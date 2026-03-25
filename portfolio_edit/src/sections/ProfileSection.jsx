import { useState } from 'react';
import LayoutSizeControl from './LayoutSizeControl';

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
    if (disabled) return (
        <div className={className} style={style} onClick={onClick}>
            {value || placeholder}
        </div>
    );

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
                               children,
                           }) {
    const isEdit = store.mode === 'edit';
    const showHelpers = isEdit && store.ui.showEditHelpers;
    const isDragging = draggingKey === blockKey;
    const isDragOver = dragOverKey === blockKey && draggingKey !== blockKey;

    const handleDragStart = (event) => {
        if (!showHelpers) return;
        event.stopPropagation();
        setDraggingKey(blockKey);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(blockKey));
    };

    const handleDragOver = (event) => {
        if (!showHelpers || !draggingKey) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverKey !== blockKey) setDragOverKey(blockKey);
    };

    const handleDrop = (event) => {
        if (!showHelpers) return;
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

    return (
        <div
            className={`profile-layout-item span-${colSpan} span-r-${rowSpan} ${isDragging ? 'dragging' : ''} ${
                isDragOver ? 'drag-over' : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {showHelpers ? (
                <div className="profile-block-toolbar no-print">
                    <div
                        className="drag-handle"
                        title="드래그해서 위치 이동"
                        draggable
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        ⋮⋮
                    </div>

                    <strong>{label}</strong>

                    <LayoutSizeControl
                        widthValue={colSpan}
                        heightValue={rowSpan}
                        onWidthChange={(value) => store.actions.setProfileBlockSpan(blockKey, value)}
                        onHeightChange={(value) => store.actions.setProfileBlockRowSpan(blockKey, value)}
                    />

                    <div className="profile-block-actions">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                store.actions.toggleProfileBlock(blockKey);
                            }}
                        >
                            숨김
                        </button>
                    </div>
                </div>
            ) : null}

            {children}
        </div>
    );
}

export default function ProfileSection({ store }) {
    const { profile } = store.portfolio;
    const isEdit = store.mode === 'edit';
    const cardStyle = store.actions.sectionCardStyle('profileCard');

    const [draggingKey, setDraggingKey] = useState(null);
    const [dragOverKey, setDragOverKey] = useState(null);

    const visibleBlocks = (profile.layout || []).filter((item) => item.visible !== false);

    const blockMap = {
        image: {
            label: '프로필 이미지',
            node: (
                <div className="profile-block profile-photo-block">
                    {profile.image ? (
                        <img src={profile.image} alt={profile.name || 'profile'} className="profile-photo" />
                    ) : (
                        <div className="profile-photo placeholder">PHOTO</div>
                    )}

                    {isEdit ? (
                        <label className="ghost small upload-label">
                            이미지 업로드
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    readFileAsDataUrl(file, (value) => store.actions.updateProfile('image', value));
                                }}
                            />
                        </label>
                    ) : null}
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
        },

        contacts: {
            label: '연락처',
            node: (
                <div className="profile-block profile-contacts-block">
                    {isEdit ? (
                        <div className="profile-contacts-edit">
                            <div className="contact-edit-row">
                                <span {...viewProps(store, 'profile.contacts.email.label', '이메일 라벨')}>EMAIL</span>
                                <input
                                    value={profile.email}
                                    onChange={(e) => store.actions.updateProfile('email', e.target.value)}
                                    {...inputProps(store, 'profile.contacts.email.value', '이메일 값')}
                                />
                            </div>
                            <div className="contact-edit-row">
                                <span {...viewProps(store, 'profile.contacts.github.label', '깃허브 라벨')}>GITHUB</span>
                                <input
                                    value={profile.github}
                                    onChange={(e) => store.actions.updateProfile('github', e.target.value)}
                                    {...inputProps(store, 'profile.contacts.github.value', '깃허브 값')}
                                />
                            </div>
                            <div className="contact-edit-row">
                                <span {...viewProps(store, 'profile.contacts.phone.label', '전화번호 라벨')}>PHONE</span>
                                <input
                                    value={profile.phone}
                                    onChange={(e) => store.actions.updateProfile('phone', e.target.value)}
                                    {...inputProps(store, 'profile.contacts.phone.value', '전화번호 값')}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="profile-contact-list">
                            <div className="profile-contact-row">
                                <span {...viewProps(store, 'profile.contacts.email.label', '이메일 라벨')}>EMAIL</span>
                                <strong {...viewProps(store, 'profile.contacts.email.value', '이메일 값')}>
                                    {profile.email}
                                </strong>
                            </div>
                            <div className="profile-contact-row">
                                <span {...viewProps(store, 'profile.contacts.github.label', '깃허브 라벨')}>GITHUB</span>
                                <strong {...viewProps(store, 'profile.contacts.github.value', '깃허브 값')}>
                                    {profile.github}
                                </strong>
                            </div>
                            <div className="profile-contact-row">
                                <span {...viewProps(store, 'profile.contacts.phone.label', '전화번호 라벨')}>PHONE</span>
                                <strong {...viewProps(store, 'profile.contacts.phone.value', '전화번호 값')}>
                                    {profile.phone}
                                </strong>
                            </div>
                        </div>
                    )}
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
        },
    };

    return (
        <section
            className="portfolio-card"
            style={cardStyle}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'profileCard', label: '프로필 카드' });
            }}
        >
            <div className="section-head">
                <div className="profile-layout-head">
                    <div>
                        <h2 className="section-title">프로필</h2>
                        {isEdit ? <p className="profile-layout-help">내부 블럭도 드래그 + 격자 배치 가능</p> : null}
                    </div>
                </div>
            </div>

            <div className="profile-layout-grid">
                {visibleBlocks.map((block) => (
                    <ProfileBlockShell
                        key={block.key}
                        store={store}
                        blockKey={block.key}
                        label={block.label}
                        colSpan={block.colSpan || 12}
                        rowSpan={block.rowSpan || 1}
                        draggingKey={draggingKey}
                        dragOverKey={dragOverKey}
                        setDraggingKey={setDraggingKey}
                        setDragOverKey={setDragOverKey}
                    >
                        {blockMap[block.key]?.node}
                    </ProfileBlockShell>
                ))}
            </div>

            {isEdit ? (
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
            ) : null}
        </section>
    );
}