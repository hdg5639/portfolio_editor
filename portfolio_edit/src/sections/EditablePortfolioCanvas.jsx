import { useMemo, useState } from 'react';
import ProfileSection from './ProfileSection';
import SkillSection from './SkillSection';
import ProjectsSection from './ProjectsSection';
import TimelineSection from './TimelineSection';
import CustomSection from './CustomSection';

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
  const isEdit = store.mode === 'edit';
  const isDragging = draggingKey === sectionKey;
  const isDragOver = dragOverKey === sectionKey && draggingKey !== sectionKey;

  const handleDragStart = (event) => {
    if (!isEdit) return;
    setDraggingKey(sectionKey);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sectionKey);
  };

  const handleDragOver = (event) => {
    if (!isEdit || !draggingKey) return;
    event.preventDefault();
    if (dragOverKey !== sectionKey) setDragOverKey(sectionKey);
  };

  const handleDrop = (event) => {
    if (!isEdit) return;
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
          className={`section-tile span-${span} span-r-${rowSpan} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`.trim()}
          draggable={isEdit}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
      >
        {isEdit ? (
            <div className="section-tile-toolbar no-print">
              <div className="drag-handle" title="드래그해서 위치 이동">
                ⋮⋮
              </div>

              <strong>{label}</strong>

              <div className="span-switcher">
                {[12, 8, 6, 4, 3].map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={span === value ? 'active' : ''}
                        onClick={(event) => {
                          event.stopPropagation();
                          store.actions.setSectionSpan(sectionKey, value);
                        }}
                    >
                      {value}칸
                    </button>
                ))}
              </div>

              <div className="span-switcher">
                {[1, 2, 3].map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={rowSpan === value ? 'active' : ''}
                        onClick={(event) => {
                          event.stopPropagation();
                          store.actions.setSectionRowSpan(sectionKey, value);
                        }}
                    >
                      높이 {value}
                    </button>
                ))}
              </div>
            </div>
        ) : null}

        {children}
      </div>
  );
}

export default function EditablePortfolioCanvas({ store }) {
  const { portfolio, actions } = store;
  const pageStyle = portfolio.styles.page;

  const [draggingKey, setDraggingKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const canvasStyle = {
    backgroundColor: pageStyle.backgroundColor,
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
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
          style={{ backgroundColor: pageStyle.backgroundColor }}
          onClick={() => actions.select({ key: 'page', label: '페이지 전체' })}
      >
        <div className="portfolio-page preview-page" style={canvasStyle}>
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
}