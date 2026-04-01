import { GenericImageBlock, GenericListBlock, GenericTextBlock } from './SharedBlockRenderers.jsx';

export function ProjectTextBlock({ block, projectId, store, editable }) {
    const baseKey = `projects.${projectId}.blocks.${block.id}`;
    return (
        <GenericTextBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            contentKey={`${baseKey}.content`}
            titleLabel="프로젝트 블록 제목"
            contentLabel="프로젝트 블록 본문"
            onTitleChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'title', value)}
            onContentChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'content', value)}
        />
    );
}

export function ProjectListBlock({ block, projectId, store, editable }) {
    const baseKey = `projects.${projectId}.blocks.${block.id}`;
    return (
        <GenericListBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            titleLabel="프로젝트 리스트 제목"
            itemLabelPrefix="프로젝트 리스트 항목"
            onTitleChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'title', value)}
            onItemChange={(index, value) => store.actions.updateProjectListItem(projectId, block.id, index, value)}
            onItemRemove={(index) => store.actions.removeProjectListItem(projectId, block.id, index)}
        />
    );
}

export function ProjectImageBlock({ block, projectId, store, editable, fillHeight = false, measureOnly = false }) {
    const baseKey = `projects.${projectId}.blocks.${block.id}`;
    return (
        <GenericImageBlock
            block={block}
            editable={editable}
            store={store}
            baseKey={baseKey}
            titleKey={`${baseKey}.title`}
            captionKey={`${baseKey}.caption`}
            titleLabel="프로젝트 이미지 블록 제목"
            captionLabel="프로젝트 이미지 캡션"
            altFallback="project"
            fillHeight={fillHeight}
            measureOnly={measureOnly}
            uploadInputIdPrefix={`project-image-${projectId}-${block.id}`}
            onTitleChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'title', value)}
            onCaptionChange={(value) => store.actions.updateProjectBlock(projectId, block.id, 'caption', value)}
            onImageUpload={(index, value) => store.actions.updateProjectImage(projectId, block.id, index, value)}
            onImageClear={(index) => store.actions.updateProjectImage(projectId, block.id, index, '')}
            onImageRemove={(index) => store.actions.removeProjectImage(projectId, block.id, index)}
        />
    );
}
