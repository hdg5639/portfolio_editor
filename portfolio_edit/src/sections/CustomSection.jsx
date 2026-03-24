import { useState } from 'react';

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

function EditableText({ as = 'input', value, placeholder, onChange, className = '', disabled = false }) {
    if (disabled) return <div className={className}>{value || placeholder}</div>;

    if (as === 'textarea') {
        return (
            <textarea
                className={className}
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    return (
        <input
            className={className}
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function ItemShell({
                       store,
                       sectionId,
                       item,
                       draggingId,
                       dragOverId,
                       setDraggingId,
                       setDragOverId,
                       children,
                   }) {
    const isEdit = store.mode === 'edit';
    const isDragging = draggingId === item.id;
    const isDragOver = dragOverId === item.id && draggingId !== item.id;

    const onDragStart = (event) => {
        if (!isEdit) return;
        event.stopPropagation();
        setDraggingId(item.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
    };

    const onDragOver = (event) => {
        if (!isEdit || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        if (dragOverId !== item.id) setDragOverId(item.id);
    };

    const onDrop = (event) => {
        if (!isEdit) return;
        event.preventDefault();
        event.stopPropagation();
        const dragged = event.dataTransfer.getData('text/plain') || draggingId;
        if (dragged && dragged !== item.id) {
            store.actions.moveCustomSectionItem(sectionId, dragged, item.id);
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
            className={`custom-item-shell span-${item.colSpan || 6} span-r-${item.rowSpan || 1} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {isEdit ? (
                <div className="project-block-toolbar">
                    <div
                        className="drag-handle"
                        draggable
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    >
                        ⋮⋮
                    </div>

                    <strong>{item.title || '아이템'}</strong>

                    <div className="profile-block-actions">
                        {[12, 8, 6, 4, 3].map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={(item.colSpan || 6) === value ? 'active' : ''}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    store.actions.setCustomSectionItemSpan(sectionId, item.id, value);
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
                                className={(item.rowSpan || 1) === value ? 'active' : ''}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    store.actions.setCustomSectionItemRowSpan(sectionId, item.id, value);
                                }}
                            >
                                H{value}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                store.actions.removeCustomSectionItem(sectionId, item.id);
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

function ComplexBlockShell({
                               store,
                               sectionId,
                               itemId,
                               block,
                               draggingId,
                               dragOverId,
                               setDraggingId,
                               setDragOverId,
                               children,
                           }) {
    const editable = store.mode === 'edit';
    const isDragging = draggingId === block.id;
    const isDragOver = dragOverId === block.id && draggingId !== block.id;

    const onDragStart = (event) => {
        if (!editable) return;
        event.stopPropagation();
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', block.id);
    };

    const onDragOver = (event) => {
        if (!editable || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        if (dragOverId !== block.id) setDragOverId(block.id);
    };

    const onDrop = (event) => {
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        const dragged = event.dataTransfer.getData('text/plain') || draggingId;
        if (dragged && dragged !== block.id) {
            store.actions.moveCustomComplexBlock(sectionId, itemId, dragged, block.id);
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
            {editable ? (
                <div className="project-block-toolbar">
                    <div
                        className="drag-handle"
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
                                    store.actions.setCustomComplexBlockSpan(sectionId, itemId, block.id, value);
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
                                    store.actions.setCustomComplexBlockRowSpan(sectionId, itemId, block.id, value);
                                }}
                            >
                                H{value}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                store.actions.removeCustomComplexBlock(sectionId, itemId, block.id);
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

function ComplexTextBlock({ store, sectionId, itemId, block, editable }) {
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content || ''}
                        onChange={(e) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'content', e.target.value)}
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

function ComplexListBlock({ store, sectionId, itemId, block, editable }) {
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((entry, index) => (
                            <input
                                key={`${block.id}-${index}`}
                                value={entry}
                                onChange={(e) => store.actions.updateCustomComplexListItem(sectionId, itemId, block.id, index, e.target.value)}
                            />
                        ))}
                        <button
                            type="button"
                            className="ghost small"
                            onClick={() => store.actions.addCustomComplexListItem(sectionId, itemId, block.id)}
                        >
                            리스트 항목 추가
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h4>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((entry, index) => (
                            <li key={`${block.id}-${index}`}>{entry}</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function ComplexImageBlock({ store, sectionId, itemId, block, editable }) {
    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        onChange={(e) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)}
                        className="custom-input title"
                    />
                    <input
                        value={block.caption || ''}
                        onChange={(e) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'caption', e.target.value)}
                        className="custom-input subtitle"
                    />
                    <div className="project-image-grid">
                        {(block.images || []).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                {image ? <img src={image} alt={block.title || 'custom'} /> : <div className="project-image-placeholder">IMAGE</div>}
                                <label className="ghost small upload-label">
                                    이미지 업로드
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            readFileAsDataUrl(file, (value) =>
                                                store.actions.updateCustomComplexImage(sectionId, itemId, block.id, index, value)
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
                        onClick={() => store.actions.addCustomComplexImage(sectionId, itemId, block.id)}
                    >
                        이미지 슬롯 추가
                    </button>
                </>
            ) : (
                <>
                    <h4>{block.title}</h4>
                    <div className="project-image-grid">
                        {(block.images || []).filter(Boolean).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                <img src={image} alt={block.title || 'custom'} />
                            </div>
                        ))}
                    </div>
                    {block.caption ? <p className="project-caption">{block.caption}</p> : null}
                </>
            )}
        </div>
    );
}

function ComplexProjectItem({ sectionId, item, store, editable }) {
    const [draggingBlockId, setDraggingBlockId] = useState(null);
    const [dragOverBlockId, setDragOverBlockId] = useState(null);

    return (
        <article className="portfolio-card project-card-inner">
            <div className="project-top-meta">
                {editable ? (
                    <>
                        <input
                            value={item.title || ''}
                            onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', e.target.value)}
                            className="custom-input title"
                        />
                        <input
                            value={item.subtitle || ''}
                            onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'subtitle', e.target.value)}
                            className="custom-input subtitle"
                        />
                        <input
                            value={item.date || ''}
                            onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'date', e.target.value)}
                            className="custom-input meta"
                        />
                        <textarea
                            value={item.summary || ''}
                            onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'summary', e.target.value)}
                            className="custom-input description"
                        />
                        <input
                            value={item.link || ''}
                            onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'link', e.target.value)}
                            className="custom-input link"
                        />
                    </>
                ) : (
                    <>
                        <div className="project-head-row">
                            <h3>{item.title}</h3>
                            <strong>{item.subtitle}</strong>
                        </div>
                        <p className="project-period">{item.date}</p>
                        <p>{item.summary}</p>
                        <p>{item.link}</p>
                    </>
                )}
            </div>

            {editable ? (
                <div className="project-list-edit">
                    <strong>기술 스택</strong>
                    {(item.techStack || []).map((tech, index) => (
                        <input
                            key={`${item.id}-tech-${index}`}
                            value={tech}
                            onChange={(e) => store.actions.updateCustomComplexTech(sectionId, item.id, index, e.target.value)}
                        />
                    ))}
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addCustomComplexTech(sectionId, item.id)}
                    >
                        기술 추가
                    </button>
                </div>
            ) : (
                <div className="chip-list">
                    {(item.techStack || []).filter(Boolean).map((tech, index) => (
                        <span key={`${item.id}-chip-${index}`} className="chip">{tech}</span>
                    ))}
                </div>
            )}

            <div className="project-block-grid">
                {(item.blocks || []).map((block) => (
                    <ComplexBlockShell
                        key={block.id}
                        store={store}
                        sectionId={sectionId}
                        itemId={item.id}
                        block={block}
                        draggingId={draggingBlockId}
                        dragOverId={dragOverBlockId}
                        setDraggingId={setDraggingBlockId}
                        setDragOverId={setDragOverBlockId}
                    >
                        {block.type === 'text' ? (
                            <ComplexTextBlock store={store} sectionId={sectionId} itemId={item.id} block={block} editable={editable} />
                        ) : block.type === 'list' ? (
                            <ComplexListBlock store={store} sectionId={sectionId} itemId={item.id} block={block} editable={editable} />
                        ) : (
                            <ComplexImageBlock store={store} sectionId={sectionId} itemId={item.id} block={block} editable={editable} />
                        )}
                    </ComplexBlockShell>
                ))}
            </div>

            {editable ? (
                <div className="project-add-blocks">
                    <button type="button" className="ghost small" onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'text')}>
                        텍스트 블록
                    </button>
                    <button type="button" className="ghost small" onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'list')}>
                        리스트 블록
                    </button>
                    <button type="button" className="ghost small" onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'image')}>
                        이미지 블록
                    </button>
                </div>
            ) : null}
        </article>
    );
}

function renderItem(section, item, store, disabled) {
    const sectionId = section.id;

    if (section.template === 'simpleList') {
        return (
            <div className="custom-item simple">
                <EditableText
                    value={item.title}
                    placeholder="제목"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                    className="custom-input title"
                    disabled={disabled}
                />
                <EditableText
                    as="textarea"
                    value={item.description}
                    placeholder="설명"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                    className="custom-input description"
                    disabled={disabled}
                />
            </div>
        );
    }

    if (section.template === 'timeline') {
        return (
            <div className="custom-item timeline">
                <EditableText
                    value={item.date}
                    placeholder="날짜"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'date', value)}
                    className="custom-input meta"
                    disabled={disabled}
                />
                <EditableText
                    value={item.title}
                    placeholder="제목"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                    className="custom-input title"
                    disabled={disabled}
                />
                <EditableText
                    as="textarea"
                    value={item.description}
                    placeholder="설명"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                    className="custom-input description"
                    disabled={disabled}
                />
            </div>
        );
    }

    if (section.template === 'media') {
        return (
            <div className={`custom-item media ${item.imagePosition === 'left' ? 'image-left' : ''} ${item.imagePosition === 'right' ? 'image-right' : ''}`}>
                {item.image ? (
                    <div className="custom-media-preview">
                        <img src={item.image} alt={item.title || 'custom'} />
                    </div>
                ) : null}

                <div className="custom-media-body">
                    {!disabled ? (
                        <div className="inline-actions wrap">
                            <select
                                value={item.imagePosition || 'top'}
                                onChange={(e) => store.actions.updateCustomSectionItem(sectionId, item.id, 'imagePosition', e.target.value)}
                            >
                                <option value="top">이미지 상단</option>
                                <option value="left">이미지 좌측</option>
                                <option value="right">이미지 우측</option>
                            </select>
                            <label className="ghost small upload-label">
                                이미지 업로드
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        readFileAsDataUrl(file, (value) =>
                                            store.actions.updateCustomSectionItem(sectionId, item.id, 'image', value)
                                        );
                                    }}
                                />
                            </label>
                        </div>
                    ) : null}

                    <EditableText
                        value={item.title}
                        placeholder="제목"
                        onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                        className="custom-input title"
                        disabled={disabled}
                    />
                    <EditableText
                        as="textarea"
                        value={item.description}
                        placeholder="설명"
                        onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                        className="custom-input description"
                        disabled={disabled}
                    />
                </div>
            </div>
        );
    }

    return (
        <ComplexProjectItem
            sectionId={sectionId}
            item={item}
            store={store}
            editable={!disabled}
        />
    );
}

export default function CustomSection({ store, section }) {
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor(`section.custom.${section.id}.title`);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    return (
        <section className="portfolio-card" style={store.actions.cardStyle()}>
            <div className="section-head">
                {isEdit ? (
                    <input
                        className="section-title-input"
                        style={titleStyle}
                        value={section.name}
                        onChange={(e) => store.actions.updateCustomSectionMeta(section.id, 'name', e.target.value)}
                    />
                ) : (
                    <h2 className="section-title" style={titleStyle}>{section.name}</h2>
                )}

                {isEdit ? (
                    <button type="button" className="ghost small" onClick={() => store.actions.addCustomSectionItem(section.id)}>
                        항목 추가
                    </button>
                ) : null}
            </div>

            <div className="custom-section-grid">
                {(section.items || []).map((item) => (
                    <ItemShell
                        key={item.id}
                        store={store}
                        sectionId={section.id}
                        item={item}
                        draggingId={draggingId}
                        dragOverId={dragOverId}
                        setDraggingId={setDraggingId}
                        setDragOverId={setDragOverId}
                    >
                        {renderItem(section, item, store, !isEdit)}
                    </ItemShell>
                ))}
            </div>
        </section>
    );
}