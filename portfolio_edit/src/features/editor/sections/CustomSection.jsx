import { useEffect, useMemo, useState } from 'react';
import { getCardSelectionState, getCustomItemSelectionState } from '../utils/storeHelpers';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge, selectableInputProps, selectableViewProps } from '../components/editor-primitives/index.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import DragHandle from '../components/drag/DragHandle.jsx';
import ReorderDropOverlay from '../components/drag/ReorderDropOverlay.jsx';
import EditableCollectionItemShell from '../components/item-shells/EditableCollectionItemShell.jsx';
import CustomSimpleItemRenderer from '../components/item-renderers/CustomSimpleItemRenderer.jsx';
import CustomTimelineItemRenderer from '../components/item-renderers/CustomTimelineItemRenderer.jsx';
import CustomMediaItemRenderer from '../components/item-renderers/CustomMediaItemRenderer.jsx';
import CustomComplexItemRenderer from '../components/item-renderers/CustomComplexItemRenderer.jsx';
import CustomComplexProjectItem from '../components/item-renderers/CustomComplexProjectItem.jsx';
import useNativeReorderAdapter from '../hooks/useNativeReorderAdapter.js';
import { DRAG_TYPES } from '../constants/dragTypes.js';
import { SelectionKey } from '../utils/selectionKeys.js';

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
    const itemSelection = getCustomItemSelectionState(store.selected?.key, sectionId, item.id);
    const dragAdapter = useNativeReorderAdapter({
        id: item.id,
        dragType: DRAG_TYPES.customItem,
        draggingId,
        dragOverId,
        setDraggingId,
        setDragOverId,
        enabled: showHelpers,
        tapEnabled: showHelpers && !!store.ui?.isMobile,
        onMove: (fromId, toId) => store.actions.moveCustomSectionItem(sectionId, fromId, toId),
    });
    const isDragging = dragAdapter.isDragging;
    const isDragOver = dragAdapter.isDragOver;
    const itemStyle = {
        gridColumn: `span ${item.colSpan || 6} / span ${item.colSpan || 6}`,
        gridRow: `span ${item.rowSpan || 1} / span ${item.rowSpan || 1}`,
    };

    const helperSlot = showHelpers ? (
        <LayoutChrome
            label={item.title || '아이템'}
            summary={`${item.colSpan || 6} × ${item.rowSpan || 1}`}
            defaultExpanded={false}
            dragHandle={
                <DragHandle handleProps={dragAdapter.dragHandleProps} onClick={dragAdapter.toggleTapArm} />
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

    const overlaySlot = <ReorderDropOverlay active={dragAdapter.showTapOverlay} onClick={dragAdapter.handleTapReorder} />;

    return (
        <EditableCollectionItemShell
            className="custom-item-shell"
            style={itemStyle}
            selectionState={itemSelection}
            isDragging={isDragging}
            isDragOver={isDragOver}
            onClick={(event) => {
                if (dragAdapter.handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: SelectionKey.custom.item(sectionId, item.id), label: `${item.title || '커스텀'} 항목` });
            }}
            dragEvents={dragAdapter.dropTargetProps}
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

function renderItem(section, item, store, disabled) {
    const sectionId = section.id;
    const itemTemplate = item.template || section.template || 'simpleList';

    const sharedProps = { sectionId, item, store, disabled };

    switch (itemTemplate) {
        case 'simpleList':
            return <CustomSimpleItemRenderer {...sharedProps} />;
        case 'timeline':
            return <CustomTimelineItemRenderer {...sharedProps} />;
        case 'media':
            return <CustomMediaItemRenderer {...sharedProps} />;
        default:
            return <CustomComplexItemRenderer {...sharedProps} ComplexItemComponent={CustomComplexProjectItem} />;
    }
}

export default function CustomSection({ store, section }) {
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor(SelectionKey.sectionTitle('custom', section.id));
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const measuredSectionItems = useMeasuredGridItems(section.items || [], (item) => item.id, {
        lockAutoRowSpan: store.mode !== 'edit',
    });
    const resolvedSectionItems = useMemo(() => measuredSectionItems.resolvedItems, [measuredSectionItems.resolvedItems]);
    const cardSelection = getCardSelectionState(store.selected?.key, SelectionKey.card.custom(), [`custom.${section.id}`, `section.custom.${section.id}`]);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={store.actions.sectionCardStyle(SelectionKey.card.custom())}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: SelectionKey.card.custom(), label: '커스텀 카드' });
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
                                key: SelectionKey.sectionTitle('custom', section.id),
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
                                key: SelectionKey.sectionTitle('custom', section.id),
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