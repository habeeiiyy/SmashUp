import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { Loading, useToast, Toast, GlassCard, GradientButton, InputModern, BtnOutline } from '../components';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password1: '',
    password2: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast, show } = useToast();
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
    <div className="relative min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/15 blur-[140px] rounded-full"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full"></div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="relative z-10 w-full max-w-md">
        <GlassCard hoverable={false} className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
            <p className="text-white/50 text-sm mt-2">Join SmashUp and start tracking issues</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
              <InputModern
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <InputModern
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
              <InputModern
                type="password"
                name="password1"
                value={formData.password1}
                onChange={(e) => setFormData({ ...formData, password1: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Confirm password</label>
              <InputModern
                type="password"
                name="password2"
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <GradientButton type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </GradientButton>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">Already have an account?</p>
            <BtnOutline onClick={() => navigate('/login')} className="mt-2 inline-block text-sm">
              Sign in
            </BtnOutline>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
