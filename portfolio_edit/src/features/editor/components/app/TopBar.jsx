function EditorLayoutModeSwitch({ value, onChange, compact = false }) {
  const options = [
    { key: 'auto', label: compact ? '자동' : '자동' },
    { key: 'desktop', label: compact ? '데탑' : '데스크탑' },
    { key: 'mobile', label: compact ? '모바일' : '모바일' },
  ];

  return (
    <div className={`topbar-layout-switch ${compact ? 'is-compact' : ''}`} role="group" aria-label="에디터 레이아웃 모드 전환">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`topbar-layout-switch-button ${value === option.key ? 'active' : ''}`}
          onClick={() => onChange(option.key)}
          aria-pressed={value === option.key}
          title={`에디터 레이아웃을 ${option.label} 모드로 설정`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function HistoryControls({ canUndo, canRedo, onUndo, onRedo, compact = false }) {
  return (
    <div className={`topbar-history-group ${compact ? 'is-compact' : ''}`} role="group" aria-label="실행 취소 및 다시 실행">
      <button
        type="button"
        className="topbar-history-button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="실행 취소"
        title="실행 취소 (Ctrl/Cmd + Z)"
      >
        <span aria-hidden="true">↶</span>
        {compact ? null : <strong>실행 취소</strong>}
      </button>

      <button
        type="button"
        className="topbar-history-button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="다시 실행"
        title="다시 실행 (Ctrl/Cmd + Shift + Z / Ctrl + Y)"
      >
        <span aria-hidden="true">↷</span>
        {compact ? null : <strong>다시 실행</strong>}
      </button>
    </div>
  );
}

function MobileTopBarControls({
  currentModeLabel,
  nextModeLabel,
  isExporting,
  canUndo,
  canRedo,
  onToggleMode,
  onUndo,
  onRedo,
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

      <div className="topbar-mobile-tool-grid">
        <HistoryControls canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} compact />

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
    </div>
  );
}

function DesktopTopBarControls({
  currentModeLabel,
  nextModeLabel,
  isExporting,
  canUndo,
  canRedo,
  onToggleMode,
  onUndo,
  onRedo,
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

      <HistoryControls canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />

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
  editorLayoutMode,
  canUndo,
  canRedo,
  onChangeEditorLayoutMode,
  onToggleMode,
  onUndo,
  onRedo,
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
          <div className="topbar-layout-switch-row">
            <span className="topbar-layout-switch-label">에디터 레이아웃</span>
            <EditorLayoutModeSwitch value={editorLayoutMode} onChange={onChangeEditorLayoutMode} compact={isMobile} />
          </div>
        </div>

        <div className="topbar-right">
          {isMobile ? (
            <MobileTopBarControls
              currentModeLabel={currentModeLabel}
              nextModeLabel={nextModeLabel}
              isExporting={isExporting}
              canUndo={canUndo}
              canRedo={canRedo}
              onToggleMode={onToggleMode}
              onUndo={onUndo}
              onRedo={onRedo}
              onOpenExport={onOpenExport}
              onReset={onReset}
            />
          ) : (
            <DesktopTopBarControls
              currentModeLabel={currentModeLabel}
              nextModeLabel={nextModeLabel}
              isExporting={isExporting}
              canUndo={canUndo}
              canRedo={canRedo}
              onToggleMode={onToggleMode}
              onUndo={onUndo}
              onRedo={onRedo}
              onOpenExport={onOpenExport}
              onReset={onReset}
            />
          )}
        </div>
      </div>
    </header>
  );
}
