import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { AppShell } from '@/components/layout';
import { LoginPage, RegisterPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/projects';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
      <p className="text-lg text-gray-400">{title} — Coming in Phase 2</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="my-tasks" element={<PlaceholderPage title="My Tasks" />} />
        <Route path="inbox" element={<PlaceholderPage title="Inbox" />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id/*" element={<PlaceholderPage title="Project Detail" />} />
        <Route path="teams" element={<PlaceholderPage title="Teams" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="trash" element={<PlaceholderPage title="Trash" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
