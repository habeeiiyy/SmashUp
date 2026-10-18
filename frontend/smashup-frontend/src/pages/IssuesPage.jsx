import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { issuesAPI, projectsAPI } from '../api';
import { Loading, useToast, Toast } from '../components';

export const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: '',
    project: '',
    assigned_to: '',
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
      setNewIssue({ title: '', description: '', category: '', project: '', assigned_to: '' });
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
    <div className="container mx-auto p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => {
            // handled by timeout in hook
          }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
        <button
          onClick={() => {
            document.getElementById('create-issue')?.classList.remove('hidden');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          + New Issue
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Title</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Category</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Priority</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Project</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No issues found.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <Link to={`/issues/${issue.id}`} className="font-medium text-blue-600 hover:underline">
                      {issue.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {issue.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium ${issue.status === 'RESOLVED' ? 'text-green-600' : issue.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-slate-600'}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs ${issue.priority === 'CRITICAL' || issue.priority === 'HIGH' ? 'text-red-600' : issue.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600">
                      {issue.project_name || issue.project}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      className="text-sm text-blue-600 hover:underline"
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

      <div
        id="create-issue"
        className="hidden mt-6 bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Create New Issue</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Project
            </label>
            <select
              name="project"
              value={newIssue.project}
              onChange={(e) =>
                setNewIssue({ ...newIssue, project: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={newIssue.title}
              onChange={(e) =>
                setNewIssue({ ...newIssue, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={newIssue.description}
              onChange={(e) =>
                setNewIssue({ ...newIssue, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={newIssue.category}
              onChange={(e) =>
                setNewIssue({ ...newIssue, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Bug, Feature, Improvement"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 transition"
          >
            {creating ? 'Creating...' : 'Create Issue'}
          </button>
        </form>
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

  if (!issue) return <div className="text-center py-10">Issue not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Link to="/issues" className="text-slate-500 hover:text-slate-700">
          ← Back to Issues
        </Link>
        <button
          onClick={() => navigate(`/issues/${id}/edit`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Edit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {issue.title}
        </h1>
        <div className="flex gap-4 mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {issue.category}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
            {issue.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${issue.priority === 'CRITICAL' || issue.priority === 'HIGH' ? 'bg-red-100 text-red-700' : issue.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {issue.priority}
          </span>
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Description</h3>
          <p className="text-slate-700 whitespace-pre-wrap">{issue.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map(
                (status) => {
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
                      className={`w-full py-2.5 rounded border text-sm font-medium transition ${isActive ? config.active : `${config.bg} ${config.text} ${config.border}`}`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  );
                }
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Priority
            </h4>
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
                    className={`w-full py-2.5 rounded border text-sm font-medium transition ${isActive ? config.active : `${config.bg} ${config.text} ${config.border}`}`}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
