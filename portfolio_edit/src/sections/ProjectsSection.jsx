import { useState } from 'react';

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
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
    const isDragging = draggingId === block.id;
    const isDragOver = dragOverId === block.id && draggingId !== block.id;

    const onDragStart = (event) => {
        if (!isEdit) return;
        event.stopPropagation();
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(block.id));
    };

    const onDragOver = (event) => {
        if (!isEdit || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverId !== block.id) setDragOverId(block.id);
    };

    const onDrop = (event) => {
        if (!isEdit) return;
        event.preventDefault();
        event.stopPropagation();

        const dragged = event.dataTransfer.getData('text/plain') || draggingId;
        if (dragged && dragged !== block.id) {
            store.actions.moveProjectBlock(projectId, dragged, block.id);
        }

        setDraggingId(null);
        setDragOverId(null);
    };

    const onDragEnd = (event) => {
        event.stopPropagation();
        setDraggingId(null);
        setDragOverId(null);
    };

    return (
        <div
            className={`project-block-shell span-${block.colSpan || 12} span-r-${block.rowSpan || 1} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {isEdit ? (
                <div className="project-block-toolbar">
                    <div
                        className="drag-handle"
                        title="드래그해서 위치 이동"
                        draggable
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    >
                        ⋮⋮
                    </div>

                    <strong>{block.type} · {block.title}</strong>

                    <div className="profile-block-actions">
                        {[12, 8, 6, 4, 3].map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={(block.colSpan || 12) === value ? 'active' : ''}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    store.actions.setProjectBlockSpan(projectId, block.id, value);
                                }}
                            >
                                W{value}
                            </button>
                        ))}
                    </div>

                    <div className="profile-block-actions">
                        {[1, 2, 3].map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={(block.rowSpan || 1) === value ? 'active' : ''}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    store.actions.setProjectBlockRowSpan(projectId, block.id, value);
                                }}
                            >
                                H{value}
                            </button>
                        ))}
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
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content}
                        onChange={(e) => store.actions.updateProjectBlock(projectId, block.id, 'content', e.target.value)}
                        className="custom-input description"
                    />
                </>
            ) : (
                <>
                    <h4>{block.title}</h4>
                    <p>{block.content}</p>
                </>
            )}
        </div>
    );
}

function ListBlock({ block, projectId, store, editable }) {
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((item, index) => (
                            <input
                                key={`${block.id}-${index}`}
                                value={item}
                                onChange={(e) => store.actions.updateProjectListItem(projectId, block.id, index, e.target.value)}
                            />
                        ))}
                        <button type="button" className="ghost small" onClick={() => store.actions.addProjectListItem(projectId, block.id)}>
                            리스트 항목 추가
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h4>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}
                    </ul>
                </>
            )}
        </div>
    );
}

function ImageBlock({ block, projectId, store, editable }) {
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <input
                        value={block.caption || ''}
                        onChange={(e) => store.actions.updateProjectBlock(projectId, block.id, 'caption', e.target.value)}
                        className="custom-input subtitle"
                    />

                    <div className="project-image-grid">
                        {(block.images || []).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                {image ? <img src={image} alt={block.title || 'project'} /> : <div className="project-image-placeholder">IMAGE</div>}
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

                    <button type="button" className="ghost small" onClick={() => store.actions.addProjectImage(projectId, block.id)}>
                        이미지 슬롯 추가
                    </button>
                </>
            ) : (
                <>
                    <h4>{block.title}</h4>
                    <div className="project-image-grid">
                        {(block.images || []).filter(Boolean).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                <img src={image} alt={block.title || 'project'} />
                            </div>
                        ))}
                    </div>
                    {block.caption ? <p className="project-caption">{block.caption}</p> : null}
                </>
            )}
        </div>
    );
}

export default function ProjectsSection({ store }) {
    const cardStyle = store.actions.cardStyle();
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor('section.projects.title');

    return (
        <section className="portfolio-card" style={cardStyle}>
            <div className="section-head">
                <h2 className="section-title" style={titleStyle}>프로젝트</h2>
            </div>

            <div className="projects-list">
                {store.portfolio.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} store={store} editable={isEdit} />
                ))}
            </div>
        </section>
    );
}

function ProjectCard({ project, store, editable }) {
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    return (
        <article className="portfolio-card project-card-inner">
            <div className="project-top-meta">
                {editable ? (
                    <>
                        <input value={project.title} onChange={(e) => store.actions.updateProject(project.id, 'title', e.target.value)} className="custom-input title" />
                        <input value={project.role} onChange={(e) => store.actions.updateProject(project.id, 'role', e.target.value)} className="custom-input subtitle" />
                        <input value={project.period} onChange={(e) => store.actions.updateProject(project.id, 'period', e.target.value)} className="custom-input meta" />
                        <textarea value={project.summary} onChange={(e) => store.actions.updateProject(project.id, 'summary', e.target.value)} className="custom-input description" />
                        <input value={project.link} onChange={(e) => store.actions.updateProject(project.id, 'link', e.target.value)} className="custom-input link" />
                    </>
                ) : (
                    <>
                        <div className="project-head-row">
                            <h3>{project.title}</h3>
                            <strong>{project.role}</strong>
                        </div>
                        <p className="project-period">{project.period}</p>
                        <p>{project.summary}</p>
                        <p>{project.link}</p>
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
                    <button type="button" className="ghost small" onClick={() => store.actions.addProjectBlock(project.id, 'text')}>텍스트 블록</button>
                    <button type="button" className="ghost small" onClick={() => store.actions.addProjectBlock(project.id, 'list')}>리스트 블록</button>
                    <button type="button" className="ghost small" onClick={() => store.actions.addProjectBlock(project.id, 'image')}>이미지 블록</button>
                    <button type="button" className="ghost danger small" onClick={() => store.actions.removeProject(project.id)}>프로젝트 삭제</button>
                </div>
            ) : null}
        </article>
    );
}