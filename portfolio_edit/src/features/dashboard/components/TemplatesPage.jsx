import { INSPIRED_TEMPLATES, TEMPLATE_BROWSE_ROWS, TEMPLATE_CATEGORIES } from '../constants/dashboardData.js';

function CategoryChip({ label }) {
  return (
    <button type="button" className="dashboard-category-chip">
      <span className="dashboard-category-dot" />
      {label}
    </button>
  );
}

function TemplateTile({ title, compact }) {
  return (
    <button type="button" className={`dashboard-template-tile ${compact ? 'is-compact' : ''}`}>
      <div className="dashboard-template-illustration" />
      <strong>{title}</strong>
    </button>
  );
}

function InspiredTemplateCard({ title, author, summary }) {
  return (
    <article className="dashboard-inspired-card">
      <div className="dashboard-inspired-preview">
        <span className="dashboard-inspired-badge">{author}</span>
      </div>
      <strong>{title}</strong>
      <p>{summary}</p>
    </article>
  );
}

export default function TemplatesPage() {
  return (
    <div className="dashboard-page dashboard-templates-page">
      <section className="dashboard-toolbar-card template-toolbar-card">
        <div className="dashboard-toolbar-copy">
          <span className="dashboard-hero-kicker">Library</span>
          <h1>템플릿 라이브러리</h1>
          <p>깔끔한 포트폴리오부터 발표용 문서까지, 시작점을 고르고 내 콘텐츠로 바꾸세요.</p>
        </div>
        <button type="button" className="dashboard-light-button">
          북마크 모음
        </button>
      </section>

      <section className="dashboard-surface-card dashboard-toolbar-surface">
        <div className="dashboard-search-bar compact">
          <span aria-hidden="true">⌕</span>
          <input type="text" placeholder="원하는 템플릿을 검색해 보세요" />
        </div>
        <div className="dashboard-category-row">
          {TEMPLATE_CATEGORIES.map((label) => (
            <CategoryChip key={label} label={label} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>카테고리 둘러보기</h2>
        </div>
        <div className="dashboard-template-browse-stack">
          {TEMPLATE_BROWSE_ROWS.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="dashboard-template-row-scroll">
              {row.map((title) => (
                <TemplateTile key={title} title={title} compact={rowIndex > 0} />
              ))}
              <button type="button" className="dashboard-carousel-arrow">›</button>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>추천 템플릿 큐레이션</h2>
        </div>
        <div className="dashboard-inspired-grid">
          {INSPIRED_TEMPLATES.map((item) => (
            <InspiredTemplateCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      <section className="dashboard-section-block">
        <div className="dashboard-section-head">
          <h2>빠르게 적용 가능한 포맷</h2>
        </div>
        <div className="dashboard-template-browse-stack">
          <div className="dashboard-template-row-scroll">
            {['포트폴리오', '브랜딩', '슬라이드', '리포트', 'SNS 카드', '포스터'].map((title) => (
              <TemplateTile key={title} title={title} />
            ))}
            <button type="button" className="dashboard-carousel-arrow">›</button>
          </div>
        </div>
      </section>
    </div>
  );
}
