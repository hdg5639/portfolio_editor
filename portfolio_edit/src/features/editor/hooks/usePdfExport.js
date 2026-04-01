import { useRef, useState, useCallback } from 'react';
import { getDefaultPdfExporter } from '../export/ExportService.js';

export function usePdfExport({ store }) {
  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const { actions, mode, portfolio } = store;

  const openExportSheet = useCallback(() => {
    if (!isExporting) {
      setIsExportSheetOpen(true);
    }
  }, [isExporting]);

  const closeExportSheet = useCallback(() => {
    if (!isExporting) {
      setIsExportSheetOpen(false);
    }
  }, [isExporting]);

  const handleExportPdf = useCallback(
    async (nextOrientation = portfolio.styles.page?.orientation || 'portrait') => {
      const target = exportRef.current;
      if (!target || isExporting) return;

      try {
        setIsExporting(true);
        setIsExportSheetOpen(false);

        actions.clearSelection?.();
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

        const exporter = await getDefaultPdfExporter();
        await exporter.export({
          target,
          portfolio,
          mode,
          actions,
          orientation: nextOrientation,
          setMode: actions.setMode,
        });
      } catch (error) {
        console.error('PDF export failed:', error);
        alert('PDF 추출 중 오류가 발생했습니다.');
      } finally {
        setIsExporting(false);
      }
    },
    [actions, isExporting, mode, portfolio],
  );

  return {
    exportRef,
    isExporting,
    isExportSheetOpen,
    openExportSheet,
    closeExportSheet,
    handleExportPdf,
  };
}
