import { selectableInputProps } from '../editor-primitives/index.jsx';
import EditableCustomText from './EditableCustomText.jsx';

export default function CustomTimelineItemRenderer({ sectionId, item, store, disabled }) {
    const dateKey = `custom.${sectionId}.${item.id}.date`;
    const titleKey = `custom.${sectionId}.${item.id}.title`;
    const descKey = `custom.${sectionId}.${item.id}.description`;

    return (
        <div className="custom-item timeline">
            <EditableCustomText
                value={item.date}
                placeholder="날짜"
                onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'date', value)}
                className="custom-input meta"
                disabled={disabled}
                {...selectableInputProps(store, dateKey, '타임라인 날짜')}
            />
            <EditableCustomText
                value={item.title}
                placeholder="제목"
                onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                className="custom-input title"
                disabled={disabled}
                {...selectableInputProps(store, titleKey, '타임라인 제목')}
            />
            <EditableCustomText
                as="textarea"
                value={item.description}
                placeholder="설명"
                onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                className="custom-input description"
                disabled={disabled}
                {...selectableInputProps(store, descKey, '타임라인 설명')}
            />
        </div>
    );
}
