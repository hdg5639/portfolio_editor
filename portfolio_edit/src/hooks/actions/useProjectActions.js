import { useMemo } from 'react';
import { updateById, moveBefore } from '../../utils/storeHelpers';
import { createProject, createTextBlock, createListBlock, createImageBlock } from '../../utils/defaultPortfolio';

export function useProjectActions(setPortfolio) {
    return useMemo(() => ({
        addProject: () =>
            setPortfolio((prev) => ({ ...prev, projects: [...prev.projects, createProject()] })),
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
                    blocks: [...project.blocks, type === 'text' ? createTextBlock() : type === 'list' ? createListBlock() : createImageBlock()],
                })),
            })),
        moveProjectBlock: (projectId, draggedBlockId, targetBlockId) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({ ...project, blocks: moveBefore(project.blocks, draggedBlockId, targetBlockId, 'id') })),
            })),
        setProjectBlockSpan: (projectId, blockId, colSpan) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: project.blocks.map((block) => block.id === blockId ? { ...block, colSpan } : block),
                })),
            })),
        setProjectBlockRowSpan: (projectId, blockId, rowSpan) =>
            setPortfolio((prev) => ({
                ...prev,
                projects: updateById(prev.projects, projectId, (project) => ({
                    ...project, blocks: project.blocks.map((block) => block.id === blockId ? { ...block, rowSpan } : block),
                })),
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