import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { issuesAPI, projectsAPI } from '../api';
import { Loading, useToast, Toast, GlassCard, GradientButton, InputModern, SelectModern, Badge, StatusPill, PriorityPill } from '../components';

export const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: '',
    project: '',
  });
  const [creating, setCreating] = useState(false);
  const { toast, show } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadProjects();
    loadIssues();
  }, [searchParams]);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data.results || response.data);
    } catch (err) {
      show('Failed to load projects', 'error');
    }
  };

  const loadIssues = async () => {
    try {
      const params = {};
      if (searchParams.get('project')) {
        params.project = searchParams.get('project');
        setNewIssue((prev) => ({ ...prev, project: searchParams.get('project') }));
      }
      const response = await issuesAPI.list(params);
      setIssues(response.data.results || response.data);
    } catch (err) {
      show('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await issuesAPI.create({
        project: parseInt(newIssue.project),
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category || 'General',
      });
      setNewIssue({ title: '', description: '', category: '', project: '' });
      show('Issue created successfully', 'success');
      loadIssues();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.errors ||
        'Failed to create issue. Make sure you are a member of this project.';
      show(msg, 'error');
    } finally {
      setCreating(false);
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
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Issues</h1>
          <p className="text-white/50 text-sm">Track and manage your team's issues</p>
        </div>
        <GradientButton
          onClick={() => {
            document.getElementById('create-issue')?.classList.remove('hidden');
          }}
          className="px-6 py-3 text-sm"
        >
          + New Issue
        </GradientButton>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                      No issues found.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <Link to={`/issues/${issue.id}`} className="font-medium text-white hover:text-purple-400 transition-colors">
                          {issue.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-[0.6rem]">
                          {issue.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={issue.status} />
                      </td>
                      <td className="px-4 py-4">
                        <PriorityPill priority={issue.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-6">Create Issue</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Project</label>
              <SelectModern
                name="project"
                value={newIssue.project}
                onChange={(e) => setNewIssue({ ...newIssue, project: e.target.value })}
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectModern>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Title</label>
              <InputModern
                type="text"
                name="title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                placeholder="Issue title"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Description</label>
              <InputModern
                type="text"
                name="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                placeholder="Describe the issue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Category</label>
              <InputModern
                type="text"
                name="category"
                value={newIssue.category}
                onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                placeholder="e.g. Bug, Feature"
              />
            </div>
            <GradientButton
              type="submit"
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Issue'}
            </GradientButton>
          </form>
        </div>
      </div>
    </div>
  );
};

export const IssueDetailPage = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadIssue();
  }, [id]);

  const loadIssue = async () => {
    try {
      const response = await issuesAPI.get(id);
      setIssue(response.data);
    } catch (err) {
      show('Failed to load issue', 'error');
      navigate('/issues');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await issuesAPI.changeStatus(id, { status });
      show('Status updated successfully', 'success');
      loadIssue();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change status';
      show(msg, 'error');
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await issuesAPI.changePriority(id, { priority });
      show('Priority updated successfully', 'success');
      loadIssue();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change priority';
      show(msg, 'error');
    }
  };

  if (loading) return <Loading />;

  if (!issue) return <div className="text-center py-20 text-white/50">Issue not found.</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="purple">Issue</Badge>
            <span className="text-xs text-white/40">#{issue.id}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{issue.title}</h1>
          <Badge variant="slate">{issue.category}</Badge>
        </div>
        <Link to="/issues" className="btn-outline px-5 py-3 text-sm">
          ← Back
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card">
          <div className="flex items-center gap-3 mb-6">
            <StatusPill status={issue.status} />
            <PriorityPill priority={issue.priority} />
          </div>
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Description</h3>
            <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Status</h4>
              <div className="grid grid-cols-2 gap-3">
                {['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map((status) => {
                  const isActive = issue.status === status;
                  const config = {
                    OPEN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', active: 'bg-blue-100 border-blue-400 text-blue-700' },
                    IN_PROGRESS: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', active: 'bg-indigo-100 border-indigo-400 text-indigo-700' },
                    IN_REVIEW: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', active: 'bg-purple-100 border-purple-400 text-purple-700' },
                    RESOLVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', active: 'bg-green-100 border-green-400 text-green-700' },
                    CLOSED: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', active: 'bg-slate-100 border-slate-400 text-slate-700' },
                  }[status];
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`w-full py-2.5 rounded-[0.9rem] border text-sm font-medium transition ${isActive ? config.active : `${config.bg} ${config.text} ${config.border}`}`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Priority</h4>
              <div className="grid grid-cols-2 gap-3">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => {
                  const isActive = issue.priority === priority;
                  const config = {
                    LOW: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', active: 'bg-green-100 border-green-400 text-green-700' },
                    MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', active: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
                    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', active: 'bg-orange-100 border-orange-400 text-orange-700' },
                    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', active: 'bg-red-100 border-red-400 text-red-700' },
                  }[priority];
                  return (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      className={`w-full py-2.5 rounded-[0.9rem] border text-sm font-medium transition ${isActive ? config.active : `${config.bg} ${config.text} ${config.border}`}`}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sticky top-24">
          <h3 className="text-lg font-bold text-white mb-6">Issue #{issue.id}</h3>
          <div className="space-y-4">
            <div className="glass-card p-4 rounded-[1.2rem]">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Category</p>
              <p className="text-white font-medium">{issue.category}</p>
            </div>
            <div className="glass-card p-4 rounded-[1.2rem]">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Created</p>
              <p className="text-white font-medium">{issue.created_at?.slice(0, 10) || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
