import { useMemo, useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState, getCustomItemSelectionState, getCustomBlockSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

function bind(store, key, label) {
    return {
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

function EditableText({
                          as = 'input',
                          value,
                          placeholder,
                          onChange,
                          className = '',
                          disabled = false,
                          style,
                          onClick,
                      }) {
    if (disabled) {
        return (
            <div className={className} style={style} onClick={onClick}>
                {value || placeholder}
            </div>
        );
    }

    if (as === 'textarea') {
        return (
            <textarea
                className={className}
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                style={style}
                onClick={onClick}
            />
        );
    }

    return (
        <input
            className={className}
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={style}
            onClick={onClick}
        />
    );
}

function SelectionBadge({ label, tone = 'block' }) {
    return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
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
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const isDragging = draggingId === item.id;
    const isDragOver = dragOverId === item.id && draggingId !== item.id;
    const itemSelection = getCustomItemSelectionState(store.selected?.key, sectionId, item.id);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = useTapReorder && !!draggingId && draggingId !== item.id;

    const onDragStart = (event) => {
        if (!showHelpers) return;
        event.stopPropagation();
        setDraggingId(item.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
    };

    const onDragOver = (event) => {
        if (!showHelpers || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        if (dragOverId !== item.id) setDragOverId(item.id);
    };

    const onDrop = (event) => {
        if (!showHelpers) return;
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

    const handleTapReorder = (event) => {
        if (!showTapOverlay) return false;
        event.preventDefault();
        event.stopPropagation();
        store.actions.moveCustomSectionItem(sectionId, draggingId, item.id);
        setDraggingId(null);
        setDragOverId(null);
        return true;
    };

    return (
        <div
            className={`custom-item-shell selection-scope selection-item span-${item.colSpan || 6} span-r-${item.rowSpan || 1} ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''} ${itemSelection.selected ? 'is-selected' : ''} ${itemSelection.ancestor ? 'is-ancestor' : ''}`}
            onClick={(event) => {
                if (handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: `custom.${sectionId}.${item.id}`, label: `${item.title || '커스텀'} 항목` });
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >

            {showHelpers ? (
                <LayoutChrome
                    label={item.title || '아이템'}
                    summary={`${item.colSpan || 6} × ${item.rowSpan || 1}`}
                    defaultExpanded={!store.ui?.isMobile}
                    dragHandle={
                        <div className="drag-handle" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={(event) => {
                            if (!useTapReorder) return;
                            event.preventDefault();
                            event.stopPropagation();
                            setDraggingId((current) => (current === item.id ? null : item.id));
                            setDragOverId(null);
                        }}>
                            ⋮⋮
                        </div>
                    }
                    controls={
                        <LayoutSizeControl
                            widthValue={item.colSpan || 6}
                            heightValue={item.rowSpan || 1}
                            onWidthChange={(value) => store.actions.setCustomSectionItemSpan(sectionId, item.id, value)}
                            onHeightChange={(value) => store.actions.setCustomSectionItemRowSpan(sectionId, item.id, value)}
                            compact
                        />
                    }
                    actions={
                        <div className="profile-block-actions">
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
                    }
                />
            ) : null}

            {showTapOverlay ? (
                <button type="button" className="tap-reorder-overlay active" onClick={handleTapReorder}>
                    여기로 이동
                </button>
            ) : null}

            <div className="layout-item-body">
                {children}
            </div>
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
                               layoutMode,
                               placementStyle,
                               measureRef,
                               minRowSpan,
                               layoutItemsOverride,
                               children,
                           }) {
    const editable = store.mode === 'edit';
    const showHelpers = editable && store.ui.showEditHelpers;
    const isDragging = draggingId === block.id;
    const isDragOver = layoutMode === 'packed' && dragOverId === block.id && draggingId !== block.id;
    const blockSelection = getCustomBlockSelectionState(store.selected?.key, sectionId, itemId, block.id);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = layoutMode === 'packed' && useTapReorder && !!draggingId && draggingId !== block.id;

    const onDragStart = (event) => {
        if (!showHelpers) return;
        event.stopPropagation();
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', block.id);
    };

    const onDragOver = (event) => {
        if (layoutMode !== 'packed' || !showHelpers || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        if (dragOverId !== block.id) setDragOverId(block.id);
    };

    const onDrop = (event) => {
        if (layoutMode !== 'packed' || !showHelpers) return;
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

    const handleTapReorder = (event) => {
        if (!showTapOverlay) return false;
        event.preventDefault();
        event.stopPropagation();
        store.actions.moveCustomComplexBlock(sectionId, itemId, draggingId, block.id);
        setDraggingId(null);
        setDragOverId(null);
        return true;
    };

    return (
        <div
            className={`project-block-shell selection-scope selection-block span-${block.colSpan || 12} span-r-${block.rowSpan || 1} layout-mode-${layoutMode} ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''} ${blockSelection.selected ? 'is-selected' : ''} ${blockSelection.ancestor ? 'is-ancestor' : ''}`}
            style={placementStyle}
            onClick={(event) => {
                if (handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: `custom.${sectionId}.${itemId}.blocks.${block.id}`, label: `${block.title || block.type} 블럭` });
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >

            {showHelpers ? (
                <LayoutChrome
                    label={`${block.type} · ${block.title}`}
                    summary={`${block.colSpan || 12} × ${block.rowSpan || 1}`}
                    defaultExpanded={!store.ui?.isMobile}
                    dragHandle={
                        <div className={`drag-handle ${layoutMode === 'manual' && draggingId === block.id ? 'is-armed' : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={(event) => {
                            if (layoutMode === 'manual') {
                                event.preventDefault();
                                event.stopPropagation();
                                setDraggingId((current) => (current === block.id ? null : block.id));
                                setDragOverId(null);
                                return;
                            }
                            if (!useTapReorder) return;
                            event.preventDefault();
                            event.stopPropagation();
                            setDraggingId((current) => (current === block.id ? null : block.id));
                            setDragOverId(null);
                        }}>
                            ⋮⋮
                        </div>
                    }
                    controls={
                        <LayoutSizeControl
                            widthValue={block.colSpan || 12}
                            heightValue={block.rowSpan || 1}
                            minHeightValue={minRowSpan}
                            onWidthChange={(value) =>
                                store.actions.setCustomComplexBlockSpan(sectionId, itemId, block.id, value, layoutItemsOverride)
                            }
                            onHeightChange={(value) =>
                                store.actions.setCustomComplexBlockRowSpan(sectionId, itemId, block.id, value, layoutItemsOverride)
                            }
                            compact
                        />
                    }
                    actions={
                        <div className="profile-block-actions">
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
                    }
                />
            ) : null}

            {showTapOverlay ? (
                <button type="button" className="tap-reorder-overlay active" onClick={handleTapReorder}>
                    여기로 이동
                </button>
            ) : null}

            <div className="layout-item-body">
                <div className="layout-item-measure" ref={measureRef}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function ComplexTextBlock({ store, sectionId, itemId, block, editable }) {
    const titleKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.title`;
    const contentKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.content`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '복합 텍스트 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content || ''}
                        {...selectableInputProps(store, contentKey, '복합 텍스트 블록 본문')}
                        onChange={(e) =>
                            store.actions.updateCustomComplexBlock(
                                sectionId,
                                itemId,
                                block.id,
                                'content',
                                e.target.value
                            )
                        }
                        className="custom-input description"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '복합 텍스트 블록 제목')}>{block.title}</h4>
                    <p {...selectableViewProps(store, contentKey, '복합 텍스트 블록 본문')}>{block.content}</p>
                </>
            )}
        </div>
    );
}

function ComplexListBlock({ store, sectionId, itemId, block, editable }) {
    const titleKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.title`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '복합 리스트 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((entry, index) => {
                            const itemKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.items.${index}`;
                            return (
                                <div key={`${block.id}-${index}`} className="project-list-edit-row">
                                    <input
                                        value={entry}
                                        {...selectableInputProps(store, itemKey, `복합 리스트 항목 ${index + 1}`)}
                                        onChange={(e) =>
                                            store.actions.updateCustomComplexListItem(
                                                sectionId,
                                                itemId,
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
                                            store.actions.removeCustomComplexListItem(
                                                sectionId,
                                                itemId,
                                                block.id,
                                                index
                                            )
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
                            onClick={() => store.actions.addCustomComplexListItem(sectionId, itemId, block.id)}
                        >
                            리스트 항목 추가
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '복합 리스트 블록 제목')}>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((entry, index) => {
                            const itemKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.items.${index}`;
                            return (
                                <li
                                    key={`${block.id}-${index}`}
                                    {...selectableViewProps(store, itemKey, `복합 리스트 항목 ${index + 1}`)}
                                >
                                    {entry}
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}

function ComplexImageBlock({store, sectionId, itemId, block, editable}) {
    const titleKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.title`;
    const captionKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.caption`;

    return (
        <div className="project-inner-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '복합 이미지 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <input
                        value={block.caption || ''}
                        {...selectableInputProps(store, captionKey, '복합 이미지 블록 캡션')}
                        onChange={(e) =>
                            store.actions.updateCustomComplexBlock(
                                sectionId,
                                itemId,
                                block.id,
                                'caption',
                                e.target.value
                            )
                        }
                        className="custom-input subtitle"
                    />
                    <div className="project-image-grid">
                    {(block.images || []).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                {image ? (
                                    <img src={image} alt={block.title || 'custom'} />
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
                                                store.actions.updateCustomComplexImage(
                                                    sectionId,
                                                    itemId,
                                                    block.id,
                                                    index,
                                                    value
                                                )
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
                    <h4 {...selectableViewProps(store, titleKey, '복합 이미지 블록 제목')}>{block.title}</h4>
                    <div className="project-image-grid">
                        {(block.images || []).filter(Boolean).map((image, index) => (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                <img src={image} alt={block.title || 'custom'} />
                            </div>
                        ))}
                    </div>
                    {block.caption ? (
                        <p {...selectableViewProps(store, captionKey, '복합 이미지 블록 캡션')} className="project-caption">
                            {block.caption}
                        </p>
                    ) : null}
                </>
            )}
        </div>
    );
}

function ComplexProjectItem({ sectionId, item, store, editable }) {
    const [draggingBlockId, setDraggingBlockId] = useState(null);
    const [dragOverBlockId, setDragOverBlockId] = useState(null);
    const [manualPreviewCell, setManualPreviewCell] = useState(null);

    const titleKey = `custom.${sectionId}.${item.id}.title`;
    const subtitleKey = `custom.${sectionId}.${item.id}.subtitle`;
    const dateKey = `custom.${sectionId}.${item.id}.date`;
    const summaryKey = `custom.${sectionId}.${item.id}.summary`;
    const linkKey = `custom.${sectionId}.${item.id}.link`;
    const blockLayoutMode = item.layoutMode || 'manual';
    const measuredComplexBlocks = useMeasuredGridItems(item.blocks || [], (block) => block.id);
    const resolvedComplexBlocks = useMemo(() => {
        const normalized = blockLayoutMode === 'manual' ? normalizeGridItems(measuredComplexBlocks.resolvedItems) : measuredComplexBlocks.resolvedItems;
        return normalized;
    }, [blockLayoutMode, measuredComplexBlocks.resolvedItems]);
    const blockPreviewPacked = blockLayoutMode === 'packed'
        ? getPackedPlacementPreview(resolvedComplexBlocks, draggingBlockId, dragOverBlockId)
        : null;
    const blockPreviewManual = blockLayoutMode === 'manual' && manualPreviewCell
        ? getManualPlacementPreview(resolvedComplexBlocks, draggingBlockId, manualPreviewCell.x, manualPreviewCell.y)
        : null;
    const blockGridRows = getGridRowExtent(resolvedComplexBlocks, blockPreviewPacked?.preview || blockPreviewManual?.preview, 4);

    return (
        <article className="portfolio-card project-card-inner">
            {editable ? (
                <div className="project-card-toolbar project-card-toolbar-wrap no-print">
                    <strong>{item.title || '복합 프로젝트'}</strong>

                    <div className="layout-mode-controls compact">
                        <button
                            type="button"
                            className={`layout-mode-chip ${blockLayoutMode === 'manual' ? 'active' : ''}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                store.actions.setCustomComplexLayoutMode(sectionId, item.id, 'manual', resolvedComplexBlocks);
                                setDragOverBlockId(null);
                                setManualPreviewCell(null);
                            }}
                        >
                            자유형
                        </button>
                        <button
                            type="button"
                            className={`layout-mode-chip ${blockLayoutMode === 'packed' ? 'active' : ''}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                store.actions.setCustomComplexLayoutMode(sectionId, item.id, 'packed', resolvedComplexBlocks);
                                setDraggingBlockId(null);
                                setDragOverBlockId(null);
                                setManualPreviewCell(null);
                            }}
                        >
                            정리형
                        </button>
                        <button
                            type="button"
                            className="layout-mode-action"
                            onClick={(event) => {
                                event.stopPropagation();
                                store.actions.autoArrangeCustomComplexBlocks(sectionId, item.id, resolvedComplexBlocks);
                            }}
                        >
                            자동 정리
                        </button>
                    </div>
                </div>
            ) : null}
            <div className="project-top-meta">
                {editable ? (
                    <>
                        <input
                            value={item.title || ''}
                            {...selectableInputProps(store, titleKey, '복합 프로젝트 제목')}
                            onChange={(e) =>
                                store.actions.updateCustomSectionItem(sectionId, item.id, 'title', e.target.value)
                            }
                            className="custom-input title"
                        />
                        <input
                            value={item.subtitle || ''}
                            {...selectableInputProps(store, subtitleKey, '복합 프로젝트 부제목')}
                            onChange={(e) =>
                                store.actions.updateCustomSectionItem(sectionId, item.id, 'subtitle', e.target.value)
                            }
                            className="custom-input subtitle"
                        />
                        <input
                            value={item.date || ''}
                            {...selectableInputProps(store, dateKey, '복합 프로젝트 날짜')}
                            onChange={(e) =>
                                store.actions.updateCustomSectionItem(sectionId, item.id, 'date', e.target.value)
                            }
                            className="custom-input meta"
                        />
                        <textarea
                            value={item.summary || ''}
                            {...selectableInputProps(store, summaryKey, '복합 프로젝트 요약')}
                            onChange={(e) =>
                                store.actions.updateCustomSectionItem(sectionId, item.id, 'summary', e.target.value)
                            }
                            className="custom-input description"
                        />
                        <input
                            value={item.link || ''}
                            {...selectableInputProps(store, linkKey, '복합 프로젝트 링크')}
                            onChange={(e) =>
                                store.actions.updateCustomSectionItem(sectionId, item.id, 'link', e.target.value)
                            }
                            className="custom-input link"
                        />
                    </>
                ) : (
                    <>
                        <div className="project-head-row">
                            <h3 {...selectableViewProps(store, titleKey, '복합 프로젝트 제목')}>{item.title}</h3>
                            <strong {...selectableViewProps(store, subtitleKey, '복합 프로젝트 부제목')}>
                                {item.subtitle}
                            </strong>
                        </div>
                        <p className="project-period" {...selectableViewProps(store, dateKey, '복합 프로젝트 날짜')}>
                            {item.date}
                        </p>
                        <p {...selectableViewProps(store, summaryKey, '복합 프로젝트 요약')}>{item.summary}</p>
                        <p {...selectableViewProps(store, linkKey, '복합 프로젝트 링크')}>{item.link}</p>
                    </>
                )}
            </div>

            {editable ? (
                <div className="project-list-edit">
                    <strong>기술 스택</strong>
                    {(item.techStack || []).map((tech, index) => {
                        const techKey = `custom.${sectionId}.${item.id}.tech.${index}`;
                        return (
                            <input
                                key={`${item.id}-tech-${index}`}
                                value={tech}
                                {...selectableInputProps(store, techKey, `복합 프로젝트 기술 ${index + 1}`)}
                                onChange={(e) =>
                                    store.actions.updateCustomComplexTech(sectionId, item.id, index, e.target.value)
                                }
                            />
                        );
                    })}
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
                    {(item.techStack || []).filter(Boolean).map((tech, index) => {
                        const techKey = `custom.${sectionId}.${item.id}.tech.${index}`;
                        return (
                            <span
                                key={`${item.id}-chip-${index}`}
                                className="chip"
                                {...selectableViewProps(store, techKey, `복합 프로젝트 기술 ${index + 1}`)}
                            >
                                {tech}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className={`project-block-grid layout-mode-${blockLayoutMode} ${editable && store.ui.showEditHelpers ? 'show-grid-guides' : ''} ${blockLayoutMode === 'manual' && draggingBlockId ? 'manual-placement-active' : ''}`}>
                {editable && store.ui.showEditHelpers ? (
                    <GridPlacementOverlay
                        rows={blockGridRows}
                        preview={blockPreviewPacked?.preview || blockPreviewManual?.preview}
                        items={resolvedComplexBlocks.filter((block) => block.visible !== false)}
                        activeItemId={draggingBlockId}
                        showOccupiedRanges={blockLayoutMode === 'manual'}
                        active={!!draggingBlockId}
                        interactive={blockLayoutMode === 'manual' && !!draggingBlockId}
                        confirmBeforePlace={!!store.ui?.isMobile}
                        onCellEnter={(cell) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            setManualPreviewCell(cell);
                        }}
                        onCellDrop={(cell) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, resolvedComplexBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                        }}
                        onCellClick={(cell, event) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            event.preventDefault();
                            event.stopPropagation();
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, resolvedComplexBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                        }}
                        onCellConfirm={(cell, event) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            event?.preventDefault?.();
                            event?.stopPropagation?.();
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, resolvedComplexBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                        }}
                        onPointerLeave={() => {
                            if (blockLayoutMode === 'manual') setManualPreviewCell(null);
                        }}
                        onCancel={() => {
                            setManualPreviewCell(null);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            store.actions.selectPage();
                        }}
                    />
                ) : null}

                {resolvedComplexBlocks.map((block) => (
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
                        layoutMode={blockLayoutMode}
                        placementStyle={getGridItemPlacementStyle(block, blockLayoutMode)}
                        measureRef={measuredComplexBlocks.registerMeasureRef(block.id)}
                        minRowSpan={block.minRowSpan || 1}
                        layoutItemsOverride={resolvedComplexBlocks}
                    >
                        {block.type === 'text' ? (
                            <ComplexTextBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                            />
                        ) : block.type === 'list' ? (
                            <ComplexListBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                            />
                        ) : (
                            <ComplexImageBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                            />
                        )}
                    </ComplexBlockShell>
                ))}
            </div>

            {editable ? (
                <div className="project-add-blocks">
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'text')}
                    >
                        텍스트 블록
                    </button>
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'list')}
                    >
                        리스트 블록
                    </button>
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addCustomComplexBlock(sectionId, item.id, 'image')}
                    >
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
        const titleKey = `custom.${sectionId}.${item.id}.title`;
        const descKey = `custom.${sectionId}.${item.id}.description`;

        return (
            <div className="custom-item simple">
                <EditableText
                    value={item.title}
                    placeholder="제목"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                    className="custom-input title"
                    disabled={disabled}
                    {...selectableInputProps(store, titleKey, '커스텀 항목 제목')}
                />
                <EditableText
                    as="textarea"
                    value={item.description}
                    placeholder="설명"
                    onChange={(value) =>
                        store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)
                    }
                    className="custom-input description"
                    disabled={disabled}
                    {...selectableInputProps(store, descKey, '커스텀 항목 설명')}
                />
            </div>
        );
    }

    if (section.template === 'timeline') {
        const dateKey = `custom.${sectionId}.${item.id}.date`;
        const titleKey = `custom.${sectionId}.${item.id}.title`;
        const descKey = `custom.${sectionId}.${item.id}.description`;

        return (
            <div className="custom-item timeline">
                <EditableText
                    value={item.date}
                    placeholder="날짜"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'date', value)}
                    className="custom-input meta"
                    disabled={disabled}
                    {...selectableInputProps(store, dateKey, '타임라인 날짜')}
                />
                <EditableText
                    value={item.title}
                    placeholder="제목"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                    className="custom-input title"
                    disabled={disabled}
                    {...selectableInputProps(store, titleKey, '타임라인 제목')}
                />
                <EditableText
                    as="textarea"
                    value={item.description}
                    placeholder="설명"
                    onChange={(value) =>
                        store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)
                    }
                    className="custom-input description"
                    disabled={disabled}
                    {...selectableInputProps(store, descKey, '타임라인 설명')}
                />
            </div>
        );
    }

    if (section.template === 'media') {
        const titleKey = `custom.${sectionId}.${item.id}.title`;
        const descKey = `custom.${sectionId}.${item.id}.description`;

        return (
            <div
                className={`custom-item media ${item.imagePosition === 'left' ? 'image-left' : ''} ${
                    item.imagePosition === 'right' ? 'image-right' : ''
                }`}
            >
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
                                onChange={(e) =>
                                    store.actions.updateCustomSectionItem(
                                        sectionId,
                                        item.id,
                                        'imagePosition',
                                        e.target.value
                                    )
                                }
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
                                            store.actions.updateCustomSectionItem(
                                                sectionId,
                                                item.id,
                                                'image',
                                                value
                                            )
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
                        {...selectableInputProps(store, titleKey, '미디어 항목 제목')}
                    />
                    <EditableText
                        as="textarea"
                        value={item.description}
                        placeholder="설명"
                        onChange={(value) =>
                            store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)
                        }
                        className="custom-input description"
                        disabled={disabled}
                        {...selectableInputProps(store, descKey, '미디어 항목 설명')}
                    />
                </div>
            </div>
        );
    }

    return <ComplexProjectItem sectionId={sectionId} item={item} store={store} editable={!disabled} />;
}

export default function CustomSection({ store, section }) {
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor(`section.custom.${section.id}.title`);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const cardSelection = getCardSelectionState(store.selected?.key, 'customCard', [`custom.${section.id}`, `section.custom.${section.id}`]);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={store.actions.sectionCardStyle('customCard')}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'customCard', label: '커스텀 카드' });
            }}
        >
            {cardSelection.selected ? (
                <SelectionBadge label="커스텀 카드 선택됨" tone="card" />
            ) : null}

            <div className="section-head">
                {isEdit ? (
                    <input
                        className="section-title-input"
                        style={titleStyle}
                        value={section.name}
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.select({
                                key: `section.custom.${section.id}.title`,
                                label: `${section.name} 섹션 제목`,
                            });
                        }}
                        onChange={(e) => store.actions.updateCustomSectionMeta(section.id, 'name', e.target.value)}
                    />
                ) : (
                    <h2
                        className="section-title"
                        style={titleStyle}
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.select({
                                key: `section.custom.${section.id}.title`,
                                label: `${section.name} 섹션 제목`,
                            });
                        }}
                    >
                        {section.name}
                    </h2>
                )}

                {isEdit ? (
                    <button
                        type="button"
                        className="ghost small"
                        onClick={() => store.actions.addCustomSectionItem(section.id)}
                    >
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