export const IMAGE_RATIO_OPTIONS = [
    { value: 'custom', label: 'Custom' },
    { value: '1:1', label: '1:1' },
    { value: '3:2', label: '3:2' },
    { value: '2:3', label: '2:3' },
    { value: '4:3', label: '4:3' },
    { value: '16:10', label: '16:10' },
    { value: '16:9', label: '16:9' },
];

export const FIXED_RATIO_IMAGE_MEASURE_BIAS = 16;

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

export function getImageFrameProps(block) {
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

export function getImageGridLayoutStyle(block) {
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
