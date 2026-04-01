import LayoutChrome from '../LayoutChrome.jsx';
import LayoutSizeControl from '../../sections/LayoutSizeControl.jsx';
import DragHandle from '../drag/DragHandle.jsx';
import ReorderDropOverlay from '../drag/ReorderDropOverlay.jsx';
import useNativeReorderAdapter from '../../hooks/useNativeReorderAdapter.js';
import { DRAG_TYPES } from '../../constants/dragTypes.js';
import { getProfileBlockSelectionState } from '../../utils/storeHelpers.js';

export default function ProfileBlockShell({
    store,
    blockKey,
    label,
    colSpan,
    rowSpan,
    draggingKey,
    dragOverKey,
    setDraggingKey,
    setDragOverKey,
    layoutMode,
    placementStyle,
    measureRef,
    minRowSpan,
    layoutItemsOverride,
    actions,
    measureNode,
    children,
}) {
    const isEdit = store.mode === 'edit';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const blockSelection = getProfileBlockSelectionState(store.selected?.key, blockKey);
    const packedDragAdapter = useNativeReorderAdapter({
        id: blockKey,
        dragType: DRAG_TYPES.profileBlock,
        draggingId: draggingKey,
        dragOverId: dragOverKey,
        setDraggingId: setDraggingKey,
        setDragOverId: setDragOverKey,
        enabled: showHelpers && layoutMode === 'packed',
        tapEnabled: showHelpers && !!store.ui?.isMobile && layoutMode === 'packed',
        onMove: (fromId, toId) => store.actions.moveProfileBlock(fromId, toId),
    });
    const isDragging = draggingKey === blockKey;
    const isDragOver = layoutMode === 'packed' && packedDragAdapter.isDragOver;
    const showTapOverlay = layoutMode === 'packed' && packedDragAdapter.showTapOverlay;

    const armDragHandle = (event) => {
        if (layoutMode === 'manual') {
            event.preventDefault();
            event.stopPropagation();
            setDraggingKey((current) => (current === blockKey ? null : blockKey));
            setDragOverKey(null);
            return;
        }

        packedDragAdapter.toggleTapArm(event);
    };

    return (
        <div
            className={`profile-layout-item selection-scope selection-block span-${colSpan} span-r-${rowSpan} layout-mode-${layoutMode} ${layoutMode === 'manual' && draggingKey === blockKey ? 'manual-armed' : ''} ${isDragging ? 'dragging' : ''} ${
                isDragOver ? 'drag-over' : ''
            } ${blockSelection.selected ? 'is-selected' : ''} ${blockSelection.ancestor ? 'is-ancestor' : ''}`}
            style={placementStyle}
            onClick={(event) => {
                if (packedDragAdapter.handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: `profileBlock.${blockKey}`, label: `${label} 블럭` });
            }}
            {...packedDragAdapter.dropTargetProps}
        >
            {showHelpers ? (
                <LayoutChrome
                    label={label}
                    summary={`${colSpan} × ${rowSpan}`}
                    defaultExpanded={false}
                    dragHandle={
                        <DragHandle
                            title={layoutMode === 'manual' ? '드래그 후 격자 위치 선택' : '드래그해서 순서 이동'}
                            isArmed={layoutMode === 'manual' && draggingKey === blockKey}
                            handleProps={{
                                ...packedDragAdapter.dragHandleProps,
                                draggable: showHelpers && layoutMode === 'packed',
                            }}
                            onClick={armDragHandle}
                        />
                    }
                    controls={
                        <LayoutSizeControl
                            widthValue={colSpan}
                            heightValue={rowSpan}
                            minHeightValue={minRowSpan}
                            onWidthChange={(value) => store.actions.setProfileBlockSpan(blockKey, value, layoutItemsOverride)}
                            onHeightChange={(value) => store.actions.setProfileBlockRowSpan(blockKey, value, layoutItemsOverride)}
                            compact
                        />
                    }
                    actions={actions}
                />
            ) : null}

            <ReorderDropOverlay active={showTapOverlay} onClick={packedDragAdapter.handleTapReorder} />

            <div className="layout-item-body">
                {measureNode ? (
                    <div className="layout-item-measure-probe" ref={measureRef} aria-hidden="true">
                        {measureNode}
                    </div>
                ) : null}
                <div className="layout-item-measure" ref={measureNode ? null : measureRef}>
                    {children}
                </div>
            </div>
        </div>
    );
}
