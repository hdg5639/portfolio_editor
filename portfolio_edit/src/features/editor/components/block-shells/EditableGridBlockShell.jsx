import LayoutChrome from '../LayoutChrome.jsx';
import LayoutSizeControl from '../../sections/LayoutSizeControl.jsx';

export default function EditableGridBlockShell({
    store,
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
    selectionState,
    shellClassName = 'project-block-shell selection-scope selection-block',
    dragHandleTitleManual = '드래그 후 격자 위치 선택',
    dragHandleTitlePacked = '드래그해서 순서 이동',
    layoutSummary,
    chromeLabel,
    removeLabel = '제거',
    selectOnClick,
    moveItem,
    setItemSpan,
    setItemRowSpan,
    removeItem,
    children,
}) {
    const editable = store.mode === 'edit';
    const showHelpers = editable && store.ui.showEditHelpers;
    const isDragging = draggingId === block.id;
    const isDragOver = layoutMode === 'packed' && dragOverId === block.id && draggingId !== block.id;
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = layoutMode === 'packed' && useTapReorder && !!draggingId && draggingId !== block.id;

    const clearDragState = () => {
        setDraggingId(null);
        setDragOverId(null);
    };

    const armDragHandle = (event) => {
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
    };

    const handleTapReorder = (event) => {
        if (!showTapOverlay) return false;
        event.preventDefault();
        event.stopPropagation();
        moveItem(draggingId, block.id);
        clearDragState();
        return true;
    };

    const onDragStart = (event) => {
        if (!showHelpers) return;
        event.stopPropagation();
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(block.id));
    };

    const onDragOver = (event) => {
        if (layoutMode !== 'packed' || !showHelpers || !draggingId) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverId !== block.id) {
            setDragOverId(block.id);
        }
    };

    const onDrop = (event) => {
        if (layoutMode !== 'packed' || !showHelpers) return;
        event.preventDefault();
        event.stopPropagation();

        const dragged = event.dataTransfer.getData('text/plain') || draggingId;
        if (dragged && dragged !== block.id) {
            moveItem(dragged, block.id);
        }

        clearDragState();
    };

    const onDragEnd = (event) => {
        event.stopPropagation();
        clearDragState();
    };

    return (
        <div
            className={`${shellClassName} span-${block.colSpan || 12} span-r-${block.rowSpan || 1} layout-mode-${layoutMode} ${layoutMode === 'manual' && draggingId === block.id ? 'manual-armed' : ''} ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''} ${selectionState.selected ? 'is-selected' : ''} ${selectionState.ancestor ? 'is-ancestor' : ''}`}
            style={placementStyle}
            onClick={(event) => {
                if (handleTapReorder(event)) return;
                event.stopPropagation();
                selectOnClick();
            }}
            onDragOver={onDragOver}
            onDragLeave={() => {
                if (dragOverId === block.id) setDragOverId(null);
            }}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {showHelpers ? (
                <LayoutChrome
                    label={chromeLabel}
                    summary={layoutSummary}
                    defaultExpanded={false}
                    dragHandle={
                        <div
                            className={`drag-handle ${layoutMode === 'manual' && draggingId === block.id ? 'is-armed' : ''}`}
                            title={layoutMode === 'manual' ? dragHandleTitleManual : dragHandleTitlePacked}
                            draggable
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={armDragHandle}
                        >
                            ⋮⋮
                        </div>
                    }
                    controls={
                        <LayoutSizeControl
                            widthValue={block.colSpan || 12}
                            heightValue={block.rowSpan || 1}
                            minHeightValue={minRowSpan}
                            onWidthChange={(value) => setItemSpan(value, layoutItemsOverride)}
                            onHeightChange={(value) => setItemRowSpan(value, layoutItemsOverride)}
                            compact
                        />
                    }
                    actions={
                        <div className="profile-block-actions">
                            {toolbarActions}
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    removeItem();
                                }}
                            >
                                {removeLabel}
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
