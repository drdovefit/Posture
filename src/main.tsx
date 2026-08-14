import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Light mode only — clear any dark-mode class a previous version may have set.
document.documentElement.classList.remove('dark');
localStorage.removeItem('posturelab-theme');

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const AnalyzePage = lazy(() => import('./features/analysis/AnalyzePage'));
const HistoryPage = lazy(() => import('./features/history/HistoryPage'));
const ComparePage = lazy(() => import('./features/history/ComparePage'));
const PainPage = lazy(() => import('./features/pain/PainPage'));
const GuidePage = lazy(() => import('./features/dashboard/GuidePage'));

function Fallback() {
  return (
    <div className="grid place-items-center py-20 text-slate-400">
      <div className="animate-pulse text-sm">Loading…</div>
    </div>
  );
}

function page(el: React.ReactNode) {
  return <Suspense fallback={<Fallback />}>{el}</Suspense>;
}

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: page(<DashboardPage />) },
      { path: 'analyze', element: page(<AnalyzePage />) },
      { path: 'history', element: page(<HistoryPage />) },
      { path: 'compare', element: page(<ComparePage />) },
      { path: 'pain', element: page(<PainPage />) },
      { path: 'guide', element: page(<GuidePage />) },
    ],
  },
]);

// Keep the installed PWA fresh: poll for a new service worker and reload once
// it takes control, so users always get the latest deploy without manual cache
// clearing.
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.ready.then((reg) => {
    reg.update();
    setInterval(() => reg.update(), 30_000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
