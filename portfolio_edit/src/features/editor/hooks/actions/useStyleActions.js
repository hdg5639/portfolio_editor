import { useMemo } from 'react';
import { defaultStyle } from '../../utils/defaultPortfolio';
import { getAncestorElementKeys, getCardStyleKeyForElement, isCardSelectionKey, SelectionKey } from '../../utils/selectionKeys.js';

const TEXT_STYLE_FIELDS = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing'];

function pickTextStyles(style) {
    if (!style) return {};
    return TEXT_STYLE_FIELDS.reduce((acc, key) => {
        if (style[key] !== undefined) acc[key] = style[key];
        return acc;
    }, {});
}

export function useStyleActions(portfolio, setPortfolio, selected) {
    const resolveCardStyleKey = (key) => key;

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
            if (selected.key === SelectionKey.page() || isCardSelectionKey(selected.key)) {
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
            if (selected.key === SelectionKey.page()) return portfolio.styles.page;
            if (isCardSelectionKey(selected.key)) return portfolio.styles[resolveCardStyleKey(selected.key)];
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
