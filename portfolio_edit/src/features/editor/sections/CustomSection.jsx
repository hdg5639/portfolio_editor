import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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



function AutoGrowTextarea({ className = '', value, placeholder, onChange, inputMeta }) {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.style.height = '0px';
        node.style.height = `${node.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value || ''}
            placeholder={placeholder}
            rows={1}
            className={className}
            onChange={(e) => onChange(e.target.value)}
            {...inputMeta}
        />
    );
}


const IMAGE_RATIO_OPTIONS = [
    { value: 'custom', label: 'Custom' },
    { value: '1:1', label: '1:1' },
    { value: '3:2', label: '3:2' },
    { value: '2:3', label: '2:3' },
    { value: '4:3', label: '4:3' },
    { value: '16:10', label: '16:10' },
    { value: '16:9', label: '16:9' },
];

const FIXED_RATIO_IMAGE_MEASURE_BIAS = 16;

function parsePositiveRatioPart(value, fallback = 1) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function getImageAreaRatioValue(ratioOption, customWidth = 1, customHeight = 1) {
    switch (ratioOption) {
        case '1:1':
            return '1 / 1';
        case '3:2':
            return '3 / 2';
        case '2:3':
            return '2 / 3';
        case '4:3':
            return '4 / 3';
        case '16:10':
            return '16 / 10';
        case '16:9':
            return '16 / 9';
        case 'custom': {
            const width = parsePositiveRatioPart(customWidth);
            const height = parsePositiveRatioPart(customHeight);
            return `${width} / ${height}`;
        }
        default:
            return null;
    }
}

function getImageFrameProps(block) {
    const ratioOption = block.imageAspectRatio || 'custom';
    const customWidth = block.imageCustomRatioWidth ?? 1;
    const customHeight = block.imageCustomRatioHeight ?? 1;
    const ratioValue = getImageAreaRatioValue(ratioOption, customWidth, customHeight);

    return {
        ratioOption,
        hasFixedRatio: !!ratioValue,
        customWidth: parsePositiveRatioPart(customWidth),
        customHeight: parsePositiveRatioPart(customHeight),
        style: ratioValue ? { '--project-image-area-ratio': ratioValue } : undefined,
    };
}

function getImageGridLayoutStyle(block) {
    const slotCount = Math.max(1, block.images?.length || 0);
    const colSpan = Number(block.colSpan) || 12;

    const maxColumns = colSpan >= 9 ? 3 : colSpan >= 5 ? 2 : 1;
    const columns = Math.max(1, Math.min(slotCount, maxColumns));
    const rows = Math.max(1, Math.ceil(slotCount / columns));

    return {
        '--image-grid-columns': columns,
        '--image-grid-rows': rows,
    };
}

function ImageRatioToolbar({
    ratioOption,
    customWidth,
    customHeight,
    onRatioChange,
    onCustomWidthChange,
    onCustomHeightChange,
}) {
    return (
        <div className="image-ratio-toolbar" onClick={(e) => e.stopPropagation()}>
            <label className="image-ratio-control">
                <span>이미지 비율</span>
                <select value={ratioOption} onChange={(e) => onRatioChange(e.target.value)}>
                    {IMAGE_RATIO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>
            {ratioOption === 'custom' ? (
                <div className="image-ratio-custom-fields">
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={customWidth}
                        aria-label="커스텀 이미지 비율 가로"
                        onChange={(e) => onCustomWidthChange(e.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={customHeight}
                        aria-label="커스텀 이미지 비율 세로"
                        onChange={(e) => onCustomHeightChange(e.target.value)}
                    />
                </div>
            ) : null}
        </div>
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
                       measureRef,
                       minRowSpan,
                       children,
                   }) {
    const isEdit = store.mode === 'edit';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const isDragging = draggingId === item.id;
    const isDragOver = dragOverId === item.id && draggingId !== item.id;
    const itemSelection = getCustomItemSelectionState(store.selected?.key, sectionId, item.id);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = useTapReorder && !!draggingId && draggingId !== item.id;
    const itemStyle = {
        gridColumn: `span ${item.colSpan || 6} / span ${item.colSpan || 6}`,
        gridRow: `span ${item.rowSpan || 1} / span ${item.rowSpan || 1}`,
    };

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
            className={`custom-item-shell selection-scope selection-item ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''} ${itemSelection.selected ? 'is-selected' : ''} ${itemSelection.ancestor ? 'is-ancestor' : ''}` }
            style={itemStyle}
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
                    defaultExpanded={false}
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
                            minHeightValue={minRowSpan}
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
                <article className="project-card-inner custom-item-card">
                    <div className="layout-item-measure" ref={measureRef}>
                        {children}
                        {isEdit ? (
                            <div className="custom-item-footer-actions">
                                <button
                                    type="button"
                                    className="ghost danger small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        store.actions.removeCustomSectionItem(sectionId, item.id);
                                    }}
                                >
                                    항목 삭제
                                </button>
                            </div>
                        ) : null}
                    </div>
                </article>
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
                               measureNode = null,
                               fillBody = false,
                               measureBias = 0,
                               minRowSpan,
                               layoutItemsOverride,
                               toolbarActions,
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
            className={`project-block-shell selection-scope selection-block span-${block.colSpan || 12} span-r-${block.rowSpan || 1} layout-mode-${layoutMode} ${layoutMode === 'manual' && draggingId === block.id ? 'manual-armed' : ''} ${
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
                    defaultExpanded={false}
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
                            {toolbarActions}
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
                {measureNode ? (
                    <div
                        className="layout-item-measure-probe"
                        ref={measureRef}
                        data-layout-measure-bias={measureBias || undefined}
                        aria-hidden="true"
                    >
                        {measureNode}
                    </div>
                ) : null}
                <div
                    className={`layout-item-measure${fillBody ? ' fill-height' : ''}`}
                    ref={measureNode ? null : measureRef}
                    data-layout-measure-bias={measureBias || undefined}
                >
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
        <div className="project-inner-card project-image-block-card">
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
        <div className="project-inner-card project-image-block-card">
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

function ComplexImageBlock({store, sectionId, itemId, block, editable, fillHeight = false, measureOnly = false}) {
    const titleKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.title`;
    const captionKey = `custom.${sectionId}.${itemId}.blocks.${block.id}.caption`;
    const imageGridStyle = useMemo(() => getImageGridLayoutStyle(block), [block.colSpan, block.images]);
    const imageFrame = useMemo(() => getImageFrameProps(block), [block.imageAspectRatio, block.imageCustomRatioWidth, block.imageCustomRatioHeight]);

    const imageGrid = (mode = 'edit') => (
        <div
            className={`project-image-frame${imageFrame.hasFixedRatio ? ' has-fixed-ratio' : ''}${mode === 'measure' ? ' is-measure' : ''}`}
            style={imageFrame.style}
        >
            <div className="project-image-grid" style={imageGridStyle}>
                {(block.images || []).map((image, index) => {
                    if (mode === 'preview') {
                        if (!image) return null;
                        return (
                            <div key={`${block.id}-img-${index}`} className="project-image-slot">
                                <img src={image} alt={block.title || 'custom'} />
                            </div>
                        );
                    }

                    if (mode === 'measure') {
                        return (
                            <div key={`${block.id}-probe-img-${index}`} className="project-image-editor-slot">
                                <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                    {image ? (
                                        <img src={image} alt={block.title || 'custom'} />
                                    ) : (
                                        <div className="project-image-placeholder">IMAGE</div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    const inputId = `custom-image-${sectionId}-${itemId}-${block.id}-${index}`;
                    return (
                        <div key={`${block.id}-img-${index}`} className="project-image-editor-slot">
                            <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                {image ? (
                                    <img src={image} alt={block.title || 'custom'} />
                                ) : (
                                    <div className="project-image-placeholder">IMAGE</div>
                                )}
                                <div className="project-image-slot-actions inside">
                                    <label
                                        htmlFor={inputId}
                                        className="ghost small upload-label"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {image ? '이미지 변경' : '이미지 업로드'}
                                    </label>
                                    <input
                                        id={inputId}
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
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
                                            e.target.value = '';
                                        }}
                                    />
                                    {image ? (
                                        <button
                                            type="button"
                                            className="ghost small project-image-clear-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                store.actions.updateCustomComplexImage(sectionId, itemId, block.id, index, '');
                                            }}
                                        >
                                            이미지 삭제
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="ghost danger small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            store.actions.removeCustomComplexImage(sectionId, itemId, block.id, index);
                                        }}
                                    >
                                        슬롯 제거
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (measureOnly) {
        return (
            <div className="project-inner-card project-image-block-card">
                {editable ? (
                    <>
                        <div className="custom-input title">{block.title || ' '}</div>
                        {imageGrid('measure')}
                        <div className="custom-input subtitle">{block.caption || ' '}</div>
                    </>
                ) : (
                    <>
                        <h4>{block.title}</h4>
                        {imageGrid('preview')}
                        {block.caption ? <p className="project-caption">{block.caption}</p> : null}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`project-inner-card project-image-block-card${fillHeight ? ' fill-height' : ''}${imageFrame.hasFixedRatio ? ' fixed-image-ratio' : ''}`}>
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
                    {imageGrid('edit')}
                    <AutoGrowTextarea
                        value={block.caption || ''}
                        placeholder="이미지 캡션"
                        inputMeta={selectableInputProps(store, captionKey, '복합 이미지 블록 캡션')}
                        onChange={(value) =>
                            store.actions.updateCustomComplexBlock(
                                sectionId,
                                itemId,
                                block.id,
                                'caption',
                                value
                            )
                        }
                        className="custom-input subtitle project-image-caption-input"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '복합 이미지 블록 제목')}>{block.title}</h4>
                    {imageGrid('preview')}
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
    const [manualLayoutSnapshot, setManualLayoutSnapshot] = useState(null);

    const titleKey = `custom.${sectionId}.${item.id}.title`;
    const subtitleKey = `custom.${sectionId}.${item.id}.subtitle`;
    const dateKey = `custom.${sectionId}.${item.id}.date`;
    const summaryKey = `custom.${sectionId}.${item.id}.summary`;
    const linkKey = `custom.${sectionId}.${item.id}.link`;
    const blockLayoutMode = item.layoutMode || 'manual';
    const measuredComplexBlocks = useMeasuredGridItems(item.blocks || [], (block) => block.id, {
        lockAutoRowSpan: store.mode !== 'edit',
    });
    const resolvedComplexBlocks = useMemo(() => {
        const normalized = blockLayoutMode === 'manual' ? normalizeGridItems(measuredComplexBlocks.resolvedItems) : measuredComplexBlocks.resolvedItems;
        return normalized;
    }, [blockLayoutMode, measuredComplexBlocks.resolvedItems]);
    useEffect(() => {
        if (blockLayoutMode !== 'manual') {
            if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
            return;
        }

        if (draggingBlockId) {
            if (!manualLayoutSnapshot) {
                setManualLayoutSnapshot(resolvedComplexBlocks.map((block) => ({ ...block })));
            }
            return;
        }

        if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
    }, [blockLayoutMode, draggingBlockId, manualLayoutSnapshot, resolvedComplexBlocks]);

    const previewSourceBlocks = blockLayoutMode === 'manual' && manualLayoutSnapshot ? manualLayoutSnapshot : resolvedComplexBlocks;
    const blockPreviewPacked = blockLayoutMode === 'packed'
        ? getPackedPlacementPreview(resolvedComplexBlocks, draggingBlockId, dragOverBlockId)
        : null;
    const blockPreviewManual = blockLayoutMode === 'manual' && manualPreviewCell
        ? getManualPlacementPreview(previewSourceBlocks, draggingBlockId, manualPreviewCell.x, manualPreviewCell.y)
        : null;
    const blockGridRows = getGridRowExtent(previewSourceBlocks, blockPreviewPacked?.preview || blockPreviewManual?.preview, 4);

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
                                setManualLayoutSnapshot(null);
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
                                setManualLayoutSnapshot(null);
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
                        items={previewSourceBlocks.filter((block) => block.visible !== false)}
                        activeItemId={draggingBlockId}
                        showOccupiedRanges={blockLayoutMode === 'manual'}
                        active={!!draggingBlockId}
                        interactive={blockLayoutMode === 'manual' && !!draggingBlockId}
                        confirmBeforePlace={!!store.ui?.isMobile}
                        isMobileLayout={!!store.ui?.isMobile}
                        onCellEnter={(cell) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            setManualPreviewCell(cell);
                        }}
                        onCellDrop={(cell) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, previewSourceBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onCellClick={(cell, event) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            event.preventDefault();
                            event.stopPropagation();
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, previewSourceBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onCellConfirm={(cell, event) => {
                            if (blockLayoutMode !== 'manual' || !draggingBlockId) return;
                            event?.preventDefault?.();
                            event?.stopPropagation?.();
                            store.actions.placeCustomComplexBlock(sectionId, item.id, draggingBlockId, cell.x, cell.y, previewSourceBlocks);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onPointerLeave={() => {
                            if (blockLayoutMode === 'manual') setManualPreviewCell(null);
                        }}
                        onCancel={() => {
                            setManualPreviewCell(null);
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                            setManualLayoutSnapshot(null);
                            store.actions.selectPage();
                        }}
                    />
                ) : null}

                {resolvedComplexBlocks.map((block) => {
                    const toolbarActions = editable
                        ? block.type === 'list'
                            ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        store.actions.addCustomComplexListItem(sectionId, item.id, block.id);
                                    }}
                                >
                                    리스트 항목 추가
                                </button>
                            )
                            : block.type === 'image'
                                ? (
                                    <>
                                        <ImageRatioToolbar
                                            ratioOption={block.imageAspectRatio || 'custom'}
                                            customWidth={block.imageCustomRatioWidth ?? 1}
                                            customHeight={block.imageCustomRatioHeight ?? 1}
                                            onRatioChange={(nextValue) => {
                                                store.actions.updateCustomComplexBlock(sectionId, item.id, block.id, 'imageAspectRatio', nextValue);
                                                if (nextValue !== 'custom') {
                                                    store.actions.setCustomComplexBlockRowSpan(sectionId, item.id, block.id, 1, resolvedComplexBlocks);
                                                }
                                            }}
                                            onCustomWidthChange={(value) =>
                                                store.actions.updateCustomComplexBlock(sectionId, item.id, block.id, 'imageCustomRatioWidth', value)
                                            }
                                            onCustomHeightChange={(value) =>
                                                store.actions.updateCustomComplexBlock(sectionId, item.id, block.id, 'imageCustomRatioHeight', value)
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                store.actions.addCustomComplexImage(sectionId, item.id, block.id);
                                            }}
                                        >
                                            이미지 슬롯 추가
                                        </button>
                                    </>
                                )
                                : null
                        : null;

                    const isImageBlock = block.type === 'image';
                    const imageFrameProps = isImageBlock ? getImageFrameProps(block) : null;
                    const shouldFillImageBlock = !!(isImageBlock && imageFrameProps && !imageFrameProps.hasFixedRatio);
                    const measureBias = isImageBlock && imageFrameProps?.hasFixedRatio ? FIXED_RATIO_IMAGE_MEASURE_BIAS : 0;
                    const blockNode = block.type === 'text'
                        ? (
                            <ComplexTextBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                            />
                        ) : block.type === 'list'
                            ? (
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
                                    fillHeight={shouldFillImageBlock}
                                />
                            );
                    const measureNode = shouldFillImageBlock
                        ? (
                            <ComplexImageBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                                measureOnly
                            />
                        )
                        : null;

                    return (
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
                        measureNode={measureNode}
                        fillBody={shouldFillImageBlock}
                        measureBias={measureBias}
                        minRowSpan={block.minRowSpan || 1}
                        layoutItemsOverride={resolvedComplexBlocks}
                        toolbarActions={toolbarActions}
                    >
                        {blockNode}
                    </ComplexBlockShell>
                    );
                })}
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
    const itemTemplate = item.template || section.template || 'simpleList';

    if (itemTemplate === 'simpleList') {
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

    if (itemTemplate === 'timeline') {
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

    if (itemTemplate === 'media') {
        const titleKey = `custom.${sectionId}.${item.id}.title`;
        const descKey = `custom.${sectionId}.${item.id}.description`;

        return (
            <div className="custom-item media media-stack">
                {item.image || !disabled ? (
                    <div className={`custom-media-preview ${item.image ? 'has-image' : 'is-empty'}`}>
                        {item.image ? (
                            <img src={item.image} alt={item.title || 'custom'} />
                        ) : (
                            <div className="project-image-placeholder">IMAGE</div>
                        )}
                        {!disabled ? (
                            <div className="custom-media-preview-actions" onClick={(e) => e.stopPropagation()}>
                                <label className="ghost small upload-label">
                                    {item.image ? '이미지 변경' : '이미지 업로드'}
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            const file = e.target.files?.[0];
                                            readFileAsDataUrl(file, (value) =>
                                                store.actions.updateCustomSectionItem(
                                                    sectionId,
                                                    item.id,
                                                    'image',
                                                    value
                                                )
                                            );
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                                {item.image ? (
                                    <button
                                        type="button"
                                        className="ghost small project-image-clear-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            store.actions.updateCustomSectionItem(sectionId, item.id, 'image', '');
                                        }}
                                    >
                                        이미지 삭제
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="custom-media-body">
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
    const measuredSectionItems = useMeasuredGridItems(section.items || [], (item) => item.id, {
        lockAutoRowSpan: store.mode !== 'edit',
    });
    const resolvedSectionItems = useMemo(() => measuredSectionItems.resolvedItems, [measuredSectionItems.resolvedItems]);
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
                {resolvedSectionItems.map((item) => (
                    <ItemShell
                        key={item.id}
                        store={store}
                        sectionId={section.id}
                        item={item}
                        draggingId={draggingId}
                        dragOverId={dragOverId}
                        setDraggingId={setDraggingId}
                        setDragOverId={setDragOverId}
                        measureRef={measuredSectionItems.registerMeasureRef(item.id)}
                        minRowSpan={measuredSectionItems.minRowSpanById[item.id]}
                    >
                        {renderItem(section, item, store, !isEdit)}
                    </ItemShell>
                ))}
            </div>
        </section>
    );
}