import { useEffect, useMemo, useState } from 'react';
import { getCardSelectionState, getCustomItemSelectionState } from '../utils/storeHelpers';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge, selectableInputProps, selectableViewProps } from '../components/editor-primitives/index.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import EditableCollectionItemShell from '../components/item-shells/EditableCollectionItemShell.jsx';
import CustomSimpleItemRenderer from '../components/item-renderers/CustomSimpleItemRenderer.jsx';
import CustomTimelineItemRenderer from '../components/item-renderers/CustomTimelineItemRenderer.jsx';
import CustomMediaItemRenderer from '../components/item-renderers/CustomMediaItemRenderer.jsx';
import CustomComplexItemRenderer from '../components/item-renderers/CustomComplexItemRenderer.jsx';
import CustomComplexProjectItem from '../components/item-renderers/CustomComplexProjectItem.jsx';

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