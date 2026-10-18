import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../api';
import { Alert, Loading } from '../components';

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get current user info from token or make a profile API call
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      // For now, create mock user from localStorage or just show basic info
      setUser({
        username: localStorage.getItem('username') || 'User',
        email: localStorage.getItem('email') || '',
      });
      // Load issues created by this user
      const response = await issuesAPI.list();
      const allIssues = response.data.results || response.data;
      setIssues(allIssues.filter((i) => i.created_by === user?.username));
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {user?.username}
            </h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">
            Your Issues ({issues.length})
          </h3>
          {issues.length === 0 ? (
            <p className="text-slate-500">No issues created yet.</p>
          ) : (
            <ul className="space-y-3">
              {issues.map((issue) => (
                <li key={issue.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-100">
                  <div>
                    <Link to={`/issues/${issue.id}`} className="font-medium text-blue-600 hover:underline">
                      {issue.title}
                    </Link>
                    <p className="text-xs text-slate-500">{issue.category || 'No category'}</p>
                  </div>
                  <span className={`text-xs font-medium ${issue.status === 'RESOLVED' ? 'text-green-600' : 'text-slate-600'}`}>
                    {issue.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
