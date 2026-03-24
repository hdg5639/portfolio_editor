function renderBlock(block) {
  if (block.type === 'text') {
    return <p className="project-paragraph">{block.content}</p>;
  }

  if (block.type === 'list') {
    return (
      <ul className="project-list">
        {block.items?.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="project-images-wrap">
        <div className={`project-images ${block.images?.length >= 4 ? 'four' : ''}`}>
          {(block.images || []).map((src, index) => (
            <img key={index} src={src} alt={block.caption || `project-${index}`} />
          ))}
        </div>
        {block.caption ? <p className="image-caption">{block.caption}</p> : null}
      </div>
    );
  }

  return null;
}

export default function ProjectCard({ project, accent }) {
  return (
    <article className="project-card preview-card">
      <div className="project-top">
        <div>
          <h4>{project.title}</h4>
          <p className="project-period mono">{project.period}</p>
        </div>
        <div className="project-role" style={{ color: accent }}>{project.role}</div>
      </div>

      <p className="project-summary">{project.summary}</p>

      {project.blocks.map((block) => (
        <section key={block.id} className="project-block">
          <h5>{block.title}</h5>
          {renderBlock(block)}
        </section>
      ))}

      <div className="project-footer">
        <div className="chip-list">
          {(project.techStack || []).filter(Boolean).map((tech, index) => (
            <span key={`${project.id}-${index}`} className="chip">{tech}</span>
          ))}
        </div>
        {project.link ? (
          <a href={project.link} target="_blank" rel="noreferrer" style={{ color: accent }}>
            프로젝트 링크
          </a>
        ) : null}
      </div>
    </article>
  );
}
