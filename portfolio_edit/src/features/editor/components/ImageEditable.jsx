import { useRef } from 'react';
import { fileToDataUrl } from '../utils/file';

export default function ImageEditable({
                                          src,
                                          alt,
                                          editable,
                                          selected,
                                          onSelect,
                                          onChange,
                                          style,
                                      }) {
    const ref = useRef(null);

    const handlePick = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        onChange(dataUrl);
        event.target.value = '';
    };

    const openPicker = (event) => {
        event.stopPropagation();
        ref.current?.click();
    };

    return (
        <div
            className={`image-editable ${editable && selected ? 'selected' : ''}`}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
        >
            {src ? <img src={src} alt={alt} /> : <div className="image-placeholder">이미지 업로드</div>}

            {editable ? (
                <>
                    <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        className="hidden-file-input"
                        onChange={handlePick}
                    />
                    {selected ? (
                        <button type="button" className="image-edit-button no-print" onClick={openPicker}>
                            이미지 변경
                        </button>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}