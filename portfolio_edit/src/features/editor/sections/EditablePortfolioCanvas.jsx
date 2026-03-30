import { forwardRef, useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import ProfileSection from './ProfileSection.jsx';
import SkillSection from './SkillSection.jsx';
import ProjectsSection from './ProjectsSection.jsx';
import TimelineSection from './TimelineSection.jsx';
import CustomSection from './CustomSection.jsx';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import { getSectionSelectionState } from '../utils/storeHelpers';

function SelectionBadge({ label, tone = 'section' }) {
  return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
}

function SectionTile({
                       store,
                       sectionKey,
                       label,
                       span,
                       rowSpan,
                       draggingKey,
                       dragOverKey,
                       setDraggingKey,
                       setDragOverKey,
                       children,
                     }) {
  const editable = store.mode === 'edit';
  const showHelpers = editable && store.ui.showEditHelpers;
  const isDragging = draggingKey === sectionKey;
  const isDragOver = dragOverKey === sectionKey && draggingKey !== sectionKey;
  const showSectionDropOverlay = showHelpers && !!draggingKey && draggingKey !== sectionKey;
  const sectionSelection = getSectionSelectionState(store.selected?.key, sectionKey);
  const useTapReorder = showHelpers && !!store.ui?.isMobile;

  const isSectionDragEvent = (event) =>
      Array.from(event.dataTransfer?.types || []).includes('application/x-section');

  const handleDragStart = (event) => {
    if (!showHelpers) return;
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-section', sectionKey);
    setDraggingKey(sectionKey);
  };

  const handleDragOver = (event) => {
    if (!showHelpers || !draggingKey || !isSectionDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    if (dragOverKey !== sectionKey) {
      setDragOverKey(sectionKey);
    }
  };

  const handleDrop = (event) => {
    if (!showHelpers || !isSectionDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();

    const dragged = event.dataTransfer.getData('application/x-section') || draggingKey;

    if (dragged && dragged !== sectionKey) {
      store.actions.moveSection(dragged, sectionKey);
    }

    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleDragLeave = (event) => {
    if (!isSectionDragEvent(event)) return;

    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;

    if (dragOverKey === sectionKey) {
      setDragOverKey(null);
    }
  };

  const handleDragEnd = (event) => {
    event?.stopPropagation?.();
    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleTapReorder = (event) => {
    if (!useTapReorder || !draggingKey || draggingKey === sectionKey) return false;
    event.preventDefault();
    event.stopPropagation();
    store.actions.moveSection(draggingKey, sectionKey);
    setDraggingKey(null);
    setDragOverKey(null);
    return true;
  };

  return (
      <div
          className={`section-tile selection-scope selection-section span-${span} span-r-${rowSpan || 1} ${isDragging ? 'dragging' : ''} ${
              isDragOver ? 'drag-over' : ''
          } ${sectionSelection.selected ? 'is-selected' : ''} ${sectionSelection.ancestor ? 'is-ancestor' : ''}`}
          onClick={(event) => {
            if (handleTapReorder(event)) return;
            event.stopPropagation();
            const mapping = {
              profile: { key: 'profileCard', label: '프로필 카드' },
              projects: { key: 'projectsCard', label: '프로젝트 카드' },
              skills: { key: 'skillsCard', label: '기술 스택 카드' },
              awards: { key: 'awardsCard', label: '수상 카드' },
              certificates: { key: 'certificatesCard', label: '자격증 카드' },
            };
            const payload = sectionKey.startsWith('custom:') ? { key: 'customCard', label: '커스텀 카드' } : mapping[sectionKey];
            if (payload) store.actions.select(payload);
          }}
          onDragEnterCapture={handleDragOver}
          onDragOverCapture={handleDragOver}
          onDragLeaveCapture={handleDragLeave}
          onDropCapture={handleDrop}
          onDragEnd={handleDragEnd}
      >
        {sectionSelection.selected ? (
            <SelectionBadge label={`${label} 선택됨`} tone="section" />
        ) : null}

        {showHelpers ? (
            <div className="section-tile-toolbar no-print">
              <div className="drag-handle" draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} onClick={(event) => {
                if (!useTapReorder) return;
                event.preventDefault();
                event.stopPropagation();
                setDraggingKey((current) => (current === sectionKey ? null : sectionKey));
                setDragOverKey(null);
              }}>
                ⋮⋮
              </div>

              <strong>{label}</strong>

              <LayoutSizeControl
                  widthValue={span}
                  heightValue={rowSpan || 1}
                  onWidthChange={(value) => store.actions.setSectionSpan(sectionKey, value)}
                  onHeightChange={(value) => store.actions.setSectionRowSpan(sectionKey, value)}
              />
            </div>
        ) : null}

        {showSectionDropOverlay ? (
            <div
                className={`section-drop-overlay ${(isDragOver || useTapReorder) ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleTapReorder}
            >
              {useTapReorder ? <span>여기로 이동</span> : null}
            </div>
        ) : null}

        {children}
      </div>
  );
}

const EditablePortfolioCanvas = forwardRef(function EditablePortfolioCanvas(
    { store, hideZoomControls = false },
    exportRef
) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const isLandscape = pageStyle.orientation === 'landscape';
  const baseWidth =
      pageStyle.widthMode === 'custom' ? pageStyle.customWidth || 1280 : pageStyle.fixedWidth || 980;
  const pageMinHeight = Math.round(baseWidth * (isLandscape ? 210 / 297 : 297 / 210));
  const isMobileCanvas = !!store.ui?.isMobile;

  const visibleSections = useMemo(() => {
    return portfolio.layout.items.filter((item) => portfolio.layout.sections[item.key]);
  }, [portfolio.layout.items, portfolio.layout.sections]);

  const sectionMap = useMemo(() => {
    const map = {
      profile: { label: '프로필', node: <ProfileSection store={store} /> },
      skills: { label: '기술 스택', node: <SkillSection store={store} /> },
      projects: { label: '프로젝트', node: <ProjectsSection store={store} /> },
      awards: {
        label: '수상',
        node: <TimelineSection store={store} sectionKey="awards" title="수상" />,
      },
      certificates: {
        label: '자격증',
        node: <TimelineSection store={store} sectionKey="certificates" title="자격증" />,
      },
    };

    (portfolio.customSections || []).forEach((section) => {
      map[`custom:${section.id}`] = {
        label: section.name,
        node: <CustomSection store={store} section={section} />,
      };
    });

    return map;
  }, [portfolio.customSections, store]);

  const [scale, setScale] = useState(1);
  const [showZoomUI, setShowZoomUI] = useState(true);
  const [contentHeight, setContentHeight] = useState(pageMinHeight);
  const [wrapViewportSize, setWrapViewportSize] = useState({ width: 0, height: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const wrapRef = useRef(null);
  const pageInnerRef = useRef(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const scaleRef = useRef(scale);
  const previousScaleRef = useRef(scale);
  const pinchStateRef = useRef({ active: false, startDistance: 0, startScale: 1 });
  const previousEditPanGutterRef = useRef(0);

  const canvasStyle = {
    backgroundColor: pageStyle.backgroundColor,
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
    textAlign: pageStyle.textAlign,
    lineHeight: pageStyle.lineHeight,
    letterSpacing: pageStyle.letterSpacing,
    width: `${baseWidth}px`,
    minWidth: `${baseWidth}px`,
    maxWidth: `${baseWidth}px`,
    minHeight: `${contentHeight}px`,
    margin: isMobileCanvas ? '0' : '0 auto',
    boxSizing: 'border-box',
    flex: '0 0 auto',
  };

  const getFitScale = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return 1;

    const computed = window.getComputedStyle(wrap);
    const paddingLeft = parseFloat(computed.paddingLeft || '0');
    const paddingRight = parseFloat(computed.paddingRight || '0');
    const availableWidth = Math.max(0, wrap.clientWidth - paddingLeft - paddingRight);

    if (!availableWidth || !baseWidth) return 1;

    return Math.min(1, availableWidth / baseWidth);
  }, [baseWidth]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    const minScale = isMobileCanvas ? getFitScale() : 0.3;
    setScale((prev) => Math.max(prev - 0.1, minScale));
  };

  const handleZoomReset = () => {
    setScale(isMobileCanvas ? getFitScale() : 1);
  };

  const handleWheel = useCallback(
      (e) => {
        const wrap = wrapRef.current;

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();

          const minScale = isMobileCanvas ? getFitScale() : 0.3;
          const zoomOut = e.deltaY > 0;

          setScale((prev) => {
            const next = zoomOut ? prev - 0.05 : prev + 0.05;
            return Math.min(Math.max(next, minScale), 2);
          });
          return;
        }

        if (!wrap || isMobileCanvas) return;

        const canPanHorizontally = wrap.scrollWidth > wrap.clientWidth + 1;
        const horizontalIntent = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);

        if (!canPanHorizontally || !horizontalIntent) return;

        e.preventDefault();
        const horizontalDelta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
        wrap.scrollLeft += horizontalDelta;
      },
      [getFitScale, isMobileCanvas]
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
  }, [getFitScale, isMobileCanvas, baseWidth, pageStyle.orientation]);

  useLayoutEffect(() => {
    const node = pageInnerRef.current;
    if (!node) return;

    const updateHeight = () => {
      const measured = Math.max(pageMinHeight, Math.ceil(node.scrollHeight));
      setContentHeight(measured);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [pageMinHeight, visibleSections, portfolio]);

  const scaledWidth = Math.round(baseWidth * scale);
  const scaledHeight = Math.round(contentHeight * scale);
  const dynamicPanGutter = Math.round(baseWidth * Math.max(0, scale - 1) * 0.95);
  const editPanGutter = !isMobileCanvas && store.mode === 'edit'
      ? Math.max(520, Math.round(baseWidth * 0.52) + dynamicPanGutter)
      : 0;

  const getStageMetrics = useCallback((targetScale) => {
    const targetScaledWidth = Math.round(baseWidth * targetScale);
    const targetDynamicPanGutter = Math.round(baseWidth * Math.max(0, targetScale - 1) * 0.95);
    const targetEditPanGutter = !isMobileCanvas && store.mode === 'edit'
      ? Math.max(520, Math.round(baseWidth * 0.52) + targetDynamicPanGutter)
      : 0;

    const minStageWidth = !isMobileCanvas
      ? Math.max(0, wrapViewportSize.width - 48)
      : targetScaledWidth;

    const targetStageWidth = !isMobileCanvas && store.mode === 'edit'
      ? Math.max(targetScaledWidth + targetEditPanGutter * 2, minStageWidth)
      : targetScaledWidth;

    const stageOffsetX = Math.max(0, Math.round((targetStageWidth - targetScaledWidth) / 2));

    return {
      scaledWidth: targetScaledWidth,
      stageWidth: targetStageWidth,
      stageOffsetX,
      editPanGutter: targetEditPanGutter,
    };
  }, [baseWidth, isMobileCanvas, store.mode, wrapViewportSize.width]);

  const { stageWidth, stageOffsetX } = getStageMetrics(scale);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useLayoutEffect(() => {
    if (isMobileCanvas || store.mode !== 'edit') {
      previousScaleRef.current = scale;
      return;
    }

    const wrap = wrapRef.current;
    const previousScale = previousScaleRef.current;

    if (!wrap || !previousScale || previousScale === scale) {
      previousScaleRef.current = scale;
      return;
    }

    const prevMetrics = getStageMetrics(previousScale);
    const nextMetrics = getStageMetrics(scale);
    const viewportCenterX = wrap.scrollLeft + wrap.clientWidth / 2;
    const viewportCenterY = wrap.scrollTop + wrap.clientHeight / 2;
    const contentCenterX = (viewportCenterX - prevMetrics.stageOffsetX) / previousScale;
    const contentCenterY = viewportCenterY / previousScale;

    requestAnimationFrame(() => {
      const nextScrollLeft = contentCenterX * scale + nextMetrics.stageOffsetX - wrap.clientWidth / 2;
      const nextScrollTop = contentCenterY * scale - wrap.clientHeight / 2;
      const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const maxTop = Math.max(0, wrap.scrollHeight - wrap.clientHeight);

      wrap.scrollLeft = Math.max(0, Math.min(maxLeft, nextScrollLeft));
      wrap.scrollTop = Math.max(0, Math.min(maxTop, nextScrollTop));
    });

    previousScaleRef.current = scale;
  }, [getStageMetrics, isMobileCanvas, scale, store.mode]);

  const lastCenterSignatureRef = useRef('');

  useLayoutEffect(() => {
    if (isMobileCanvas || store.mode !== 'edit') return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    const nextSignature = `${store.mode}:${baseWidth}:${Math.round(contentHeight)}:${wrap.clientWidth}`;
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
  }, [baseWidth, contentHeight, editPanGutter, isMobileCanvas, store.mode, wrapViewportSize.width]);

  const isEditableTarget = (target) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest('input, textarea, select, option, button, [contenteditable="true"], [data-no-space-pan="true"]')
    );
  };

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
      const pointerX = midpoint.x - rect.left + wrap.scrollLeft;
      const pointerY = midpoint.y - rect.top + wrap.scrollTop;
      const contentX = pointerX / scaleRef.current;
      const contentY = pointerY / scaleRef.current;

      const rawScale = pinchStateRef.current.startScale * (nextDistance / pinchStateRef.current.startDistance);
      const nextScale = Math.min(Math.max(rawScale, minScale), 2.5);

      scaleRef.current = nextScale;
      setScale(nextScale);

      requestAnimationFrame(() => {
        wrap.scrollLeft = Math.max(0, contentX * nextScale - (midpoint.x - rect.left));
        wrap.scrollTop = Math.max(0, contentY * nextScale - (midpoint.y - rect.top));
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
  }, [getFitScale, isMobileCanvas]);

  useEffect(() => {
    if (isMobileCanvas || typeof window === 'undefined' || typeof document === 'undefined') return undefined;

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

  const handleCanvasMouseDown = (event) => {
    if (isMobileCanvas || !spacePressed || event.button !== 0) return;
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
  };

  return (
      <div
          className={`canvas-wrap ${isMobileCanvas ? 'mobile-canvas-wrap' : ''} ${store.mode === 'edit' && !isMobileCanvas ? 'edit-canvas-wrap' : ''} ${spacePressed ? 'is-space-pan-ready' : ''} ${isSpacePanning ? 'is-space-panning' : ''}`}
          ref={wrapRef}
          style={{
            backgroundColor: 'transparent',
            paddingLeft: isMobileCanvas ? undefined : `24px`,
            paddingRight: isMobileCanvas ? undefined : `24px`,
            justifyContent: !isMobileCanvas && store.mode === 'edit' ? 'flex-start' : undefined,
          }}
          onMouseDown={handleCanvasMouseDown}
          onDragStart={(event) => {
            if (spacePressed) {
              event.preventDefault();
            }
          }}
          onClick={() => actions.select({ key: 'page', label: '페이지 전체' })}
      >
        <div
            className={`canvas-scale-stage ${isMobileCanvas ? 'mobile-scale-stage' : ''}`}
            style={{
              width: `${stageWidth}px`,
              minWidth: `${stageWidth}px`,
              height: `${scaledHeight}px`,
              minHeight: `${scaledHeight}px`,
            }}
        >
          <div
              className={`canvas-scale-wrapper ${isMobileCanvas ? 'mobile-scale-wrapper' : ''}`}
              style={{
                width: `${baseWidth}px`,
                minWidth: `${baseWidth}px`,
                height: `${contentHeight}px`,
                minHeight: `${contentHeight}px`,
                left: `${stageOffsetX}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
          >
            <div
                ref={(node) => {
                  pageInnerRef.current = node;
                  if (typeof exportRef === 'function') {
                    exportRef(node);
                  } else if (exportRef) {
                    exportRef.current = node;
                  }
                }}
                className={`portfolio-page preview-page ${isLandscape ? 'is-landscape' : 'is-portrait'}`}
                style={canvasStyle}
            >
              <div className="portfolio-grid">
                {visibleSections.map(({ key: sectionKey, ...item }) => (
                    <SectionTile
                        key={sectionKey}
                        sectionKey={sectionKey}
                        store={store}
                        draggingKey={draggingKey}
                        dragOverKey={dragOverKey}
                        setDraggingKey={setDraggingKey}
                        setDragOverKey={setDragOverKey}
                        {...item}
                    >
                      {sectionMap[sectionKey]?.node || null}
                    </SectionTile>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!hideZoomControls ? (
            <div
                className={`zoom-controls no-print ${showZoomUI ? 'expanded' : 'collapsed'}`}
                onClick={(e) => e.stopPropagation()}
            >
              {showZoomUI ? (
                  <>
                    <button onClick={handleZoomOut} title="축소">-
                    </button>
                    <span onClick={handleZoomReset} style={{ cursor: 'pointer' }} title="100%로 초기화">
                {Math.round(scale * 100)}%
              </span>
                    <button onClick={handleZoomIn} title="확대">+
                    </button>
                    <div className="zoom-divider" />
                    <button onClick={() => setShowZoomUI(false)} title="숨기기">✕
                    </button>
                  </>
              ) : (
                  <button onClick={() => setShowZoomUI(true)} title="줌 컨트롤 열기">🔍</button>
              )}
            </div>
        ) : null}
      </div>
  );
});

export default EditablePortfolioCanvas;