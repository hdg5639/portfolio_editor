import { useMemo } from 'react';
import { updateById, moveBefore } from '../../utils/storeHelpers';
import { autoPlaceGridItems, mergeGridDraftIntoSource, normalizeGridItems, placeManualGridItem, sortGridItemsByPosition } from '../../utils/layoutGrid.js';
import { createSkill, createTimelineItem } from '../../utils/defaultPortfolio';

export function useLayoutAndProfileActions(setPortfolio) {
    return useMemo(() => ({
        // 레이아웃 섹션 조작
        toggleSection: (key) =>
            setPortfolio((prev) => ({
                ...prev,
                layout: { ...prev.layout, sections: { ...prev.layout.sections, [key]: !prev.layout.sections[key] } },
            })),
        setSectionSpan: (key, span) =>
            setPortfolio((prev) => {
                const next = { ...prev, layout: { ...prev.layout, items: prev.layout.items.map((item) => item.key === key ? { ...item, span } : item) } };
                if (key.startsWith('custom:')) {
                    const sectionId = key.replace('custom:', '');
                    next.customSections = prev.customSections.map((section) => section.id === sectionId ? { ...section, span } : section);
                }
                return next;
            }),
        setSectionRowSpan: (key, rowSpan) =>
            setPortfolio((prev) => {
                const next = { ...prev, layout: { ...prev.layout, items: prev.layout.items.map((item) => item.key === key ? { ...item, rowSpan } : item) } };
                if (key.startsWith('custom:')) {
                    const sectionId = key.replace('custom:', '');
                    next.customSections = prev.customSections.map((section) => section.id === sectionId ? { ...section, rowSpan } : section);
                }
                return next;
            }),
        moveSection: (draggedKey, targetKey) =>
            setPortfolio((prev) => ({
                ...prev,
                layout: { ...prev.layout, items: moveBefore(prev.layout.items, draggedKey, targetKey, 'key') },
            })),

        // 프로필 조작
        updateProfile: (field, value) =>
            setPortfolio((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } })),
        setProfileLayoutMode: (layoutMode, layoutItemsOverride = null) =>
            setPortfolio((prev) => {
                const sourceItems = prev.profile.layout || [];
                const draftItems = layoutItemsOverride || sourceItems;
                const laidOut =
                    layoutMode === 'packed'
                        ? sortGridItemsByPosition(draftItems)
                        : autoPlaceGridItems(draftItems);
                return {
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layoutMode,
                        layout: mergeGridDraftIntoSource(sourceItems, laidOut),
                    },
                };
            }),
        autoArrangeProfileBlocks: (layoutItemsOverride = null) =>
            setPortfolio((prev) => {
                const sourceItems = prev.profile.layout || [];
                const laidOut = autoPlaceGridItems(layoutItemsOverride || sourceItems);
                return {
                    ...prev,
                    profile: { ...prev.profile, layout: mergeGridDraftIntoSource(sourceItems, laidOut) },
                };
            }),
        moveProfileBlock: (draggedKey, targetKey) =>
            setPortfolio((prev) => ({
                ...prev,
                profile: { ...prev.profile, layout: moveBefore(prev.profile.layout, draggedKey, targetKey, 'key') },
            })),
        placeProfileBlock: (draggedKey, gridX, gridY, layoutItemsOverride = null) =>
            setPortfolio((prev) => {
                const sourceItems = prev.profile.layout || [];
                const draftItems = layoutItemsOverride || sourceItems;
                const placed = placeManualGridItem(draftItems, draggedKey, gridX, gridY);
                return {
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: mergeGridDraftIntoSource(sourceItems, placed),
                    },
                };
            }),
        setProfileBlockSpan: (key, colSpan, layoutItemsOverride = null) =>
            setPortfolio((prev) => {
                const sourceItems = prev.profile.layout || [];
                const draftItems = normalizeGridItems((layoutItemsOverride || sourceItems).map((item) => item.key === key ? { ...item, colSpan } : item));
                return {
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: mergeGridDraftIntoSource(sourceItems, draftItems, { copySpanIds: [key] }),
                    },
                };
            }),
        setProfileBlockRowSpan: (key, rowSpan, layoutItemsOverride = null) =>
            setPortfolio((prev) => {
                const sourceItems = prev.profile.layout || [];
                const draftItems = normalizeGridItems((layoutItemsOverride || sourceItems).map((item) => item.key === key ? { ...item, rowSpan } : item));
                return {
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: mergeGridDraftIntoSource(sourceItems, draftItems, { copySpanIds: [key] }),
                    },
                };
            }),
        toggleProfileBlock: (key) =>
            setPortfolio((prev) => ({
                ...prev,
                profile: { ...prev.profile, layout: prev.profile.layout.map((item) => item.key === key ? { ...item, visible: !item.visible } : item) },
            })),

        // 스킬 (Skills) 조작
        addSkill: () =>
            setPortfolio((prev) => ({ ...prev, skills: [...prev.skills, createSkill()] })),
        updateSkill: (id, field, value) =>
            setPortfolio((prev) => ({ ...prev, skills: updateById(prev.skills, id, (item) => ({ ...item, [field]: value })) })),
        removeSkill: (id) =>
            setPortfolio((prev) => ({ ...prev, skills: prev.skills.filter((item) => item.id !== id) })),

        // 타임라인 (수상/자격증) 조작
        addTimelineItem: (sectionKey) =>
            setPortfolio((prev) => ({
                ...prev,
                [sectionKey]: [...prev[sectionKey], createTimelineItem(sectionKey === 'awards' ? '새 수상' : '새 자격증')],
            })),
        updateTimelineItem: (sectionKey, id, field, value) =>
            setPortfolio((prev) => ({
                ...prev,
                [sectionKey]: updateById(prev[sectionKey], id, (item) => ({ ...item, [field]: value })),
            })),
        removeTimelineItem: (sectionKey, id) =>
            setPortfolio((prev) => ({
                ...prev,
                [sectionKey]: prev[sectionKey].filter((item) => item.id !== id),
            })),
    }), [setPortfolio]);
}