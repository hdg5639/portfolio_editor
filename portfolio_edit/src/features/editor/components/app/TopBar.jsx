function MobileTopBarControls({
  currentModeLabel,
  nextModeLabel,
  isExporting,
  onToggleMode,
  onOpenExport,
  onReset,
}) {
  return (
    <div className="topbar-mobile-controls">
      <button
        type="button"
        className="topbar-mode-toggle topbar-mode-toggle-mobile"
        onClick={onToggleMode}
        aria-label={`${nextModeLabel}로 전환`}
      >
        <span className="topbar-mode-toggle-kicker">Mode</span>
        <strong>{currentModeLabel}</strong>
        <span className="topbar-mode-toggle-next">→ {nextModeLabel}</span>
      </button>

      <div className="topbar-mobile-icon-stack">
        <button
          type="button"
          className="topbar-icon-button topbar-icon-button-primary"
          onClick={onOpenExport}
          disabled={isExporting}
          aria-label={isExporting ? 'PDF 생성 중' : 'PDF 추출'}
          title={isExporting ? 'PDF 생성 중' : 'PDF 추출'}
        >
          <span aria-hidden="true">⤓</span>
        </button>

        <button
          type="button"
          className="topbar-icon-button"
          onClick={onReset}
          aria-label="초기화"
          title="초기화"
        >
          <span aria-hidden="true">⟲</span>
        </button>
      </div>
    </div>
  );
}

function DesktopTopBarControls({
  currentModeLabel,
  nextModeLabel,
  isExporting,
  onToggleMode,
  onOpenExport,
  onReset,
}) {
  return (
    <>
      <button
        type="button"
        className="topbar-mode-toggle"
        onClick={onToggleMode}
        aria-label={`${nextModeLabel}로 전환`}
      >
        <span className="topbar-mode-toggle-kicker">Mode</span>
        <span className="topbar-mode-toggle-body">
          <strong>{currentModeLabel}</strong>
          <span className="topbar-mode-toggle-separator" aria-hidden="true">
            ·
          </span>
          <span className="topbar-mode-toggle-next">→ {nextModeLabel}</span>
        </span>
      </button>

      <div className="topbar-action-group">
        <button
          type="button"
          className="topbar-action-button topbar-action-button-primary"
          onClick={onOpenExport}
          disabled={isExporting}
        >
          <span className="topbar-action-icon" aria-hidden="true">
            ↗
          </span>
          <span className="topbar-action-text">
            <span className="topbar-button-kicker">Export</span>
            <strong>{isExporting ? 'PDF 생성 중...' : 'PDF 추출'}</strong>
          </span>
        </button>

        <button type="button" className="topbar-action-button" onClick={onReset}>
          <span className="topbar-action-icon" aria-hidden="true">
            ⟲
          </span>
          <span className="topbar-action-text">
            <span className="topbar-button-kicker">Reset</span>
            <strong>초기화</strong>
          </span>
        </button>
      </div>
    </>
  );
}

export default function TopBar({
  isMobile,
  mobileEditorMode,
  selectedLabel,
  currentModeLabel,
  nextModeLabel,
  isExporting,
  onToggleMode,
  onOpenExport,
  onReset,
}) {
  return (
    <header className="topbar no-print">
      <div className="topbar-inner">
        <div className="topbar-left">
          <strong>Portfolio Editor Prototype</strong>
          <p>
            {isMobile
              ? `모바일 ${mobileEditorMode === 'layout' ? '구성' : '스타일'} 편집 · 선택: ${selectedLabel || '없음'}`
              : '완성본 위에서 직접 편집하고, 토글로 미리보기 전환'}
          </p>
        </div>

        <div className="topbar-right">
          {isMobile ? (
            <MobileTopBarControls
              currentModeLabel={currentModeLabel}
              nextModeLabel={nextModeLabel}
              isExporting={isExporting}
              onToggleMode={onToggleMode}
              onOpenExport={onOpenExport}
              onReset={onReset}
            />
          ) : (
            <DesktopTopBarControls
              currentModeLabel={currentModeLabel}
              nextModeLabel={nextModeLabel}
              isExporting={isExporting}
              onToggleMode={onToggleMode}
              onOpenExport={onOpenExport}
              onReset={onReset}
            />
          )}
        </div>
      </div>
    </header>
  );
}
