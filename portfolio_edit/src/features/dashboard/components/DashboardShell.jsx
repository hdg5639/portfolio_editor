import { DASHBOARD_NAV_ITEMS, RECENT_PROJECTS } from '../constants/dashboardData.js';

function SidebarBrand() {
  return (
    <div className="dashboard-brand">
      <div className="dashboard-brand-mark">PS</div>
      <div>
        <strong>Portfolio Studio</strong>
        <p>workspace for makers</p>
      </div>
    </div>
  );
}

function SidebarRail({ activeView, onNavigate }) {
  return (
    <aside className="dashboard-sidebar-rail">
      <button type="button" className="dashboard-rail-toggle" aria-label="사이드 메뉴">
        ≡
      </button>

      <button type="button" className="dashboard-create-button" onClick={() => onNavigate('editor')}>
        <span>＋</span>
        <span>새 문서</span>
      </button>

      <nav className="dashboard-rail-nav">
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`dashboard-rail-link ${activeView === item.key ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="dashboard-rail-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <button type="button" className="dashboard-avatar-pill">
          김
        </button>
      </div>
    </aside>
  );
}

function SidebarPanel({ onNavigate }) {
  return (
    <aside className="dashboard-sidebar-panel">
      <SidebarBrand />

      <div className="dashboard-side-promo">
        <span className="dashboard-side-eyebrow">오늘의 작업 흐름</span>
        <strong>아이디어 정리부터 PDF 배포까지 한 화면에서 이어가기</strong>
        <p>초안, 템플릿, 최근 포트폴리오를 한 번에 확인하고 바로 편집실로 들어갈 수 있어요.</p>
        <div className="dashboard-side-actions">
          <button type="button" className="dashboard-side-primary" onClick={() => onNavigate('editor')}>
            편집실 열기
          </button>
          <button type="button" className="dashboard-side-secondary" onClick={() => onNavigate('templates')}>
            템플릿 보기
          </button>
        </div>
      </div>

      <div className="dashboard-side-group dashboard-side-stats">
        <div>
          <small>이번 주 편집</small>
          <strong>12</strong>
        </div>
        <div>
          <small>PDF 내보내기</small>
          <strong>4</strong>
        </div>
        <div>
          <small>저장된 초안</small>
          <strong>7</strong>
        </div>
      </div>

      <div className="dashboard-side-group">
        <div className="dashboard-section-head compact">
          <span className="dashboard-side-group-label">최근 작업</span>
          <button type="button" className="dashboard-inline-link" onClick={() => onNavigate('projects')}>
            전체 보기
          </button>
        </div>
        <div className="dashboard-side-list">
          {RECENT_PROJECTS.slice(0, 5).map((item) => (
            <button key={item.id} type="button" className="dashboard-side-list-item" onClick={() => onNavigate('editor')}>
              <span className={`dashboard-side-list-thumb kind-${item.kind}`}>▭</span>
              <span className="dashboard-side-list-text">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MobileBottomNav({ activeView, onNavigate }) {
  const mobileItems = [
    { key: 'home', shortLabel: '홈', icon: '⌂' },
    { key: 'projects', shortLabel: '보관함', icon: '▣' },
    { key: 'templates', shortLabel: '템플릿', icon: '◫' },
    { key: 'editor', shortLabel: '편집실', icon: '✎' },
    { key: 'more', shortLabel: '더보기', icon: '⋯' },
  ];

  return (
    <nav className="dashboard-mobile-bottom-nav">
      {mobileItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`dashboard-mobile-nav-item ${activeView === item.key ? 'is-active' : ''}`}
          onClick={() => onNavigate(item.key === 'more' ? 'home' : item.key)}
        >
          <span>{item.icon}</span>
          <small>{item.shortLabel}</small>
        </button>
      ))}
    </nav>
  );
}

export default function DashboardShell({ activeView, onNavigate, children }) {
  return (
    <div className="dashboard-shell">
      <SidebarRail activeView={activeView} onNavigate={onNavigate} />
      <SidebarPanel activeView={activeView} onNavigate={onNavigate} />

      <main className="dashboard-content-shell">{children}</main>

      <MobileBottomNav activeView={activeView} onNavigate={onNavigate} />
    </div>
  );
}
