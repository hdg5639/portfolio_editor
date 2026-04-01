import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState, getProjectSelectionState, getProjectBlockSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';
import { SelectionBadge, selectableInputProps, selectableViewProps } from '../components/editor-primitives/index.jsx';

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
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
    const isEdit = store.mode === 'edit';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const isDragging = draggingId === block.id;
    const isDragOver = layoutMode === 'packed' && dragOverId === block.id && draggingId !== block.id;
    const blockSelection = getProjectBlockSelectionState(store.selected?.key, projectId, block.id);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = layoutMode === 'packed' && useTapReorder && !!draggingId && draggingId !== block.id;

    const onDragStart = (event) => {
        if (!showHelpers) return;
        setDraggingId(block.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(block.id));
    };

    const onDragOver = (event) => {
        if (layoutMode !== 'packed' || !showHelpers || !draggingId) return;
        event.preventDefault();
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
            store.actions.moveProjectBlock(projectId, dragged, block.id);
        }

        setDraggingId(null);
        setDragOverId(null);
    };

    const onDragEnd = () => {
        setDraggingId(null);
        setDragOverId(null);
    };

    const handleTapReorder = (event) => {
        if (!showTapOverlay) return false;
        event.preventDefault();
        event.stopPropagation();
        store.actions.moveProjectBlock(projectId, draggingId, block.id);
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
                store.actions.select({ key: `projects.${projectId}.blocks.${block.id}`, label: `${block.title || '프로젝트'} 블럭` });
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
                    label={`${block.type} · ${block.title}`}
                    summary={`${block.colSpan || 12} × ${block.rowSpan || 1}`}
                    defaultExpanded={false}
                    dragHandle={
                        <div
                            className={`drag-handle ${layoutMode === 'manual' && draggingId === block.id ? 'is-armed' : ''}`}
                            title={layoutMode === 'manual' ? '드래그 후 격자 위치 선택' : '드래그해서 순서 이동'}
                            draggable
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(event) => {
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
                            }}
                        >
                            ⋮⋮
                        </div>
                    }
                    controls={
                        <LayoutSizeControl
                            widthValue={block.colSpan || 12}
                            heightValue={block.rowSpan || 1}
                            minHeightValue={minRowSpan}
                            onWidthChange={(value) => store.actions.setProjectBlockSpan(projectId, block.id, value, layoutItemsOverride)}
                            onHeightChange={(value) => store.actions.setProjectBlockRowSpan(projectId, block.id, value, layoutItemsOverride)}
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
                                    store.actions.removeProjectBlock(projectId, block.id);
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

function TextBlock({ block, projectId, store, editable }) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;
    const contentKey = `projects.${projectId}.blocks.${block.id}.content`;

    return (
        <div className="project-inner-card project-image-block-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '프로젝트 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content || ''}
                        {...selectableInputProps(store, contentKey, '프로젝트 블록 본문')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'content', e.target.value)
                        }
                        className="custom-input description"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 블록 제목')}>{block.title}</h4>
                    <p {...selectableViewProps(store, contentKey, '프로젝트 블록 본문')}>{block.content}</p>
                </>
            )}
        </div>
    );
}

