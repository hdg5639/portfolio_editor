import { useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl';

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

function bind(store, key, label) {
    return {
        selected: store.selected?.key === key,
        style: store.actions.styleFor(key),
        select: () => store.actions.select({ key, label }),
    };
}

function selectableInputProps(store, key, label) {
    const bound = bind(store, key, label);
    return {
        style: bound.style,
        onClick: (e) => {
            e.stopPropagation();
            bound.select();
        },
    };
}

function selectableViewProps(store, key, label) {
    const bound = bind(store, key, label);
    return {
        style: bound.style,
        onClick: (e) => {
            e.stopPropagation();
            bound.select();
        },
    };
}

function BlockShell({
                        store,
                        projectId,
                        block,
                        draggingId,
                        dragOverId,
                        setDraggingId,
                        setDragOverId,
                        children,
                    }) {
    const isEdit = store.mode === 'edit';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const isDragging = draggingId === block.id;
    const isDragOver = dragOverId === block.id && draggingId !== block.id;

    const onDragStart = (event) => {
        if (!showHelpers) return;
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(block.id));
    };

    const onDragOver = (event) => {
        if (!showHelpers || !draggingId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverId !== block.id) {
            setDragOverId(block.id);
        }
    };

    const onDrop = (event) => {
        if (!showHelpers) return;
        event.preventDefault();
        event.stopPropagation();

        const dragged = event.dataTransfer.getData('text/plain') || draggingId;
        if (dragged && dragged !== block.id) {
            store.actions.moveProjectBlock(projectId, dragged, block.id);
        }

        setDraggingId(null);
        setDragOverId(null);
    };

    const onDragEnd = () => {
        setDraggingId(null);
        setDragOverId(null);
    };

    return (
        <div
            className={`project-block-shell span-${block.colSpan || 12} span-r-${block.rowSpan || 1} ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''}`}
            draggable={showHelpers}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={() => {
                if (dragOverId === block.id) setDragOverId(null);
            }}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {showHelpers ? (
                <div className="project-block-toolbar">
                    <div
                        className="drag-handle"
                        title="드래그해서 위치 이동"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        ⋮⋮
                    </div>

                    <strong>
                        {block.type} · {block.title}
                    </strong>

                    <LayoutSizeControl
                        widthValue={block.colSpan || 12}
                        heightValue={block.rowSpan || 1}
                        onWidthChange={(value) => store.actions.setProjectBlockSpan(projectId, block.id, value)}
                        onHeightChange={(value) => store.actions.setProjectBlockRowSpan(projectId, block.id, value)}
                    />

                    <div className="profile-block-actions">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                store.actions.removeProjectBlock(projectId, block.id);
                            }}
                        >
                            제거
                        </button>
                    </div>
                </div>
            ) : null}

            {children}
        </div>
    );
}

function TextBlock({ block, projectId, store, editable }) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;
    const contentKey = `projects.${projectId}.blocks.${block.id}.content`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '프로젝트 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content || ''}
                        {...selectableInputProps(store, contentKey, '프로젝트 블록 본문')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'content', e.target.value)
                        }
                        className="custom-input description"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 블록 제목')}>{block.title}</h4>
                    <p {...selectableViewProps(store, contentKey, '프로젝트 블록 본문')}>{block.content}</p>
                </>
            )}
        </div>
    );
}

