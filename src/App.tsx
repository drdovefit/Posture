import { NavLink, Outlet, useLocation } from 'react-router-dom';
import SyncButton from './components/SyncButton';

const nav = [
  { to: '/', label: 'Dashboard', icon: '◱', end: true },
  { to: '/analyze', label: 'Analyze', icon: '＋' },
  { to: '/history', label: 'History', icon: '≣' },
  { to: '/compare', label: 'Compare', icon: '⇄' },
  { to: '/pain', label: 'Pain diary', icon: '♥' },
  { to: '/guide', label: 'Guide', icon: '?' },
];

export default function App() {
  const loc = useLocation();

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center">
            <img
              src={`${import.meta.env.BASE_URL}brand/wordmark.png`}
              alt="Posture Lab"
              className="h-11 w-auto sm:h-14"
            />
          </NavLink>
          <div className="ml-auto flex items-center gap-2">
            <SyncButton />
            <NavLink
              to="/settings"
              aria-label="Settings"
              title="Settings"
              className={({ isActive }) =>
                `grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              ⚙
            </NavLink>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="mr-1.5 opacity-70">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main key={loc.pathname} className="flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        PostureLab is an educational tool, not medical advice.
        <span className="mx-1">·</span>
        <span title="App version">Version {__APP_VERSION__}</span>
      </footer>
    </div>
  );
}
