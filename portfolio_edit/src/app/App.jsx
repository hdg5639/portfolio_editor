import './styles/index.css';
import { useMemo, useState } from 'react';
import { usePortfolioStore } from '../features/editor/hooks/usePortfolioStore.js';
import EditorWorkspace from '../features/editor/components/app/EditorWorkspace.jsx';
import DashboardShell from '../features/dashboard/components/DashboardShell.jsx';
import HomePage from '../features/dashboard/components/HomePage.jsx';
import ProjectsPage from '../features/dashboard/components/ProjectsPage.jsx';
import TemplatesPage from '../features/dashboard/components/TemplatesPage.jsx';

function DashboardView({ activeView, onNavigate, onOpenEditor }) {
  const page = useMemo(() => {
    switch (activeView) {
      case 'projects':
        return <ProjectsPage onOpenEditor={onOpenEditor} />;
      case 'templates':
        return <TemplatesPage />;
      default:
        return <HomePage onOpenEditor={onOpenEditor} />;
    }
  }, [activeView, onOpenEditor]);

  return (
    <div className="dashboard-root">
      <DashboardShell activeView={activeView} onNavigate={onNavigate}>
        {page}
      </DashboardShell>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const store = usePortfolioStore();

  if (activeView === 'editor') {
    return <EditorWorkspace store={store} onExit={() => setActiveView('projects')} />;
  }

  return (
    <DashboardView
      activeView={activeView}
      onNavigate={setActiveView}
      onOpenEditor={() => setActiveView('editor')}
    />
  );
}
