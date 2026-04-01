import LayoutChrome from '../LayoutChrome.jsx';
import LayoutSizeControl from '../../sections/LayoutSizeControl.jsx';
import DragHandle from '../drag/DragHandle.jsx';
import ReorderDropOverlay from '../drag/ReorderDropOverlay.jsx';
import useNativeReorderAdapter from '../../hooks/useNativeReorderAdapter.js';

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
    dragType,
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
    const packedDragAdapter = useNativeReorderAdapter({
        id: block.id,
        dragType,
        draggingId,
        dragOverId,
        setDraggingId,
        setDragOverId,
        enabled: showHelpers && layoutMode === 'packed',
        tapEnabled: showHelpers && !!store.ui?.isMobile && layoutMode === 'packed',
        onMove: moveItem,
    });
    const isDragging = draggingId === block.id;
    const isDragOver = layoutMode === 'packed' && packedDragAdapter.isDragOver;
    const showTapOverlay = layoutMode === 'packed' && packedDragAdapter.showTapOverlay;

    const armDragHandle = (event) => {
        if (layoutMode === 'manual') {
            event.preventDefault();
            event.stopPropagation();
            setDraggingId((current) => (current === block.id ? null : block.id));
            setDragOverId(null);
            return;
        }

        packedDragAdapter.toggleTapArm(event);
    };

    return (
        <div
            className={`${shellClassName} span-${block.colSpan || 12} span-r-${block.rowSpan || 1} layout-mode-${layoutMode} ${layoutMode === 'manual' && draggingId === block.id ? 'manual-armed' : ''} ${
                isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''} ${selectionState.selected ? 'is-selected' : ''} ${selectionState.ancestor ? 'is-ancestor' : ''}`}
            style={placementStyle}
            onClick={(event) => {
                if (packedDragAdapter.handleTapReorder(event)) return;
                event.stopPropagation();
                selectOnClick();
            }}
            {...packedDragAdapter.dropTargetProps}
        >
            {showHelpers ? (
                <LayoutChrome
                    label={chromeLabel}
                    summary={layoutSummary}
                    defaultExpanded={false}
                    dragHandle={
                        <DragHandle
                            title={layoutMode === 'manual' ? dragHandleTitleManual : dragHandleTitlePacked}
                            isArmed={layoutMode === 'manual' && draggingId === block.id}
                            handleProps={{
                                ...packedDragAdapter.dragHandleProps,
                                draggable: showHelpers && layoutMode === 'packed',
                            }}
                            onClick={armDragHandle}
                        />
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

            <ReorderDropOverlay active={showTapOverlay} onClick={packedDragAdapter.handleTapReorder} />

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