function ListBlock({ block, projectId, store, editable }) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '프로젝트 리스트 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `projects.${projectId}.blocks.${block.id}.items.${index}`;
                            return (
                                <div key={`${block.id}-${index}`} className="project-list-edit-row">
                                    <input
                                        value={item}
                                        {...selectableInputProps(store, itemKey, `프로젝트 리스트 항목 ${index + 1}`)}
                                        onChange={(e) =>
                                            store.actions.updateProjectListItem(
                                                projectId,
                                                block.id,
                                                index,
                                                e.target.value
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="ghost danger small"
                                        onClick={() =>
                                            store.actions.removeProjectListItem(projectId, block.id, index)
                                        }
                                    >
                                        X
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            className="ghost small"
                            onClick={() => store.actions.addProjectListItem(projectId, block.id)}
                        >
                            리스트 항목 추가
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 리스트 제목')}>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `projects.${projectId}.blocks.${block.id}.items.${index}`;
                            return (
                                <li
                                    key={`${block.id}-${index}`}
                                    {...selectableViewProps(store, itemKey, `프로젝트 리스트 항목 ${index + 1}`)}
                                >
                                    {item}
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}

function ImageBlock({block, projectId, store, editable}) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;
    const captionKey = `projects.${projectId}.blocks.${block.id}.caption`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '프로젝트 이미지 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <input
                        value={block.caption || ''}
                        {...selectableInputProps(store, captionKey, '프로젝트 이미지 캡션')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'caption', e.target.value)
                        }
                        className="custom-input subtitle"
                    />

                    <div className="project-image-grid">
                        {(block.images || []).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                {image ? (
                                    <img src={image} alt={block.title || 'project'} />
                                ) : (
                                    <div className="project-image-placeholder">IMAGE</div>
                                )}
                                <label className="ghost small upload-label">
                                    이미지 업로드
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            readFileAsDataUrl(file, (value) =>
                                                store.actions.updateProjectImage(projectId, block.id, index, value)
                                            );
                                        }}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addProjectImage(projectId, block.id)}
                    >
                        이미지 슬롯 추가
                    </button>
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 이미지 블록 제목')}>{block.title}</h4>
                    <div className="project-image-grid">
                        {(block.images || []).filter(Boolean).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                <img src={image} alt={block.title || 'project'} />
                            </div>
                        ))}
                    </div>
                    {block.caption ? (
                        <p {...selectableViewProps(store, captionKey, '프로젝트 이미지 캡션')} className="project-caption">
                            {block.caption}
                        </p>
                    ) : null}
                </>
            )}
        </div>
    );
}

export default function ProjectsSection({ store }) {
    const cardStyle = store.actions.sectionCardStyle('projectsCard');
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor('section.projects.title');
    const [draggingProjectId, setDraggingProjectId] = useState(null);
    const [dragOverProjectId, setDragOverProjectId] = useState(null);

    return (
        <section
            className="portfolio-card"
            style={cardStyle}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({key: 'projectsCard', label: '프로젝트 카드'});
            }}
        >
            <div className="section-head">
                <h2 className="section-title" style={titleStyle}>
                    프로젝트
                </h2>
            </div>

            <div className="projects-list">
                {store.portfolio.projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        store={store}
                        editable={isEdit}
                        draggingProjectId={draggingProjectId}
                        dragOverProjectId={dragOverProjectId}
                        setDraggingProjectId={setDraggingProjectId}
                        setDragOverProjectId={setDragOverProjectId}
                    />
                ))}
            </div>
        </section>
    );
}

