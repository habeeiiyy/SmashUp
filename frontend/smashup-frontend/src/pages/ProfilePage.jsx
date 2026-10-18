import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../api';
import { Loading, useToast, Toast, GlassCard, GradientButton, InputModern, BtnOutline } from '../components';

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      setUser({
        username: localStorage.getItem('username') || 'User',
        email: localStorage.getItem('email') || '',
      });
      const response = await issuesAPI.list();
      const allIssues = response.data.results || response.data;
      setIssues(allIssues.filter((i) => i.created_by === user?.username));
    } catch (err) {
      show('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Profile</h1>
          <p className="text-white/50 text-sm">Your account and activity</p>
        </div>
        <Link to="/" className="btn-outline px-5 py-3 text-sm">
          ← Back to Home
        </Link>
      </div>

      <GlassCard className="mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-[3rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-glow-purple">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
            <p className="text-white/50 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Your Issues ({issues.length})</h3>
          {issues.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-white/50 text-sm">No issues created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="glass-card p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-purple-500/30 transition-colors"
                >
                  <div>
                    <Link to={`/issues/${issue.id}`} className="font-medium text-white hover:text-purple-400 transition-colors">
                      {issue.title}
                    </Link>
                    <p className="text-xs text-white/50 mt-1">{issue.category || 'No category'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={issue.status} />
                    <PriorityPill priority={issue.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
