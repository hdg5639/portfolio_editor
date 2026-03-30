import { useMemo } from 'react';
import { clone } from '../../utils/storeHelpers';
import { defaultPortfolio } from '../../utils/defaultPortfolio';

export function useUiActions(setUi, setModeState, setSelected, setPortfolio, STORAGE_KEY) {
    return useMemo(() => ({
        setMode: (nextMode) => {
            setModeState(nextMode);
            if (nextMode === 'preview') {
                setSelected(null);
            }
        },
        clearSelection: () => {
            setSelected(null);
        },
        select: (next) => {
            setSelected(next);
        },
        selectPage: () => {
            setSelected({ key: 'page', label: '페이지 전체' });
            setUi((prev) => ({
                ...prev,
                mobileEditorMode: prev.isMobile ? 'style' : prev.mobileEditorMode,
                mobileStyleTool: prev.isMobile ? 'box' : prev.mobileStyleTool,
            }));
        },
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
        setMobileEditorMode: (mode) =>
            setUi((prev) => ({
                ...prev,
                mobileEditorMode: mode,
                mobileSheetOpen: false,
                mobileQuickOpen: mode === 'style' ? prev.mobileQuickOpen : false,
            })),
        setMobileLayoutTool: (tool) =>
            setUi((prev) => ({
                ...prev,
                mobileLayoutTool: tool,
                mobileEditorMode: 'layout',
                mobileSheetOpen: true,
                mobileQuickOpen: false,
            })),
        setMobileStyleTool: (tool) =>
            setUi((prev) => ({
                ...prev,
                mobileStyleTool: tool,
                mobileEditorMode: 'style',
                mobileSheetOpen: true,
            })),
        toggleMobileSheet: (force) =>
            setUi((prev) => ({
                ...prev,
                mobileSheetOpen: typeof force === 'boolean' ? force : !prev.mobileSheetOpen,
            })),
        toggleMobileQuick: (force) =>
            setUi((prev) => ({
                ...prev,
                mobileQuickOpen: typeof force === 'boolean' ? force : !prev.mobileQuickOpen,
            })),
        reset: () => {
            const next = clone(defaultPortfolio);
            setPortfolio(next);
            setSelected({ key: 'page', label: '페이지 전체' });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        },
    }), [setUi, setModeState, setSelected, setPortfolio, STORAGE_KEY]);
}
