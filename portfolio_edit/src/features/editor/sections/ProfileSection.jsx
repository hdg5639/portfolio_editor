import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl.jsx';
import LayoutChrome from '../components/LayoutChrome.jsx';
import GridPlacementOverlay from '../components/GridPlacementOverlay.jsx';
import { getCardSelectionState, getProfileBlockSelectionState } from '../utils/storeHelpers';
import { getGridItemPlacementStyle, getGridRowExtent, getManualPlacementPreview, getPackedPlacementPreview, normalizeGridItems } from '../utils/layoutGrid.js';
import useMeasuredGridItems from '../hooks/useMeasuredGridItems.js';

function bind(store, key, label) {
    return {
        style: store.actions.styleFor(key),
        select: () => store.actions.select({ key, label }),
    };
}

function viewProps(store, key, label) {
    const bound = bind(store, key, label);
    return {
        style: bound.style,
        onClick: (e) => {
            e.stopPropagation();
            bound.select();
        },
    };
}

function inputProps(store, key, label) {
    const bound = bind(store, key, label);
    return {
        style: bound.style,
        onClick: (e) => {
            e.stopPropagation();
            bound.select();
        },
    };
}

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

function EditableInput({
    value,
    placeholder,
    onChange,
    className = '',
    as = 'input',
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

function SelectionBadge({ label, tone = 'block' }) {
    return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
}

function AutoGrowTextarea({ className, value, placeholder, onChange, inputMeta }) {
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

function ProfileBlockShell({
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
    const isDragging = draggingKey === blockKey;
    const isDragOver = layoutMode === 'packed' && dragOverKey === blockKey && draggingKey !== blockKey;
    const blockSelection = getProfileBlockSelectionState(store.selected?.key, blockKey);
    const useTapReorder = showHelpers && !!store.ui?.isMobile;
    const showTapOverlay = layoutMode === 'packed' && useTapReorder && !!draggingKey && draggingKey !== blockKey;

    const handleDragStart = (event) => {
        if (!showHelpers) return;
        event.stopPropagation();
        setDraggingKey(blockKey);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(blockKey));
    };

    const handleDragOver = (event) => {
        if (layoutMode !== 'packed' || !showHelpers || !draggingKey) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverKey !== blockKey) setDragOverKey(blockKey);
    };

    const handleDrop = (event) => {
        if (layoutMode !== 'packed' || !showHelpers) return;
        event.preventDefault();
        event.stopPropagation();

        const dragged = event.dataTransfer.getData('text/plain') || draggingKey;
        if (dragged && dragged !== blockKey) {
            store.actions.moveProfileBlock(dragged, blockKey);
        }

        setDraggingKey(null);
        setDragOverKey(null);
    };

    const handleDragEnd = (event) => {
        event.stopPropagation();
        setDraggingKey(null);
        setDragOverKey(null);
    };

    const handleTapReorder = (event) => {
        if (!showTapOverlay) return false;
        event.preventDefault();
        event.stopPropagation();
        store.actions.moveProfileBlock(draggingKey, blockKey);
        setDraggingKey(null);
        setDragOverKey(null);
        return true;
    };

    return (
        <div
            className={`profile-layout-item selection-scope selection-block span-${colSpan} span-r-${rowSpan} layout-mode-${layoutMode} ${layoutMode === 'manual' && draggingKey === blockKey ? 'manual-armed' : ''} ${isDragging ? 'dragging' : ''} ${
                isDragOver ? 'drag-over' : ''
            } ${blockSelection.selected ? 'is-selected' : ''} ${blockSelection.ancestor ? 'is-ancestor' : ''}`}
            style={placementStyle}
            onClick={(event) => {
                if (handleTapReorder(event)) return;
                event.stopPropagation();
                store.actions.select({ key: `profileBlock.${blockKey}`, label: `${label} 블럭` });
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {showHelpers ? (
                <LayoutChrome
                    label={label}
                    summary={`${colSpan} × ${rowSpan}`}
                    defaultExpanded={false}
                    dragHandle={
                        <div
                            className={`drag-handle ${layoutMode === 'manual' && draggingKey === blockKey ? 'is-armed' : ''}`}
                            title={layoutMode === 'manual' ? '드래그 후 격자 위치 선택' : '드래그해서 순서 이동'}
                            draggable
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onClick={(event) => {
                                if (layoutMode === 'manual') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setDraggingKey((current) => (current === blockKey ? null : blockKey));
                                    setDragOverKey(null);
                                    return;
                                }

                                if (!useTapReorder) return;
                                event.preventDefault();
                                event.stopPropagation();
                                setDraggingKey((current) => (current === blockKey ? null : blockKey));
                                setDragOverKey(null);
                            }}
                        >
                            ⋮⋮
                        </div>
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

            {showTapOverlay ? (
                <button type="button" className="tap-reorder-overlay active" onClick={handleTapReorder}>
                    여기로 이동
                </button>
            ) : null}

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

function renderContactValue(contact) {
    if (!contact?.value) return '값을 입력하세요.';
    return contact.value;
}

function renderProfileContactPreview(store, contacts) {
    return (
        <div className="profile-block profile-contacts-block">
            <div className="profile-contact-list">
                {contacts.length ? contacts.filter((contact) => contact.visible !== false).map((contact) => (
                    <div key={contact.id} className="profile-contact-row">
                        <span {...viewProps(store, `profile.contacts.${contact.id}.label`, `${contact.label} 라벨`)}>{contact.label || 'CONTACT'}</span>
                        <strong {...viewProps(store, `profile.contacts.${contact.id}.value`, `${contact.label} 값`)}>
                            {renderContactValue(contact)}
                        </strong>
                    </div>
                )) : <div className="profile-contact-empty">표시할 연락처가 없습니다.</div>}
            </div>
        </div>
    );
}

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
    const contacts = profile.contacts || [];
    const extraBlocks = profile.extraBlocks || [];
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

    const contactPreviewNode = renderProfileContactPreview(store, contacts);
    const imagePreviewNode = (
        <div className="profile-block profile-photo-block">
            {profile.image ? (
                <img src={profile.image} alt={profile.name || 'profile'} className="profile-photo" />
            ) : (
                <div className="profile-photo placeholder">PHOTO</div>
            )}
        </div>
    );
    const quotePreviewNode = (
        <div className="profile-block profile-quote-block">
            <div className="profile-quote-text" {...viewProps(store, 'profile.quote', '한 줄 메시지')}>{profile.quote}</div>
        </div>
    );
    const identityPreviewNode = (
        <div className="profile-block profile-identity-block">
            <div>
                <div className="profile-name-text" {...viewProps(store, 'profile.name', '이름')}>{profile.name}</div>
            </div>
            <div>
                <div className="profile-role-text" {...viewProps(store, 'profile.role', '직무')}>{profile.role}</div>
            </div>
        </div>
    );
    const introPreviewNode = (
        <div className="profile-block profile-intro-block">
            <div className="profile-intro-text" {...viewProps(store, 'profile.intro', '자기소개')}>{profile.intro}</div>
        </div>
    );

    const fixedBlockMap = {
        image: {
            label: '프로필 이미지',
            node: (
                <div className="profile-block profile-photo-block">
                    {profile.image ? (
                        <img src={profile.image} alt={profile.name || 'profile'} className="profile-photo" />
                    ) : (
                        <div className="profile-photo placeholder">PHOTO</div>
                    )}
                </div>
            ),
            measureNode: imagePreviewNode,
            actions: (
                <div className="profile-block-actions">
                    <label
                        className="ghost small upload-label"
                        onClick={(e) => e.stopPropagation()}
                    >
                        이미지 업로드
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                readFileAsDataUrl(file, (value) => store.actions.updateProfile('image', value));
                                e.target.value = '';
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.toggleProfileBlock('image');
                        }}
                    >
                        숨김
                    </button>
                </div>
            ),
        },
        quote: {
            label: '한 줄 메시지',
            node: (
                <div className="profile-block profile-quote-block">
                    {isEdit ? (
                        <EditableInput
                            value={profile.quote}
                            placeholder="한 줄 메시지"
                            onChange={(value) => store.actions.updateProfile('quote', value)}
                            className="profile-quote-input"
                            {...inputProps(store, 'profile.quote', '한 줄 메시지')}
                        />
                    ) : (
                        <div className="profile-quote-text" {...viewProps(store, 'profile.quote', '한 줄 메시지')}>
                            {profile.quote}
                        </div>
                    )}
                </div>
            ),
            measureNode: quotePreviewNode,
            actions: (
                <div className="profile-block-actions">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.toggleProfileBlock('quote');
                        }}
                    >
                        숨김
                    </button>
                </div>
            ),
        },
        contacts: {
            label: '연락처',
            node: (
                <div className="profile-block profile-contacts-block">
                    {isEdit ? (
                        <div className="profile-contacts-edit profile-contacts-edit-compact">
                            <div className="profile-contacts-edit-list">
                                {contacts.length ? contacts.map((contact) => (
                                    <div key={contact.id} className="profile-contact-edit-card">
                                        <div className="profile-contact-edit-head">
                                            <input
                                                value={contact.label || ''}
                                                placeholder="이름"
                                                onChange={(e) => store.actions.updateProfileContact(contact.id, 'label', e.target.value)}
                                                className="profile-contact-label-input"
                                                {...inputProps(store, `profile.contacts.${contact.id}.label`, '연락처 라벨')}
                                            />
                                            <button
                                                type="button"
                                                className="profile-contact-remove ghost danger small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    store.actions.removeProfileContact(contact.id);
                                                }}
                                                aria-label={`${contact.label || '연락처'} 삭제`}
                                            >
                                                X
                                            </button>
                                        </div>
                                        <AutoGrowTextarea
                                            value={contact.value || ''}
                                            placeholder="내용"
                                            onChange={(value) => store.actions.updateProfileContact(contact.id, 'value', value)}
                                            className="profile-contact-value-input"
                                            inputMeta={inputProps(store, `profile.contacts.${contact.id}.value`, '연락처 값')}
                                        />
                                    </div>
                                )) : <div className="profile-contact-empty">표시할 연락처가 없습니다.</div>}
                            </div>
                        </div>
                    ) : contactPreviewNode}
                </div>
            ),
            measureNode: contactPreviewNode,
            actions: (
                <div className="profile-block-actions profile-contact-actions">
                    <button type="button" className="ghost small" onClick={(e) => { e.stopPropagation(); store.actions.addProfileContact(); }}>추가</button>
                </div>
            ),
        },
        identity: {
            label: '이름 / 직무',
            node: (
                <div className="profile-block profile-identity-block">
                    <div>
                        {isEdit ? (
                            <EditableInput
                                value={profile.name}
                                placeholder="이름"
                                onChange={(value) => store.actions.updateProfile('name', value)}
                                className="profile-name-input"
                                {...inputProps(store, 'profile.name', '이름')}
                            />
                        ) : (
                            <div className="profile-name-text" {...viewProps(store, 'profile.name', '이름')}>
                                {profile.name}
                            </div>
                        )}
                    </div>

                    <div>
                        {isEdit ? (
                            <EditableInput
                                value={profile.role}
                                placeholder="직무"
                                onChange={(value) => store.actions.updateProfile('role', value)}
                                className="profile-role-input"
                                {...inputProps(store, 'profile.role', '직무')}
                            />
                        ) : (
                            <div className="profile-role-text" {...viewProps(store, 'profile.role', '직무')}>
                                {profile.role}
                            </div>
                        )}
                    </div>
                </div>
            ),
            measureNode: identityPreviewNode,
            actions: (
                <div className="profile-block-actions">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.toggleProfileBlock('identity');
                        }}
                    >
                        숨김
                    </button>
                </div>
            ),
        },
        intro: {
            label: '자기소개',
            node: (
                <div className="profile-block profile-intro-block">
                    {isEdit ? (
                        <EditableInput
                            as="textarea"
                            value={profile.intro}
                            placeholder="자기소개"
                            onChange={(value) => store.actions.updateProfile('intro', value)}
                            className="profile-intro-input"
                            {...inputProps(store, 'profile.intro', '자기소개')}
                        />
                    ) : (
                        <div className="profile-intro-text" {...viewProps(store, 'profile.intro', '자기소개')}>
                            {profile.intro}
                        </div>
                    )}
                </div>
            ),
            measureNode: isEdit ? null : introPreviewNode,
            actions: (
                <div className="profile-block-actions">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.toggleProfileBlock('intro');
                        }}
                    >
                        숨김
                    </button>
                </div>
            ),
        },
    };

    const extraBlockEntries = extraBlocks.reduce((acc, block) => {
        const baseKey = `profile.extraBlocks.${block.id}`;
        const label = block.title || (block.type === 'list' ? '추가 리스트' : block.type === 'image' ? '추가 이미지' : '추가 텍스트');
        const commonActions = (
            <div className="profile-block-actions">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.actions.removeProfileExtraBlock(block.id);
                    }}
                >
                    제거
                </button>
            </div>
        );

        if (block.type === 'list') {
            const previewNode = (
                <div className="project-inner-card project-block">
                    <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 리스트 제목')}>{block.title}</h5>
                    <ul className="project-list-view">
                        {(block.items || []).filter(Boolean).map((item, index) => (
                            <li key={`${block.id}-${index}`} {...viewProps(store, `${baseKey}.items.${index}`, '프로필 추가 리스트 항목')}>{item}</li>
                        ))}
                    </ul>
                </div>
            );
            acc[`extra:${block.id}`] = {
                label,
                measureNode: isEdit ? null : previewNode,
                node: (
                    <div className="project-inner-card project-block">
                        {isEdit ? (
                            <>
                                <input
                                    value={block.title || ''}
                                    placeholder="리스트 제목"
                                    className="custom-input title"
                                    onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'title', e.target.value)}
                                    {...inputProps(store, `${baseKey}.title`, '프로필 추가 리스트 제목')}
                                />
                                <textarea
                                    rows={6}
                                    value={(block.items || []).join('\n')}
                                    className="custom-input description"
                                    onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'items', e.target.value.split('\n'))}
                                    {...inputProps(store, `${baseKey}.items`, '프로필 추가 리스트 항목')}
                                />
                            </>
                        ) : (
                            <>
                                <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 리스트 제목')}>{block.title}</h5>
                                <ul className="project-list-view">
                                    {(block.items || []).filter(Boolean).map((item, index) => (
                                        <li key={`${block.id}-${index}`} {...viewProps(store, `${baseKey}.items.${index}`, '프로필 추가 리스트 항목')}>{item}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                ),
                actions: commonActions,
            };
            return acc;
        }

        if (block.type === 'image') {
            const imageSrc = block.images?.[0] || '';
            const previewNode = (
                <div className="project-inner-card project-block project-images-wrap">
                    <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 이미지 제목')}>{block.title}</h5>
                    <div className="project-image-slot">
                        {imageSrc ? <img src={imageSrc} alt={block.title || 'profile extra'} /> : <div className="project-image-placeholder">IMAGE</div>}
                    </div>
                    {block.caption ? <p className="image-caption" {...viewProps(store, `${baseKey}.caption`, '프로필 추가 이미지 캡션')}>{block.caption}</p> : null}
                </div>
            );
            acc[`extra:${block.id}`] = {
                label,
                measureNode: previewNode,
                node: (
                    <div className="project-inner-card project-block project-images-wrap">
                        {isEdit ? (
                            <>
                                <input
                                    value={block.title || ''}
                                    placeholder="이미지 제목"
                                    className="custom-input title"
                                    onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'title', e.target.value)}
                                    {...inputProps(store, `${baseKey}.title`, '프로필 추가 이미지 제목')}
                                />
                                <div className="project-image-editor-slot">
                                    <div className="project-image-slot">
                                        {imageSrc ? <img src={imageSrc} alt={block.title || 'profile extra'} /> : <div className="project-image-placeholder">IMAGE</div>}
                                    </div>
                                    <div className="project-image-slot-actions">
                                        <label className="ghost small upload-label">
                                            이미지 업로드
                                            <input
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    readFileAsDataUrl(file, (value) => store.actions.updateProfileExtraBlock(block.id, 'images', [value]));
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        {imageSrc ? (
                                            <button
                                                type="button"
                                                className="ghost danger small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    store.actions.updateProfileExtraBlock(block.id, 'images', ['']);
                                                }}
                                            >
                                                제거
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                                <input
                                    value={block.caption || ''}
                                    placeholder="캡션"
                                    className="custom-input"
                                    onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'caption', e.target.value)}
                                    {...inputProps(store, `${baseKey}.caption`, '프로필 추가 이미지 캡션')}
                                />
                            </>
                        ) : (
                            <>
                                <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 이미지 제목')}>{block.title}</h5>
                                <div className="project-image-slot">
                                    {imageSrc ? <img src={imageSrc} alt={block.title || 'profile extra'} /> : <div className="project-image-placeholder">IMAGE</div>}
                                </div>
                                {block.caption ? <p className="image-caption" {...viewProps(store, `${baseKey}.caption`, '프로필 추가 이미지 캡션')}>{block.caption}</p> : null}
                            </>
                        )}
                    </div>
                ),
                actions: commonActions,
            };
            return acc;
        }

        const previewNode = (
            <div className="project-inner-card project-block">
                <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 텍스트 제목')}>{block.title}</h5>
                <p className="project-paragraph" {...viewProps(store, `${baseKey}.content`, '프로필 추가 텍스트 내용')}>{block.content}</p>
            </div>
        );
        acc[`extra:${block.id}`] = {
            label,
            measureNode: isEdit ? null : previewNode,
            node: (
                <div className="project-inner-card project-block">
                    {isEdit ? (
                        <>
                            <input
                                value={block.title || ''}
                                placeholder="텍스트 제목"
                                className="custom-input title"
                                onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'title', e.target.value)}
                                {...inputProps(store, `${baseKey}.title`, '프로필 추가 텍스트 제목')}
                            />
                            <textarea
                                rows={6}
                                value={block.content || ''}
                                className="custom-input description"
                                onChange={(e) => store.actions.updateProfileExtraBlock(block.id, 'content', e.target.value)}
                                {...inputProps(store, `${baseKey}.content`, '프로필 추가 텍스트 내용')}
                            />
                        </>
                    ) : (
                        <>
                            <h5 {...viewProps(store, `${baseKey}.title`, '프로필 추가 텍스트 제목')}>{block.title}</h5>
                            <p className="project-paragraph" {...viewProps(store, `${baseKey}.content`, '프로필 추가 텍스트 내용')}>{block.content}</p>
                        </>
                    )}
                </div>
            ),
            actions: commonActions,
        };
        return acc;
    }, {});

    const blockMap = {
        ...fixedBlockMap,
        ...extraBlockEntries,
    };

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
