/**
 * useProjectActions — immer 전환 버전
 *
 * updateById() 헬퍼가 여전히 사용되지만,
 * 깊은 중첩 spread 패턴은 immer draft 직접 뮤테이션으로 교체.
 */
import { useMemo } from 'react';
import { moveBefore } from '../../utils/storeHelpers.js';
import {
  autoPlaceGridItems,
  mergeGridDraftIntoSource,
  normalizeGridItems,
  placeManualGridItem,
  sortGridItemsByPosition,
} from '../../utils/layoutGrid.js';
import {
  createProject,
  createTextBlock,
  createListBlock,
  createImageBlock,
} from '../../utils/defaultPortfolio.js';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function findProject(draft, projectId) {
  return draft.projects.find((p) => p.id === projectId);
}

function findBlock(draft, projectId, blockId) {
  return findProject(draft, projectId)?.blocks?.find((b) => b.id === blockId);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProjectActions(setPortfolio) {
  return useMemo(
    () => ({
      // ── 프로젝트 CRUD ─────────────────────────────────────────────────────
      addProject: () =>
        setPortfolio((draft) => {
          draft.projects.push(createProject());
        }),

      updateProject: (id, field, value) =>
        setPortfolio((draft) => {
          const project = findProject(draft, id);
          if (project) project[field] = value;
        }),

      moveProject: (draggedProjectId, targetProjectId) =>
        setPortfolio((draft) => {
          draft.projects = moveBefore(draft.projects, draggedProjectId, targetProjectId, 'id');
        }),

      removeProject: (id) =>
        setPortfolio((draft) => {
          draft.projects = draft.projects.filter((p) => p.id !== id);
        }),

      // ── 프로젝트 레이아웃 모드 ────────────────────────────────────────────
      setProjectLayoutMode: (projectId, layoutMode, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const sourceBlocks = project.blocks || [];
          const draftBlocks = blockItemsOverride || sourceBlocks;
          const laidOut =
            layoutMode === 'packed'
              ? sortGridItemsByPosition(draftBlocks)
              : autoPlaceGridItems(draftBlocks);
          project.layoutMode = layoutMode;
          project.blocks = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      autoArrangeProjectBlocks: (projectId, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const sourceBlocks = project.blocks || [];
          const laidOut = autoPlaceGridItems(blockItemsOverride || sourceBlocks);
          project.blocks = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      // ── 블록 CRUD ─────────────────────────────────────────────────────────
      addProjectBlock: (projectId, type) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const newBlock =
            type === 'text' ? createTextBlock()
            : type === 'list' ? createListBlock()
            : createImageBlock();
          project.blocks = normalizeGridItems([...project.blocks, newBlock]);
        }),

      moveProjectBlock: (projectId, draggedBlockId, targetBlockId) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (project) {
            project.blocks = moveBefore(project.blocks, draggedBlockId, targetBlockId, 'id');
          }
        }),

      placeProjectBlock: (projectId, draggedBlockId, gridX, gridY, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const sourceBlocks = project.blocks || [];
          const placed = placeManualGridItem(
            blockItemsOverride || sourceBlocks,
            draggedBlockId,
            gridX,
            gridY,
          );
          project.blocks = mergeGridDraftIntoSource(sourceBlocks, placed);
        }),

      setProjectBlockSpan: (projectId, blockId, colSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const sourceBlocks = project.blocks || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.id === blockId ? { ...b, colSpan } : b,
          );
          project.blocks = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockId] },
          );
        }),

      setProjectBlockRowSpan: (projectId, blockId, rowSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (!project) return;
          const sourceBlocks = project.blocks || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.id === blockId ? { ...b, rowSpan } : b,
          );
          project.blocks = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockId] },
          );
        }),

      updateProjectBlock: (projectId, blockId, field, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block) block[field] = value;
        }),

      removeProjectBlock: (projectId, blockId) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (project) project.blocks = project.blocks.filter((b) => b.id !== blockId);
        }),

      // ── 블록 내 리스트 항목 ───────────────────────────────────────────────
      addProjectListItem: (projectId, blockId) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block) {
            if (!Array.isArray(block.items)) block.items = [];
            block.items.push('새 항목');
          }
        }),

      updateProjectListItem: (projectId, blockId, index, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block?.items?.[index] !== undefined) block.items[index] = value;
        }),

      removeProjectListItem: (projectId, blockId, index) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block?.items) block.items = block.items.filter((_, i) => i !== index);
        }),

      // ── 기술 스택 ────────────────────────────────────────────────────────
      addProjectTech: (projectId) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (project) {
            if (!Array.isArray(project.techStack)) project.techStack = [];
            project.techStack.push('New Tech');
          }
        }),

      updateProjectTech: (projectId, index, value) =>
        setPortfolio((draft) => {
          const project = findProject(draft, projectId);
          if (project?.techStack?.[index] !== undefined) project.techStack[index] = value;
        }),

      // ── 블록 내 이미지 ────────────────────────────────────────────────────
      addProjectImage: (projectId, blockId) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block) {
            if (!Array.isArray(block.images)) block.images = [];
            block.images.push('');
          }
        }),

      updateProjectImage: (projectId, blockId, index, value) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (block?.images?.[index] !== undefined) block.images[index] = value;
        }),

      removeProjectImage: (projectId, blockId, index) =>
        setPortfolio((draft) => {
          const block = findBlock(draft, projectId, blockId);
          if (!block?.images) return;
          const next = block.images.filter((_, i) => i !== index);
          block.images = next.length ? next : [''];
        }),
    }),
    [setPortfolio],
  );
}
