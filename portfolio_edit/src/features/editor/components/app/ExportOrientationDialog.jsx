export default function ExportOrientationDialog({
  isOpen,
  isExporting,
  currentOrientation,
  onClose,
  onExport,
}) {
  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="export-dialog-backdrop"
        onClick={onClose}
        aria-label="PDF 방향 선택 닫기"
      />

      <section className="export-dialog no-print" role="dialog" aria-modal="true" aria-label="PDF 방향 선택">
        <div className="export-dialog-head">
          <div>
            <strong>PDF 방향 선택</strong>
            <p>추출 전에 세로형 또는 가로형을 선택합니다.</p>
          </div>

          <button type="button" className="mobile-sheet-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="orientation-picker export-orientation-picker">
          <button
            type="button"
            className={`orientation-card ${currentOrientation !== 'landscape' ? 'active' : ''}`}
            onClick={() => onExport('portrait')}
            disabled={isExporting}
          >
            <span className="orientation-card-preview portrait" />
            <strong>세로형</strong>
            <p>A4 Portrait로 저장</p>
          </button>

          <button
            type="button"
            className={`orientation-card ${currentOrientation === 'landscape' ? 'active' : ''}`}
            onClick={() => onExport('landscape')}
            disabled={isExporting}
          >
            <span className="orientation-card-preview landscape" />
            <strong>가로형</strong>
            <p>A4 Landscape로 저장</p>
          </button>
        </div>
      </section>
    </>
  );
}
