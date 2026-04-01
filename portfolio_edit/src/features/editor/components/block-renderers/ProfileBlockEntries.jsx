import { useLayoutEffect, useRef } from 'react';
import { selectableInputProps as inputProps, selectableViewProps as viewProps } from '../editor-primitives/index.jsx';
import { readFileAsDataUrl } from '../../utils/fileReaders.js';

function EditableInput({
    value,
    placeholder,
    onChange,
    className = '',
    as = 'input',
    disabled = false,
    style,
    onClick,
    ...inputMeta
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
                {...inputMeta}
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
            {...inputMeta}
        />
    );
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

function renderContactValue(contact) {
    if (!contact?.value) return '값을 입력하세요.';
    return contact.value;
}

export function renderProfileContactPreview(store, contacts) {
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

export function createProfileBlockMap({ store, profile, isEdit }) {
    const contacts = profile.contacts || [];
    const extraBlocks = profile.extraBlocks || [];
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

    return {
        ...fixedBlockMap,
        ...extraBlockEntries,
    };
}
