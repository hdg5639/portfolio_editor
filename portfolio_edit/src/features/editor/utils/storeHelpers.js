import {
    defaultPortfolio,
    defaultSectionLayout,
    defaultProfileBlocks,
    createComplexCustomItem, createTextBlock, createListBlock, createImageBlock,
    defaultStyle,
} from './defaultPortfolio.js';
import { normalizeGridItems } from './layoutGrid.js';

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


const CARD_SELECTION_KEYS = new Set([
    'profileCard',
    'projectsCard',
    'skillsCard',
    'awardsCard',
    'certificatesCard',
    'customCard',
]);

export function isCardSelectionKey(selectedKey) {
    return CARD_SELECTION_KEYS.has(selectedKey);
}

export function getSelectionTypeLabel(selectedKey) {
    if (!selectedKey) return '선택 없음';
    if (selectedKey === 'page') return '페이지';
    if (isCardSelectionKey(selectedKey)) return '카드';
    if (selectedKey.startsWith('profileBlock.')) return '블럭';
    if (/^projects\.[^.]+\.blocks\.[^.]+$/.test(selectedKey)) return '블럭';
    if (/^custom\.[^.]+\.[^.]+\.blocks\.[^.]+$/.test(selectedKey)) return '블럭';
    if (/^projects\.[^.]+$/.test(selectedKey)) return '블럭';
    if (/^skills\.[^.]+$/.test(selectedKey)) return '블럭';
    if (/^(awards|certificates)\.[^.]+$/.test(selectedKey)) return '블럭';
    if (/^custom\.[^.]+\.[^.]+$/.test(selectedKey)) return '블럭';
    return '요소';
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

function stripTransientGridState(item) {
    if (!item || typeof item !== 'object') return item;
    const { minRowSpan, ...rest } = item;
    return rest;
}


function matchesSelectionScope(selectedKey, prefix) {
    if (!selectedKey || !prefix) return false;
    return selectedKey === prefix || selectedKey.startsWith(`${prefix}.`);
}

function stripDefaultStyleValues(style) {
    if (!style || typeof style !== 'object') return style;

    const defaults = defaultStyle();
    const cleaned = { ...style };

    Object.keys(defaults).forEach((key) => {
        if (cleaned[key] === defaults[key]) {
            delete cleaned[key];
        }
    });

    return cleaned;
}

export function getCardSelectionState(selectedKey, cardKey, prefixes = []) {
    const selected = selectedKey === cardKey;
    const ancestor = !selected && prefixes.some((prefix) => matchesSelectionScope(selectedKey, prefix));
    return { selected, ancestor, active: selected || ancestor };
}

export function getSectionSelectionState(selectedKey, sectionKey) {
    const mapping = {
        profile: { cardKey: 'profileCard', prefixes: ['profile', 'profileBlock', 'section.profile'] },
        projects: { cardKey: 'projectsCard', prefixes: ['projects', 'section.projects'] },
        skills: { cardKey: 'skillsCard', prefixes: ['skills', 'section.skills'] },
        awards: { cardKey: 'awardsCard', prefixes: ['awards', 'section.awards'] },
        certificates: { cardKey: 'certificatesCard', prefixes: ['certificates', 'section.certificates'] },
    };

    if (sectionKey?.startsWith('custom:')) {
        const sectionId = sectionKey.slice('custom:'.length);
        return getCardSelectionState(selectedKey, 'customCard', [`custom.${sectionId}`, `section.custom.${sectionId}`]);
    }

    const current = mapping[sectionKey];
    if (!current) return { selected: false, ancestor: false, active: false };
    return getCardSelectionState(selectedKey, current.cardKey, current.prefixes);
}

export function getProfileBlockSelectionState(selectedKey, blockKey) {
    const shellKey = `profileBlock.${blockKey}`;
    const scopes = {
        image: ['profile.image'],
        quote: ['profile.quote'],
        contacts: ['profile.contacts'],
        identity: ['profile.name', 'profile.role'],
        intro: ['profile.intro'],
    };
    const prefixes = scopes[blockKey] || [];
    const selected = selectedKey === shellKey;
    const ancestor = !selected && prefixes.some((prefix) => matchesSelectionScope(selectedKey, prefix));
    return { selected, ancestor, active: selected || ancestor };
}

export function getProjectSelectionState(selectedKey, projectId) {
    const prefix = `projects.${projectId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
}

export function getProjectBlockSelectionState(selectedKey, projectId, blockId) {
    const prefix = `projects.${projectId}.blocks.${blockId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
}

export function getCustomItemSelectionState(selectedKey, sectionId, itemId) {
    const prefix = `custom.${sectionId}.${itemId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
}

export function getCustomBlockSelectionState(selectedKey, sectionId, itemId, blockId) {
    const prefix = `custom.${sectionId}.${itemId}.blocks.${blockId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
}

export function getSkillRowSelectionState(selectedKey, skillId) {
    const prefix = `skills.${skillId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
}

export function getTimelineItemSelectionState(selectedKey, sectionKey, itemId) {
    const prefix = `${sectionKey}.${itemId}`;
    const selected = selectedKey === prefix;
    const ancestor = !selected && matchesSelectionScope(selectedKey, prefix);
    return { selected, ancestor, active: selected || ancestor };
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

    next.profile.layoutMode = next.profile.layoutMode || 'manual';

    if (!next.profile.layout || !Array.isArray(next.profile.layout) || !next.profile.layout.length) {
        next.profile.layout = defaultProfileBlocks();
    } else {
        const defaults = defaultProfileBlocks();
        const existingMap = new Map(next.profile.layout.map((item) => [item.key, item]));
        next.profile.layout = normalizeGridItems(
            defaults.map((item) => ({
                ...item,
                ...stripTransientGridState(existingMap.get(item.key) || {}),
            }))
        );
    }

    next.styles = next.styles || {};
    next.styles.page = {
        ...defaultStyle(),
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

    const legacyTimelineCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.timelineCard || {}),
    };

    next.styles.awardsCard = {
        ...legacyTimelineCard,
        ...(next.styles.awardsCard || {}),
    };

    next.styles.certificatesCard = {
        ...legacyTimelineCard,
        ...(next.styles.certificatesCard || {}),
    };

    next.styles.customCard = {
        backgroundColor: '#ffffff',
        borderColor: '#e8e1d7',
        borderRadius: 24,
        padding: 28,
        ...legacyCard,
        ...(next.styles.customCard || {}),
    };

    next.styles.elements = Object.fromEntries(
        Object.entries(next.styles.elements || {}).map(([key, value]) => [key, stripDefaultStyleValues(value)])
    );

    delete next.styles.card;
    delete next.styles.timelineCard;

    next.projects = (next.projects || []).map((project) => ({
        ...project,
        layoutMode: project.layoutMode || 'manual',
        blocks: normalizeGridItems((project.blocks || []).map((block) => ({
            colSpan: 12,
            rowSpan: 1,
            ...stripTransientGridState(block),
        }))),
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
                    layoutMode: base.layoutMode || 'manual',
                    techStack: Array.isArray(base.techStack)
                        ? base.techStack
                        : Array.isArray(base.tags)
                            ? base.tags
                            : ['React', 'Spring'],
                    blocks: normalizeGridItems([
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
                    ]),
                };
            }

            return {
                ...base,
                layoutMode: base.layoutMode || 'manual',
                techStack: Array.isArray(base.techStack) ? base.techStack : [],
                blocks: normalizeGridItems((base.blocks || []).map((block) => ({
                    colSpan: 12,
                    rowSpan: 1,
                    ...stripTransientGridState(block),
                }))),
            };
        }),
    }));

    next.layout.items = (next.layout.items || []).map((item) => ({
        rowSpan: 1,
        ...item,
    }));

    return next;
}