import { FOLDERS, PROJECT_FILTERS, RECENT_PROJECTS } from '../constants/dashboardData.js';

function FilterChip({ label }) {
  return (
    <button type="button" className="dashboard-filter-chip">
      {label}
      <span aria-hidden="true">⌄</span>
    </button>
  );
}

function ProjectStripCard({ title, subtitle, onOpenEditor }) {
  return (
    <button type="button" className="dashboard-project-strip-card" onClick={onOpenEditor}>
      <div className="dashboard-strip-thumb">
        <div className="dashboard-strip-thumbnail-card" />
      </div>
      <strong>{title}</strong>
      <small>{subtitle}</small>
    </button>
  );
}

function FolderCard({ title, caption, onOpenEditor }) {
  return (
    <button type="button" className="dashboard-folder-card" onClick={onOpenEditor}>
      <div className="dashboard-folder-visual">
        <div className="dashboard-folder-notch" />
        <div className="dashboard-folder-cover" />
      </div>
      <strong>{title}</strong>
      <small>{caption}</small>
    </button>
  );
}

function DesignCard({ title, subtitle, onOpenEditor }) {
  return (
    <button type="button" className="dashboard-design-card" onClick={onOpenEditor}>
      <div className="dashboard-design-preview" />
      <div className="dashboard-design-info">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      <span className="dashboard-design-menu">⋯</span>
    </button>
  );
}

export default function ProjectsPage({ onOpenEditor }) {
  return (
    <div className="dashboard-page dashboard-projects-page">
      <section className="dashboard-toolbar-card">
        <div className="dashboard-toolbar-copy">
          <span className="dashboard-hero-kicker">Archive</span>
          <h1>프로젝트 보관함</h1>
          <p>작업 중인 포트폴리오와 임시 초안, 폴더를 한곳에서 정리하세요.</p>
        </div>
        <button type="button" className="dashboard-dark-button" onClick={onOpenEditor}>
          새 포트폴리오
        </button>
      </section>

      <section className="dashboard-surface-card dashboard-toolbar-surface">
        <div className="dashboard-search-bar compact">
          <span aria-hidden="true">⌕</span>
          <input type="text" placeholder="프로젝트, 폴더, 업로드 파일을 검색할 수 있어요" />
        </div>
        <div className="dashboard-filter-row">
          {PROJECT_FILTERS.map((label) => (
            <FilterChip key={label} label={label} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>최근 편집한 항목</h2>
          <div className="dashboard-icon-actions">
            <button type="button">↕</button>
            <button type="button">☷</button>
            <button type="button" onClick={onOpenEditor}>＋</button>
          </div>
        </div>
        <div className="dashboard-project-strip">
          {RECENT_PROJECTS.map((item) => (
            <ProjectStripCard key={item.id} title={item.title} subtitle={item.subtitle} onOpenEditor={onOpenEditor} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>폴더</h2>
        </div>
        <div className="dashboard-folder-grid">
          {FOLDERS.map((folder) => (
            <FolderCard key={folder.id} {...folder} onOpenEditor={onOpenEditor} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>디자인 보드</h2>
        </div>
        <div className="dashboard-design-grid">
          {RECENT_PROJECTS.map((item) => (
            <DesignCard key={`design-${item.id}`} title={item.title} subtitle={item.subtitle} onOpenEditor={onOpenEditor} />
          ))}
        </div>
      </section>
    </div>
  );
}
