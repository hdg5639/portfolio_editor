import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ProfileSection from './ProfileSection.jsx';
import SkillSection from './SkillSection.jsx';
import ProjectsSection from './ProjectsSection.jsx';
import TimelineSection from './TimelineSection.jsx';
import CustomSection from './CustomSection.jsx';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import { getSectionSelectionState } from '../utils/storeHelpers';
import { SelectionBadge } from '../components/editor-primitives/index.jsx';
import DragHandle from '../components/drag/DragHandle.jsx';
import useCanvasViewport from '../hooks/useCanvasViewport.js';
import useNativeReorderAdapter from '../hooks/useNativeReorderAdapter.js';
import { DRAG_TYPES } from '../constants/dragTypes.js';
import { SelectionKey } from '../utils/selectionKeys.js';

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
  const sectionSelection = getSectionSelectionState(store.selected?.key, sectionKey);
  const dragAdapter = useNativeReorderAdapter({
    id: sectionKey,
    dragType: DRAG_TYPES.section,
    draggingId: draggingKey,
    dragOverId: dragOverKey,
    setDraggingId: setDraggingKey,
    setDragOverId: setDragOverKey,
    enabled: showHelpers,
    tapEnabled: showHelpers && !!store.ui?.isMobile,
    onMove: (fromId, toId) => store.actions.moveSection(fromId, toId),
  });
  const isDragging = dragAdapter.isDragging;
  const isDragOver = dragAdapter.isDragOver;
  const showSectionDropOverlay = showHelpers && !!draggingKey && draggingKey !== sectionKey;

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
        if (dragAdapter.handleTapReorder(event)) return;
        event.stopPropagation();
        const mapping = {
          profile: { key: SelectionKey.card.profile(), label: '프로필 카드' },
          projects: { key: SelectionKey.card.projects(), label: '프로젝트 카드' },
          skills: { key: SelectionKey.card.skills(), label: '기술 스택 카드' },
          awards: { key: SelectionKey.card.awards(), label: '수상 카드' },
          certificates: { key: SelectionKey.card.certificates(), label: '자격증 카드' },
        };
        const payload = sectionKey.startsWith('custom:') ? { key: SelectionKey.card.custom(), label: '커스텀 카드' } : mapping[sectionKey];
        if (payload) store.actions.select(payload);
      }}
      {...dragAdapter.captureDropTargetProps}
      onDragEnd={dragAdapter.handleDragEnd}
    >
      {sectionSelection.selected ? <SelectionBadge label={`${label} 선택됨`} tone="section" /> : null}

      {showHelpers ? (
        <div className="section-tile-toolbar no-print">
          <DragHandle
            handleProps={dragAdapter.dragHandleProps}
            onClick={dragAdapter.toggleTapArm}
          />

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
          className={`section-drop-overlay ${(isDragOver || dragAdapter.showTapOverlay) ? 'active' : ''}`}
          {...dragAdapter.dropTargetProps}
          onClick={dragAdapter.handleTapReorder}
        >
          {dragAdapter.showTapOverlay ? <span>여기로 이동</span> : null}
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
        justifyContent: 'flex-start',
      }}
      onMouseDown={handleCanvasMouseDown}
      onDragStart={(event) => {
        if (spacePressed) {
          event.preventDefault();
        }
      }}
      onClick={() => actions.select({ key: SelectionKey.page(), label: '페이지 전체' })}
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
