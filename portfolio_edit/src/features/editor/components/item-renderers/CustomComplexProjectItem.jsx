import { useEffect, useMemo, useState } from 'react';
import GridPlacementOverlay from '../GridPlacementOverlay.jsx';
import LayoutChrome from '../LayoutChrome.jsx';
import LayoutSizeControl from '../../sections/LayoutSizeControl.jsx';
import ImageRatioToolbar from '../block-renderers/ImageRatioToolbar.jsx';
import { CustomComplexImageBlock, CustomComplexListBlock, CustomComplexTextBlock } from '../block-renderers/CustomComplexBlockRenderers.jsx';
import EditableGridBlockShell from '../block-shells/EditableGridBlockShell.jsx';
import useMeasuredGridItems from '../../hooks/useMeasuredGridItems.js';
import { selectableInputProps, selectableViewProps } from '../editor-primitives/index.jsx';
import { FIXED_RATIO_IMAGE_MEASURE_BIAS, getImageFrameProps } from '../../utils/imageBlockLayout.js';
import { getCustomBlockSelectionState } from '../../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../../utils/layoutGrid.js';
import { DRAG_TYPES } from '../../constants/dragTypes.js';
import { SelectionKey } from '../../utils/selectionKeys.js';

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
            dragType={DRAG_TYPES.customComplexBlock}
            chromeLabel={`${block.type} · ${block.title}`}
            layoutSummary={`${block.colSpan || 12} × ${block.rowSpan || 1}`}
            selectOnClick={() =>
                store.actions.select({ key: SelectionKey.custom.block(sectionId, itemId, block.id), label: `${block.title || block.type} 블럭` })
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

export default function CustomComplexProjectItem({ sectionId, item, store, editable }) {
    const [draggingBlockId, setDraggingBlockId] = useState(null);
    const [dragOverBlockId, setDragOverBlockId] = useState(null);
    const [manualPreviewCell, setManualPreviewCell] = useState(null);
    const [manualLayoutSnapshot, setManualLayoutSnapshot] = useState(null);

    const titleKey = SelectionKey.custom.field(sectionId, item.id, 'title');
    const subtitleKey = SelectionKey.custom.field(sectionId, item.id, 'subtitle');
    const dateKey = SelectionKey.custom.field(sectionId, item.id, 'date');
    const summaryKey = SelectionKey.custom.field(sectionId, item.id, 'summary');
    const linkKey = SelectionKey.custom.field(sectionId, item.id, 'link');
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
                        const techKey = SelectionKey.custom.tech(sectionId, item.id, index);
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
                        const techKey = SelectionKey.custom.tech(sectionId, item.id, index);
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
                            <CustomComplexTextBlock
                                store={store}
                                sectionId={sectionId}
                                itemId={item.id}
                                block={block}
                                editable={editable}
                            />
                        ) : block.type === 'list'
                            ? (
                                <CustomComplexListBlock
                                    store={store}
                                    sectionId={sectionId}
                                    itemId={item.id}
                                    block={block}
                                    editable={editable}
                                />
                            ) : (
                                <CustomComplexImageBlock
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
                            <CustomComplexImageBlock
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
