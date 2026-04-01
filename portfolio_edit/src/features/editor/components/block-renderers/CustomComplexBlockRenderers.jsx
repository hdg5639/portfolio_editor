import { GenericImageBlock, GenericListBlock, GenericTextBlock } from './SharedBlockRenderers.jsx';

export function CustomComplexTextBlock({ block, sectionId, itemId, store, editable }) {
    const baseKey = `custom.${sectionId}.${itemId}.blocks.${block.id}`;
    return (
        <GenericTextBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            contentKey={`${baseKey}.content`}
            titleLabel="복합 텍스트 블록 제목"
            contentLabel="복합 텍스트 블록 본문"
            onTitleChange={(value) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', value)}
            onContentChange={(value) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'content', value)}
        />
    );
}

export function CustomComplexListBlock({ block, sectionId, itemId, store, editable }) {
    const baseKey = `custom.${sectionId}.${itemId}.blocks.${block.id}`;
    return (
        <GenericListBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            titleLabel="복합 리스트 제목"
            itemLabelPrefix="복합 리스트 항목"
            onTitleChange={(value) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', value)}
            onItemChange={(index, value) => store.actions.updateCustomComplexListItem(sectionId, itemId, block.id, index, value)}
            onItemRemove={(index) => store.actions.removeCustomComplexListItem(sectionId, itemId, block.id, index)}
        />
    );
}

export function CustomComplexImageBlock({ block, sectionId, itemId, store, editable, fillHeight = false, measureOnly = false }) {
    const baseKey = `custom.${sectionId}.${itemId}.blocks.${block.id}`;
    return (
        <GenericImageBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            captionKey={`${baseKey}.caption`}
            titleLabel="복합 이미지 블록 제목"
            captionLabel="복합 이미지 블록 캡션"
            altFallback="custom"
            fillHeight={fillHeight}
            measureOnly={measureOnly}
            uploadInputIdPrefix={`custom-image-${sectionId}-${itemId}-${block.id}`}
            onTitleChange={(value) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'title', value)}
            onCaptionChange={(value) => store.actions.updateCustomComplexBlock(sectionId, itemId, block.id, 'caption', value)}
            onImageUpload={(index, value) => store.actions.updateCustomComplexImage(sectionId, itemId, block.id, index, value)}
            onImageClear={(index) => store.actions.updateCustomComplexImage(sectionId, itemId, block.id, index, '')}
            onImageRemove={(index) => store.actions.removeCustomComplexImage(sectionId, itemId, block.id, index)}
        />
    );
}
