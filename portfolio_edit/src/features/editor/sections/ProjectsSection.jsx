import { useEffect, useMemo, useState } from 'react';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState, getProjectSelectionState, getProjectBlockSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge, selectableInputProps, selectableViewProps } from '../components/editor-primitives/index.jsx';
import EditableGridBlockShell from '../components/block-shells/EditableGridBlockShell.jsx';
import EditableCollectionItemShell from '../components/item-shells/EditableCollectionItemShell.jsx';
import ImageRatioToolbar from '../components/block-renderers/ImageRatioToolbar.jsx';
import { ProjectImageBlock, ProjectListBlock, ProjectTextBlock } from '../components/block-renderers/ProjectBlockRenderers.jsx';
import { FIXED_RATIO_IMAGE_MEASURE_BIAS, getImageFrameProps } from '../utils/imageBlockLayout.js';

function BlockShell({
                        store,
                        projectId,
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
    const blockSelection = getProjectBlockSelectionState(store.selected?.key, projectId, block.id);

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
                store.actions.select({ key: `projects.${projectId}.blocks.${block.id}`, label: `${block.title || '프로젝트'} 블럭` })
            }
            moveItem={(fromId, toId) => store.actions.moveProjectBlock(projectId, fromId, toId)}
            setItemSpan={(value, itemsOverride) =>
                store.actions.setProjectBlockSpan(projectId, block.id, value, itemsOverride)
            }
            setItemRowSpan={(value, itemsOverride) =>
                store.actions.setProjectBlockRowSpan(projectId, block.id, value, itemsOverride)
            }
            removeItem={() => store.actions.removeProjectBlock(projectId, block.id)}
        >
            {children}
        </EditableGridBlockShell>
    );
}

export default function ProjectsSection({ store }) {
    const cardStyle = store.actions.sectionCardStyle('projectsCard');
    const isEdit = store.mode === 'edit';
    const titleStyle = store.actions.styleFor('section.projects.title');
    const cardSelection = getCardSelectionState(store.selected?.key, 'projectsCard', ['projects', 'section.projects']);
    const [draggingProjectId, setDraggingProjectId] = useState(null);
    const [dragOverProjectId, setDragOverProjectId] = useState(null);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={cardStyle}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({key: 'projectsCard', label: '프로젝트 카드'});
            }}
        >
            {cardSelection.selected ? (
                <SelectionBadge label="프로젝트 카드 선택됨" tone="card" />
            ) : null}

            <div className="section-head">
                <h2
                    className="section-title"
                    style={titleStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        store.actions.select({ key: 'section.projects.title', label: '프로젝트 섹션 제목' });
                    }}
                >
                    프로젝트
                </h2>
            </div>

            <div className="projects-list">
                {store.portfolio.projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        store={store}
                        editable={isEdit}
                        draggingProjectId={draggingProjectId}
                        dragOverProjectId={dragOverProjectId}
                        setDraggingProjectId={setDraggingProjectId}
                        setDragOverProjectId={setDragOverProjectId}
                    />
                ))}
            </div>
        </section>
    );
}

