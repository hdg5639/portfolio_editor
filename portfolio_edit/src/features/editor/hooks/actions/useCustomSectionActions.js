/**
 * useCustomSectionActions — immer 전환 버전
 *
 * 변경 전: 4단 spread 중첩 패턴
 *   setPortfolio((prev) => ({
 *     ...prev,
 *     customSections: prev.customSections.map(s =>
 *       s.id === sectionId ? { ...s, items: s.items.map(i =>
 *         i.id === itemId ? { ...i, [field]: value } : i
 *       )} : s
 *     )
 *   }))
 *
 * 변경 후: immer draft 직접 뮤테이션
 *   setPortfolio((draft) => {
 *     const item = findItem(draft, sectionId, itemId);
 *     if (item) item[field] = value;
 *   })
 *
 * setPortfolio → useEditorStore.setState(immer) 이므로
 * updater 함수가 draft를 받아 직접 수정하면 immer가 불변 업데이트를 처리함.
 */

import { useMemo } from 'react';
import { clone, syncCustomSections, moveBefore } from '../../utils/storeHelpers.js';
import {
  autoPlaceGridItems,
  mergeGridDraftIntoSource,
  normalizeGridItems,
  placeManualGridItem,
  sortGridItemsByPosition,
} from '../../utils/layoutGrid.js';
import {
  createTextBlock,
  createListBlock,
  createImageBlock,
  createCustomSection,
  createCustomSectionItem,
} from '../../utils/defaultPortfolio.js';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function findSection(draft, sectionId) {
  return draft.customSections.find((s) => s.id === sectionId);
}

function findItem(draft, sectionId, itemId) {
  return findSection(draft, sectionId)?.items.find((i) => i.id === itemId);
}

