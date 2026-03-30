import { useMemo } from 'react';
import { clone, moveBefore, syncCustomSections } from '../../utils/storeHelpers';
import { autoPlaceGridItems, mergeGridDraftIntoSource, normalizeGridItems, placeManualGridItem, sortGridItemsByPosition } from '../../utils/layoutGrid.js';
import { createTextBlock, createListBlock, createImageBlock, createCustomSection, createCustomSectionItem } from '../../utils/defaultPortfolio';

export function useCustomSectionActions(setPortfolio, portfolio) {
    return useMemo(() => ({
        getCustomSectionById: (sectionId) =>
            portfolio.customSections.find((section) => section.id === sectionId) || null,

        addCustomSection: ({ name, template, span, rowSpan }) =>
            setPortfolio((prev) => {
                const next = clone(prev);
                next.customSections = [...next.customSections, createCustomSection({ name, template, span, rowSpan })];
                return syncCustomSections(next);
            }),
        removeCustomSection: (sectionId) =>
            setPortfolio((prev) => {
                const next = clone(prev);
                next.customSections = next.customSections.filter((section) => section.id !== sectionId);
                return syncCustomSections(next);
            }),
        updateCustomSectionMeta: (sectionId, field, value) =>
            setPortfolio((prev) => {
                const next = clone(prev);
                next.customSections = next.customSections.map((section) => {
                    if (section.id !== sectionId) return section;
                    if (field !== 'template') {
                        return { ...section, [field]: value };
                    }
                    return {
                        ...section,
                        template: value,
                        items: (section.items || []).map((item) => ({
                            ...item,
                            template: item.template || section.template || 'simpleList',
                        })),
                    };
                });
                return syncCustomSections(next);
            }),

        addCustomSectionItem: (sectionId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: [...section.items, createCustomSectionItem(section.template)] } : section
                ),
            })),
        moveCustomSectionItem: (sectionId, draggedItemId, targetItemId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: moveBefore(section.items, draggedItemId, targetItemId, 'id') } : section
                ),
            })),
        setCustomSectionItemSpan: (sectionId, itemId, colSpan) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, colSpan } : item) } : section
                ),
            })),
        setCustomSectionItemRowSpan: (sectionId, itemId, rowSpan) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, rowSpan } : item) } : section
                ),
            })),
        updateCustomSectionItem: (sectionId, itemId, field, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item) } : section
                ),
            })),
        removeCustomSectionItem: (sectionId, itemId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section
                ),
            })),

        addCustomSectionTag: (sectionId, itemId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, tags: [...(item.tags || []), '새 태그'] } : item) } : section
                ),
            })),
        updateCustomSectionTag: (sectionId, itemId, tagIndex, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, tags: (item.tags || []).map((tag, index) => index === tagIndex ? value : tag) } : item) } : section
                ),
            })),
        removeCustomSectionTag: (sectionId, itemId, tagIndex) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, tags: (item.tags || []).filter((_, index) => index !== tagIndex) } : item) } : section
                ),
            })),

        // 복합 커스텀 블록 (Complex) 조작 로직
        setCustomComplexLayoutMode: (sectionId, itemId, layoutMode, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const sourceBlocks = item.blocks || [];
                                const draftBlocks = blockItemsOverride || sourceBlocks;
                                const laidOut = layoutMode === 'packed'
                                    ? sortGridItemsByPosition(draftBlocks)
                                    : autoPlaceGridItems(draftBlocks);
                                return {
                                    ...item,
                                    layoutMode,
                                    blocks: mergeGridDraftIntoSource(sourceBlocks, laidOut),
                                };
                            }),
                        }
                        : section
                ),
            })),
        autoArrangeCustomComplexBlocks: (sectionId, itemId, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const sourceBlocks = item.blocks || [];
                                const laidOut = autoPlaceGridItems(blockItemsOverride || sourceBlocks);
                                return { ...item, blocks: mergeGridDraftIntoSource(sourceBlocks, laidOut) };
                            }),
                        }
                        : section
                ),
            })),
        addCustomComplexBlock: (sectionId, itemId, type) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: normalizeGridItems([...(item.blocks || []), type === 'text' ? createTextBlock() : type === 'list' ? createListBlock() : createImageBlock()]) } : item) } : section
                ),
            })),
        moveCustomComplexBlock: (sectionId, itemId, draggedBlockId, targetBlockId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: moveBefore(item.blocks || [], draggedBlockId, targetBlockId, 'id') } : item) } : section
                ),
            })),
        placeCustomComplexBlock: (sectionId, itemId, draggedBlockId, gridX, gridY, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const sourceBlocks = item.blocks || [];
                                const draftBlocks = blockItemsOverride || sourceBlocks;
                                const placed = placeManualGridItem(draftBlocks, draggedBlockId, gridX, gridY);
                                return { ...item, blocks: mergeGridDraftIntoSource(sourceBlocks, placed) };
                            }),
                        }
                        : section
                ),
            })),
        setCustomComplexBlockSpan: (sectionId, itemId, blockId, colSpan, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const sourceBlocks = item.blocks || [];
                                const draftBlocks = normalizeGridItems((blockItemsOverride || sourceBlocks).map((block) => block.id === blockId ? { ...block, colSpan } : block));
                                return { ...item, blocks: mergeGridDraftIntoSource(sourceBlocks, draftBlocks, { copySpanIds: [blockId] }) };
                            }),
                        }
                        : section
                ),
            })),
        setCustomComplexBlockRowSpan: (sectionId, itemId, blockId, rowSpan, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const sourceBlocks = item.blocks || [];
                                const draftBlocks = normalizeGridItems((blockItemsOverride || sourceBlocks).map((block) => block.id === blockId ? { ...block, rowSpan } : block));
                                return { ...item, blocks: mergeGridDraftIntoSource(sourceBlocks, draftBlocks, { copySpanIds: [blockId] }) };
                            }),
                        }
                        : section
                ),
            })),
        updateCustomComplexBlock: (sectionId, itemId, blockId, field, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, [field]: value } : block) } : item) } : section
                ),
            })),
        removeCustomComplexBlock: (sectionId, itemId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).filter((block) => block.id !== blockId) } : item) } : section
                ),
            })),

        addCustomComplexListItem: (sectionId, itemId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, items: [...(block.items || []), '새 항목'] } : block) } : item) } : section
                ),
            })),
        updateCustomComplexListItem: (sectionId, itemId, blockId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, items: (block.items || []).map((entry, i) => i === index ? value : entry) } : block) } : item) } : section
                ),
            })),
        removeCustomComplexListItem: (sectionId, itemId, blockId, index) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, items: (block.items || []).filter((_, i) => i !== index) } : block) } : item) } : section
                ),
            })),

        addCustomComplexImage: (sectionId, itemId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, images: [...(block.images || []), ''] } : block) } : item) } : section
                ),
            })),
        updateCustomComplexImage: (sectionId, itemId, blockId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, blocks: (item.blocks || []).map((block) => block.id === blockId ? { ...block, images: (block.images || []).map((img, i) => i === index ? value : img) } : block) } : item) } : section
                ),
            })),
        removeCustomComplexImage: (sectionId, itemId, blockId, index) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId
                        ? {
                            ...section,
                            items: section.items.map((item) =>
                                item.id === itemId
                                    ? {
                                        ...item,
                                        blocks: (item.blocks || []).map((block) => {
                                            if (block.id !== blockId) return block;
                                            const nextImages = (block.images || []).filter((_, i) => i !== index);
                                            return { ...block, images: nextImages.length ? nextImages : [''] };
                                        }),
                                    }
                                    : item
                            ),
                        }
                        : section
                ),
            })),

        addCustomComplexTech: (sectionId, itemId) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, techStack: [...(item.techStack || []), 'New Tech'] } : item) } : section
                ),
            })),
        updateCustomComplexTech: (sectionId, itemId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                customSections: prev.customSections.map((section) =>
                    section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, techStack: (item.techStack || []).map((tech, i) => i === index ? value : tech) } : item) } : section
                ),
            })),
    }), [setPortfolio, portfolio.customSections]);
}