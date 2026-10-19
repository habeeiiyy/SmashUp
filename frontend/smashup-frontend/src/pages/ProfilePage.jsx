import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI, authAPI } from '../api';
import { Card, Toast, useFlash, Badge } from '../components';
import { StatusBadge, PriorityBadge } from '../components';

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, show, hide } = useFlash();
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
      let currentUsername = localStorage.getItem('username') || 'User';
      let currentEmail = localStorage.getItem('email') || '';
      let currentUserId = localStorage.getItem('user_id');
      let currentBio = '';

      try {
        const profileResp = await authAPI.getProfile();
        if (profileResp?.data) {
          currentUserId = profileResp.data.id || currentUserId;
          currentUsername = profileResp.data.username || currentUsername;
          currentEmail = profileResp.data.email || currentEmail;
          currentBio = profileResp.data.bio || '';
          localStorage.setItem('user_id', currentUserId);
          localStorage.setItem('username', currentUsername);
          if (currentEmail) localStorage.setItem('email', currentEmail);
        }
      } catch {
        // Fall back to localStorage values if getProfile fails
      }

      setUser({
        id: currentUserId,
        username: currentUsername,
        email: currentEmail,
        bio: currentBio,
      });

      const response = await issuesAPI.list();
      const allIssues = response.data.results || response.data;
      setIssues(
        allIssues.filter((i) => {
          if (currentUserId && String(i.created_by) === String(currentUserId)) return true;
          if (currentUsername && i.created_by === currentUsername) return true;
          if (i.created_by?.id && String(i.created_by.id) === String(currentUserId)) return true;
          if (i.created_by?.username && i.created_by.username === currentUsername) return true;
          return false;
        })
      );
    } catch (err) {
      show('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-github-secondaryText text-sm p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={hide} />
      ))}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
        <div>
          <h1 className="text-lg font-medium text-github-text mb-1">Profile</h1>
          <p className="text-github-secondaryText text-sm">Your account and activity</p>
        </div>
        <Link to="/" className="btn-secondary px-3 py-1.5 text-sm">
          ← Back to home
        </Link>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-github-secondary flex items-center justify-center text-[24px] text-github-secondaryText font-bold">
            {String(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-medium text-github-text">{user?.username}</h2>
            <p className="text-github-secondaryText text-sm">{user?.email}</p>
            {user?.bio && <p className="text-xs text-github-secondaryText mt-1">{user.bio}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-github-border">
          <h2 className="text-sm font-medium text-github-secondaryText mb-4">Your issues ({issues.length})</h2>
          {issues.length === 0 ? (
            <div className="p-4 text-center text-github-secondaryText text-sm">No issues created yet.</div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-2 rounded-md hover:bg-github-secondary transition-colors">
                  <div className="flex items-center gap-2">
                    <Link to={`/issues/${issue.id}`} className="text-github-text hover:text-github-blue transition-colors">
                      {issue.title}
                    </Link>
                    <Badge variant="secondary" className="text-[10px]">{issue.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
