import { PDF_BREAK_SELECTORS } from '../constants/pdfExport.js';

function collectPdfBreakCandidates(root, pageHeightCss) {
  if (!root || typeof window === 'undefined') return [];

  const rootRect = root.getBoundingClientRect();
  const selector = PDF_BREAK_SELECTORS.join(', ');
  const maxKeepTogetherHeight = pageHeightCss * 0.9;
  const candidates = [];

  root.querySelectorAll(selector).forEach((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    if (!rect.height || rect.height < 24) return;
    if (style.display === 'none' || style.visibility === 'hidden') return;
    if (element.closest('.no-print')) return;

    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;
    const height = rect.height;

    if (height > maxKeepTogetherHeight) return;

    candidates.push({ top, bottom, height });
  });

  candidates.sort((a, b) => a.top - b.top);
  return candidates;
}

function measureEffectiveExportHeight(root) {
  if (!root || typeof window === 'undefined') return 0;

  const rootRect = root.getBoundingClientRect();
  const rootStyle = window.getComputedStyle(root);
  const paddingBottom = parseFloat(rootStyle.paddingBottom || '0') || 0;
  let maxBottom = 0;

  root.querySelectorAll('*').forEach((element) => {
    if (element.closest('.no-print')) return;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;

    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    maxBottom = Math.max(maxBottom, rect.bottom - rootRect.top);
  });

  const effectiveHeight = Math.ceil(maxBottom + paddingBottom);
  return Math.max(1, Math.min(root.scrollHeight || effectiveHeight, effectiveHeight || root.scrollHeight || 0));
}

function buildPdfSlices(totalHeightCss, pageHeightCss, candidates) {
  if (!totalHeightCss || !pageHeightCss) {
    return [{ start: 0, end: totalHeightCss || 0 }];
  }

  const minFillRatio = 0.58;
  const maxBlankRatio = 0.42;
  const minBreakGap = 36;
  const slices = [];
  let currentTop = 0;
  let guard = 0;

  while (currentTop < totalHeightCss - 1 && guard < 400) {
    guard += 1;

    const preferredEnd = currentTop + pageHeightCss;
    if (preferredEnd >= totalHeightCss) {
      slices.push({ start: currentTop, end: totalHeightCss });
      break;
    }

    const crossing = candidates.filter((candidate) => {
      if (candidate.top <= currentTop + minBreakGap) return false;
      if (candidate.top >= preferredEnd) return false;
      return candidate.bottom > preferredEnd;
    });

    let nextEnd = preferredEnd;

    if (crossing.length > 0) {
      const viable = crossing.filter((candidate) => {
        const used = candidate.top - currentTop;
        const blank = preferredEnd - candidate.top;
        return used >= pageHeightCss * minFillRatio && blank <= pageHeightCss * maxBlankRatio;
      });

      const selected = viable.length > 0 ? viable[viable.length - 1] : null;
      if (selected) {
        nextEnd = selected.top;
      }
    }

    if (nextEnd <= currentTop + 1) {
      nextEnd = preferredEnd;
    }

    slices.push({ start: currentTop, end: Math.min(nextEnd, totalHeightCss) });
    currentTop = nextEnd;
  }

  if (slices.length === 0) {
    slices.push({ start: 0, end: totalHeightCss });
  }

  return slices.filter((slice, index) => {
    const height = slice.end - slice.start;
    if (height <= 2) return false;
    if (index === slices.length - 1 && height < pageHeightCss * 0.035) return false;
    return true;
  });
}