function ProjectCard({
                         project,
                         store,
                         editable,
                         draggingProjectId,
                         dragOverProjectId,
                         setDraggingProjectId,
                         setDragOverProjectId,
                     }) {
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [manualPreviewCell, setManualPreviewCell] = useState(null);
    const [manualLayoutSnapshot, setManualLayoutSnapshot] = useState(null);

    const titleKey = `projects.${project.id}.title`;
    const roleKey = `projects.${project.id}.role`;
    const periodKey = `projects.${project.id}.period`;
    const summaryKey = `projects.${project.id}.summary`;
    const linkKey = `projects.${project.id}.link`;

    const showHelpers = editable && store.ui.showEditHelpers;
    const isProjectDragging = draggingProjectId === project.id;
    const isProjectDragOver = dragOverProjectId === project.id && draggingProjectId !== project.id;

    const isProjectCardDragEvent = (event) =>
        Array.from(event.dataTransfer?.types || []).includes('application/x-project-card');

    const showProjectDropOverlay = showHelpers && !!draggingProjectId && draggingProjectId !== project.id;
    const projectSelection = getProjectSelectionState(store.selected?.key, project.id);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const blockLayoutMode = project.layoutMode || 'manual';
    const measuredProjectBlocks = useMeasuredGridItems(project.blocks || [], (block) => block.id, {
        lockAutoRowSpan: store.mode !== 'edit',
    });
    const resolvedProjectBlocks = useMemo(() => {
        const normalized = blockLayoutMode === 'manual' ? normalizeGridItems(measuredProjectBlocks.resolvedItems) : measuredProjectBlocks.resolvedItems;
        return normalized;
    }, [blockLayoutMode, measuredProjectBlocks.resolvedItems]);
    useEffect(() => {
        if (blockLayoutMode !== 'manual') {
            if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
            return;
        }

        if (draggingId) {
            if (!manualLayoutSnapshot) {
                setManualLayoutSnapshot(resolvedProjectBlocks.map((block) => ({ ...block })));
            }
            return;
        }

        if (manualLayoutSnapshot) setManualLayoutSnapshot(null);
    }, [blockLayoutMode, draggingId, manualLayoutSnapshot, resolvedProjectBlocks]);

    const previewSourceBlocks = blockLayoutMode === 'manual' && manualLayoutSnapshot ? manualLayoutSnapshot : resolvedProjectBlocks;
    const blockPreviewPacked = blockLayoutMode === 'packed'
        ? getPackedPlacementPreview(resolvedProjectBlocks, draggingId, dragOverId)
        : null;
    const blockPreviewManual = blockLayoutMode === 'manual' && manualPreviewCell
        ? getManualPlacementPreview(previewSourceBlocks, draggingId, manualPreviewCell.x, manualPreviewCell.y)
        : null;
    const blockGridRows = getGridRowExtent(previewSourceBlocks, blockPreviewPacked?.preview || blockPreviewManual?.preview, 4);

    const helperSlot = showHelpers ? (
        <div className="project-card-toolbar project-card-toolbar-wrap">
            <div
                className="drag-handle"
                draggable
                title="프로젝트 카드 순서 변경"
                onDragStart={(event) => {
                    event.stopPropagation();
                    setDraggingProjectId(project.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('application/x-project-card', String(project.id));
                }}
                onDragEnd={(event) => {
                    event.stopPropagation();
                    setDraggingProjectId(null);
                    setDragOverProjectId(null);
                }}
                onClick={(event) => {
                    if (!useTapReorder) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDraggingProjectId((current) => (current === project.id ? null : project.id));
                    setDragOverProjectId(null);
                }}
            >
                ⋮⋮
            </div>

            <strong>{project.title || '프로젝트'}</strong>

            <div className="layout-mode-controls compact no-print">
                <button
                    type="button"
                    className={`layout-mode-chip ${blockLayoutMode === 'manual' ? 'active' : ''}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        store.actions.setProjectLayoutMode(project.id, 'manual', resolvedProjectBlocks);
                        setDragOverId(null);
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
                        store.actions.setProjectLayoutMode(project.id, 'packed', resolvedProjectBlocks);
                        setDraggingId(null);
                        setDragOverId(null);
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
                        store.actions.autoArrangeProjectBlocks(project.id, resolvedProjectBlocks);
                    }}
                >
                    자동 정리
                </button>
            </div>
        </div>
    ) : null;

    const overlaySlot = showProjectDropOverlay ? (
        <div
            className={`project-card-drop-overlay ${(isProjectDragOver || useTapReorder) ? 'active' : ''}`}
            onDragOver={(event) => {
                if (!isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = 'move';

                if (dragOverProjectId !== project.id) {
                    setDragOverProjectId(project.id);
                }
            }}
            onDrop={(event) => {
                if (!isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();

                const dragged = event.dataTransfer.getData('application/x-project-card') || draggingProjectId;

                if (dragged && dragged !== project.id) {
                    store.actions.moveProject(dragged, project.id);
                }

                setDraggingProjectId(null);
                setDragOverProjectId(null);
            }}
            onClick={(event) => {
                if (!useTapReorder || !draggingProjectId || draggingProjectId === project.id) return;
                event.preventDefault();
                event.stopPropagation();
                store.actions.moveProject(draggingProjectId, project.id);
                setDraggingProjectId(null);
                setDragOverProjectId(null);
            }}
        >
            {useTapReorder ? <span>여기로 이동</span> : null}
        </div>
    ) : null;

    return (
        <EditableCollectionItemShell
            as="article"
            className="portfolio-card project-card-inner"
            selectionState={projectSelection}
            isDragging={isProjectDragging}
            isDragOver={isProjectDragOver}
            onClick={(event) => {
                if (useTapReorder && draggingProjectId && draggingProjectId !== project.id) {
                    event.preventDefault();
                    event.stopPropagation();
                    store.actions.moveProject(draggingProjectId, project.id);
                    setDraggingProjectId(null);
                    setDragOverProjectId(null);
                    return;
                }
                event.stopPropagation();
                store.actions.select({ key: `projects.${project.id}`, label: `${project.title || '프로젝트'} 항목` });
            }}
            dragEvents={{
                onDragEnterCapture: (event) => {
                    if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (dragOverProjectId !== project.id) setDragOverProjectId(project.id);
                },
                onDragOverCapture: (event) => {
                    if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'move';
                    if (dragOverProjectId !== project.id) setDragOverProjectId(project.id);
                },
                onDragLeaveCapture: (event) => {
                    if (!isProjectCardDragEvent(event)) return;
                    const nextTarget = event.relatedTarget;
                    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                    if (dragOverProjectId === project.id) setDragOverProjectId(null);
                },
                onDropCapture: (event) => {
                    if (!showHelpers || !isProjectCardDragEvent(event)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const dragged = event.dataTransfer.getData('application/x-project-card') || draggingProjectId;
                    if (dragged && dragged !== project.id) {
                        store.actions.moveProject(dragged, project.id);
                    }
                    setDraggingProjectId(null);
                    setDragOverProjectId(null);
                },
            }}
            helperSlot={helperSlot}
            overlaySlot={overlaySlot}
            body={() => (
                <>
                    <div className="project-top-meta">
                        {editable ? (
                            <>
                                <input
                                    value={project.title}
                                    {...selectableInputProps(store, titleKey, '프로젝트 제목')}
                                    onChange={(e) => store.actions.updateProject(project.id, 'title', e.target.value)}
                                    className="custom-input title"
                                />
                                <input
                                    value={project.role}
                                    {...selectableInputProps(store, roleKey, '프로젝트 역할')}
                                    onChange={(e) => store.actions.updateProject(project.id, 'role', e.target.value)}
                                    className="custom-input subtitle"
                                />
                                <input
                                    value={project.period}
                                    {...selectableInputProps(store, periodKey, '프로젝트 기간')}
                                    onChange={(e) => store.actions.updateProject(project.id, 'period', e.target.value)}
                                    className="custom-input meta"
                                />
                                <textarea
                                    value={project.summary}
                                    {...selectableInputProps(store, summaryKey, '프로젝트 요약')}
                                    onChange={(e) => store.actions.updateProject(project.id, 'summary', e.target.value)}
                                    className="custom-input description"
                                />
                                <input
                                    value={project.link}
                                    {...selectableInputProps(store, linkKey, '프로젝트 링크')}
                                    onChange={(e) => store.actions.updateProject(project.id, 'link', e.target.value)}
                                    className="custom-input link"
                                />
                            </>
                        ) : (
                            <>
                                <div className="project-head-row">
                                    <h3 {...selectableViewProps(store, titleKey, '프로젝트 제목')}>{project.title}</h3>
                                    <strong {...selectableViewProps(store, roleKey, '프로젝트 역할')}>{project.role}</strong>
                                </div>
                                <p className="project-period" {...selectableViewProps(store, periodKey, '프로젝트 기간')}>
                                    {project.period}
                                </p>
                                <p {...selectableViewProps(store, summaryKey, '프로젝트 요약')}>{project.summary}</p>
                                <p {...selectableViewProps(store, linkKey, '프로젝트 링크')}>{project.link}</p>
                            </>
                        )}
                    </div>

                    <div className={`project-block-grid layout-mode-${blockLayoutMode} ${showHelpers ? 'show-grid-guides' : ''} ${blockLayoutMode === 'manual' && draggingId ? 'manual-placement-active' : ''}`}>
                        {showHelpers ? (
                            <GridPlacementOverlay
                                rows={blockGridRows}
                                preview={blockPreviewPacked?.preview || blockPreviewManual?.preview}
                                items={previewSourceBlocks.filter((block) => block.visible !== false)}
                                activeItemId={draggingId}
                                showOccupiedRanges={blockLayoutMode === 'manual'}
                                active={!!draggingId}
                                interactive={blockLayoutMode === 'manual' && !!draggingId}
                                confirmBeforePlace={!!store.ui?.isMobile}
                                isMobileLayout={!!store.ui?.isMobile}
                                onCellEnter={(cell) => {
                                    if (blockLayoutMode !== 'manual' || !draggingId) return;
                                    setManualPreviewCell(cell);
                                }}
                                onCellDrop={(cell) => {
                                    if (blockLayoutMode !== 'manual' || !draggingId) return;
                                    store.actions.placeProjectBlock(project.id, draggingId, cell.x, cell.y, previewSourceBlocks);
                                    setDraggingId(null);
                                    setDragOverId(null);
                                    setManualPreviewCell(null);
                                    setManualLayoutSnapshot(null);
                                }}
                                onCellClick={(cell, event) => {
                                    if (blockLayoutMode !== 'manual' || !draggingId) return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    store.actions.placeProjectBlock(project.id, draggingId, cell.x, cell.y, previewSourceBlocks);
                                    setDraggingId(null);
                                    setDragOverId(null);
                                    setManualPreviewCell(null);
                                    setManualLayoutSnapshot(null);
                                }}
                                onCellConfirm={(cell, event) => {
                                    if (blockLayoutMode !== 'manual' || !draggingId) return;
                                    event?.preventDefault?.();
                                    event?.stopPropagation?.();
                                    store.actions.placeProjectBlock(project.id, draggingId, cell.x, cell.y, previewSourceBlocks);
                                    setDraggingId(null);
                                    setDragOverId(null);
                                    setManualPreviewCell(null);
                                    setManualLayoutSnapshot(null);
                                }}
                                onPointerLeave={() => {
                                    if (blockLayoutMode === 'manual') setManualPreviewCell(null);
                                }}
                                onCancel={() => {
                                    setManualPreviewCell(null);
                                    setDraggingId(null);
                                    setDragOverId(null);
                                    setManualLayoutSnapshot(null);
                                    store.actions.selectPage();
                                }}
                            />
                        ) : null}

                        {resolvedProjectBlocks.map((block) => {
                            const toolbarActions = editable
                                ? block.type === 'list'
                                    ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                store.actions.addProjectListItem(project.id, block.id);
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
                                                        store.actions.updateProjectBlock(project.id, block.id, 'imageAspectRatio', nextValue);
                                                        if (nextValue !== 'custom') {
                                                            store.actions.setProjectBlockRowSpan(project.id, block.id, 1, resolvedProjectBlocks);
                                                        }
                                                    }}
                                                    onCustomWidthChange={(value) =>
                                                        store.actions.updateProjectBlock(project.id, block.id, 'imageCustomRatioWidth', value)
                                                    }
                                                    onCustomHeightChange={(value) =>
                                                        store.actions.updateProjectBlock(project.id, block.id, 'imageCustomRatioHeight', value)
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        store.actions.addProjectImage(project.id, block.id);
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
                                ? <ProjectTextBlock block={block} projectId={project.id} store={store} editable={editable} />
                                : block.type === 'list'
                                    ? <ProjectListBlock block={block} projectId={project.id} store={store} editable={editable} />
                                    : <ProjectImageBlock block={block} projectId={project.id} store={store} editable={editable} fillHeight={shouldFillImageBlock} />;
                            const measureNode = shouldFillImageBlock
                                ? <ProjectImageBlock block={block} projectId={project.id} store={store} editable={editable} measureOnly />
                                : null;

                            return (
                                <BlockShell
                                    key={block.id}
                                    store={store}
                                    projectId={project.id}
                                    block={block}
                                    draggingId={draggingId}
                                    dragOverId={dragOverId}
                                    setDraggingId={setDraggingId}
                                    setDragOverId={setDragOverId}
                                    layoutMode={blockLayoutMode}
                                    placementStyle={getGridItemPlacementStyle(block, blockLayoutMode)}
                                    measureRef={measuredProjectBlocks.registerMeasureRef(block.id)}
                                    measureNode={measureNode}
                                    fillBody={shouldFillImageBlock}
                                    measureBias={measureBias}
                                    minRowSpan={block.minRowSpan || 1}
                                    layoutItemsOverride={resolvedProjectBlocks}
                                    toolbarActions={toolbarActions}
                                >
                                    {blockNode}
                                </BlockShell>
                            );
                        })}
                    </div>

                    {editable ? (
                        <div className="project-add-blocks">
                            <button
                                type="button"
                                className="ghost small"
                                onClick={() => store.actions.addProjectBlock(project.id, 'text')}
                            >
                                텍스트 블록
                            </button>
                            <button
                                type="button"
                                className="ghost small"
                                onClick={() => store.actions.addProjectBlock(project.id, 'list')}
                            >
                                리스트 블록
                            </button>
                            <button
                                type="button"
                                className="ghost small"
                                onClick={() => store.actions.addProjectBlock(project.id, 'image')}
                            >
                                이미지 블록
                            </button>
                            <button
                                type="button"
                                className="ghost danger small"
                                onClick={() => store.actions.removeProject(project.id)}
                            >
                                프로젝트 삭제
                            </button>
                        </div>
                    ) : null}
                </>
            )}
        />
    );
}