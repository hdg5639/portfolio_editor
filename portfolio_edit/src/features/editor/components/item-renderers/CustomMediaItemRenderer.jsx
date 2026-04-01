import { selectableInputProps } from '../editor-primitives/index.jsx';
import { readFileAsDataUrl } from '../../utils/fileReaders.js';
import EditableCustomText from './EditableCustomText.jsx';
import { SelectionKey } from '../../utils/selectionKeys.js';

export default function CustomMediaItemRenderer({ sectionId, item, store, disabled }) {
    const titleKey = SelectionKey.custom.field(sectionId, item.id, 'title');
    const descKey = SelectionKey.custom.field(sectionId, item.id, 'description');

    return (
        <div className="custom-item media media-stack">
            {item.image || !disabled ? (
                <div className={`custom-media-preview ${item.image ? 'has-image' : 'is-empty'}`}>
                    {item.image ? (
                        <img src={item.image} alt={item.title || 'custom'} />
                    ) : (
                        <div className="project-image-placeholder">IMAGE</div>
                    )}
                    {!disabled ? (
                        <div className="custom-media-preview-actions" onClick={(e) => e.stopPropagation()}>
                            <label className="ghost small upload-label">
                                {item.image ? '이미지 변경' : '이미지 업로드'}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        const file = e.target.files?.[0];
                                        readFileAsDataUrl(file, (value) =>
                                            store.actions.updateCustomSectionItem(sectionId, item.id, 'image', value),
                                        );
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                            {item.image ? (
                                <button
                                    type="button"
                                    className="ghost small project-image-clear-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        store.actions.updateCustomSectionItem(sectionId, item.id, 'image', '');
                                    }}
                                >
                                    이미지 삭제
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="custom-media-body">
                <EditableCustomText
                    value={item.title}
                    placeholder="제목"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                    className="custom-input title"
                    disabled={disabled}
                    {...selectableInputProps(store, titleKey, '미디어 항목 제목')}
                />
                <EditableCustomText
                    as="textarea"
                    value={item.description}
                    placeholder="설명"
                    onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                    className="custom-input description"
                    disabled={disabled}
                    {...selectableInputProps(store, descKey, '미디어 항목 설명')}
                />
            </div>
        </div>
    );
}
