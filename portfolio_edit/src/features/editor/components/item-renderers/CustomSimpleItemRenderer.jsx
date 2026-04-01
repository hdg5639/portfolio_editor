import { selectableInputProps } from '../editor-primitives/index.jsx';
import EditableCustomText from './EditableCustomText.jsx';

export default function CustomSimpleItemRenderer({ sectionId, item, store, disabled }) {
    const titleKey = `custom.${sectionId}.${item.id}.title`;
    const descKey = `custom.${sectionId}.${item.id}.description`;

    return (
        <div className="custom-item simple">
            <EditableCustomText
                value={item.title}
                placeholder="제목"
                onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'title', value)}
                className="custom-input title"
                disabled={disabled}
                {...selectableInputProps(store, titleKey, '커스텀 항목 제목')}
            />
            <EditableCustomText
                as="textarea"
                value={item.description}
                placeholder="설명"
                onChange={(value) => store.actions.updateCustomSectionItem(sectionId, item.id, 'description', value)}
                className="custom-input description"
                disabled={disabled}
                {...selectableInputProps(store, descKey, '커스텀 항목 설명')}
            />
        </div>
    );
}
