import InlineEditable from '../components/InlineEditable';
import { SelectionBadge, createSelectHandler, inlineEditableProps, selectableStyle } from '../components/editor-primitives/index.jsx';
import { getCardSelectionState, getSkillRowSelectionState } from '../utils/storeHelpers';
import { SelectionKey } from '../utils/selectionKeys.js';


export default function SkillSection({ store }) {
    const { portfolio, actions } = store;
    const cardSelection = getCardSelectionState(store.selected?.key, SelectionKey.card.skills(), ['skills', 'section.skills']);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={actions.sectionCardStyle(SelectionKey.card.skills())}
            onClick={createSelectHandler(store, SelectionKey.card.skills(), '기술 스택 카드')}
        >
            {cardSelection.selected ? (
                <SelectionBadge label="기술 카드 선택됨" tone="card" />
            ) : null}

            <div className="section-head">
                <h2
                    className="section-title"
                    style={selectableStyle(store, 'section.skills.title')}
                    onClick={createSelectHandler(store, 'section.skills.title', '기술 스택 섹션 제목')}
                >
                    기술 스택
                </h2>
            </div>

            <div className="skill-table">
                {portfolio.skills.map((skill) => {
                    const rowSelection = getSkillRowSelectionState(store.selected?.key, skill.id);
                    return (
                    <div className={`skill-row selection-scope selection-item ${rowSelection.selected ? 'is-selected' : ''} ${rowSelection.ancestor ? 'is-ancestor' : ''}`} key={skill.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            store.actions.select({ key: SelectionKey.skill.row(skill.id), label: `${skill.category || '기술'} 행` });
                        }}>
                        <InlineEditable
                            tag="strong"
                            value={skill.category}
                            onChange={(value) => actions.updateSkill(skill.id, 'category', value)}
                            className="skill-category"
                            {...inlineEditableProps(store, `skills.${skill.id}.category`, `기술 카테고리 ${skill.category}`)}
                        />

                        <InlineEditable
                            value={skill.value}
                            onChange={(value) => actions.updateSkill(skill.id, 'value', value)}
                            className="skill-value"
                            {...inlineEditableProps(store, `skills.${skill.id}.value`, `기술 내용 ${skill.category}`)}
                        />
                    </div>
                    );
                })}
            </div>
        </section>
    );
}