function ProjectCard({
                         project,
                         store,
                         editable,
                         draggingProjectId,
                         dragOverProjectId,
                         setDraggingProjectId,
                         setDragOverProjectId,
                     }) {
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    const titleKey = `projects.${project.id}.title`;
    const roleKey = `projects.${project.id}.role`;
    const periodKey = `projects.${project.id}.period`;
    const summaryKey = `projects.${project.id}.summary`;
    const linkKey = `projects.${project.id}.link`;

    const showHelpers = editable && store.ui.showEditHelpers;
    const isProjectDragging = draggingProjectId === project.id;
    const isProjectDragOver = dragOverProjectId === project.id && draggingProjectId !== project.id;

    const isProjectCardDragEvent = (event) =>
        Array.from(event.dataTransfer?.types || []).includes('application/x-project-card');

    const showProjectDropOverlay = showHelpers && !!draggingProjectId && draggingProjectId !== project.id;

    return (
        <article
            className={`portfolio-card project-card-inner ${
                isProjectDragging ? 'dragging' : ''
            } ${isProjectDragOver ? 'drag-over' : ''}`}
            onDragEnterCapture={(event) => {
                if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();

                if (dragOverProjectId !== project.id) {
                    setDragOverProjectId(project.id);
                }
            }}
            onDragOverCapture={(event) => {
                if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = 'move';

                if (dragOverProjectId !== project.id) {
                    setDragOverProjectId(project.id);
                }
            }}
            onDragLeaveCapture={(event) => {
                if (!isProjectCardDragEvent(event)) return;

                const nextTarget = event.relatedTarget;
                if (nextTarget && event.currentTarget.contains(nextTarget)) return;

                if (dragOverProjectId === project.id) {
                    setDragOverProjectId(null);
                }
            }}
            onDropCapture={(event) => {
                if (!showHelpers || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();

                const dragged =
                    event.dataTransfer.getData('application/x-project-card') || draggingProjectId;

                if (dragged && dragged !== project.id) {
                    store.actions.moveProject(dragged, project.id);
                }

                setDraggingProjectId(null);
                setDragOverProjectId(null);
            }}
        >
            {showHelpers ? (
                <div className="project-card-toolbar">
                    <div
                        className="drag-handle"
                        draggable
                        title="프로젝트 카드 순서 변경"
                        onDragStart={(event) => {
                            event.stopPropagation();
                            setDraggingProjectId(project.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData(
                                'application/x-project-card',
                                String(project.id)
                            );
                        }}
                        onDragEnd={(event) => {
                            event.stopPropagation();
                            setDraggingProjectId(null);
                            setDragOverProjectId(null);
                        }}
                    >
                        ⋮⋮
                    </div>

                    <strong>{project.title || '프로젝트'}</strong>
                </div>
            ) : null}

            {showProjectDropOverlay ? (
                <div
                    className={`project-card-drop-overlay ${isProjectDragOver ? 'active' : ''}`}
                    onDragOver={(event) => {
                        if (!isProjectCardDragEvent(event)) return;
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = 'move';

                        if (dragOverProjectId !== project.id) {
                            setDragOverProjectId(project.id);
                        }
                    }}
                    onDrop={(event) => {
                        if (!isProjectCardDragEvent(event)) return;
                        event.preventDefault();
                        event.stopPropagation();

                        const dragged =
                            event.dataTransfer.getData('application/x-project-card') ||
                            draggingProjectId;

                        if (dragged && dragged !== project.id) {
                            store.actions.moveProject(dragged, project.id);
                        }

                        setDraggingProjectId(null);
                        setDragOverProjectId(null);
                    }}
                />
            ) : null}

            <div className="project-top-meta">
                {editable ? (
                    <>
                        <input
                            value={project.title}
                            {...selectableInputProps(store, titleKey, '프로젝트 제목')}
                            onChange={(e) => store.actions.updateProject(project.id, 'title', e.target.value)}
                            className="custom-input title"
                        />
                        <input
                            value={project.role}
                            {...selectableInputProps(store, roleKey, '프로젝트 역할')}
                            onChange={(e) => store.actions.updateProject(project.id, 'role', e.target.value)}
                            className="custom-input subtitle"
                        />
                        <input
                            value={project.period}
                            {...selectableInputProps(store, periodKey, '프로젝트 기간')}
                            onChange={(e) => store.actions.updateProject(project.id, 'period', e.target.value)}
                            className="custom-input meta"
                        />
                        <textarea
                            value={project.summary}
                            {...selectableInputProps(store, summaryKey, '프로젝트 요약')}
                            onChange={(e) => store.actions.updateProject(project.id, 'summary', e.target.value)}
                            className="custom-input description"
                        />
                        <input
                            value={project.link}
                            {...selectableInputProps(store, linkKey, '프로젝트 링크')}
                            onChange={(e) => store.actions.updateProject(project.id, 'link', e.target.value)}
                            className="custom-input link"
                        />
                    </>
                ) : (
                    <>
                        <div className="project-head-row">
                            <h3 {...selectableViewProps(store, titleKey, '프로젝트 제목')}>{project.title}</h3>
                            <strong {...selectableViewProps(store, roleKey, '프로젝트 역할')}>{project.role}</strong>
                        </div>
                        <p className="project-period" {...selectableViewProps(store, periodKey, '프로젝트 기간')}>
                            {project.period}
                        </p>
                        <p {...selectableViewProps(store, summaryKey, '프로젝트 요약')}>{project.summary}</p>
                        <p {...selectableViewProps(store, linkKey, '프로젝트 링크')}>{project.link}</p>
                    </>
                )}
            </div>

            <div className="project-block-grid">
                {(project.blocks || []).map((block) => (
                    <BlockShell
                        key={block.id}
                        store={store}
                        projectId={project.id}
                        block={block}
                        draggingId={draggingId}
                        dragOverId={dragOverId}
                        setDraggingId={setDraggingId}
                        setDragOverId={setDragOverId}
                    >
                        {block.type === 'text' ? (
                            <TextBlock block={block} projectId={project.id} store={store} editable={editable} />
                        ) : block.type === 'list' ? (
                            <ListBlock block={block} projectId={project.id} store={store} editable={editable} />
                        ) : (
                            <ImageBlock block={block} projectId={project.id} store={store} editable={editable} />
                        )}
                    </BlockShell>
                ))}
            </div>

            {editable ? (
                <div className="project-add-blocks">
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addProjectBlock(project.id, 'text')}
                    >
                        텍스트 블록
                    </button>
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addProjectBlock(project.id, 'list')}
                    >
                        리스트 블록
                    </button>
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addProjectBlock(project.id, 'image')}
                    >
                        이미지 블록
                    </button>
                    <button
                        type="button"
                        className="ghost danger small"
                        onClick={() => store.actions.removeProject(project.id)}
                    >
                        프로젝트 삭제
                    </button>
                </div>
            ) : null}
        </article>
    );
}