import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EmailRulesPage from './pages/EmailRulesPage';
import EmailLogsPage from './pages/EmailLogsPage';
import PhoneCallsPage from './pages/PhoneCallsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute permission="canViewScheduling"><CalendarPage /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute permission="canViewScheduling"><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute permission="canViewCalls"><PhoneCallsPage /></ProtectedRoute>} />
      <Route path="/email-rules" element={<ProtectedRoute permission="canViewEmails"><EmailRulesPage /></ProtectedRoute>} />
      <Route path="/email-logs" element={<ProtectedRoute permission="canViewEmails"><EmailLogsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
