import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { register } from '../api/authApi';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'First Name', field: 'firstName', type: 'text' },
            { label: 'Last Name', field: 'lastName', type: 'text' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'Phone Number', field: 'phoneNumber', type: 'tel' },
            { label: 'Password', field: 'password', type: 'password' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={set(field)}
                required={field !== 'phoneNumber'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
