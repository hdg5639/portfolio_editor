import { useEffect, useMemo, useState } from 'react';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge } from '../components/editor-primitives/index.jsx';
import ProfileBlockShell from '../components/block-shells/ProfileBlockShell.jsx';
import { createProfileBlockMap } from '../components/block-renderers/ProfileBlockEntries.jsx';

export default function ProfileSection({ store }) {
    const { profile } = store.portfolio;
    const isEdit = store.mode === 'edit';
    const cardStyle = store.actions.sectionCardStyle('profileCard');
    const cardSelection = getCardSelectionState(store.selected?.key, 'profileCard', ['profile', 'profileBlock']);

    const [draggingKey, setDraggingKey] = useState(null);
    const [dragOverKey, setDragOverKey] = useState(null);
    const [manualPreviewCell, setManualPreviewCell] = useState(null);
    const [manualLayoutSnapshot, setManualLayoutSnapshot] = useState(null);

    const layoutMode = profile.layoutMode || 'manual';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const measuredProfileLayout = useMeasuredGridItems(profile.layout || [], (item) => item.key, {
        lockAutoRowSpan: store.mode !== 'edit',
    });
    const resolvedProfileLayout = useMemo(() => {
        const visible = measuredProfileLayout.resolvedItems.filter((item) => item.visible !== false);
        const normalizedVisible = layoutMode === 'manual' ? normalizeGridItems(visible) : visible;
        const visibleByKey = new Map(normalizedVisible.map((item) => [item.key, item]));
        return measuredProfileLayout.resolvedItems.map((item) =>
            item.visible === false ? item : (visibleByKey.get(item.key) || item)
        );
    }, [layoutMode, measuredProfileLayout.resolvedItems]);
    useEffect(() => {
        if (layoutMode !== 'manual') {
            if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
            return;
        }

        if (draggingKey) {
            if (!manualLayoutSnapshot) {
                setManualLayoutSnapshot(resolvedProfileLayout.map((item) => ({ ...item })));
            }
            return;
        }

        if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
    }, [draggingKey, layoutMode, manualLayoutSnapshot, resolvedProfileLayout]);

    const previewSourceLayout = layoutMode === 'manual' && manualLayoutSnapshot ? manualLayoutSnapshot : resolvedProfileLayout;
    const visibleBlocks = resolvedProfileLayout.filter((item) => item.visible !== false);
    const previewVisibleBlocks = previewSourceLayout.filter((item) => item.visible !== false);
    const packedPreviewState = layoutMode === 'packed'
        ? getPackedPlacementPreview(visibleBlocks, draggingKey, dragOverKey)
        : null;
    const manualPreviewState = layoutMode === 'manual' && manualPreviewCell
        ? getManualPlacementPreview(previewVisibleBlocks, draggingKey, manualPreviewCell.x, manualPreviewCell.y)
        : null;
    const gridRows = getGridRowExtent(previewVisibleBlocks, packedPreviewState?.preview || manualPreviewState?.preview, 4);
    const blockMap = useMemo(() => createProfileBlockMap({ store, profile, isEdit }), [store, profile, isEdit]);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={cardStyle}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'profileCard', label: '프로필 카드' });
            }}
        >
            {cardSelection.selected ? <SelectionBadge label="프로필 카드 선택됨" tone="card" /> : null}

            <div className="section-head section-head-with-layout-controls">
                <div className="profile-layout-head">
                    <div>
                        <h2 className="section-title" style={store.actions.styleFor('section.profile.title')}>프로필</h2>
                        {isEdit ? <p className="profile-layout-help">핸들 클릭 후 칸 선택 또는 드래그로 배치 가능</p> : null}
                    </div>
                </div>

                {showHelpers ? (
                    <div className="layout-mode-controls no-print">
                        <button
                            type="button"
                            className={`layout-mode-chip ${layoutMode === 'manual' ? 'active' : ''}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                store.actions.setProfileLayoutMode('manual', resolvedProfileLayout);
                                setDragOverKey(null);
                                setManualPreviewCell(null);
                            }}
                        >
                            자유형
                        </button>
                        <button
                            type="button"
                            className={`layout-mode-chip ${layoutMode === 'packed' ? 'active' : ''}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                store.actions.setProfileLayoutMode('packed', resolvedProfileLayout);
                                setDraggingKey(null);
                                setDragOverKey(null);
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
                                store.actions.autoArrangeProfileBlocks(resolvedProfileLayout);
                            }}
                        >
                            자동 정리
                        </button>
                    </div>
                ) : null}
            </div>

            <div className={`profile-layout-grid layout-mode-${layoutMode} ${showHelpers ? 'show-grid-guides' : ''} ${layoutMode === 'manual' && draggingKey ? 'manual-placement-active' : ''}`}>
                {showHelpers ? (
                    <GridPlacementOverlay
                        rows={gridRows}
                        preview={packedPreviewState?.preview || manualPreviewState?.preview}
                        items={previewVisibleBlocks}
                        activeItemId={draggingKey}
                        showOccupiedRanges={layoutMode === 'manual'}
                        active={!!draggingKey}
                        interactive={layoutMode === 'manual' && !!draggingKey}
                        confirmBeforePlace={!!store.ui?.isMobile}
                        isMobileLayout={!!store.ui?.isMobile}
                        onCellEnter={(cell) => {
                            if (layoutMode !== 'manual' || !draggingKey) return;
                            setManualPreviewCell(cell);
                        }}
                        onCellDrop={(cell) => {
                            if (layoutMode !== 'manual' || !draggingKey) return;
                            store.actions.placeProfileBlock(draggingKey, cell.x, cell.y, previewSourceLayout);
                            setDraggingKey(null);
                            setDragOverKey(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onCellClick={(cell, event) => {
                            if (layoutMode !== 'manual' || !draggingKey) return;
                            event.preventDefault();
                            event.stopPropagation();
                            store.actions.placeProfileBlock(draggingKey, cell.x, cell.y, previewSourceLayout);
                            setDraggingKey(null);
                            setDragOverKey(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onCellConfirm={(cell, event) => {
                            if (layoutMode !== 'manual' || !draggingKey) return;
                            event?.preventDefault?.();
                            event?.stopPropagation?.();
                            store.actions.placeProfileBlock(draggingKey, cell.x, cell.y, previewSourceLayout);
                            setDraggingKey(null);
                            setDragOverKey(null);
                            setManualPreviewCell(null);
                            setManualLayoutSnapshot(null);
                        }}
                        onPointerLeave={() => {
                            if (layoutMode === 'manual') setManualPreviewCell(null);
                        }}
                        onCancel={() => {
                            setManualPreviewCell(null);
                            setDraggingKey(null);
                            setDragOverKey(null);
                            setManualLayoutSnapshot(null);
                            store.actions.selectPage();
                        }}
                    />
                ) : null}

                {visibleBlocks.map((block) => {
                    const current = blockMap[block.key];
                    if (!current) return null;
                    return (
                        <ProfileBlockShell
                            key={block.key}
                            store={store}
                            blockKey={block.key}
                            label={current.label || block.label}
                            colSpan={block.colSpan || 12}
                            rowSpan={block.rowSpan || 1}
                            minRowSpan={block.minRowSpan || 1}
                            draggingKey={draggingKey}
                            dragOverKey={dragOverKey}
                            setDraggingKey={setDraggingKey}
                            setDragOverKey={setDragOverKey}
                            layoutMode={layoutMode}
                            placementStyle={getGridItemPlacementStyle(block, layoutMode)}
                            measureRef={measuredProfileLayout.registerMeasureRef(block.key)}
                            layoutItemsOverride={resolvedProfileLayout}
                            actions={current.actions}
                            measureNode={current.measureNode}
                        >
                            {current.node}
                        </ProfileBlockShell>
                    );
                })}
            </div>

            {isEdit ? (
                <>
                    <div className="profile-add-tools">
                        <div className="profile-add-group">
                            <strong>추가 블럭</strong>
                            <div className="profile-add-actions">
                                <button type="button" className="ghost small" onClick={() => store.actions.addProfileExtraBlock('text')}>텍스트 박스</button>
                                <button type="button" className="ghost small" onClick={() => store.actions.addProfileExtraBlock('list')}>리스트 박스</button>
                                <button type="button" className="ghost small" onClick={() => store.actions.addProfileExtraBlock('image')}>이미지 박스</button>
                            </div>
                        </div>
                    </div>

                    <div className="profile-hidden-tools">
                        {(profile.layout || [])
                            .filter((block) => block.visible === false)
                            .map((block) => (
                                <button
                                    key={block.key}
                                    type="button"
                                    className="ghost small"
                                    onClick={() => store.actions.toggleProfileBlock(block.key)}
                                >
                                    {block.label} 다시 표시
                                </button>
                            ))}
                    </div>
                </>
            ) : null}
        </section>
    );
}
