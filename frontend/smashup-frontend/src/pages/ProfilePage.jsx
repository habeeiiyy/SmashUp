import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../api';
import { Card, Button, Input, Toast, useFlash, Badge } from '../components';
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
          <div className="w-12 h-12 rounded-full bg-github-secondary flex items-center justify-center text-[24px] text-github-secondaryText">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-medium text-github-text">{user?.username}</h2>
            <p className="text-github-secondaryText text-sm">{user?.email}</p>
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
