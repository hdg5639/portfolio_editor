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
  createSkill,
  createTimelineItem,
  createProfileContact,
  createProfileExtraBlock,
  createProfileExtraLayoutItem,
} from '../../utils/defaultPortfolio.js';

const CONTACT_PRESETS = {
  blank: { label: '', type: 'text', value: '' },
  email: { label: 'Email', type: 'email', value: '' },
  phone: { label: 'Phone', type: 'phone', value: '' },
  url: { label: 'Website', type: 'url', value: '' },
  text: { label: '연락처', type: 'text', value: '' },
};

export function useLayoutAndProfileActions(setPortfolio) {
  return useMemo(
    () => ({
      toggleSection: (key) =>
        setPortfolio((draft) => {
          draft.layout.sections[key] = !draft.layout.sections[key];
        }),

      setSectionSpan: (key, span) =>
        setPortfolio((draft) => {
          const item = draft.layout.items.find((i) => i.key === key);
          if (item) item.span = span;
          if (key.startsWith('custom:')) {
            const sectionId = key.replace('custom:', '');
            const section = draft.customSections.find((s) => s.id === sectionId);
            if (section) section.span = span;
          }
        }),

      setSectionRowSpan: (key, rowSpan) =>
        setPortfolio((draft) => {
          const item = draft.layout.items.find((i) => i.key === key);
          if (item) item.rowSpan = rowSpan;
          if (key.startsWith('custom:')) {
            const sectionId = key.replace('custom:', '');
            const section = draft.customSections.find((s) => s.id === sectionId);
            if (section) section.rowSpan = rowSpan;
          }
        }),

      moveSection: (draggedKey, targetKey) =>
        setPortfolio((draft) => {
          draft.layout.items = moveBefore(draft.layout.items, draggedKey, targetKey, 'key');
        }),

      updateProfile: (field, value) =>
        setPortfolio((draft) => {
          draft.profile[field] = value;
        }),

      addProfileContact: (type = 'blank') =>
        setPortfolio((draft) => {
          const contact = createProfileContact(CONTACT_PRESETS[type] ?? CONTACT_PRESETS.blank);
          if (!Array.isArray(draft.profile.contacts)) draft.profile.contacts = [];
          draft.profile.contacts.push(contact);
        }),

      updateProfileContact: (contactId, field, value) =>
        setPortfolio((draft) => {
          const contact = draft.profile.contacts?.find((c) => c.id === contactId);
          if (contact) contact[field] = value;
        }),

      removeProfileContact: (contactId) =>
        setPortfolio((draft) => {
          draft.profile.contacts = (draft.profile.contacts || []).filter(
            (c) => c.id !== contactId,
          );
        }),

      addProfileExtraBlock: (type = 'text') =>
        setPortfolio((draft) => {
          const block = createProfileExtraBlock(type);
          const layoutItem = createProfileExtraLayoutItem(block);
          if (!Array.isArray(draft.profile.extraBlocks)) draft.profile.extraBlocks = [];
          draft.profile.extraBlocks.push(block);
          draft.profile.layout = autoPlaceGridItems([...(draft.profile.layout || []), layoutItem]);
        }),

      updateProfileExtraBlock: (blockId, field, value) =>
        setPortfolio((draft) => {
          const block = draft.profile.extraBlocks?.find((b) => b.id === blockId);
          if (block) block[field] = value;
          if (field === 'title') {
            const layoutItem = draft.profile.layout?.find((i) => i.key === `extra:${blockId}`);
            if (layoutItem) layoutItem.label = value || layoutItem.label;
          }
        }),

      removeProfileExtraBlock: (blockId) =>
        setPortfolio((draft) => {
          draft.profile.extraBlocks = (draft.profile.extraBlocks || []).filter(
            (b) => b.id !== blockId,
          );
          draft.profile.layout = (draft.profile.layout || []).filter(
            (i) => i.key !== `extra:${blockId}`,
          );
        }),

      setProfileLayoutMode: (layoutMode, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const sourceBlocks = draft.profile.layout || [];
          const draftBlocks = blockItemsOverride || sourceBlocks;
          const laidOut =
            layoutMode === 'packed'
              ? sortGridItemsByPosition(draftBlocks)
              : autoPlaceGridItems(draftBlocks);
          draft.profile.layoutMode = layoutMode;
          draft.profile.layout = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      autoArrangeProfileBlocks: (blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const sourceBlocks = draft.profile.layout || [];
          const laidOut = autoPlaceGridItems(blockItemsOverride || sourceBlocks);
          draft.profile.layout = mergeGridDraftIntoSource(sourceBlocks, laidOut);
        }),

      moveProfileBlock: (draggedKey, targetKey) =>
        setPortfolio((draft) => {
          draft.profile.layout = moveBefore(draft.profile.layout || [], draggedKey, targetKey, 'key');
        }),

      placeProfileBlock: (draggedBlockKey, gridX, gridY, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const sourceBlocks = draft.profile.layout || [];
          const placed = placeManualGridItem(
            blockItemsOverride || sourceBlocks,
            draggedBlockKey,
            gridX,
            gridY,
            12,
          );
          draft.profile.layout = mergeGridDraftIntoSource(sourceBlocks, placed);
        }),

      setProfileBlockSpan: (blockKey, colSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const sourceBlocks = draft.profile.layout || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.key === blockKey ? { ...b, colSpan } : b,
          );
          draft.profile.layout = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockKey] },
          );
        }),

      setProfileBlockRowSpan: (blockKey, rowSpan, blockItemsOverride = null) =>
        setPortfolio((draft) => {
          const sourceBlocks = draft.profile.layout || [];
          const updated = (blockItemsOverride || sourceBlocks).map((b) =>
            b.key === blockKey ? { ...b, rowSpan } : b,
          );
          draft.profile.layout = mergeGridDraftIntoSource(
            sourceBlocks,
            normalizeGridItems(updated),
            { copySpanIds: [blockKey] },
          );
        }),

      toggleProfileBlock: (key) =>
        setPortfolio((draft) => {
          const item = draft.profile.layout?.find((i) => i.key === key);
          if (item) item.visible = !item.visible;
        }),

      addSkill: () =>
        setPortfolio((draft) => {
          draft.skills.push(createSkill());
        }),

      updateSkill: (id, field, value) =>
        setPortfolio((draft) => {
          const skill = draft.skills.find((s) => s.id === id);
          if (skill) skill[field] = value;
        }),

      removeSkill: (id) =>
        setPortfolio((draft) => {
          draft.skills = draft.skills.filter((s) => s.id !== id);
        }),

      addTimelineItem: (sectionKey) =>
        setPortfolio((draft) => {
          const label = sectionKey === 'awards' ? '새 수상' : '새 자격증';
          if (!Array.isArray(draft[sectionKey])) draft[sectionKey] = [];
          draft[sectionKey].push(createTimelineItem(label));
        }),

      updateTimelineItem: (sectionKey, id, field, value) =>
        setPortfolio((draft) => {
          const item = draft[sectionKey]?.find((i) => i.id === id);
          if (item) item[field] = value;
        }),

      removeTimelineItem: (sectionKey, id) =>
        setPortfolio((draft) => {
          draft[sectionKey] = (draft[sectionKey] || []).filter((i) => i.id !== id);
        }),
    }),
    [setPortfolio],
  );
}
