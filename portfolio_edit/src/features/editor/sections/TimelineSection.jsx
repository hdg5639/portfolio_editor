import InlineEditable from '../components/InlineEditable';
import { SelectionBadge, createSelectHandler, inlineEditableProps, selectableStyle } from '../components/editor-primitives/index.jsx';
import { getCardSelectionState, getTimelineItemSelectionState } from '../utils/storeHelpers';
import { SelectionKey } from '../utils/selectionKeys.js';


export default function TimelineSection({ store, sectionKey, title }) {
    const { portfolio, actions } = store;
    const items = portfolio[sectionKey] || [];
    const cardKey = sectionKey === 'awards' ? 'awardsCard' : 'certificatesCard';
    const cardSelection = getCardSelectionState(store.selected?.key, cardKey, [sectionKey, `section.${sectionKey}`]);

    return (
        <section
            className={`portfolio-card selection-scope selection-card ${cardSelection.selected ? 'is-selected' : ''} ${cardSelection.ancestor ? 'is-ancestor' : ''}`}
            style={actions.sectionCardStyle(cardKey)}
            onClick={createSelectHandler(store, cardKey, `${title} 카드`)}
        >
            {cardSelection.selected ? (
                <SelectionBadge label={`${title} 카드 선택됨`} tone="card" />
            ) : null}

            <div className="section-head">
                <h2
                    className="section-title"
                    style={selectableStyle(store, `section.${sectionKey}.title`)}
                    onClick={createSelectHandler(store, `section.${sectionKey}.title`, `${title} 섹션 제목`)}
                >
                    {title}
                </h2>
            </div>

            <div className="timeline-list">
                {items.map((item) => {
                    const rowSelection = getTimelineItemSelectionState(store.selected?.key, sectionKey, item.id);
                    return (
                        <div
                            className={`timeline-row selection-scope selection-item ${rowSelection.selected ? 'is-selected' : ''} ${rowSelection.ancestor ? 'is-ancestor' : ''}`}
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                store.actions.select({ key: SelectionKey.timeline.item(sectionKey, item.id), label: `${title} 항목` });
                            }}
                        >
                            <InlineEditable
                                value={item.date}
                                onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'date', value)}
                                className="timeline-date"
                                {...inlineEditableProps(store, `${sectionKey}.${item.id}.date`, `${title} 날짜`)}
                            />

                            <div className="timeline-content">
                                <div className="timeline-title-row">
                                    <InlineEditable
                                        tag="strong"
                                        value={item.title}
                                        onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'title', value)}
                                        className="timeline-title"
                                        {...inlineEditableProps(store, `${sectionKey}.${item.id}.title`, `${title} 제목`)}
                                    />

                                    {store.mode === 'edit' ? (
                                        <button
                                            type="button"
                                            className="timeline-item-remove ghost danger small"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                actions.removeTimelineItem(sectionKey, item.id);
                                            }}
                                            aria-label={`${title} 항목 삭제`}
                                        >
                                            X
                                        </button>
                                    ) : null}
                                </div>

                                <InlineEditable
                                    multiline
                                    value={item.desc}
                                    onChange={(value) => actions.updateTimelineItem(sectionKey, item.id, 'desc', value)}
                                    className="timeline-desc"
                                    {...inlineEditableProps(store, `${sectionKey}.${item.id}.desc`, `${title} 설명`)}
                                />
                            </div>
                        </div>
                    );
                })}

                {store.mode === 'edit' ? (
                    <button
                        type="button"
                        className="timeline-add-button ghost small"
                        onClick={(event) => {
                            event.stopPropagation();
                            actions.addTimelineItem(sectionKey);
                        }}
                    >
                        {title} 항목 추가
                    </button>
                ) : null}
            </div>
        </section>
    );
}