function findBlock(draft, sectionId, itemId, blockId) {
  return findItem(draft, sectionId, itemId)?.blocks?.find((b) => b.id === blockId);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCustomSectionActions(setPortfolio, portfolio) {
  return useMemo(
    () => ({
      // ── 읽기 전용 (store를 직접 읽으므로 immer 불필요) ──────────────────
      getCustomSectionById: (sectionId) =>
        portfolio.customSections.find((s) => s.id === sectionId) ?? null,

      // ── 섹션 CRUD ────────────────────────────────────────────────────────
      addCustomSection: ({ name, template, span, rowSpan }) =>
        setPortfolio((draft) => {
          draft.customSections.push(createCustomSection({ name, template, span, rowSpan }));
          // syncCustomSections는 순수 함수 (draft가 아닌 plain object 반환)
          // → draft를 통째로 교체하는 방식으로 처리
          const synced = syncCustomSections(draft);
          draft.layout = synced.layout;
          draft.customSections = synced.customSections;
        }),

      removeCustomSection: (sectionId) =>
        setPortfolio((draft) => {
          draft.customSections = draft.customSections.filter((s) => s.id !== sectionId);
          const synced = syncCustomSections(draft);
          draft.layout = synced.layout;
          draft.customSections = synced.customSections;
        }),

      updateCustomSectionMeta: (sectionId, field, value) =>
        setPortfolio((draft) => {
          const section = findSection(draft, sectionId);
          if (!section) return;

          if (field !== 'template') {
            section[field] = value;
          } else {
            section.template = value;
            section.items.forEach((item) => {
              item.template = item.template || section.template || 'simpleList';
            });
          }

          const synced = syncCustomSections(draft);
          draft.layout = synced.layout;
          draft.customSections = synced.customSections;
        }),

      // ── 아이템 CRUD ──────────────────────────────────────────────────────
      addCustomSectionItem: (sectionId) =>
        setPortfolio((draft) => {
          const section = findSection(draft, sectionId);
          if (section) section.items.push(createCustomSectionItem(section.template));
        }),

      moveCustomSectionItem: (sectionId, draggedItemId, targetItemId) =>
        setPortfolio((draft) => {
          const section = findSection(draft, sectionId);
          if (section) {
            section.items = moveBefore(section.items, draggedItemId, targetItemId, 'id');
          }
        }),

      setCustomSectionItemSpan: (sectionId, itemId, colSpan) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) item.colSpan = colSpan;
        }),

      setCustomSectionItemRowSpan: (sectionId, itemId, rowSpan) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) item.rowSpan = rowSpan;
        }),

      updateCustomSectionItem: (sectionId, itemId, field, value) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) item[field] = value;
        }),

      removeCustomSectionItem: (sectionId, itemId) =>
        setPortfolio((draft) => {
          const section = findSection(draft, sectionId);
          if (section) section.items = section.items.filter((i) => i.id !== itemId);
        }),

      // ── 태그 ─────────────────────────────────────────────────────────────
      addCustomSectionTag: (sectionId, itemId) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) {
            if (!Array.isArray(item.tags)) item.tags = [];
            item.tags.push('새 태그');
          }
        }),

      updateCustomSectionTag: (sectionId, itemId, tagIndex, value) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item?.tags?.[tagIndex] !== undefined) item.tags[tagIndex] = value;
        }),

      removeCustomSectionTag: (sectionId, itemId, tagIndex) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item?.tags) item.tags = item.tags.filter((_, i) => i !== tagIndex);
        }),

      // ── 복합(complex) 레이아웃 ───────────────────────────────────────────
      setCustomComplexLayoutMode: (sectionId, itemId, layoutMode, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const sourceBlocks = item.blocks || [];
          const draftBlocks = blockItemsOverride || sourceBlocks;
          const laidOut =
            layoutMode === 'packed'
              ? sortGridItemsByPosition(draftBlocks)
              : autoPlaceGridItems(draftBlocks);
          item.layoutMode = layoutMode;
          item.blocks = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      autoArrangeCustomComplexBlocks: (sectionId, itemId, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const sourceBlocks = item.blocks || [];
          const laidOut = autoPlaceGridItems(blockItemsOverride || sourceBlocks);
          item.blocks = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      // ── 복합 블록 CRUD ───────────────────────────────────────────────────
      addCustomComplexBlock: (sectionId, itemId, type) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const newBlock =
            type === 'text' ? createTextBlock()
            : type === 'list' ? createListBlock()
            : createImageBlock();
          item.blocks = normalizeGridItems([...(item.blocks || []), newBlock]);
        }),

      moveCustomComplexBlock: (sectionId, itemId, draggedBlockId, targetBlockId) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) {
            item.blocks = moveBefore(item.blocks || [], draggedBlockId, targetBlockId, 'id');
          }
        }),

      placeCustomComplexBlock: (sectionId, itemId, draggedBlockId, gridX, gridY, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const sourceBlocks = item.blocks || [];
          const placed = placeManualGridItem(
            blockItemsOverride || sourceBlocks,
            draggedBlockId,
            gridX,
            gridY,
          );
          item.blocks = mergeGridDraftIntoSource(sourceBlocks, placed);
        }),

      setCustomComplexBlockSpan: (sectionId, itemId, blockId, colSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const sourceBlocks = item.blocks || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.id === blockId ? { ...b, colSpan } : b,
          );
          item.blocks = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockId] },
          );
        }),

      setCustomComplexBlockRowSpan: (sectionId, itemId, blockId, rowSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (!item) return;
          const sourceBlocks = item.blocks || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.id === blockId ? { ...b, rowSpan } : b,
          );
          item.blocks = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockId] },
          );
        }),

      updateCustomComplexBlock: (sectionId, itemId, blockId, field, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block) block[field] = value;
        }),

      removeCustomComplexBlock: (sectionId, itemId, blockId) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) item.blocks = (item.blocks || []).filter((b) => b.id !== blockId);
        }),

      // ── 복합 블록 내 리스트 항목 ─────────────────────────────────────────
      addCustomComplexListItem: (sectionId, itemId, blockId) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block) {
            if (!Array.isArray(block.items)) block.items = [];
            block.items.push('새 항목');
          }
        }),

      updateCustomComplexListItem: (sectionId, itemId, blockId, index, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block?.items?.[index] !== undefined) block.items[index] = value;
        }),

      removeCustomComplexListItem: (sectionId, itemId, blockId, index) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block?.items) block.items = block.items.filter((_, i) => i !== index);
        }),

      // ── 복합 블록 내 이미지 ──────────────────────────────────────────────
      addCustomComplexImage: (sectionId, itemId, blockId) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block) {
            if (!Array.isArray(block.images)) block.images = [];
            block.images.push('');
          }
        }),

      updateCustomComplexImage: (sectionId, itemId, blockId, index, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (block?.images?.[index] !== undefined) block.images[index] = value;
        }),

      removeCustomComplexImage: (sectionId, itemId, blockId, index) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, sectionId, itemId, blockId);
          if (!block?.images) return;
          const next = block.images.filter((_, i) => i !== index);
          block.images = next.length ? next : [''];
        }),

      // ── 복합 아이템 기술 스택 ────────────────────────────────────────────
      addCustomComplexTech: (sectionId, itemId) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item) {
            if (!Array.isArray(item.techStack)) item.techStack = [];
            item.techStack.push('New Tech');
          }
        }),

      updateCustomComplexTech: (sectionId, itemId, index, value) =>
        setPortfolio((draft) => {
          const item = findItem(draft, sectionId, itemId);
          if (item?.techStack?.[index] !== undefined) item.techStack[index] = value;
        }),
    }),
    [setPortfolio, portfolio.customSections],
  );
}
