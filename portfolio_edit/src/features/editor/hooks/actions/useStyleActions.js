import { useMemo } from 'react';
import { defaultStyle } from '../../utils/defaultPortfolio';

const TEXT_STYLE_FIELDS = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing'];

function pickTextStyles(style) {
    if (!style) return {};
    return TEXT_STYLE_FIELDS.reduce((acc, key) => {
        if (style[key] !== undefined) acc[key] = style[key];
        return acc;
    }, {});
}

function getCardStyleKeyForElement(key) {
    if (!key) return null;
    if (key.startsWith('profile') || key.startsWith('section.profile')) return 'profileCard';
    if (key.startsWith('projects') || key.startsWith('section.projects')) return 'projectsCard';
    if (key.startsWith('skills') || key.startsWith('section.skills')) return 'skillsCard';
    if (key.startsWith('awards') || key.startsWith('section.awards')) return 'awardsCard';
    if (key.startsWith('certificates') || key.startsWith('section.certificates')) return 'certificatesCard';
    if (key.startsWith('custom') || key.startsWith('section.custom')) return 'customCard';
    return null;
}

function getAncestorElementKeys(key) {
    if (!key || key === 'page') return [];

    const ancestors = [];
    const parts = key.split('.');

    if (key.startsWith('profile.')) {
        const field = parts[1];
        if (field === 'image') ancestors.push('profileBlock.image');
        if (field === 'quote') ancestors.push('profileBlock.quote');
        if (field === 'intro') ancestors.push('profileBlock.intro');
        if (field === 'name' || field === 'role') ancestors.push('profileBlock.identity');
        if (field === 'contacts') ancestors.push('profile.contacts', 'profileBlock.contacts');
        return [...new Set(ancestors)];
    }

    if (key.startsWith('skills.')) {
        if (parts.length >= 3) ancestors.push(`skills.${parts[1]}`);
        return ancestors;
    }

    if (key.startsWith('awards.') || key.startsWith('certificates.')) {
        if (parts.length >= 3) ancestors.push(`${parts[0]}.${parts[1]}`);
        return ancestors;
    }

    if (key.startsWith('projects.')) {
        if (parts.length >= 3) ancestors.push(`projects.${parts[1]}`);
        if (parts[2] === 'blocks' && parts.length >= 5) {
            ancestors.push(`projects.${parts[1]}.blocks.${parts[3]}`);
        }
        return [...new Set(ancestors)];
    }

    if (key.startsWith('custom.')) {
        if (parts.length >= 4) ancestors.push(`custom.${parts[1]}.${parts[2]}`);
        if (parts[3] === 'blocks' && parts.length >= 6) {
            ancestors.push(`custom.${parts[1]}.${parts[2]}.blocks.${parts[4]}`);
        }
        return [...new Set(ancestors)];
    }

    return [];
}

export function useStyleActions(portfolio, setPortfolio, selected) {
    const resolveCardStyleKey = (key) => key;
    const cardStyleKeys = ['profileCard', 'projectsCard', 'skillsCard', 'awardsCard', 'certificatesCard', 'customCard'];

    return useMemo(() => ({
        setPageOrientation: (orientation) => setPortfolio((prev) => ({
            ...prev, styles: { ...prev.styles, page: { ...prev.styles.page, orientation } }
        })),
        togglePageOrientation: () => setPortfolio((prev) => {
            const current = prev.styles.page?.orientation || 'portrait';
            return { ...prev, styles: { ...prev.styles, page: { ...prev.styles.page, orientation: current === 'portrait' ? 'landscape' : 'portrait' } } };
        }),
        updateGlobalStyle: (target, field, value) => setPortfolio((prev) => ({
            ...prev, styles: { ...prev.styles, [target]: { ...prev.styles[target], [field]: value } }
        })),
        updateSelectedStyle: (field, value) => {
            if (!selected) return;
            if (selected.key === 'page' || cardStyleKeys.includes(selected.key)) {
                const targetKey = resolveCardStyleKey(selected.key);
                setPortfolio((prev) => ({ ...prev, styles: { ...prev.styles, [targetKey]: { ...prev.styles[targetKey], [field]: value } } }));
                return;
            }
            setPortfolio((prev) => ({
                ...prev,
                styles: {
                    ...prev.styles,
                    elements: {
                        ...prev.styles.elements,
                        [selected.key]: { ...(prev.styles.elements[selected.key] || {}), [field]: value },
                    },
                },
            }));
        },
        getSelectedStyle: () => {
            if (!selected) return null;
            if (selected.key === 'page') return portfolio.styles.page;
            if (cardStyleKeys.includes(selected.key)) return portfolio.styles[resolveCardStyleKey(selected.key)];
            return { ...defaultStyle(), ...pickTextStyles(portfolio.styles.page), ...(portfolio.styles.elements[selected.key] || {}) };
        },
        styleFor: (key) => {
            const cardKey = getCardStyleKeyForElement(key);
            const ancestorKeys = getAncestorElementKeys(key);
            const inheritedTextStyle = ancestorKeys.reduce(
                (acc, ancestorKey) => ({ ...acc, ...pickTextStyles(portfolio.styles.elements?.[ancestorKey]) }),
                {}
            );

            return {
                ...defaultStyle(),
                ...pickTextStyles(portfolio.styles.page),
                ...pickTextStyles(cardKey ? portfolio.styles[resolveCardStyleKey(cardKey)] : null),
                ...inheritedTextStyle,
                ...(portfolio.styles.elements?.[key] || {}),
            };
        },
        sectionCardStyle: (target) => {
            const resolvedKey = resolveCardStyleKey(target);
            return {
                backgroundColor: portfolio.styles[resolvedKey]?.backgroundColor,
                borderColor: portfolio.styles[resolvedKey]?.borderColor,
                borderRadius: `${portfolio.styles[resolvedKey]?.borderRadius ?? 24}px`,
                padding: `${portfolio.styles[resolvedKey]?.padding ?? 28}px`,
                color: portfolio.styles.page?.color,
                fontFamily: portfolio.styles.page?.fontFamily,
                textAlign: portfolio.styles.page?.textAlign,
                lineHeight: portfolio.styles.page?.lineHeight,
                letterSpacing: portfolio.styles.page?.letterSpacing,
            };
        },
    }), [portfolio, setPortfolio, selected]);
}
