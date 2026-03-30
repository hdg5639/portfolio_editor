import { useMemo } from 'react';
import { updateById, moveBefore } from '../../utils/storeHelpers';
import { autoPlaceGridItems, mergeGridDraftIntoSource, normalizeGridItems, placeManualGridItem, sortGridItemsByPosition } from '../../utils/layoutGrid.js';
import { createProject, createTextBlock, createListBlock, createImageBlock } from '../../utils/defaultPortfolio';

export function useProjectActions(setPortfolio) {
    return useMemo(() => ({
        addProject: () =>
            setPortfolio((prev) => ({ ...prev, projects: [...prev.projects, createProject()] })),
        setProjectLayoutMode: (projectId, layoutMode, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => {
                    const sourceBlocks = project.blocks || [];
                    const draftBlocks = blockItemsOverride || sourceBlocks;
                    const laidOut = layoutMode === 'packed'
                        ? sortGridItemsByPosition(draftBlocks)
                        : autoPlaceGridItems(draftBlocks);
                    return {
                        ...project,
                        layoutMode,
                        blocks: mergeGridDraftIntoSource(sourceBlocks, laidOut),
                    };
                }),
            })),
        autoArrangeProjectBlocks: (projectId, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => {
                    const sourceBlocks = project.blocks || [];
                    const laidOut = autoPlaceGridItems(blockItemsOverride || sourceBlocks);
                    return {
                        ...project,
                        blocks: mergeGridDraftIntoSource(sourceBlocks, laidOut),
                    };
                }),
            })),
        updateProject: (id, field, value) =>
            setPortfolio((prev) => ({ ...prev, projects: updateById(prev.projects, id, (item) => ({ ...item, [field]: value })) })),
        moveProject: (draggedProjectId, targetProjectId) =>
            setPortfolio((prev) => ({ ...prev, projects: moveBefore(prev.projects, draggedProjectId, targetProjectId, 'id') })),
        removeProject: (id) =>
            setPortfolio((prev) => ({ ...prev, projects: prev.projects.filter((item) => item.id !== id) })),

        addProjectBlock: (projectId, type) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project,
                    blocks: normalizeGridItems([...project.blocks, type === 'text' ? createTextBlock() : type === 'list' ? createListBlock() : createImageBlock()]),
                })),
            })),
        moveProjectBlock: (projectId, draggedBlockId, targetBlockId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({ ...project, blocks: moveBefore(project.blocks, draggedBlockId, targetBlockId, 'id') })),
            })),
        placeProjectBlock: (projectId, draggedBlockId, gridX, gridY, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => {
                    const sourceBlocks = project.blocks || [];
                    const draftBlocks = blockItemsOverride || sourceBlocks;
                    const placed = placeManualGridItem(draftBlocks, draggedBlockId, gridX, gridY);
                    return {
                        ...project,
                        blocks: mergeGridDraftIntoSource(sourceBlocks, placed),
                    };
                }),
            })),
        setProjectBlockSpan: (projectId, blockId, colSpan, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => {
                    const sourceBlocks = project.blocks || [];
                    const draftBlocks = normalizeGridItems((blockItemsOverride || sourceBlocks).map((block) => block.id === blockId ? { ...block, colSpan } : block));
                    return {
                        ...project,
                        blocks: mergeGridDraftIntoSource(sourceBlocks, draftBlocks, { copySpanIds: [blockId] }),
                    };
                }),
            })),
        setProjectBlockRowSpan: (projectId, blockId, rowSpan, blockItemsOverride = null) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => {
                    const sourceBlocks = project.blocks || [];
                    const draftBlocks = normalizeGridItems((blockItemsOverride || sourceBlocks).map((block) => block.id === blockId ? { ...block, rowSpan } : block));
                    return {
                        ...project,
                        blocks: mergeGridDraftIntoSource(sourceBlocks, draftBlocks, { copySpanIds: [blockId] }),
                    };
                }),
            })),
        updateProjectBlock: (projectId, blockId, field, value) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, [field]: value })),
                })),
            })),
        removeProjectBlock: (projectId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({ ...project, blocks: project.blocks.filter((block) => block.id !== blockId) })),
            })),

        addProjectListItem: (projectId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, items: [...(block.items || []), '새 항목'] })),
                })),
            })),
        updateProjectListItem: (projectId, blockId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, items: block.items.map((item, i) => (i === index ? value : item)) })),
                })),
            })),
        removeProjectListItem: (projectId, blockId, index) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, items: (block.items || []).filter((_, i) => i !== index) })),
                })),
            })),

        addProjectTech: (projectId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({ ...project, techStack: [...project.techStack, 'New Tech'] })),
            })),
        updateProjectTech: (projectId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({ ...project, techStack: project.techStack.map((item, i) => (i === index ? value : item)) })),
            })),

        addProjectImage: (projectId, blockId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, images: [...(block.images || []), ''] })),
                })),
            })),
        updateProjectImage: (projectId, blockId, index, value) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: updateById(project.blocks, blockId, (block) => ({ ...block, images: block.images.map((img, i) => (i === index ? value : img)) })),
                })),
            })),
    }), [setPortfolio]);
}