import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { issuesAPI, projectsAPI } from '../api';
import {
  Card,
  Button,
  Input,
  Select,
  Toast,
  useFlash,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  StatusBadge,
  PriorityBadge,
} from '../components';

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
  const [showCreate, setShowCreate] = useState(false);
  const { toasts, show, hide } = useFlash();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadProjects();
    loadIssues();
    if (searchParams.get('create')) {
      setShowCreate(true);
    }
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
    if (!newIssue.project) {
      show('Please select a project', 'error');
      return;
    }
    setCreating(true);
    try {
      await issuesAPI.create({
        project: parseInt(newIssue.project),
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category || 'General',
      });
      setNewIssue({
        title: '',
        description: '',
        category: '',
        project: searchParams.get('project') || '',
      });
      setShowCreate(false);
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

  if (loading) return <div className="text-github-secondaryText text-sm p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={hide} />
      ))}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-lg font-medium text-github-text mb-1">Issues</h1>
          <p className="text-github-secondaryText text-sm">Track and manage your team's issues</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          variant="primary"
          className="px-4 py-2 text-sm"
        >
          {showCreate ? 'Close form' : 'New issue'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-x-auto">
              <Table>
              <Thead>
                <Tr>
                  <Th className="w-1/3">Title</Th>
                  <Th className="w-1/6">Category</Th>
                  <Th className="w-1/6">Status</Th>
                  <Th className="w-1/6">Priority</Th>
                  <Th className="w-1/6">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {issues.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} className="text-center text-github-secondaryText text-sm py-8">
                      No issues found.
                    </Td>
                  </Tr>
                ) : (
                  issues.map((issue) => (
                    <Tr key={issue.id} className="group">
                      <Td className="font-medium text-github-text">
                        <Link to={`/issues/${issue.id}`} className="hover:text-github-blue transition-colors">
                          {issue.title}
                        </Link>
                      </Td>
                      <Td>
                        <span className="text-github-secondaryText text-xs">{issue.category}</span>
                      </Td>
                      <Td>
                        <StatusBadge status={issue.status} />
                      </Td>
                      <Td>
                        <PriorityBadge priority={issue.priority} />
                      </Td>
                      <Td>
                        <button
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="text-github-blue text-xs hover:underline"
                        >
                          Open
                        </button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            </div>
          </Card>
        </div>

        {showCreate && (
          <div className="lg:col-span-1">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-github-secondaryText">New issue</h2>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-xs text-github-secondaryText hover:text-github-text"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="form-group">
                  <label className="label-github">Project *</label>
                  <Select
                    name="project"
                    value={newIssue.project}
                    onChange={(e) => setNewIssue({ ...newIssue, project: e.target.value })}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="form-group">
                  <label className="label-github">Title *</label>
                  <Input
                    type="text"
                    name="title"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="Issue title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label-github">Description</label>
                  <Input
                    type="text"
                    name="description"
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Describe the issue"
                  />
                </div>
                <div className="form-group">
                  <label className="label-github">Category</label>
                  <Input
                    type="text"
                    name="category"
                    value={newIssue.category}
                    onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                    placeholder="e.g. Bug, Feature"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" disabled={creating} className="flex-1">
                    {creating ? 'Creating...' : 'Create issue'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export const IssueDetailPage = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toasts, show, hide } = useFlash();
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

  if (loading) return <div className="text-github-secondaryText text-sm p-8 text-center">Loading...</div>;

  if (!issue) return <div className="text-github-secondaryText text-sm p-8 text-center">Issue not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={hide} />
      ))}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Issue</Badge>
            <span className="text-xs text-github-secondaryText">#{issue.id}</span>
          </div>
          <h1 className="text-lg font-medium text-github-text">{issue.title}</h1>
          <Badge variant="secondary">{issue.category}</Badge>
        </div>
        <Link to="/issues" className="btn-secondary px-3 py-1.5 text-sm">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
            </div>
            <div className="mb-6">
              <h2 className="text-xs font-medium text-github-secondaryText mb-2">Description</h2>
              <p className="text-github-text text-sm leading-relaxed whitespace-pre-wrap">{issue.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h2 className="text-xs font-medium text-github-secondaryText mb-2">Status</h2>
                <div className="grid grid-cols-2 gap-2">
                  {['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map((status) => {
                    const isActive = issue.status === status;
                    const config = {
                      OPEN: { label: 'Open', color: 'blue' },
                      IN_PROGRESS: { label: 'In progress', color: 'purple' },
                      IN_REVIEW: { label: 'In review', color: 'purple' },
                      RESOLVED: { label: 'Resolved', color: 'green' },
                      CLOSED: { label: 'Closed', color: 'secondary' },
                    }[status];
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`px-3 py-2 text-xs border rounded-md text-center transition-colors ${
                          isActive
                            ? config.color === 'blue'
                              ? 'bg-github-blue text-white border-github-blue'
                              : config.color === 'purple'
                              ? 'bg-github-purple text-white border-github-purple'
                              : config.color === 'green'
                              ? 'bg-github-green text-white border-github-green'
                              : 'bg-github-secondary text-github-secondaryText border-github-border'
                            : 'bg-transparent text-github-secondaryText border-github-border hover:bg-github-secondary'
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xs font-medium text-github-secondaryText mb-2">Priority</h2>
                <div className="grid grid-cols-2 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => {
                    const isActive = issue.priority === priority;
                    const config = {
                      LOW: { label: 'Low', color: 'green' },
                      MEDIUM: { label: 'Medium', color: 'blue' },
                      HIGH: { label: 'High', color: 'orange' },
                      CRITICAL: { label: 'Critical', color: 'red' },
                    }[priority];
                    return (
                      <button
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        className={`px-3 py-2 text-xs border rounded-md text-center transition-colors ${
                          isActive
                            ? config.color === 'green'
                              ? 'bg-github-green text-white border-github-green'
                              : config.color === 'blue'
                              ? 'bg-github-blue text-white border-github-blue'
                              : config.color === 'orange'
                              ? 'bg-github-orange text-white border-github-orange'
                              : 'bg-github-red text-white border-github-red'
                            : 'bg-transparent text-github-secondaryText border-github-border hover:bg-github-secondary'
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-sm font-medium text-github-secondaryText mb-4">Issue #{issue.id}</h2>
            <div className="space-y-4">
              <div className="p-2 rounded-md bg-github-secondary">
                <p className="text-xs font-medium text-github-secondaryText mb-1">Category</p>
                <p className="text-github-text text-sm">{issue.category}</p>
              </div>
              <div className="p-2 rounded-md bg-github-secondary">
                <p className="text-xs font-medium text-github-secondaryText mb-1">Created</p>
                <p className="text-github-text text-sm">{issue.created_at?.slice(0, 10) || ''}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
