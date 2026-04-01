import { useEffect, useMemo, useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState, getCustomItemSelectionState, getCustomBlockSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge, selectableInputProps, selectableViewProps } from '../components/editor-primitives/index.jsx';
import { readFileAsDataUrl } from '../utils/fileReaders.js';
import ImageRatioToolbar from '../components/block-renderers/ImageRatioToolbar.jsx';
import { CustomComplexImageBlock, CustomComplexListBlock, CustomComplexTextBlock } from '../components/block-renderers/CustomComplexBlockRenderers.jsx';
import { FIXED_RATIO_IMAGE_MEASURE_BIAS, getImageFrameProps } from '../utils/imageBlockLayout.js';
import EditableCollectionItemShell from '../components/item-shells/EditableCollectionItemShell.jsx';

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

    const helperSlot = showHelpers ? (
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
    ) : null;

    const overlaySlot = showTapOverlay ? (
        <button type="button" className="tap-reorder-overlay active" onClick={handleTapReorder}>
            여기로 이동
        </button>
    ) : null;

    return (
        <EditableCollectionItemShell
            className="custom-item-shell"
            style={itemStyle}
            selectionState={itemSelection}
            isDragging={isDragging}
            isDragOver={isDragOver}
            onClick={(event) => {
                if (handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: `custom.${sectionId}.${item.id}`, label: `${item.title || '커스텀'} 항목` });
            }}
            dragEvents={{ onDragOver, onDrop, onDragEnd }}
            helperSlot={helperSlot}
            overlaySlot={overlaySlot}
            measureRef={measureRef}
            body={({ measureRef }) => (
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
            )}
        />
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
    const blockSelection = getCustomBlockSelectionState(store.selected?.key, sectionId, itemId, block.id);

    return (
        <EditableGridBlockShell
            store={store}
            block={block}
            draggingId={draggingId}
            dragOverId={dragOverId}
            setDraggingId={setDraggingId}
            setDragOverId={setDragOverId}
            layoutMode={layoutMode}
            placementStyle={placementStyle}
            measureRef={measureRef}
            measureNode={measureNode}
            fillBody={fillBody}
            measureBias={measureBias}
            minRowSpan={minRowSpan}
            layoutItemsOverride={layoutItemsOverride}
            toolbarActions={toolbarActions}
            selectionState={blockSelection}
            chromeLabel={`${block.type} · ${block.title}`}
            layoutSummary={`${block.colSpan || 12} × ${block.rowSpan || 1}`}
            selectOnClick={() =>
                store.actions.select({ key: `custom.${sectionId}.${itemId}.blocks.${block.id}`, label: `${block.title || block.type} 블럭` })
            }
            moveItem={(fromId, toId) => store.actions.moveCustomComplexBlock(sectionId, itemId, fromId, toId)}
            setItemSpan={(value, itemsOverride) =>
                store.actions.setCustomComplexBlockSpan(sectionId, itemId, block.id, value, itemsOverride)
            }
            setItemRowSpan={(value, itemsOverride) =>
                store.actions.setCustomComplexBlockRowSpan(sectionId, itemId, block.id, value, itemsOverride)
            }
            removeItem={() => store.actions.removeCustomComplexBlock(sectionId, itemId, block.id)}
        >
            {children}
        </EditableGridBlockShell>
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