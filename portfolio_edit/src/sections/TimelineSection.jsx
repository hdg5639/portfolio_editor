import InlineEditable from '../components/InlineEditable';

function bind(store, key, label) {
    return {
        editable: store.mode === 'edit',
        selected: store.selected?.key === key,
        onSelect: () => store.actions.select({ key, label }),
        style: store.actions.styleFor(key),
    };
}

export default function TimelineSection({ store, sectionKey, title }) {
    const { portfolio, actions } = store;
    const items = portfolio[sectionKey] || [];

    return (
        <section
            className="portfolio-card"
            style={actions.cardStyle()}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'card', label: '공통 카드' });
            }}
        >
            <div className="section-head">
                <h2 className="section-title" style={actions.styleFor(`section.${sectionKey}.title`)}>
                    {title}
                </h2>
            </div>

            <div className="timeline-list">
                {items.map((item) => (
                    <div className="timeline-row" key={item.id}>
                        <InlineEditable
                            value={item.date}
                            onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'date', value)}
                            className="timeline-date"
                            {...bind(store, `${sectionKey}.${item.id}.date`, `${title} 날짜`)}
                        />

                        <div className="timeline-content">
                            <InlineEditable
                                tag="strong"
                                value={item.title}
                                onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'title', value)}
                                className="timeline-title"
                                {...bind(store, `${sectionKey}.${item.id}.title`, `${title} 제목`)}
                            />

                            <InlineEditable
                                multiline
                                value={item.desc}
                                onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'desc', value)}
                                className="timeline-desc"
                                {...bind(store, `${sectionKey}.${item.id}.desc`, `${title} 설명`)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}