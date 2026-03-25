import { useMemo } from 'react';
import { defaultStyle } from '../../utils/defaultPortfolio';

export function useStyleActions(portfolio, setPortfolio, selected) {
    const resolveCardStyleKey = (key) => (key === 'awardsCard' || key === 'certificatesCard' ? 'timelineCard' : key);
    const cardStyleKeys = ['profileCard', 'projectsCard', 'skillsCard', 'timelineCard', 'awardsCard', 'certificatesCard', 'customCard'];

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
                ...prev, styles: { ...prev.styles, elements: { ...prev.styles.elements, [selected.key]: { ...(prev.styles.elements[selected.key] || defaultStyle()), [field]: value } } }
            }));
        },
        getSelectedStyle: () => {
            if (!selected) return null;
            if (selected.key === 'page') return portfolio.styles.page;
            if (cardStyleKeys.includes(selected.key)) return portfolio.styles[resolveCardStyleKey(selected.key)];
            return { ...defaultStyle(), ...(portfolio.styles.elements[selected.key] || {}) };
        },
        styleFor: (key) => ({ ...defaultStyle(), ...(portfolio.styles.elements[key] || {}) }),
        sectionCardStyle: (target) => {
            const resolvedKey = resolveCardStyleKey(target);
            return {
                backgroundColor: portfolio.styles[resolvedKey]?.backgroundColor,
                borderColor: portfolio.styles[resolvedKey]?.borderColor,
                borderRadius: `${portfolio.styles[resolvedKey]?.borderRadius ?? 24}px`,
                padding: `${portfolio.styles[resolvedKey]?.padding ?? 28}px`,
            };
        },
    }), [portfolio, setPortfolio, selected]);
}