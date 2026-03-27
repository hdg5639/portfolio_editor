export default function PanelSection({
                                         title,
                                         action,
                                         children,
                                         collapsible = false,
                                         defaultOpen = true,
                                     }) {
    if (collapsible) {
        return (
            <details className="panel-section panel-section-accordion" open={defaultOpen}>
                <summary className="panel-section-head">
                    <strong>{title}</strong>
                    {action ? <span className="panel-section-head-action">{action}</span> : null}
                </summary>
                <div className="panel-section-body">{children}</div>
            </details>
        );
    }

    return (
        <section className="panel-section">
            <div className="panel-section-head">
                <strong>{title}</strong>
                {action ? action : null}
            </div>
            <div className="panel-section-body">{children}</div>
        </section>
    );
}