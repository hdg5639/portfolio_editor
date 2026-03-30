import { useEffect, useState, useMemo } from 'react';
import {
    EDITOR_LAYOUT_MODE_STORAGE_KEY,
    detectMobileViewport,
    getStoredEditorLayoutMode,
    migratePortfolio,
    clone,
    resolveEditorLayoutMode,
} from '../utils/storeHelpers';
import { defaultPortfolio } from '../utils/defaultPortfolio';

import { useUiActions } from './actions/useUiActions.js';
import { useStyleActions } from './actions/useStyleActions.js';
import { useProjectActions } from './actions/useProjectActions.js';
import { useCustomSectionActions } from './actions/useCustomSectionActions.js';
import { useLayoutAndProfileActions } from './actions/useLayoutAndProfileActions.js';

const STORAGE_KEY = 'portfolio-editor-v5';

export function usePortfolioStore() {
    const [portfolio, setPortfolio] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? migratePortfolio(JSON.parse(raw)) : clone(defaultPortfolio);
    });

    const [mode, setMode] = useState('edit');
    const [selected, setSelected] = useState({ key: 'page', label: '페이지 전체' });
    const [ui, setUi] = useState(() => {
        const viewportIsMobile = detectMobileViewport();
        const editorLayoutMode = getStoredEditorLayoutMode();
        const isMobile = resolveEditorLayoutMode(editorLayoutMode, viewportIsMobile);

        return {
            showContentPanel: true,
            showStylePanel: true,
            showEditHelpers: true,
            viewportIsMobile,
            editorLayoutMode,
            isMobile,
            mobileEditorMode: 'layout',
            mobileLayoutTool: 'sections',
            mobileStyleTool: 'text',
            mobileSheetOpen: false,
            mobileQuickOpen: false,
        };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    }, [portfolio]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncViewport = () => {
            const viewportIsMobile = detectMobileViewport();
            setUi((prev) => {
                const isMobile = resolveEditorLayoutMode(prev.editorLayoutMode, viewportIsMobile);
                return {
                    ...prev,
                    viewportIsMobile,
                    isMobile,
                    mobileSheetOpen: isMobile ? prev.mobileSheetOpen : false,
                    mobileQuickOpen: isMobile ? prev.mobileQuickOpen : false,
                };
            });
        };
        syncViewport();
        window.addEventListener('resize', syncViewport);
        return () => window.removeEventListener('resize', syncViewport);
    }, []);

    const uiActions = useUiActions(setUi, setMode, setSelected, setPortfolio, STORAGE_KEY, EDITOR_LAYOUT_MODE_STORAGE_KEY);
    const styleActions = useStyleActions(portfolio, setPortfolio, selected);
    const projectActions = useProjectActions(setPortfolio);
    const customSectionActions = useCustomSectionActions(setPortfolio, portfolio);
    const layoutAndProfileActions = useLayoutAndProfileActions(setPortfolio);

    const actions = useMemo(() => ({
        ...uiActions,
        ...styleActions,
        ...projectActions,
        ...customSectionActions,
        ...layoutAndProfileActions
    }), [uiActions, styleActions, projectActions, customSectionActions, layoutAndProfileActions]);

    return { portfolio, mode, selected, ui, actions };
}