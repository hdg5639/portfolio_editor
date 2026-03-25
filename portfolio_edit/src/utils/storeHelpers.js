import {
    defaultPortfolio,
    defaultSectionLayout,
    defaultProfileBlocks,
    createComplexCustomItem, createTextBlock, createListBlock, createImageBlock
} from './defaultPortfolio';

export const MOBILE_BREAKPOINT = 920;

export function detectMobileViewport() {
    if (typeof window === 'undefined') return false;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const shortSide = Math.min(width, height);

    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const noHover = window.matchMedia?.('(hover: none)').matches ?? false;

    // 실제 모바일 기기는 그대로 잡고,
    // 데스크톱 브라우저는 폭이 충분히 작으면 모바일 편집 UI로 전환
    if (hasCoarsePointer || noHover) {
        return shortSide <= MOBILE_BREAKPOINT;
    }

    return width <= MOBILE_BREAKPOINT;
}

export function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function updateById(list, id, updater) {
    return list.map((item) => (item.id === id ? updater(item) : item));
}

export function moveBefore(list, draggedKey, targetKey, keyName = 'key') {
    if (!draggedKey || !targetKey || draggedKey === targetKey) return list;
    const next = [...list];
    const fromIndex = next.findIndex((item) => item[keyName] === draggedKey);
    const toIndex = next.findIndex((item) => item[keyName] === targetKey);
    if (fromIndex < 0 || toIndex < 0) return list;
    const [dragged] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragged);
    return next;
}

export function syncCustomSections(portfolio) {
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
    const mergedBase = baseItems.map((item) => ({ ...item, ...(existingMap.get(item.key) || {}) }));
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
            return { ...found, ...item, label: found.label, kind: found.kind, sectionId: found.sectionId };
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

export function migratePortfolio(rawPortfolio) {
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
        orientation: 'portrait',
        ...(next.styles.page || {}),
    };

    const legacyCard = next.styles.card || {};

    next.styles.profileCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.profileCard || {}),
    };

    next.styles.projectsCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.projectsCard || {}),
    };

    next.styles.skillsCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.skillsCard || {}),
    };

    next.styles.timelineCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.timelineCard || {}),
    };

    next.styles.customCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.customCard || {}),
    };

    delete next.styles.card;

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