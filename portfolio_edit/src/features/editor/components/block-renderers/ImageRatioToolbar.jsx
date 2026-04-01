import { IMAGE_RATIO_OPTIONS } from '../../utils/imageBlockLayout.js';

export default function ImageRatioToolbar({
    ratioOption,
    customWidth,
    customHeight,
    onRatioChange,
    onCustomWidthChange,
    onCustomHeightChange,
}) {
    return (
        <div className="image-ratio-toolbar" onClick={(event) => event.stopPropagation()}>
            <label className="image-ratio-control">
                <span>이미지 비율</span>
                <select value={ratioOption} onChange={(event) => onRatioChange(event.target.value)}>
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
                        onChange={(event) => onCustomWidthChange(event.target.value)}
                    />
                    <span>:</span>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={customHeight}
                        aria-label="커스텀 이미지 비율 세로"
                        onChange={(event) => onCustomHeightChange(event.target.value)}
                    />
                </div>
            ) : null}
        </div>
    );
}
