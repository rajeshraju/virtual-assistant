import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { login } from '../api/authApi';
import toast from 'react-hot-toast';
import '../styles/auth/AuthPages.less';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      setAuth(res.token, res.user);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Virtual Assistant Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="auth-page__label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="auth-page__input" />
          </div>
          <div>
            <label className="auth-page__label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="auth-page__input" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full btn-primary py-2 px-4 rounded-lg font-medium">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-page__footer">
          No account? <Link to="/register" className="auth-page__link">Register</Link>
        </p>
      </div>
    </div>
  );
}
