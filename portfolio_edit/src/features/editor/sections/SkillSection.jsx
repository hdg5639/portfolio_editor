import InlineEditable from '../components/InlineEditable';
import { getCardSelectionState, getSkillRowSelectionState } from '../utils/storeHelpers';

function bind(store, key, label) {
    return {
        editable: store.mode === 'edit',
        selected: store.selected?.key === key,
        onSelect: () => store.actions.select({ key, label }),
        style: store.actions.styleFor(key),
    };
}

function SelectionBadge({ label, tone = 'block' }) {
    return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
}

export default function SkillSection({ store }) {
    const { portfolio, actions } = store;
    const cardSelection = getCardSelectionState(store.selected?.key, 'skillsCard', ['skills', 'section.skills']);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={actions.sectionCardStyle('skillsCard')}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'skillsCard', label: '기술 스택 카드' });
            }}
        >
            {cardSelection.selected ? (
                <SelectionBadge label="기술 카드 선택됨" tone="card" />
            ) : null}

            <div className="section-head">
                <h2 className="section-title" style={actions.styleFor('section.skills.title')}>
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
                            store.actions.select({ key: `skills.${skill.id}`, label: `${skill.category || '기술'} 행` });
                        }}>
                        <InlineEditable
                            tag="strong"
                            value={skill.category}
                            onChange={(value) => actions.updateSkill(skill.id, 'category', value)}
                            className="skill-category"
                            {...bind(store, `skills.${skill.id}.category`, `기술 카테고리 ${skill.category}`)}
                        />

                        <InlineEditable
                            value={skill.value}
                            onChange={(value) => actions.updateSkill(skill.id, 'value', value)}
                            className="skill-value"
                            {...bind(store, `skills.${skill.id}.value`, `기술 내용 ${skill.category}`)}
                        />
                    </div>
                    );
                })}
            </div>
        </section>
    );
}