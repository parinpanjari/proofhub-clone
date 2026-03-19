import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Inbox,
  FolderKanban,
  Users,
  BarChart3,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const mainNav: NavItem[] = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'My Tasks', icon: CheckSquare, path: '/my-tasks' },
  { label: 'Inbox', icon: Inbox, path: '/inbox' },
];

const bottomNav: NavItem[] = [
  { label: 'Teams', icon: Users, path: '/teams' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Trash', icon: Trash2, path: '/trash' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const { default: api } = await import('@/api/axios');
      await api.post('/auth/logout');
    } catch {
      // Logout even if API call fails
    }
    logout();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="text-lg font-semibold">ProofHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main nav items */}
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Projects section */}
        <div className="mt-6">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            <span>Projects</span>
            <div className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 cursor-pointer hover:text-gray-600" />
              {projectsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </div>
          </button>

          {projectsExpanded && (
            <div className="mt-1 space-y-1">
              <NavLink
                to="/projects"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  location.pathname === '/projects'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <FolderKanban className="h-4 w-4" />
                All Projects
              </NavLink>
              {/* Sample project entries — populated dynamically in Phase 2 */}
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                Website Redesign
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav items */}
        <div className="mt-6 space-y-1">
          {bottomNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
            <p className="truncate text-xs text-gray-400">{user?.email ?? ''}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