function ListBlock({ block, projectId, store, editable }) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;

    return (
        <div className="project-inner-card project-image-block-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, '프로젝트 리스트 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `projects.${projectId}.blocks.${block.id}.items.${index}`;
                            return (
                                <div key={`${block.id}-${index}`} className="project-list-edit-row">
                                    <input
                                        value={item}
                                        {...selectableInputProps(store, itemKey, `프로젝트 리스트 항목 ${index + 1}`)}
                                        onChange={(e) =>
                                            store.actions.updateProjectListItem(
                                                projectId,
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
                                            store.actions.removeProjectListItem(projectId, block.id, index)
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
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 리스트 제목')}>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `projects.${projectId}.blocks.${block.id}.items.${index}`;
                            return (
                                <li
                                    key={`${block.id}-${index}`}
                                    {...selectableViewProps(store, itemKey, `프로젝트 리스트 항목 ${index + 1}`)}
                                >
                                    {item}
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}

function ImageBlock({block, projectId, store, editable, fillHeight = false, measureOnly = false}) {
    const titleKey = `projects.${projectId}.blocks.${block.id}.title`;
    const captionKey = `projects.${projectId}.blocks.${block.id}.caption`;
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
                                <img src={image} alt={block.title || 'project'} />
                            </div>
                        );
                    }

                    if (mode === 'measure') {
                        return (
                            <div key={`${block.id}-probe-img-${index}`} className="project-image-editor-slot">
                                <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                    {image ? (
                                        <img src={image} alt={block.title || 'project'} />
                                    ) : (
                                        <div className="project-image-placeholder">IMAGE</div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    const inputId = `project-image-${projectId}-${block.id}-${index}`;
                    return (
                        <div key={`${block.id}-img-${index}`} className="project-image-editor-slot">
                            <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                {image ? (
                                    <img src={image} alt={block.title || 'project'} />
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
                                                store.actions.updateProjectImage(projectId, block.id, index, value)
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
                                                store.actions.updateProjectImage(projectId, block.id, index, '');
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
                                            store.actions.removeProjectImage(projectId, block.id, index);
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
                        {...selectableInputProps(store, titleKey, '프로젝트 이미지 블록 제목')}
                        onChange={(e) =>
                            store.actions.updateProjectBlock(projectId, block.id, 'title', e.target.value)
                        }
                        className="custom-input title"
                    />
                    {imageGrid('edit')}
                    <AutoGrowTextarea
                        value={block.caption || ''}
                        placeholder="이미지 캡션"
                        inputMeta={selectableInputProps(store, captionKey, '프로젝트 이미지 캡션')}
                        onChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'caption', value)}
                        className="custom-input subtitle project-image-caption-input"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, '프로젝트 이미지 블록 제목')}>{block.title}</h4>
                    {imageGrid('preview')}
                    {block.caption ? (
                        <p {...selectableViewProps(store, captionKey, '프로젝트 이미지 캡션')} className="project-caption">
                            {block.caption}
                        </p>
                    ) : null}
                </>
            )}
        </div>
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

    return (
        <article
            className={`portfolio-card project-card-inner selection-scope selection-item ${
                isProjectDragging ? 'dragging' : ''
            } ${isProjectDragOver ? 'drag-over' : ''} ${projectSelection.selected ? 'is-selected' : ''} ${projectSelection.ancestor ? 'is-ancestor' : ''}`}
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
            onDragEnterCapture={(event) => {
                if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();

                if (dragOverProjectId !== project.id) {
                    setDragOverProjectId(project.id);
                }
            }}
            onDragOverCapture={(event) => {
                if (!showHelpers || !draggingProjectId || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = 'move';

                if (dragOverProjectId !== project.id) {
                    setDragOverProjectId(project.id);
                }
            }}
            onDragLeaveCapture={(event) => {
                if (!isProjectCardDragEvent(event)) return;

                const nextTarget = event.relatedTarget;
                if (nextTarget && event.currentTarget.contains(nextTarget)) return;

                if (dragOverProjectId === project.id) {
                    setDragOverProjectId(null);
                }
            }}
            onDropCapture={(event) => {
                if (!showHelpers || !isProjectCardDragEvent(event)) return;
                event.preventDefault();
                event.stopPropagation();

                const dragged =
                    event.dataTransfer.getData('application/x-project-card') || draggingProjectId;

                if (dragged && dragged !== project.id) {
                    store.actions.moveProject(dragged, project.id);
                }

                setDraggingProjectId(null);
                setDragOverProjectId(null);
            }}
        >

            {showHelpers ? (
                <div className="project-card-toolbar project-card-toolbar-wrap">
                    <div
                        className="drag-handle"
                        draggable
                        title="프로젝트 카드 순서 변경"
                        onDragStart={(event) => {
                            event.stopPropagation();
                            setDraggingProjectId(project.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData(
                                'application/x-project-card',
                                String(project.id)
                            );
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
            ) : null}

            {showProjectDropOverlay ? (
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

                        const dragged =
                            event.dataTransfer.getData('application/x-project-card') ||
                            draggingProjectId;

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
            ) : null}

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
                        ? <TextBlock block={block} projectId={project.id} store={store} editable={editable} />
                        : block.type === 'list'
                            ? <ListBlock block={block} projectId={project.id} store={store} editable={editable} />
                            : <ImageBlock block={block} projectId={project.id} store={store} editable={editable} fillHeight={shouldFillImageBlock} />;
                    const measureNode = shouldFillImageBlock
                        ? <ImageBlock block={block} projectId={project.id} store={store} editable={editable} measureOnly />
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
        </article>
    );
}