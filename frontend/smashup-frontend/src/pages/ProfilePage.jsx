import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI, authAPI } from '../api';
import { Card, Toast, useFlash, Badge } from '../components';
import { StatusBadge, PriorityBadge } from '../components';

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ bio: '', position: '', company: '' });
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
      let currentPosition = '';
      let currentCompany = '';

      try {
        const profileResp = await authAPI.getProfile();
        if (profileResp?.data) {
          currentUserId = profileResp.data.id || currentUserId;
          currentUsername = profileResp.data.username || currentUsername;
          currentEmail = profileResp.data.email || currentEmail;
          currentBio = profileResp.data.bio || '';
          currentPosition = profileResp.data.position || '';
          currentCompany = profileResp.data.company || '';
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
        position: currentPosition,
        company: currentCompany,
      });
      setEditData({
        bio: currentBio,
        position: currentPosition,
        company: currentCompany,
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await authAPI.updateProfile(editData);
      setUser((prev) => ({
        ...prev,
        bio: resp.data.bio,
        position: resp.data.position,
        company: resp.data.company,
      }));
      setIsEditing(false);
      show('Profile updated successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update profile';
      show(msg, 'error');
    } finally {
      setSaving(false);
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
        <div className="flex gap-2">
          <Link to="/" className="btn-secondary px-3 py-1.5 text-sm">
            ← Back to home
          </Link>
          {!isEditing && (
            <button
              onClick={() => {
                setEditData({
                  bio: user?.bio || '',
                  position: user?.position || '',
                  company: user?.company || '',
                });
                setIsEditing(true);
              }}
              className="btn-primary px-3 py-1.5 text-sm"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      <Card>
        {!isEditing ? (
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-github-secondary flex items-center justify-center text-[24px] text-github-secondaryText font-bold flex-shrink-0">
                {String(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-github-text">{user?.username}</h2>
                  {user?.position && (
                    <Badge variant="blue" className="text-xs">
                      {user.position}
                    </Badge>
                  )}
                  {user?.company && (
                    <Badge variant="secondary" className="text-xs">
                      🏢 {user.company}
                    </Badge>
                  )}
                </div>
                <p className="text-github-secondaryText text-sm flex items-center gap-1">
                  <span>{user?.email}</span>
                  <span className="text-[10px] bg-github-secondary px-1.5 py-0.5 rounded text-github-secondaryText">Visible to you</span>
                </p>
                {user?.bio ? (
                  <p className="text-xs text-github-text mt-2 whitespace-pre-wrap leading-relaxed max-w-xl">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-xs text-github-secondaryText italic mt-2">
                    No bio added yet. Click &quot;Edit profile&quot; to add your bio, position, and company.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="mb-6 pb-6 border-b border-github-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-github-text">Edit profile details</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-github-secondaryText hover:text-github-text"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="label-github">Position / Title</label>
                <input
                  type="text"
                  name="position"
                  value={editData.position}
                  onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                  placeholder="e.g. Frontend Engineer, Product Manager"
                  className="input-github"
                />
              </div>

              <div className="form-group mb-0">
                <label className="label-github">Company / Organization</label>
                <input
                  type="text"
                  name="company"
                  value={editData.company}
                  onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                  placeholder="e.g. Apple, SmashUp"
                  className="input-github"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="label-github">Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell your team about yourself..."
                className="input-github"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-4 py-1.5 text-sm"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

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
