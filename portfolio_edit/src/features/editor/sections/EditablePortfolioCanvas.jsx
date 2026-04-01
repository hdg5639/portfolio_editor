import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ProfileSection from './ProfileSection.jsx';
import SkillSection from './SkillSection.jsx';
import ProjectsSection from './ProjectsSection.jsx';
import TimelineSection from './TimelineSection.jsx';
import CustomSection from './CustomSection.jsx';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import { getSectionSelectionState } from '../utils/storeHelpers';
import { SelectionBadge } from '../components/editor-primitives/index.jsx';
import useCanvasViewport from '../hooks/useCanvasViewport.js';

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
  const resolvedSpan = Math.min(12, Math.max(1, Number(span) || 12));
  const resolvedRowSpan = Math.min(48, Math.max(1, Number(rowSpan) || 1));
  const showHelpers = editable && store.ui.showEditHelpers;
  const isDragging = draggingKey === sectionKey;
  const isDragOver = dragOverKey === sectionKey && draggingKey !== sectionKey;
  const showSectionDropOverlay = showHelpers && !!draggingKey && draggingKey !== sectionKey;
  const sectionSelection = getSectionSelectionState(store.selected?.key, sectionKey);
  const useTapReorder = showHelpers && !!store.ui?.isMobile;

  const isSectionDragEvent = (event) => Array.from(event.dataTransfer?.types || []).includes('application/x-section');

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
      className={`section-tile selection-scope selection-section span-${resolvedSpan} span-r-${resolvedRowSpan} ${isDragging ? 'dragging' : ''} ${
        isDragOver ? 'drag-over' : ''
      } ${sectionSelection.selected ? 'is-selected' : ''} ${sectionSelection.ancestor ? 'is-ancestor' : ''}`}
      style={{
        gridColumn: `span ${resolvedSpan}`,
        gridRow: `span ${resolvedRowSpan}`,
      }}
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
      {sectionSelection.selected ? <SelectionBadge label={`${label} 선택됨`} tone="section" /> : null}

      {showHelpers ? (
        <div className="section-tile-toolbar no-print">
          <div
            className="drag-handle"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(event) => {
              if (!useTapReorder) return;
              event.preventDefault();
              event.stopPropagation();
              setDraggingKey((current) => (current === sectionKey ? null : sectionKey));
              setDragOverKey(null);
            }}
          >
            ⋮⋮
          </div>

          <strong>{label}</strong>

          <LayoutSizeControl
            widthValue={resolvedSpan}
            heightValue={resolvedRowSpan}
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

const EditablePortfolioCanvas = forwardRef(function EditablePortfolioCanvas({ store, hideZoomControls = false }, exportRef) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const isLandscape = pageStyle.orientation === 'landscape';
  const baseWidth = pageStyle.widthMode === 'custom' ? pageStyle.customWidth || 1280 : pageStyle.fixedWidth || 980;
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

  const [contentHeight, setContentHeight] = useState(pageMinHeight);
  const pageInnerRef = useRef(null);

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

  const {
    wrapRef,
    scale,
    showZoomUI,
    setShowZoomUI,
    mobileZoomPosition,
    spacePressed,
    isSpacePanning,
    scaledHeight,
    stageWidth,
    stageOffsetX,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleMobileZoomDragStart,
    handleCanvasMouseDown,
  } = useCanvasViewport({
    baseWidth,
    contentHeight,
    isMobileCanvas,
    mode: store.mode,
  });

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

  return (
    <div
      className={`canvas-wrap ${isMobileCanvas ? 'mobile-canvas-wrap' : ''} ${store.mode === 'edit' && !isMobileCanvas ? 'edit-canvas-wrap' : ''} ${spacePressed ? 'is-space-pan-ready' : ''} ${isSpacePanning ? 'is-space-panning' : ''}`}
      ref={wrapRef}
      style={{
        backgroundColor: 'transparent',
        paddingLeft: isMobileCanvas ? undefined : '24px',
        paddingRight: isMobileCanvas ? undefined : '24px',
        justifyContent: isMobileCanvas ? 'center' : store.mode === 'edit' ? 'flex-start' : undefined,
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
          className={`zoom-controls no-print ${showZoomUI ? 'expanded' : 'collapsed'} ${isMobileCanvas ? 'is-mobile-draggable' : ''}`}
          style={
            isMobileCanvas && Number.isFinite(mobileZoomPosition.x) && Number.isFinite(mobileZoomPosition.y)
              ? { left: `${mobileZoomPosition.x}px`, top: `${mobileZoomPosition.y}px`, right: 'auto', bottom: 'auto', transform: 'none' }
              : undefined
          }
          onClick={(event) => event.stopPropagation()}
        >
          {isMobileCanvas ? (
            <button
              type="button"
              className="zoom-drag-handle"
              onPointerDown={handleMobileZoomDragStart}
              title="줌 버튼 이동"
            >
              ⋮⋮
            </button>
          ) : null}
          {showZoomUI ? (
            <>
              <button onClick={handleZoomOut} title="축소">
                -
              </button>
              <span onClick={handleZoomReset} style={{ cursor: 'pointer' }} title="100%로 초기화">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={handleZoomIn} title="확대">
                +
              </button>
              <div className="zoom-divider" />
              <button onClick={() => setShowZoomUI(false)} title={isMobileCanvas ? '접기' : '숨기기'}>
                ✕
              </button>
            </>
          ) : (
            <button onClick={() => setShowZoomUI(true)} title="줌 컨트롤 열기">
              🔍
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
});

export default EditablePortfolioCanvas;
