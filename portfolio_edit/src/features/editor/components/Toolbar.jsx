export default function Toolbar({ mode, onModeChange, onTogglePanel, onToggleStylePanel, onPrint, onReset }) {
  return (
    <header className="toolbar no-print">
      <div>
        <h1>Portfolio Editor Prototype</h1>
        <p>완성본 위에서 직접 편집하고, 토글로 미리보기 전환</p>
      </div>

      <div className="toolbar-actions">
        <button type="button" className="ghost" onClick={onTogglePanel}>구성 패널</button>
        <button type="button" className="ghost" onClick={onToggleStylePanel}>스타일 패널</button>

        <div className="segment-control">
          <button type="button" className={mode === 'edit' ? 'active' : ''} onClick={() => onModeChange('edit')}>편집</button>
          <button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => onModeChange('preview')}>미리보기</button>
        </div>

        <button type="button" onClick={onPrint}>PDF 추출</button>
        <button type="button" className="ghost" onClick={onReset}>초기화</button>
      </div>
    </header>
  );
}
