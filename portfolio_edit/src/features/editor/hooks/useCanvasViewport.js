import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

function getWrapInsets(wrap) {
  if (!wrap || typeof window === 'undefined') {
    return {
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      contentWidth: 0,
      contentHeight: 0,
    };
  }

  const computed = window.getComputedStyle(wrap);
  const paddingLeft = parseFloat(computed.paddingLeft || '0');
  const paddingRight = parseFloat(computed.paddingRight || '0');
  const paddingTop = parseFloat(computed.paddingTop || '0');
  const paddingBottom = parseFloat(computed.paddingBottom || '0');

  return {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    contentWidth: Math.max(0, wrap.clientWidth - paddingLeft - paddingRight),
    contentHeight: Math.max(0, wrap.clientHeight - paddingTop - paddingBottom),
  };
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, select, option, button, [contenteditable="true"], [data-no-space-pan="true"]')
  );
}

export default function useCanvasViewport({
  baseWidth,
  contentHeight,
  isMobileCanvas,
  mode,
}) {
  const [scale, setScale] = useState(1);
  const [showZoomUI, setShowZoomUI] = useState(true);
  const [mobileZoomPosition, setMobileZoomPosition] = useState({ x: null, y: null });
  const [wrapViewportSize, setWrapViewportSize] = useState({ width: 0, height: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  const wrapRef = useRef(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const scaleRef = useRef(scale);
  const previousScaleRef = useRef(scale);
  const pinchStateRef = useRef({ active: false, startDistance: 0, startScale: 1 });
  const previousEditPanGutterRef = useRef(0);
  const lastCenterSignatureRef = useRef('');
  const mobileZoomDragRef = useRef(null);

  const getDefaultMobileZoomPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 16, y: 160 };
    const collapsedWidth = 88;
    const fallbackHeight = showZoomUI ? 48 : 40;
    return {
      x: Math.max(12, window.innerWidth - collapsedWidth - 16),
      y: Math.max(96, window.innerHeight - fallbackHeight - 124),
    };
  }, [showZoomUI]);

  const clampMobileZoomPosition = useCallback(
    (x, y) => {
      if (typeof window === 'undefined') return { x, y };
      const estimatedWidth = showZoomUI ? 220 : 92;
      const estimatedHeight = 48;
      return {
        x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - estimatedWidth - 12)),
        y: Math.min(Math.max(88, y), Math.max(88, window.innerHeight - estimatedHeight - 96)),
      };
    },
    [showZoomUI],
  );

  useEffect(() => {
    if (!isMobileCanvas) return;
    setMobileZoomPosition((current) => {
      if (Number.isFinite(current.x) && Number.isFinite(current.y)) {
        return clampMobileZoomPosition(current.x, current.y);
      }
      return getDefaultMobileZoomPosition();
    });
  }, [clampMobileZoomPosition, getDefaultMobileZoomPosition, isMobileCanvas]);

  useEffect(() => {
    if (!isMobileCanvas) return undefined;

    const handleResize = () => {
      setMobileZoomPosition((current) => {
        if (Number.isFinite(current.x) && Number.isFinite(current.y)) {
          return clampMobileZoomPosition(current.x, current.y);
        }
        return getDefaultMobileZoomPosition();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampMobileZoomPosition, getDefaultMobileZoomPosition, isMobileCanvas]);

  const getFitScale = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return 1;

    const { contentWidth: availableWidth } = getWrapInsets(wrap);

    if (!availableWidth || !baseWidth) return 1;

    return Math.min(1, availableWidth / baseWidth);
  }, [baseWidth]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    const minScale = isMobileCanvas ? getFitScale() : 0.3;
    setScale((prev) => Math.max(prev - 0.1, minScale));
  }, [getFitScale, isMobileCanvas]);

  const handleZoomReset = useCallback(() => {
    setScale(isMobileCanvas ? getFitScale() : 1);
  }, [getFitScale, isMobileCanvas]);

  const handleWheel = useCallback(
    (event) => {
      const wrap = wrapRef.current;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        const minScale = isMobileCanvas ? getFitScale() : 0.3;
        const zoomOut = event.deltaY > 0;

        setScale((prev) => {
          const next = zoomOut ? prev - 0.05 : prev + 0.05;
          return Math.min(Math.max(next, minScale), 2);
        });
        return;
      }

      if (!wrap || isMobileCanvas) return;

      const canPanHorizontally = wrap.scrollWidth > wrap.clientWidth + 1;
      const horizontalIntent = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (!canPanHorizontally || !horizontalIntent) return;

      event.preventDefault();
      const horizontalDelta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
      wrap.scrollLeft += horizontalDelta;
    },
    [getFitScale, isMobileCanvas],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    wrap.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const updateSize = () => {
      setWrapViewportSize((current) => {
        const next = { width: wrap.clientWidth, height: wrap.clientHeight };
        return current.width === next.width && current.height === next.height ? current : next;
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(wrap);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isMobileCanvas) return;

    const applyFitScale = () => {
      setScale(getFitScale());
    };

    applyFitScale();

    window.addEventListener('resize', applyFitScale);
    window.addEventListener('orientationchange', applyFitScale);

    return () => {
      window.removeEventListener('resize', applyFitScale);
      window.removeEventListener('orientationchange', applyFitScale);
    };
  }, [getFitScale, isMobileCanvas, baseWidth]);

  const scaledWidth = Math.round(baseWidth * scale);
  const scaledHeight = Math.round(contentHeight * scale);
  const dynamicPanGutter = Math.round(baseWidth * Math.max(0, scale - 1) * 0.95);
  const editPanGutter = !isMobileCanvas && mode === 'edit'
    ? Math.max(520, Math.round(baseWidth * 0.52) + dynamicPanGutter)
    : 0;

  const getStageMetrics = useCallback(
    (targetScale) => {
      const targetScaledWidth = Math.round(baseWidth * targetScale);
      const targetDynamicPanGutter = Math.round(baseWidth * Math.max(0, targetScale - 1) * 0.95);
      const targetEditPanGutter = !isMobileCanvas && mode === 'edit'
        ? Math.max(520, Math.round(baseWidth * 0.52) + targetDynamicPanGutter)
        : 0;

      const wrap = wrapRef.current;
      const { contentWidth } = getWrapInsets(wrap);
      const fallbackContentWidth = Math.max(0, wrapViewportSize.width - (isMobileCanvas ? 32 : 48));
      const viewportContentWidth = contentWidth || fallbackContentWidth;
      const minStageWidth = !isMobileCanvas ? viewportContentWidth : Math.max(viewportContentWidth, targetScaledWidth);

      let targetStageWidth = targetScaledWidth;
      if (!isMobileCanvas && mode === 'edit') {
        targetStageWidth = Math.max(targetScaledWidth + targetEditPanGutter * 2, minStageWidth);
      } else if (isMobileCanvas) {
        const overflowX = Math.max(0, targetScaledWidth - viewportContentWidth);
        const mobilePanGutter = overflowX > 0 ? Math.max(18, Math.min(96, Math.round(overflowX * 0.18))) : 0;
        targetStageWidth = Math.max(targetScaledWidth + mobilePanGutter * 2, minStageWidth);
      }

      const stageOffsetX = Math.max(0, Math.round((targetStageWidth - targetScaledWidth) / 2));

      return {
        scaledWidth: targetScaledWidth,
        stageWidth: targetStageWidth,
        stageOffsetX,
        editPanGutter: targetEditPanGutter,
      };
    },
    [baseWidth, isMobileCanvas, mode, wrapViewportSize.width],
  );

  const { stageWidth, stageOffsetX } = getStageMetrics(scale);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useLayoutEffect(() => {
    if (mode !== 'edit') {
      previousScaleRef.current = scale;
      return;
    }

    const wrap = wrapRef.current;
    const previousScale = previousScaleRef.current;

    if (!wrap || !previousScale || previousScale === scale) {
      previousScaleRef.current = scale;
      return;
    }

    if (pinchStateRef.current.active) {
      previousScaleRef.current = scale;
      return;
    }

    const prevMetrics = getStageMetrics(previousScale);
    const nextMetrics = getStageMetrics(scale);
    const { paddingLeft, paddingTop, contentWidth, contentHeight } = getWrapInsets(wrap);
    const viewportCenterX = wrap.scrollLeft + paddingLeft + contentWidth / 2;
    const viewportCenterY = wrap.scrollTop + paddingTop + contentHeight / 2;
    const contentCenterX = (viewportCenterX - prevMetrics.stageOffsetX) / previousScale;
    const contentCenterY = viewportCenterY / previousScale;

    requestAnimationFrame(() => {
      const nextScrollLeft = contentCenterX * scale + nextMetrics.stageOffsetX - (paddingLeft + contentWidth / 2);
      const nextScrollTop = contentCenterY * scale - (paddingTop + contentHeight / 2);
      const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const maxTop = Math.max(0, wrap.scrollHeight - wrap.clientHeight);

      wrap.scrollLeft = Math.max(0, Math.min(maxLeft, nextScrollLeft));
      wrap.scrollTop = Math.max(0, Math.min(maxTop, nextScrollTop));
    });

    previousScaleRef.current = scale;
  }, [getStageMetrics, mode, scale]);

  useLayoutEffect(() => {
    if (isMobileCanvas || mode !== 'edit') return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    const nextSignature = `${mode}:${baseWidth}:${Math.round(contentHeight)}:${wrap.clientWidth}`;
    const prevGutter = previousEditPanGutterRef.current;
    const gutterDelta = editPanGutter - prevGutter;
    previousEditPanGutterRef.current = editPanGutter;

    if (lastCenterSignatureRef.current !== nextSignature) {
      lastCenterSignatureRef.current = nextSignature;
      requestAnimationFrame(() => {
        const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
        wrap.scrollLeft = Math.max(0, Math.min(maxLeft, Math.round(maxLeft / 2)));
      });
      return;
    }

    if (!gutterDelta) return;

    requestAnimationFrame(() => {
      const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const compensatedLeft = wrap.scrollLeft + gutterDelta / 2;
      wrap.scrollLeft = Math.max(0, Math.min(maxLeft, compensatedLeft));
    });
  }, [baseWidth, contentHeight, editPanGutter, isMobileCanvas, mode, wrapViewportSize.width]);

  useEffect(() => {
    if (!isMobileCanvas) return undefined;

    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const getDistance = (touches) => {
      const [first, second] = touches;
      return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    };

    const getMidpoint = (touches) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (event) => {
      if (event.touches.length < 2) return;

      const minScale = getFitScale();
      pinchStateRef.current = {
        active: true,
        startDistance: getDistance(event.touches),
        startScale: Math.max(scaleRef.current, minScale),
      };
    };

    const handleTouchMove = (event) => {
      if (!pinchStateRef.current.active || event.touches.length < 2) return;

      event.preventDefault();

      const minScale = getFitScale();
      const nextDistance = getDistance(event.touches);
      if (!nextDistance || !pinchStateRef.current.startDistance) return;

      const rect = wrap.getBoundingClientRect();
      const midpoint = getMidpoint(event.touches);
      const currentMetrics = getStageMetrics(scaleRef.current);
      const { paddingLeft, paddingTop } = getWrapInsets(wrap);
      const contentViewportX = midpoint.x - rect.left - paddingLeft;
      const contentViewportY = midpoint.y - rect.top - paddingTop;
      const pointerX = contentViewportX + wrap.scrollLeft;
      const pointerY = contentViewportY + wrap.scrollTop;
      const contentX = (pointerX - currentMetrics.stageOffsetX) / scaleRef.current;
      const contentY = pointerY / scaleRef.current;

      const rawScale = pinchStateRef.current.startScale * (nextDistance / pinchStateRef.current.startDistance);
      const nextScale = Math.min(Math.max(rawScale, minScale), 2.5);
      const nextMetrics = getStageMetrics(nextScale);

      scaleRef.current = nextScale;
      setScale(nextScale);

      requestAnimationFrame(() => {
        const nextScrollLeft = contentX * nextScale + nextMetrics.stageOffsetX - contentViewportX;
        const nextScrollTop = contentY * nextScale - contentViewportY;
        const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
        const maxTop = Math.max(0, wrap.scrollHeight - wrap.clientHeight);

        wrap.scrollLeft = Math.max(0, Math.min(maxLeft, nextScrollLeft));
        wrap.scrollTop = Math.max(0, Math.min(maxTop, nextScrollTop));
      });
    };

    const handleTouchEnd = () => {
      if (pinchStateRef.current.active && wrapRef.current) {
        pinchStateRef.current.active = false;
        const minScale = getFitScale();
        if (scaleRef.current < minScale) {
          scaleRef.current = minScale;
          setScale(minScale);
        }
      }
    };

    wrap.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrap.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrap.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      wrap.removeEventListener('touchstart', handleTouchStart);
      wrap.removeEventListener('touchmove', handleTouchMove);
      wrap.removeEventListener('touchend', handleTouchEnd);
      wrap.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [getFitScale, getStageMetrics, isMobileCanvas]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const stopPanning = () => {
      panStateRef.current.active = false;
      setIsSpacePanning(false);
    };

    const shouldBlockSpace = (event) => {
      if (event.code !== 'Space' || event.metaKey || event.ctrlKey || event.altKey) return false;
      if (isEditableTarget(event.target)) return false;
      return true;
    };

    const blockSpaceDefault = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event) => {
      if (!shouldBlockSpace(event)) return;

      blockSpaceDefault(event);
      if (!event.repeat) {
        setSpacePressed(true);
      }
    };

    const handleKeyPress = (event) => {
      if (!shouldBlockSpace(event)) return;
      blockSpaceDefault(event);
    };

    const handleKeyUp = (event) => {
      if (!shouldBlockSpace(event) && event.code !== 'Space') return;
      if (event.code === 'Space') {
        blockSpaceDefault(event);
      }
      setSpacePressed(false);
      stopPanning();
    };

    const handleWindowBlur = () => {
      setSpacePressed(false);
      stopPanning();
    };

    const handleMouseMove = (event) => {
      if (!panStateRef.current.active) return;

      const wrap = wrapRef.current;
      if (!wrap) return;

      const deltaX = event.clientX - panStateRef.current.startX;
      const deltaY = event.clientY - panStateRef.current.startY;

      wrap.scrollLeft = panStateRef.current.scrollLeft - deltaX;
      wrap.scrollTop = panStateRef.current.scrollTop - deltaY;
    };

    const handleMouseUp = () => {
      stopPanning();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
    window.addEventListener('keypress', handleKeyPress, { passive: false, capture: true });
    window.addEventListener('keyup', handleKeyUp, { passive: false, capture: true });
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keypress', handleKeyPress, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobileCanvas]);

  const handleMobileZoomDragStart = useCallback(
    (event) => {
      if (!isMobileCanvas) return;
      event.preventDefault();
      event.stopPropagation();

      const origin = Number.isFinite(mobileZoomPosition.x) && Number.isFinite(mobileZoomPosition.y)
        ? mobileZoomPosition
        : getDefaultMobileZoomPosition();

      mobileZoomDragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: origin.x,
        originY: origin.y,
      };
    },
    [getDefaultMobileZoomPosition, isMobileCanvas, mobileZoomPosition],
  );

  useEffect(() => {
    if (!isMobileCanvas) return undefined;

    const handlePointerMove = (event) => {
      const dragState = mobileZoomDragRef.current;
      if (!dragState) return;
      const next = clampMobileZoomPosition(
        dragState.originX + (event.clientX - dragState.startX),
        dragState.originY + (event.clientY - dragState.startY),
      );
      setMobileZoomPosition((current) => (current.x === next.x && current.y === next.y ? current : next));
    };

    const stopDragging = () => {
      mobileZoomDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', stopDragging, { passive: true });
    window.addEventListener('pointercancel', stopDragging, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [clampMobileZoomPosition, isMobileCanvas]);

  const handleCanvasMouseDown = useCallback(
    (event) => {
      if (!spacePressed || event.button !== 0) return;
      if (isEditableTarget(event.target)) return;

      const wrap = wrapRef.current;
      if (!wrap) return;

      event.preventDefault();
      panStateRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: wrap.scrollLeft,
        scrollTop: wrap.scrollTop,
      };
      setIsSpacePanning(true);
    },
    [spacePressed],
  );

  return {
    wrapRef,
    scale,
    showZoomUI,
    setShowZoomUI,
    mobileZoomPosition,
    spacePressed,
    isSpacePanning,
    scaledWidth,
    scaledHeight,
    stageWidth,
    stageOffsetX,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleMobileZoomDragStart,
    handleCanvasMouseDown,
  };
}
