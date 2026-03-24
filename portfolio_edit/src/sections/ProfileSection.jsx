import { useState } from 'react';

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
                       }) {
  if (disabled) return <div className={className}>{value || placeholder}</div>;

  if (as === 'textarea') {
    return (
        <textarea
            className={className}
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    );
  }

  return (
      <input
          className={className}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
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
  const isDragging = draggingKey === blockKey;
  const isDragOver = dragOverKey === blockKey && draggingKey !== blockKey;

  const handleDragStart = (event) => {
    if (!isEdit) return;
    event.stopPropagation();
    setDraggingKey(blockKey);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(blockKey));
  };

  const handleDragOver = (event) => {
    if (!isEdit || !draggingKey) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== blockKey) setDragOverKey(blockKey);
  };

  const handleDrop = (event) => {
    if (!isEdit) return;
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
          className={`profile-layout-item span-${colSpan} span-r-${rowSpan} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
      >
        {isEdit ? (
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

              <div className="profile-block-actions">
                {[12, 8, 6, 4, 3].map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={colSpan === value ? 'active' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          store.actions.setProfileBlockSpan(blockKey, value);
                        }}
                    >
                      W{value}
                    </button>
                ))}
              </div>

              <div className="profile-block-actions">
                {[1, 2, 3].map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={rowSpan === value ? 'active' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          store.actions.setProfileBlockRowSpan(blockKey, value);
                        }}
                    >
                      H{value}
                    </button>
                ))}
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
  const cardStyle = store.actions.cardStyle();

  const quoteStyle = store.actions.styleFor('profile.quote');
  const nameStyle = store.actions.styleFor('profile.name');
  const roleStyle = store.actions.styleFor('profile.role');
  const introStyle = store.actions.styleFor('profile.intro');
  const contactsStyle = store.actions.styleFor('profile.contacts');

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
          <div
              className="profile-block profile-quote-block"
              onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'profile.quote', label: '한 줄 메시지' });
              }}
          >
            {isEdit ? (
                <EditableInput
                    value={profile.quote}
                    placeholder="한 줄 메시지"
                    onChange={(value) => store.actions.updateProfile('quote', value)}
                    className="profile-quote-input"
                />
            ) : (
                <div className="profile-quote-text" style={quoteStyle}>
                  {profile.quote}
                </div>
            )}
          </div>
      ),
    },

    contacts: {
      label: '연락처',
      node: (
          <div
              className="profile-block profile-contacts-block"
              style={contactsStyle}
              onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'profile.contacts', label: '연락처' });
              }}
          >
            {isEdit ? (
                <div className="profile-contacts-edit">
                  <div className="contact-edit-row">
                    <span>EMAIL</span>
                    <input value={profile.email} onChange={(e) => store.actions.updateProfile('email', e.target.value)} />
                  </div>
                  <div className="contact-edit-row">
                    <span>GITHUB</span>
                    <input value={profile.github} onChange={(e) => store.actions.updateProfile('github', e.target.value)} />
                  </div>
                  <div className="contact-edit-row">
                    <span>PHONE</span>
                    <input value={profile.phone} onChange={(e) => store.actions.updateProfile('phone', e.target.value)} />
                  </div>
                </div>
            ) : (
                <div className="profile-contact-list">
                  <div className="profile-contact-row">
                    <span>EMAIL</span>
                    <strong>{profile.email}</strong>
                  </div>
                  <div className="profile-contact-row">
                    <span>GITHUB</span>
                    <strong>{profile.github}</strong>
                  </div>
                  <div className="profile-contact-row">
                    <span>PHONE</span>
                    <strong>{profile.phone}</strong>
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
            <div
                onClick={(e) => {
                  e.stopPropagation();
                  store.actions.select({ key: 'profile.name', label: '이름' });
                }}
            >
              {isEdit ? (
                  <EditableInput
                      value={profile.name}
                      placeholder="이름"
                      onChange={(value) => store.actions.updateProfile('name', value)}
                      className="profile-name-input"
                  />
              ) : (
                  <div className="profile-name-text" style={nameStyle}>
                    {profile.name}
                  </div>
              )}
            </div>

            <div
                onClick={(e) => {
                  e.stopPropagation();
                  store.actions.select({ key: 'profile.role', label: '직무' });
                }}
            >
              {isEdit ? (
                  <EditableInput
                      value={profile.role}
                      placeholder="직무"
                      onChange={(value) => store.actions.updateProfile('role', value)}
                      className="profile-role-input"
                  />
              ) : (
                  <div className="profile-role-text" style={roleStyle}>
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
          <div
              className="profile-block profile-intro-block"
              onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'profile.intro', label: '자기소개' });
              }}
          >
            {isEdit ? (
                <EditableInput
                    as="textarea"
                    value={profile.intro}
                    placeholder="자기소개"
                    onChange={(value) => store.actions.updateProfile('intro', value)}
                    className="profile-intro-input"
                />
            ) : (
                <div className="profile-intro-text" style={introStyle}>
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
            store.actions.select({ key: 'card', label: '공통 카드' });
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
                      <button key={block.key} type="button" className="ghost small" onClick={() => store.actions.toggleProfileBlock(block.key)}>
                        {block.label} 다시 표시
                      </button>
                  ))}
            </div>
        ) : null}
      </section>
  );
}