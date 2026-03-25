import { forwardRef, useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import ProfileSection from './ProfileSection';
import SkillSection from './SkillSection';
import ProjectsSection from './ProjectsSection';
import TimelineSection from './TimelineSection';
import CustomSection from './CustomSection';
import LayoutSizeControl from './LayoutSizeControl';

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

    const dragged =
        event.dataTransfer.getData('application/x-section') || draggingKey;

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

  return (
      <div
          className={`section-tile span-${span} span-r-${rowSpan || 1} ${
              isDragging ? 'dragging' : ''
          } ${isDragOver ? 'drag-over' : ''}`}
          onDragEnterCapture={handleDragOver}
          onDragOverCapture={handleDragOver}
          onDragLeaveCapture={handleDragLeave}
          onDropCapture={handleDrop}
          onDragEnd={handleDragEnd}
      >
        {showHelpers ? (
            <div className="section-tile-toolbar no-print">
              <div
                  className="drag-handle"
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
              >
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
                className={`section-drop-overlay ${isDragOver ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />
        ) : null}

        {children}
      </div>
  );
}

const EditablePortfolioCanvas = forwardRef(function EditablePortfolioCanvas({ store, hideZoomControls = false },
                                                                            exportRef) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const isLandscape = pageStyle.orientation === 'landscape';
  const baseWidth =
      pageStyle.widthMode === 'custom'
          ? pageStyle.customWidth || 1280
          : pageStyle.fixedWidth || 980;

  const pageMinHeight = Math.round(baseWidth * (isLandscape ? 210 / 297 : 297 / 210));

  const isMobileCanvas = !!store.ui?.isMobile;

  const canvasStyle = {
    backgroundColor: pageStyle.backgroundColor,
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
    width: `${baseWidth}px`,
    minWidth: `${baseWidth}px`,
    maxWidth: `${baseWidth}px`,
    minHeight: `${pageMinHeight}px`,
    margin: isMobileCanvas ? '0' : '0 auto',
    boxSizing: 'border-box',
    flex: '0 0 auto',
  };
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
  const wrapRef = useRef(null);

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
        if (!(e.ctrlKey || e.metaKey)) return;

        e.preventDefault();

        const minScale = isMobileCanvas ? getFitScale() : 0.3;
        const zoomOut = e.deltaY > 0;

        setScale((prev) => {
          const next = zoomOut ? prev - 0.05 : prev + 0.05;
          return Math.min(Math.max(next, minScale), 2);
        });
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

  const scaledWidth = Math.round(baseWidth * scale);
  const scaledHeight = Math.round(pageMinHeight * scale);

  return (
      <div
          className={`canvas-wrap ${isMobileCanvas ? 'mobile-canvas-wrap' : ''}`}
          ref={wrapRef}
          style={{backgroundColor: 'transparent'}}
          onClick={() => actions.select({key: 'page', label: '페이지 전체'})}
      >
        <div
            className={`canvas-scale-stage ${isMobileCanvas ? 'mobile-scale-stage' : ''}`}
            style={{
              width: `${scaledWidth}px`,
              minWidth: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              minHeight: `${scaledHeight}px`,
            }}
        >
          <div
              className={`canvas-scale-wrapper ${isMobileCanvas ? 'mobile-scale-wrapper' : ''}`}
              style={{
                width: `${baseWidth}px`,
                minWidth: `${baseWidth}px`,
                height: `${pageMinHeight}px`,
                minHeight: `${pageMinHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
          >
            <div
                ref={exportRef}
                className={`portfolio-page preview-page ${isLandscape ? 'is-landscape' : 'is-portrait'}`}
                style={canvasStyle}
            >
              <div className="portfolio-grid">
                {visibleSections.map(({key: sectionKey, ...item}) => (
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
                    <button onClick={handleZoomOut} title="축소">-</button>
                    <span onClick={handleZoomReset} style={{ cursor: 'pointer' }} title="100%로 초기화">
                    {Math.round(scale * 100)}%
                </span>
                    <button onClick={handleZoomIn} title="확대">+</button>
                    <div className="zoom-divider" />
                    <button onClick={() => setShowZoomUI(false)} title="숨기기">✕</button>
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