import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { register } from '../api/authApi';
import toast from 'react-hot-toast';
import '../styles/auth/AuthPages.less';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      setAuth(res.token, res.user);
      navigate('/dashboard');
    } catch {
      toast.error('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'First Name', field: 'firstName', type: 'text' },
            { label: 'Last Name', field: 'lastName', type: 'text' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'Phone Number', field: 'phoneNumber', type: 'tel' },
            { label: 'Password', field: 'password', type: 'password' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="auth-page__label">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={set(field)}
                required={field !== 'phoneNumber'}
                className="auth-page__input" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full btn-primary py-2 px-4 rounded-lg font-medium">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-page__footer">
          Already have an account? <Link to="/login" className="auth-page__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
