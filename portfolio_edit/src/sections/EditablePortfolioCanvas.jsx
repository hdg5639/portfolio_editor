import { forwardRef, useMemo, useState, useRef, useEffect, useCallback } from 'react';
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

const EditablePortfolioCanvas = forwardRef(function EditablePortfolioCanvas({ store }, exportRef) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const isLandscape = pageStyle.orientation === 'landscape';
  const baseWidth =
      pageStyle.widthMode === 'custom'
          ? pageStyle.customWidth || 1280
          : pageStyle.fixedWidth || 980;

  const resolvedPageWidth = `${baseWidth}px`;
  const pageMinHeight = Math.round(baseWidth * (isLandscape ? 210 / 297 : 297 / 210));

  const canvasStyle = {
    backgroundColor: pageStyle.backgroundColor,
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
    width: '100%',
    maxWidth: resolvedPageWidth,
    minHeight: `${pageMinHeight}px`,
    margin: '0 auto',
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

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setScale(1);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomOut = e.deltaY > 0;
      setScale(prev => {
        const next = zoomOut ? prev - 0.05 : prev + 0.05;
        return Math.min(Math.max(next, 0.3), 2.0); // 30% ~ 200% 제한
      });
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (wrap) {
      wrap.addEventListener('wheel', handleWheel, { passive: false });
      return () => wrap.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
      <div
          className="canvas-wrap"
          ref={wrapRef}
          style={{backgroundColor: 'transparent'}}
          onClick={() => actions.select({key: 'page', label: '페이지 전체'})}
      >
        <div
            className="canvas-scale-wrapper"
            style={{transform: `scale(${scale})`}}
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

        <div className={`zoom-controls no-print ${showZoomUI ? 'expanded' : 'collapsed'}`}
             onClick={(e) => e.stopPropagation()}>
          {showZoomUI ? (
              <>
                <button onClick={handleZoomOut} title="축소">-</button>
                <span onClick={handleZoomReset} style={{cursor: 'pointer'}} title="100%로 초기화">
                            {Math.round(scale * 100)}%
                        </span>
                <button onClick={handleZoomIn} title="확대">+</button>
                <div className="zoom-divider"/>
                <button onClick={() => setShowZoomUI(false)} title="숨기기">✕</button>
              </>
          ) : (
              <button onClick={() => setShowZoomUI(true)} title="줌 컨트롤 열기">🔍</button>
          )}
        </div>
      </div>
  );
});

export default EditablePortfolioCanvas;