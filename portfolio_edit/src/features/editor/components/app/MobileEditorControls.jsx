import { useEffect, useState } from 'react';
import SidePanel from '../SidePanel';
import StylePanel from '../StylePanel';
import {
  MOBILE_LAYOUT_TITLE_MAP,
  MOBILE_LAYOUT_TOOLS,
  MOBILE_STYLE_TITLE_MAP,
  MOBILE_STYLE_TOOLS,
} from '../../constants/editorTools';
import { getSelectionTypeLabel } from '../../utils/storeHelpers';

function MobileDockButton({ active, label, onClick, emphasized = false }) {
  return (
    <button
      type="button"
      className={`mobile-dock-button ${active ? 'active' : ''} ${emphasized ? 'emphasized' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  );
}

export function MobileEditorSheet({ store }) {
  const { ui, actions } = store;
  const isLayout = ui.mobileEditorMode === 'layout';

  const [shouldRender, setShouldRender] = useState(ui.mobileSheetOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (ui.mobileSheetOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return;
    }

    setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), 220);
    return () => clearTimeout(timer);
  }, [ui.mobileSheetOpen]);

  if (!shouldRender) return null;

  const titleMap = isLayout ? MOBILE_LAYOUT_TITLE_MAP : MOBILE_STYLE_TITLE_MAP;
  const title = titleMap[isLayout ? ui.mobileLayoutTool : ui.mobileStyleTool] || '편집';

  return (
    <>
      <button
        type="button"
        className={`mobile-sheet-backdrop ${isVisible ? 'is-open' : ''}`}
        onClick={() => actions.toggleMobileSheet(false)}
        aria-label="모바일 편집창 닫기"
      />

      <section className={`mobile-editor-sheet ${isVisible ? 'is-open' : ''}`}>
        <div className="mobile-editor-sheet-handle" />

        <div className="mobile-editor-sheet-head">
          <div>
            <strong>{title}</strong>
            <p>{isLayout ? '구성 항목을 바로 수정합니다.' : '선택 대상을 기준으로 스타일을 수정합니다.'}</p>
          </div>

          <button type="button" className="mobile-sheet-close" onClick={() => actions.toggleMobileSheet(false)}>
            닫기
          </button>
        </div>

        <div className="mobile-editor-sheet-body">
          {isLayout ? (
            <SidePanel store={store} mobileTool={ui.mobileLayoutTool} embedded />
          ) : (
            <StylePanel store={store} mobileTool={ui.mobileStyleTool} embedded />
          )}
        </div>
      </section>
    </>
  );
}

export function MobileQuickFab({ store }) {
  const { ui, actions } = store;

  if (ui.mobileEditorMode !== 'style') return null;

  return (
    <div className={`mobile-quick-fab-shell ${ui.mobileQuickOpen ? 'is-open' : ''}`}>
      {ui.mobileQuickOpen ? (
        <div className="mobile-quick-panel">
          <StylePanel store={store} quickOnly embedded />
        </div>
      ) : null}

      <button type="button" className="mobile-quick-fab" onClick={() => actions.toggleMobileQuick()}>
        {ui.mobileQuickOpen ? '닫기' : '빠른'}
      </button>
    </div>
  );
}

export function MobileSelectionChip({ store }) {
  const { ui, selected, actions } = store;

  if (ui.mobileEditorMode !== 'style') return null;

  const typeLabel = getSelectionTypeLabel(selected?.key);

  return (
    <button
      type="button"
      className="mobile-selection-chip no-print"
      onClick={() => {
        actions.setMobileStyleTool('select');
        actions.toggleMobileSheet(true);
      }}
    >
      <span className="mobile-selection-chip-label">선택됨</span>
      <strong>{selected?.label || '선택 없음'}</strong>
      <em>{typeLabel}</em>
    </button>
  );
}

export function MobileBottomDock({ store }) {
  const { ui, actions } = store;
  const isLayout = ui.mobileEditorMode === 'layout';
  const tools = isLayout ? MOBILE_LAYOUT_TOOLS : MOBILE_STYLE_TOOLS;

  return (
    <div className="mobile-bottom-dock no-print">
      <div className="mobile-bottom-dock-inner">
        {tools.map((tool) => {
          const isActive = ui.mobileSheetOpen && (isLayout ? ui.mobileLayoutTool === tool.key : ui.mobileStyleTool === tool.key);

          return (
            <MobileDockButton
              key={tool.key}
              active={isActive}
              label={tool.label}
              onClick={() => {
                if (isActive) {
                  actions.toggleMobileSheet(false);
                  return;
                }

                if (isLayout) {
                  actions.setMobileLayoutTool(tool.key);
                  return;
                }

                actions.setMobileStyleTool(tool.key);
              }}
            />
          );
        })}

        <MobileDockButton
          active={false}
          label={isLayout ? '스타일' : '구성'}
          emphasized
          onClick={() => actions.setMobileEditorMode(isLayout ? 'style' : 'layout')}
        />
      </div>
    </div>
  );
}