function buildPdfWrapper({ clone, exportWidthPx, exportPadding, baseBackgroundColor }) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${exportWidthPx}px`;
  wrapper.style.padding = `${exportPadding}px`;
  wrapper.style.background = baseBackgroundColor || '#ece7dc';
  wrapper.style.zIndex = '-1';

  clone.style.width = `${exportWidthPx}px`;
  clone.style.maxWidth = `${exportWidthPx}px`;
  clone.style.margin = '0 auto';
  clone.style.transform = 'none';
  clone.style.boxSizing = 'border-box';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return wrapper;
}

function getPdfDimensions(resolvedOrientation) {
  const isLandscape = resolvedOrientation === 'landscape';
  return {
    widthMm: isLandscape ? 297 : 210,
    heightMm: isLandscape ? 210 : 297,
    exportWidthPx: isLandscape ? 1754 : 1240,
  };
}

function buildSafePdfName(name) {
  return (name || 'portfolio').replace(/[\/:*?"<>|]/g, '').replace(/\s+/g, '-');
}

export function createHtmlCanvasPdfExporter() {
  return {
    kind: 'html-canvas',
    async export({ target, portfolio, mode, actions, orientation, setMode }) {
      if (!target) return;

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      let wrapper = null;
      const prevMode = mode;
      const prevOrientation = portfolio.styles.page?.orientation || 'portrait';
      const resolvedOrientation = orientation || prevOrientation;

      try {
        if (prevOrientation !== resolvedOrientation) {
          actions.setPageOrientation(resolvedOrientation);
          await new Promise((resolve) => setTimeout(resolve, 220));
        }

        if (mode !== 'preview') {
          setMode('preview');
          await new Promise((resolve) => setTimeout(resolve, 220));
        }

        await document.fonts?.ready;

        const clone = target.cloneNode(true);
        const { widthMm, heightMm, exportWidthPx } = getPdfDimensions(resolvedOrientation);
        const exportPadding = 0;

        wrapper = buildPdfWrapper({
          clone,
          exportWidthPx,
          exportPadding,
          baseBackgroundColor: portfolio.styles.page.baseBackgroundColor,
        });

        await new Promise((resolve) => setTimeout(resolve, 150));

        const effectiveHeightCss = measureEffectiveExportHeight(clone);
        clone.style.minHeight = `${effectiveHeightCss}px`;
        clone.style.height = `${effectiveHeightCss}px`;
        wrapper.style.height = `${effectiveHeightCss}px`;
        wrapper.style.overflow = 'hidden';

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: portfolio.styles.page.backgroundColor || '#ffffff',
          logging: false,
          width: clone.scrollWidth,
          height: effectiveHeightCss,
          windowWidth: clone.scrollWidth,
          windowHeight: effectiveHeightCss,
        });

        const pdf = new jsPDF(resolvedOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const renderScale = canvasWidth / Math.max(1, clone.scrollWidth);
        const pageHeightCss = (clone.scrollWidth * heightMm) / widthMm;
        const breakCandidates = collectPdfBreakCandidates(clone, pageHeightCss);
        const cssSlices = buildPdfSlices(effectiveHeightCss, pageHeightCss, breakCandidates);

        let pageIndex = 0;

        for (const slice of cssSlices) {
          const startPx = Math.max(0, Math.floor(slice.start * renderScale));
          const endPx = Math.min(canvasHeight, Math.ceil(slice.end * renderScale));
          const sliceHeightPx = Math.max(1, endPx - startPx);

          if (sliceHeightPx < 8) continue;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvasWidth;
          sliceCanvas.height = sliceHeightPx;

          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0,
            startPx,
            canvasWidth,
            sliceHeightPx,
            0,
            0,
            canvasWidth,
            sliceHeightPx,
          );

          const imgData = sliceCanvas.toDataURL('image/png');
          const sliceHeightMm = (sliceCanvas.height * widthMm) / canvasWidth;

          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, widthMm, sliceHeightMm, undefined, 'FAST');
          pageIndex += 1;
        }

        pdf.save(`${buildSafePdfName(portfolio.profile?.name)}-portfolio.pdf`);
      } finally {
        if (wrapper?.parentNode) wrapper.parentNode.removeChild(wrapper);
        if (prevMode !== 'preview') setMode(prevMode);
      }
    },
  };
}
