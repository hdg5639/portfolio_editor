import { useMemo } from 'react';
import { defaultStyle } from '../../utils/defaultPortfolio';

export function useStyleActions(portfolio, setPortfolio, selected) {
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
            const cardStyleKeys = ['profileCard', 'projectsCard', 'skillsCard', 'timelineCard', 'customCard'];
            if (selected.key === 'page' || cardStyleKeys.includes(selected.key)) {
                setPortfolio((prev) => ({ ...prev, styles: { ...prev.styles, [selected.key]: { ...prev.styles[selected.key], [field]: value } } }));
                return;
            }
            setPortfolio((prev) => ({
                ...prev, styles: { ...prev.styles, elements: { ...prev.styles.elements, [selected.key]: { ...(prev.styles.elements[selected.key] || defaultStyle()), [field]: value } } }
            }));
        },
        getSelectedStyle: () => {
            if (!selected) return null;
            const cardStyleKeys = ['profileCard', 'projectsCard', 'skillsCard', 'timelineCard', 'customCard'];
            if (selected.key === 'page') return portfolio.styles.page;
            if (cardStyleKeys.includes(selected.key)) return portfolio.styles[selected.key];
            return { ...defaultStyle(), ...(portfolio.styles.elements[selected.key] || {}) };
        },
        styleFor: (key) => ({ ...defaultStyle(), ...(portfolio.styles.elements[key] || {}) }),
        sectionCardStyle: (target) => ({
            backgroundColor: portfolio.styles[target]?.backgroundColor,
            borderColor: portfolio.styles[target]?.borderColor,
            borderRadius: `${portfolio.styles[target]?.borderRadius ?? 24}px`,
            padding: `${portfolio.styles[target]?.padding ?? 28}px`,
        }),
    }), [portfolio, setPortfolio, selected]);
}