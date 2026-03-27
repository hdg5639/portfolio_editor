import { HIGHLIGHT_CARDS, HOME_QUICK_ACTIONS, RECENT_PROJECTS } from '../constants/dashboardData.js';

function QuickAction({ label, icon, hint }) {
  return (
    <button type="button" className="dashboard-quick-action">
      <span className="dashboard-quick-action-icon">{icon}</span>
      <strong>{label}</strong>
      <small>{hint}</small>
    </button>
  );
}

function HighlightCard({ title, description, badge, tone }) {
  return (
    <article className={`dashboard-highlight-card tone-${tone}`}>
      <span className="dashboard-card-badge">{badge}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <span className="dashboard-card-inline-link">바로 시작</span>
    </article>
  );
}

function RecentCard({ title, subtitle, meta, onOpenEditor }) {
  return (
    <button type="button" className="dashboard-recent-card" onClick={onOpenEditor}>
      <div className="dashboard-recent-preview">
        <div className="dashboard-recent-page">
          <span className="dashboard-recent-line short" />
          <span className="dashboard-recent-line long" />
          <span className="dashboard-recent-line medium" />
        </div>
      </div>
      <div className="dashboard-recent-card-body">
        <strong>{title}</strong>
        <small>{subtitle}</small>
        <span className="dashboard-recent-meta">{meta}</span>
      </div>
    </button>
  );
}

export default function HomePage({ onOpenEditor }) {
  return (
    <div className="dashboard-page dashboard-home-page">
      <section className="dashboard-hero-card dashboard-hero-home">
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-kicker">Portfolio workspace</span>
          <h1>정리되지 않은 경험을<br />보여줄 수 있는 결과물로 바꾸세요.</h1>
          <p>
            프로젝트, 수상, 자격증, 템플릿을 한 흐름으로 연결해서 포트폴리오를 빠르게 완성하는 작업실입니다.
          </p>
        </div>
        <div className="dashboard-hero-utilities">
          <div className="dashboard-search-bar">
            <span aria-hidden="true">⌕</span>
            <input type="text" placeholder="프로젝트, 템플릿, 업로드 파일을 검색해 보세요" />
          </div>
          <div className="dashboard-hero-stat-grid">
            <div className="dashboard-stat-card">
              <small>최근 편집</small>
              <strong>12건</strong>
            </div>
            <div className="dashboard-stat-card">
              <small>활성 템플릿</small>
              <strong>8개</strong>
            </div>
            <div className="dashboard-stat-card">
              <small>내보낸 PDF</small>
              <strong>4회</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>빠른 시작</h2>
          <button type="button" className="dashboard-inline-link" onClick={onOpenEditor}>
            새 포트폴리오 만들기
          </button>
        </div>
        <div className="dashboard-quick-actions-row">
          {HOME_QUICK_ACTIONS.map((item) => (
            <QuickAction key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>추천 시작점</h2>
        </div>
        <div className="dashboard-highlight-grid">
          {HIGHLIGHT_CARDS.map((card) => (
            <HighlightCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>최근 작업</h2>
          <button type="button" className="dashboard-inline-link" onClick={onOpenEditor}>
            편집실 열기
          </button>
        </div>
        <div className="dashboard-recent-grid">
          {RECENT_PROJECTS.map((item) => (
            <RecentCard key={item.id} {...item} onOpenEditor={onOpenEditor} />
          ))}
        </div>
      </section>
    </div>
  );
}
