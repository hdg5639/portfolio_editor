import { useMemo } from 'react';
import { selectableInputProps, selectableViewProps } from '../editor-primitives/index.jsx';
import { readFileAsDataUrl } from '../../utils/fileReaders.js';
import { getImageFrameProps, getImageGridLayoutStyle } from '../../utils/imageBlockLayout.js';
import AutoGrowTextarea from './AutoGrowTextarea.jsx';

export function GenericTextBlock({
    block,
    editable,
    store,
    titleKey,
    contentKey,
    titleLabel,
    contentLabel,
    onTitleChange,
    onContentChange,
}) {
    return (
        <div className="project-inner-card project-image-block-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, titleLabel)}
                        onChange={(event) => onTitleChange(event.target.value)}
                        className="custom-input title"
                    />
                    <textarea
                        value={block.content || ''}
                        {...selectableInputProps(store, contentKey, contentLabel)}
                        onChange={(event) => onContentChange(event.target.value)}
                        className="custom-input description"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, titleLabel)}>{block.title}</h4>
                    <p {...selectableViewProps(store, contentKey, contentLabel)}>{block.content}</p>
                </>
            )}
        </div>
    );
}

export function GenericListBlock({
    block,
    editable,
    store,
    baseKey,
    titleKey,
    titleLabel,
    itemLabelPrefix,
    onTitleChange,
    onItemChange,
    onItemRemove,
}) {
    return (
        <div className="project-inner-card project-image-block-card">
            {editable ? (
                <>
                    <input
                        value={block.title}
                        {...selectableInputProps(store, titleKey, titleLabel)}
                        onChange={(event) => onTitleChange(event.target.value)}
                        className="custom-input title"
                    />
                    <div className="project-list-edit">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `${baseKey}.items.${index}`;
                            const itemLabel = `${itemLabelPrefix} ${index + 1}`;
                            return (
                                <div key={`${block.id}-${index}`} className="project-list-edit-row">
                                    <input
                                        value={item}
                                        {...selectableInputProps(store, itemKey, itemLabel)}
                                        onChange={(event) => onItemChange(index, event.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="ghost danger small"
                                        onClick={() => onItemRemove(index)}
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
                    <h4 {...selectableViewProps(store, titleKey, titleLabel)}>{block.title}</h4>
                    <ul className="project-list-view">
                        {(block.items || []).map((item, index) => {
                            const itemKey = `${baseKey}.items.${index}`;
                            const itemLabel = `${itemLabelPrefix} ${index + 1}`;
                            return (
                                <li
                                    key={`${block.id}-${index}`}
                                    {...selectableViewProps(store, itemKey, itemLabel)}
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

export function GenericImageBlock({
    block,
    editable,
    store,
    titleKey,
    captionKey,
    titleLabel,
    captionLabel,
    altFallback,
    fillHeight = false,
    measureOnly = false,
    uploadInputIdPrefix,
    onTitleChange,
    onCaptionChange,
    onImageUpload,
    onImageClear,
    onImageRemove,
}) {
    const imageGridStyle = useMemo(() => getImageGridLayoutStyle(block), [block.colSpan, block.images]);
    const imageFrame = useMemo(
        () => getImageFrameProps(block),
        [block.imageAspectRatio, block.imageCustomRatioWidth, block.imageCustomRatioHeight],
    );

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
                                <img src={image} alt={block.title || altFallback} />
                            </div>
                        );
                    }

                    if (mode === 'measure') {
                        return (
                            <div key={`${block.id}-probe-img-${index}`} className="project-image-editor-slot">
                                <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                    {image ? (
                                        <img src={image} alt={block.title || altFallback} />
                                    ) : (
                                        <div className="project-image-placeholder">IMAGE</div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    const inputId = `${uploadInputIdPrefix}-${index}`;
                    return (
                        <div key={`${block.id}-img-${index}`} className="project-image-editor-slot">
                            <div className={`project-image-slot ${image ? 'has-image' : 'is-empty'}`}>
                                {image ? (
                                    <img src={image} alt={block.title || altFallback} />
                                ) : (
                                    <div className="project-image-placeholder">IMAGE</div>
                                )}
                                <div className="project-image-slot-actions inside">
                                    <label
                                        htmlFor={inputId}
                                        className="ghost small upload-label"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        {image ? '이미지 변경' : '이미지 업로드'}
                                    </label>
                                    <input
                                        id={inputId}
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => {
                                            event.stopPropagation();
                                            const file = event.target.files?.[0];
                                            readFileAsDataUrl(file, (value) => onImageUpload(index, value));
                                            event.target.value = '';
                                        }}
                                    />
                                    {image ? (
                                        <button
                                            type="button"
                                            className="ghost small project-image-clear-button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onImageClear(index);
                                            }}
                                        >
                                            이미지 삭제
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="ghost danger small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onImageRemove(index);
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
                        {...selectableInputProps(store, titleKey, titleLabel)}
                        onChange={(event) => onTitleChange(event.target.value)}
                        className="custom-input title"
                    />
                    {imageGrid('edit')}
                    <AutoGrowTextarea
                        value={block.caption || ''}
                        placeholder="이미지 캡션"
                        inputMeta={selectableInputProps(store, captionKey, captionLabel)}
                        onChange={onCaptionChange}
                        className="custom-input subtitle project-image-caption-input"
                    />
                </>
            ) : (
                <>
                    <h4 {...selectableViewProps(store, titleKey, titleLabel)}>{block.title}</h4>
                    {imageGrid('preview')}
                    {block.caption ? (
                        <p {...selectableViewProps(store, captionKey, captionLabel)} className="project-caption">
                            {block.caption}
                        </p>
                    ) : null}
                </>
            )}
        </div>
    );
}
