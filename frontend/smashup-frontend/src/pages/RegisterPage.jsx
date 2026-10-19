import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { Card, Button, Input, Toast, useFlash } from '../components';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password1: '',
    password2: '',
  });
  const [loading, setLoading] = useState(false);
  const { toasts, show, hide } = useFlash();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password1 !== formData.password2) {
      show('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password1: formData.password1,
        password2: formData.password2,
      });
      show('Account created successfully! Please log in.', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const serverError = err.response?.data;
      if (serverError) {
        const errors = serverError.errors || serverError;
        if (errors.username) {
          show(
            Array.isArray(errors.username) ? errors.username[0] : errors.username,
            'error'
          );
        } else if (errors.password1) {
          show(
            Array.isArray(errors.password1) ? errors.password1[0] : errors.password1,
            'error'
          );
        } else if (errors.password2) {
          show(
            Array.isArray(errors.password2) ? errors.password2[0] : errors.password2,
            'error'
          );
        } else if (errors.email) {
          show(
            Array.isArray(errors.email) ? errors.email[0] : errors.email,
            'error'
          );
        } else if (errors.non_field_errors) {
          show(
            Array.isArray(errors.non_field_errors)
              ? errors.non_field_errors[0]
              : errors.non_field_errors,
            'error'
          );
        } else {
          const allMessages = [];
          for (const key of Object.keys(errors)) {
            const val = errors[key];
            if (Array.isArray(val)) {
              allMessages.push(...val);
            } else {
              allMessages.push(String(val));
            }
          }
          show(allMessages.join(', '), 'error');
        }
      } else {
        show('Registration failed', 'error');
      }
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
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-github-purple font-bold text-lg">Smash</span>
            <span className="text-github-orange font-bold text-lg">Up</span>
          </div>
          <h1 className="text-lg font-medium text-github-text mb-1">Create account</h1>
          <p className="text-github-secondaryText text-sm">Join SmashUp and start tracking issues</p>

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
                placeholder="johndoe"
                required
              />
            </div>
            <div className="form-group">
              <label className="label-github">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>
            <div className="form-group">
              <label className="label-github">Password</label>
              <Input
                type="password"
                name="password1"
                value={formData.password1}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label className="label-github">Confirm password</label>
              <Input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-github-border text-center">
            <p className="text-github-secondaryText text-sm">Already have an account?</p>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="mt-2 inline-block w-auto"
            >
              Sign in
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
