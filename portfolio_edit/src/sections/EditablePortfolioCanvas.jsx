import { forwardRef, useMemo, useState } from 'react';
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

  const handleDragStart = (event) => {
    if (!showHelpers) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sectionKey);
    setDraggingKey(sectionKey);
  };

  const handleDragOver = (event) => {
    if (!showHelpers || !draggingKey) return;
    event.preventDefault();
    if (dragOverKey !== sectionKey) setDragOverKey(sectionKey);
  };

  const handleDrop = (event) => {
    if (!showHelpers) return;
    event.preventDefault();

    const dragged = event.dataTransfer.getData('text/plain') || draggingKey;
    if (dragged && dragged !== sectionKey) {
      store.actions.moveSection(dragged, sectionKey);
    }

    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
    setDragOverKey(null);
  };

  return (
      <div
          className={`section-tile span-${span} span-r-${rowSpan || 1} ${
              isDragging ? 'dragging' : ''
          } ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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

        {children}
      </div>
  );
}

const EditablePortfolioCanvas = forwardRef(function EditablePortfolioCanvas({ store }, exportRef) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const resolvedPageWidth =
      pageStyle.widthMode === 'custom'
          ? `${pageStyle.customWidth || 1280}px`
          : `${pageStyle.fixedWidth || 980}px`;

  const canvasStyle = {
    backgroundColor: pageStyle.backgroundColor,
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
    width: '100%',
    maxWidth: resolvedPageWidth,
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

  return (
      <div
          className="canvas-wrap"
          style={{ backgroundColor: pageStyle.baseBackgroundColor || 'transparent' }}
          onClick={() => actions.select({ key: 'page', label: '페이지 전체' })}
      >
        <div ref={exportRef} className="portfolio-page preview-page" style={canvasStyle}>
          <div className="portfolio-grid">
            {visibleSections.map((item) => (
                <SectionTile
                    key={item.key}
                    store={store}
                    sectionKey={item.key}
                    label={item.label}
                    span={item.span}
                    rowSpan={item.rowSpan || 1}
                    draggingKey={draggingKey}
                    dragOverKey={dragOverKey}
                    setDraggingKey={setDraggingKey}
                    setDragOverKey={setDragOverKey}
                >
                  {sectionMap[item.key]?.node || null}
                </SectionTile>
            ))}
          </div>
        </div>
      </div>
  );
});

export default EditablePortfolioCanvas;