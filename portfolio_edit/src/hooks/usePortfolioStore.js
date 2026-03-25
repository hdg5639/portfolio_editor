import { useEffect, useMemo, useState } from 'react';
import {
    defaultPortfolio,
    createSkill,
    createProject,
    createTimelineItem,
    createTextBlock,
    createListBlock,
    createImageBlock,
    createCustomSection,
    createCustomSectionItem,
    createComplexCustomItem,
    defaultStyle,
    defaultSectionLayout,
    defaultProfileBlocks,
} from '../utils/defaultPortfolio';

const STORAGE_KEY = 'portfolio-editor-v5';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function updateById(list, id, updater) {
    return list.map((item) => (item.id === id ? updater(item) : item));
}

function moveBefore(list, draggedKey, targetKey, keyName = 'key') {
    if (!draggedKey || !targetKey || draggedKey === targetKey) return list;

    const next = [...list];
    const fromIndex = next.findIndex((item) => item[keyName] === draggedKey);
    const toIndex = next.findIndex((item) => item[keyName] === targetKey);

    if (fromIndex < 0 || toIndex < 0) return list;

    const [dragged] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragged);

    return next;
}

function syncCustomSections(portfolio) {
    const next = clone(portfolio);
    const baseItems = defaultSectionLayout();
    const customItems = (next.customSections || []).map((section) => ({
        key: `custom:${section.id}`,
        span: section.span || 12,
        rowSpan: section.rowSpan || 1,
        label: section.name,
        kind: 'custom',
        sectionId: section.id,
    }));

    const existingMap = new Map((next.layout?.items || []).map((item) => [item.key, item]));
    const mergedBase = baseItems.map((item) => ({
        ...item,
        ...(existingMap.get(item.key) || {}),
    }));

    const mergedCustom = customItems.map((item) => ({
        ...item,
        ...(existingMap.get(item.key) || {}),
        label: item.label,
        kind: 'custom',
        sectionId: item.sectionId,
    }));

    const desiredKeys = [...mergedBase, ...mergedCustom].map((item) => item.key);
    const ordered = (next.layout?.items || [])
        .filter((item) => desiredKeys.includes(item.key))
        .map((item) => {
            const found = [...mergedBase, ...mergedCustom].find((target) => target.key === item.key);
            return {
                ...found,
                ...item,
                label: found.label,
                kind: found.kind,
                sectionId: found.sectionId,
            };
        });

    const missing = [...mergedBase, ...mergedCustom].filter(
        (item) => !ordered.some((orderedItem) => orderedItem.key === item.key)
    );

    next.layout = next.layout || {};
    next.layout.sections = next.layout.sections || clone(defaultPortfolio.layout.sections);
    next.layout.items = [...ordered, ...missing];

    mergedCustom.forEach((item) => {
        if (typeof next.layout.sections[item.key] !== 'boolean') {
            next.layout.sections[item.key] = true;
        }
    });

    Object.keys(next.layout.sections).forEach((key) => {
        if (!desiredKeys.includes(key) && key.startsWith('custom:')) {
            delete next.layout.sections[key];
        }
    });

    return next;
}

