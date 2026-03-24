export default function SidebarSection({ title, action, children }) {
  return (
    <section className="editor-card">
      <div className="row between section-headline">
        <h3>{title}</h3>
        {action}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
