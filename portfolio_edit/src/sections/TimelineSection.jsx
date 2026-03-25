import InlineEditable from '../components/InlineEditable';
import { getCardSelectionState, getTimelineItemSelectionState } from '../utils/storeHelpers';

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

export default function TimelineSection({ store, sectionKey, title }) {
    const { portfolio, actions } = store;
    const items = portfolio[sectionKey] || [];
    const cardSelection = getCardSelectionState(store.selected?.key, 'timelineCard', [sectionKey, `section.${sectionKey}`]);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={actions.sectionCardStyle('timelineCard')}
            onClick={(e) => {
                e.stopPropagation();
                store.actions.select({ key: 'timelineCard', label: `${title} 카드` });
            }}
        >
            {cardSelection.active ? (
                <SelectionBadge label={cardSelection.selected ? `${title} 카드 선택됨` : `${title} 카드 내부 선택`} tone="card" />
            ) : null}

            <div className="section-head">
                <h2 className="section-title" style={actions.styleFor(`section.${sectionKey}.title`)}>
                    {title}
                </h2>
            </div>

            <div className="timeline-list">
                {items.map((item) => {
                    const rowSelection = getTimelineItemSelectionState(store.selected?.key, sectionKey, item.id);
                    return (
                    <div className={`timeline-row selection-scope selection-item ${rowSelection.selected ? 'is-selected' : ''} ${rowSelection.ancestor ? 'is-ancestor' : ''}`} key={item.id}>
                        {rowSelection.active ? (
                            <SelectionBadge label={rowSelection.selected ? `${title} 선택됨` : `${title} 내부 선택`} tone="item" />
                        ) : null}
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
                    );
                })}
            </div>
        </section>
    );
}