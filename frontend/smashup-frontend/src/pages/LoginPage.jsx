import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { Card, Button, Input, Toast, useFlash } from '../components';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { toasts, show, hide } = useFlash();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login(formData.username, formData.password);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_id', response.data.user?.id || '');
      localStorage.setItem('username', response.data.user?.username || formData.username);
      localStorage.setItem('email', response.data.user?.email || '');
      show('Welcome back!', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      const errData = err.response?.data;
      const msg =
        errData?.errors?.non_field_errors?.[0] ||
        errData?.non_field_errors?.[0] ||
        errData?.detail ||
        (typeof errData === 'string' ? errData : null) ||
        'Invalid username or password';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-github-bg px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-github-purple font-bold text-lg">Smash</span>
            <span className="text-github-orange font-bold text-lg">Up</span>
          </div>
          <h1 className="text-lg font-medium text-github-text mb-1">Sign in</h1>
          <p className="text-github-secondaryText text-sm">Sign in to your SmashUp account</p>

          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onClose={hide} />
          ))}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label-github">Username</label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="form-group">
              <label className="label-github">Password</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-github-border text-center">
            <p className="text-github-secondaryText text-sm">Don't have an account?</p>
            <Link
              to="/register"
              className="text-github-blue hover:underline font-medium inline-block mt-1"
            >
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
