import InlineEditable from '../components/InlineEditable';

function bind(store, key, label) {
    return {
        editable: store.mode === 'edit',
        selected: store.selected?.key === key,
        onSelect: () => store.actions.select({ key, label }),
        style: store.actions.styleFor(key),
    };
}

export default function SkillSection({ store }) {
    const { portfolio, actions } = store;

    return (
        <section
            className="portfolio-card"
            style={actions.sectionCardStyle('skillsCard')}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'skillsCard', label: '기술 스택 카드' });
            }}
        >
            <div className="section-head">
                <h2 className="section-title" style={actions.styleFor('section.skills.title')}>
                    기술 스택
                </h2>
            </div>

            <div className="skill-table">
                {portfolio.skills.map((skill) => (
                    <div className="skill-row" key={skill.id}>
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
                ))}
            </div>
        </section>
    );
}