function migratePortfolio(rawPortfolio) {
    const next = syncCustomSections(rawPortfolio || defaultPortfolio);

    if (!next.profile.layout || !Array.isArray(next.profile.layout) || !next.profile.layout.length) {
        next.profile.layout = defaultProfileBlocks();
    } else {
        const defaults = defaultProfileBlocks();
        const existingMap = new Map(next.profile.layout.map((item) => [item.key, item]));
        next.profile.layout = defaults.map((item) => ({
            ...item,
            ...(existingMap.get(item.key) || {}),
        }));
    }

    next.styles = next.styles || {};
    next.styles.page = {
        backgroundColor: '#f4f1ea',
        baseBackgroundColor: '#ece7dc',
        color: '#1d1d1b',
        fontFamily: 'Noto Sans KR, sans-serif',
        widthMode: 'fixed',
        fixedWidth: 980,
        customWidth: 1280,
        ...(next.styles.page || {}),
    };

    next.projects = (next.projects || []).map((project) => ({
        ...project,
        blocks: (project.blocks || []).map((block) => ({
            colSpan: 12,
            rowSpan: 1,
            ...block,
        })),
    }));

    next.customSections = (next.customSections || []).map((section) => ({
        ...section,
        span: section.span || 12,
        rowSpan: section.rowSpan || 1,
        items: (section.items || []).map((item) => {
            const base = {
                colSpan: 6,
                rowSpan: 1,
                ...item,
            };

            if (section.template !== 'complex') {
                return base;
            }

            if (!Array.isArray(base.blocks)) {
                const migrated = createComplexCustomItem();

                return {
                    ...migrated,
                    ...base,
                    subtitle: base.subtitle || '부제목 / 담당 역할',
                    date: base.date || '2026.01 ~ 2026.03',
                    summary: base.summary || base.description || '복합 프로젝트 요약을 입력하세요.',
                    techStack: Array.isArray(base.techStack)
                        ? base.techStack
                        : Array.isArray(base.tags)
                            ? base.tags
                            : ['React', 'Spring'],
                    blocks: [
                        {
                            ...createTextBlock(),
                            title: '상세 설명',
                            content: base.description || '설명을 입력하세요.',
                            colSpan: 8,
                            rowSpan: 1,
                        },
                        {
                            ...createListBlock(),
                            title: '기술 스택',
                            items: Array.isArray(base.tags) && base.tags.length ? base.tags : ['태그 1', '태그 2'],
                            colSpan: 4,
                            rowSpan: 2,
                        },
                        {
                            ...createImageBlock(),
                            title: '이미지',
                            caption:
                                base.imagePosition === 'left'
                                    ? '좌측 이미지'
                                    : base.imagePosition === 'right'
                                        ? '우측 이미지'
                                        : '이미지',
                            images: base.image ? [base.image] : [''],
                            colSpan: 8,
                            rowSpan: 1,
                        },
                    ],
                };
            }

            return {
                ...base,
                techStack: Array.isArray(base.techStack) ? base.techStack : [],
                blocks: (base.blocks || []).map((block) => ({
                    colSpan: 12,
                    rowSpan: 1,
                    ...block,
                })),
            };
        }),
    }));

    next.layout.items = (next.layout.items || []).map((item) => ({
        rowSpan: 1,
        ...item,
    }));

    return next;
}

