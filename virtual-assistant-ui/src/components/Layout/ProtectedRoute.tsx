import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Sidebar from './Sidebar';
import type { User } from '../../types';

type Permission = 'canViewEmails' | 'canViewCalls' | 'canViewScheduling';

interface Props {
  children: React.ReactNode;
  permission?: Permission;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, permission, adminOnly }: Props) {
  const { token, user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading…</div>
    </div>
  );

  if (!token) return <Navigate to="/login" replace />;

  if (adminOnly && user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  if (permission && user && !(user as User)[permission]) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