export function usePortfolioStore() {
    const [portfolio, setPortfolio] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? migratePortfolio(JSON.parse(raw)) : clone(defaultPortfolio);
    });

    const [mode, setMode] = useState('edit');
    const [selected, setSelected] = useState({ key: 'page', label: '페이지 전체' });
    const [ui, setUi] = useState({
        showContentPanel: true,
        showStylePanel: true,
        showEditHelpers: true,
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    }, [portfolio]);

    const actions = useMemo(
        () => ({
            setMode,
            select: setSelected,

            togglePanel: (panel) =>
                setUi((prev) => ({
                    ...prev,
                    [panel === 'content' ? 'showContentPanel' : 'showStylePanel']:
                        !prev[panel === 'content' ? 'showContentPanel' : 'showStylePanel'],
                })),

            toggleEditHelpers: () =>
                setUi((prev) => ({
                    ...prev,
                    showEditHelpers: !prev.showEditHelpers,
                })),

            setEditHelpersVisible: (visible) =>
                setUi((prev) => ({
                    ...prev,
                    showEditHelpers: Boolean(visible),
                })),

            reset: () => {
                const next = clone(defaultPortfolio);
                setPortfolio(next);
                setSelected({ key: 'page', label: '페이지 전체' });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            },

            addCustomComplexBlock: (sectionId, itemId, type) =>
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
                                            blocks: [
                                                ...(item.blocks || []),
                                                type === 'text'
                                                    ? createTextBlock()
                                                    : type === 'list'
                                                        ? createListBlock()
                                                        : createImageBlock(),
                                            ],
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            moveCustomComplexBlock: (sectionId, itemId, draggedBlockId, targetBlockId) =>
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
                                            blocks: moveBefore(item.blocks || [], draggedBlockId, targetBlockId, 'id'),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            setCustomComplexBlockSpan: (sectionId, itemId, blockId, colSpan) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId ? { ...block, colSpan } : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            setCustomComplexBlockRowSpan: (sectionId, itemId, blockId, rowSpan) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId ? { ...block, rowSpan } : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomComplexBlock: (sectionId, itemId, blockId, field, value) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId ? { ...block, [field]: value } : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            removeCustomComplexBlock: (sectionId, itemId, blockId) =>
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
                                            blocks: (item.blocks || []).filter((block) => block.id !== blockId),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            addCustomComplexListItem: (sectionId, itemId, blockId) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId
                                                    ? { ...block, items: [...(block.items || []), '새 항목'] }
                                                    : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomComplexListItem: (sectionId, itemId, blockId, index, value) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId
                                                    ? {
                                                        ...block,
                                                        items: (block.items || []).map((entry, i) =>
                                                            i === index ? value : entry
                                                        ),
                                                    }
                                                    : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            removeCustomComplexListItem: (sectionId, itemId, blockId, index) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId
                                                    ? {
                                                        ...block,
                                                        items: (block.items || []).filter((_, i) => i !== index),
                                                    }
                                                    : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            addCustomComplexImage: (sectionId, itemId, blockId) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId
                                                    ? { ...block, images: [...(block.images || []), ''] }
                                                    : block
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomComplexImage: (sectionId, itemId, blockId, index, value) =>
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
                                            blocks: (item.blocks || []).map((block) =>
                                                block.id === blockId
                                                    ? {
                                                        ...block,
                                                        images: (block.images || []).map((img, i) =>
                                                            i === index ? value : img
                                                        ),
                                                    }
                                                    : block
                                            ),
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
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.map((item) =>
                                    item.id === itemId
                                        ? { ...item, techStack: [...(item.techStack || []), 'New Tech'] }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomComplexTech: (sectionId, itemId, index, value) =>
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
                                            techStack: (item.techStack || []).map((tech, i) =>
                                                i === index ? value : tech
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            toggleSection: (key) =>
                setPortfolio((prev) => ({
                    ...prev,
                    layout: {
                        ...prev.layout,
                        sections: {
                            ...prev.layout.sections,
                            [key]: !prev.layout.sections[key],
                        },
                    },
                })),

            setSectionSpan: (key, span) =>
                setPortfolio((prev) => {
                    const next = {
                        ...prev,
                        layout: {
                            ...prev.layout,
                            items: prev.layout.items.map((item) =>
                                item.key === key ? { ...item, span } : item
                            ),
                        },
                    };

                    if (key.startsWith('custom:')) {
                        const sectionId = key.replace('custom:', '');
                        next.customSections = prev.customSections.map((section) =>
                            section.id === sectionId ? { ...section, span } : section
                        );
                    }

                    return next;
                }),

            setSectionRowSpan: (key, rowSpan) =>
                setPortfolio((prev) => {
                    const next = {
                        ...prev,
                        layout: {
                            ...prev.layout,
                            items: prev.layout.items.map((item) =>
                                item.key === key ? { ...item, rowSpan } : item
                            ),
                        },
                    };

                    if (key.startsWith('custom:')) {
                        const sectionId = key.replace('custom:', '');
                        next.customSections = prev.customSections.map((section) =>
                            section.id === sectionId ? { ...section, rowSpan } : section
                        );
                    }

                    return next;
                }),

            moveSection: (draggedKey, targetKey) =>
                setPortfolio((prev) => ({
                    ...prev,
                    layout: {
                        ...prev.layout,
                        items: moveBefore(prev.layout.items, draggedKey, targetKey, 'key'),
                    },
                })),

            updateProfile: (field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, [field]: value },
                })),

            moveProfileBlock: (draggedKey, targetKey) =>
                setPortfolio((prev) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: moveBefore(prev.profile.layout, draggedKey, targetKey, 'key'),
                    },
                })),

            setProfileBlockSpan: (key, colSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: prev.profile.layout.map((item) =>
                            item.key === key ? { ...item, colSpan } : item
                        ),
                    },
                })),

            setProfileBlockRowSpan: (key, rowSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: prev.profile.layout.map((item) =>
                            item.key === key ? { ...item, rowSpan } : item
                        ),
                    },
                })),

            toggleProfileBlock: (key) =>
                setPortfolio((prev) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        layout: prev.profile.layout.map((item) =>
                            item.key === key ? { ...item, visible: !item.visible } : item
                        ),
                    },
                })),

            addSkill: () =>
                setPortfolio((prev) => ({
                    ...prev,
                    skills: [...prev.skills, createSkill()],
                })),

            updateSkill: (id, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    skills: updateById(prev.skills, id, (item) => ({ ...item, [field]: value })),
                })),

            removeSkill: (id) =>
                setPortfolio((prev) => ({
                    ...prev,
                    skills: prev.skills.filter((item) => item.id !== id),
                })),

            addProject: () =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: [...prev.projects, createProject()],
                })),

            updateProject: (id, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, id, (item) => ({ ...item, [field]: value })),
                })),

            moveProject: (draggedProjectId, targetProjectId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: moveBefore(prev.projects, draggedProjectId, targetProjectId, 'id'),
                })),

            removeProject: (id) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: prev.projects.filter((item) => item.id !== id),
                })),

            addProjectBlock: (projectId, type) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: [
                            ...project.blocks,
                            type === 'text'
                                ? createTextBlock()
                                : type === 'list'
                                    ? createListBlock()
                                    : createImageBlock(),
                        ],
                    })),
                })),

            moveProjectBlock: (projectId, draggedBlockId, targetBlockId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: moveBefore(project.blocks, draggedBlockId, targetBlockId, 'id'),
                    })),
                })),

            setProjectBlockSpan: (projectId, blockId, colSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: project.blocks.map((block) =>
                            block.id === blockId ? { ...block, colSpan } : block
                        ),
                    })),
                })),

            setProjectBlockRowSpan: (projectId, blockId, rowSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: project.blocks.map((block) =>
                            block.id === blockId ? { ...block, rowSpan } : block
                        ),
                    })),
                })),

            updateProjectBlock: (projectId, blockId, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            [field]: value,
                        })),
                    })),
                })),

            removeProjectBlock: (projectId, blockId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: project.blocks.filter((block) => block.id !== blockId),
                    })),
                })),

            addProjectListItem: (projectId, blockId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            items: [...(block.items || []), '새 항목'],
                        })),
                    })),
                })),

            updateProjectListItem: (projectId, blockId, index, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            items: block.items.map((item, i) => (i === index ? value : item)),
                        })),
                    })),
                })),

            removeProjectListItem: (projectId, blockId, index) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            items: (block.items || []).filter((_, i) => i !== index),
                        })),
                    })),
                })),

            addProjectTech: (projectId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        techStack: [...project.techStack, 'New Tech'],
                    })),
                })),

            updateProjectTech: (projectId, index, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        techStack: project.techStack.map((item, i) => (i === index ? value : item)),
                    })),
                })),

            addProjectImage: (projectId, blockId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            images: [...(block.images || []), ''],
                        })),
                    })),
                })),

            updateProjectImage: (projectId, blockId, index, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    projects: updateById(prev.projects, projectId, (project) => ({
                        ...project,
                        blocks: updateById(project.blocks, blockId, (block) => ({
                            ...block,
                            images: block.images.map((img, i) => (i === index ? value : img)),
                        })),
                    })),
                })),

            addTimelineItem: (sectionKey) =>
                setPortfolio((prev) => ({
                    ...prev,
                    [sectionKey]: [
                        ...prev[sectionKey],
                        createTimelineItem(sectionKey === 'awards' ? '새 수상' : '새 자격증'),
                    ],
                })),

            updateTimelineItem: (sectionKey, id, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    [sectionKey]: updateById(prev[sectionKey], id, (item) => ({
                        ...item,
                        [field]: value,
                    })),
                })),

            removeTimelineItem: (sectionKey, id) =>
                setPortfolio((prev) => ({
                    ...prev,
                    [sectionKey]: prev[sectionKey].filter((item) => item.id !== id),
                })),

            addCustomSection: ({ name, template, span, rowSpan }) =>
                setPortfolio((prev) => {
                    const next = clone(prev);
                    next.customSections = [
                        ...next.customSections,
                        createCustomSection({ name, template, span, rowSpan }),
                    ];
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
                    next.customSections = next.customSections.map((section) =>
                        section.id === sectionId ? { ...section, [field]: value } : section
                    );
                    return syncCustomSections(next);
                }),

            addCustomSectionItem: (sectionId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: [...section.items, createCustomSectionItem(section.template)],
                            }
                            : section
                    ),
                })),

            moveCustomSectionItem: (sectionId, draggedItemId, targetItemId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: moveBefore(section.items, draggedItemId, targetItemId, 'id'),
                            }
                            : section
                    ),
                })),

            setCustomSectionItemSpan: (sectionId, itemId, colSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.map((item) =>
                                    item.id === itemId ? { ...item, colSpan } : item
                                ),
                            }
                            : section
                    ),
                })),

            setCustomSectionItemRowSpan: (sectionId, itemId, rowSpan) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.map((item) =>
                                    item.id === itemId ? { ...item, rowSpan } : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomSectionItem: (sectionId, itemId, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.map((item) =>
                                    item.id === itemId ? { ...item, [field]: value } : item
                                ),
                            }
                            : section
                    ),
                })),

            removeCustomSectionItem: (sectionId, itemId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.filter((item) => item.id !== itemId),
                            }
                            : section
                    ),
                })),

            addCustomSectionTag: (sectionId, itemId) =>
                setPortfolio((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                        section.id === sectionId
                            ? {
                                ...section,
                                items: section.items.map((item) =>
                                    item.id === itemId
                                        ? { ...item, tags: [...(item.tags || []), '새 태그'] }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateCustomSectionTag: (sectionId, itemId, tagIndex, value) =>
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
                                            tags: (item.tags || []).map((tag, index) =>
                                                index === tagIndex ? value : tag
                                            ),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            removeCustomSectionTag: (sectionId, itemId, tagIndex) =>
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
                                            tags: (item.tags || []).filter((_, index) => index !== tagIndex),
                                        }
                                        : item
                                ),
                            }
                            : section
                    ),
                })),

            updateGlobalStyle: (target, field, value) =>
                setPortfolio((prev) => ({
                    ...prev,
                    styles: {
                        ...prev.styles,
                        [target]: { ...prev.styles[target], [field]: value },
                    },
                })),

            updateSelectedStyle: (field, value) => {
                if (!selected) return;

                if (selected.key === 'page' || selected.key === 'card') {
                    const target = selected.key === 'page' ? 'page' : 'card';
                    setPortfolio((prev) => ({
                        ...prev,
                        styles: {
                            ...prev.styles,
                            [target]: { ...prev.styles[target], [field]: value },
                        },
                    }));
                    return;
                }

                setPortfolio((prev) => ({
                    ...prev,
                    styles: {
                        ...prev.styles,
                        elements: {
                            ...prev.styles.elements,
                            [selected.key]: {
                                ...(prev.styles.elements[selected.key] || defaultStyle()),
                                [field]: value,
                            },
                        },
                    },
                }));
            },

            getSelectedStyle: () => {
                if (!selected) return null;
                if (selected.key === 'page') return portfolio.styles.page;
                if (selected.key === 'card') return portfolio.styles.card;
                return { ...defaultStyle(), ...(portfolio.styles.elements[selected.key] || {}) };
            },

            styleFor: (key) => ({
                ...defaultStyle(),
                ...(portfolio.styles.elements[key] || {}),
            }),

            cardStyle: () => ({
                backgroundColor: portfolio.styles.card.backgroundColor,
                borderColor: portfolio.styles.card.borderColor,
                borderRadius: `${portfolio.styles.card.borderRadius}px`,
                padding: `${portfolio.styles.card.padding}px`,
            }),

            getCustomSectionById: (sectionId) =>
                portfolio.customSections.find((section) => section.id === sectionId) || null,
        }),
        [portfolio, selected]
    );

    return { portfolio, mode, selected, ui, actions };
}