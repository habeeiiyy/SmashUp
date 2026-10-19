import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI, projectMembersAPI } from '../api';
import {
  Card,
  Button,
  Input,
  Toast,
  useFlash,
  Badge,
} from '../components';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const { toasts, show, hide } = useFlash();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data.results || response.data);
    } catch (err) {
      show('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsAPI.create(newProject);
      setNewProject({ name: '', description: '' });
      show('Project created successfully', 'success');
      loadProjects();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create project';
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
          <h1 className="text-lg font-medium text-github-text mb-1">Your projects</h1>
          <p className="text-github-secondaryText text-sm">Manage your projects and teams</p>
        </div>
        <Link
          to="/issues"
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          View all issues
        </Link>
      </div>

      <Card className="mb-6">
        <h2 className="text-sm font-medium text-github-secondaryText mb-3">Create a new project</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label-github">Name</label>
              <Input
                type="text"
                name="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Mobile app redesign"
                required
              />
            </div>
            <div className="form-group">
              <label className="label-github">Description</label>
              <Input
                type="text"
                name="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create project'}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full card-github p-8 text-center">
            <h3 className="text-github-secondaryText text-sm font-medium mb-2">You don't have any projects yet</h3>
            <p className="text-github-secondaryText text-sm">Create your first project to start tracking issues</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="card-github cursor-pointer hover:bg-github-secondary transition-colors duration-150"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary">Project</Badge>
                <span className="text-xs text-github-secondaryText">{project.created_at?.slice(0, 10) || ''}</span>
              </div>
              <h3 className="font-medium text-github-text mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-github-secondaryText text-sm mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-github-secondaryText">
                <span className="font-medium text-github-text">{project.owner || 'You'}</span>
                <span>•</span>
                <span>Owner</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show } = useFlash();
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projResp = await projectsAPI.get(id);
      setProject(projResp.data);

      const membersResp = await projectMembersAPI.list();
      const allMembers = membersResp.data.results || membersResp.data;
      const projectMembers = allMembers.filter(
        (m) => m.project === parseInt(id) || m.project === id
      );
      setMembers(projectMembers);
    } catch (err) {
      show('Failed to load project details', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-github-secondaryText text-sm p-8 text-center">Loading...</div>;

  if (!project) return <div className="text-github-secondaryText text-sm p-8 text-center">Project not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Project</Badge>
            <span className="text-xs text-github-secondaryText">{project.created_at?.slice(0, 10) || ''}</span>
          </div>
          <h1 className="text-lg font-medium text-github-text">{project.name}</h1>
          {project.description && (
            <p className="text-github-secondaryText text-sm mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/projects" className="btn-secondary px-3 py-1.5 text-sm">
            ← Back
          </Link>
          <button
            onClick={() => navigate(`/issues?project=${project.id}`)}
            className="btn-primary px-4 py-2 text-sm"
          >
            View issues
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-sm font-medium text-github-secondaryText mb-4">About</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-github-secondaryText mb-1">Owner</p>
                <p className="text-github-text text-sm">{project.owner || 'You'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-github-secondaryText mb-1">Created</p>
                <p className="text-github-text text-sm">{project.created_at?.slice(0, 10) || ''}</p>
              </div>
            </div>
          </Card>

          <Card className="mt-4">
            <h2 className="text-sm font-medium text-github-secondaryText mb-4">Members ({members.length})</h2>
            {members.length === 0 ? (
              <div className="p-4 text-center text-github-secondaryText text-sm">No members yet.</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-github-secondary transition-colors">
                    <div className="w-6 h-6 rounded-full bg-github-secondary flex items-center justify-center text-[10px] text-github-secondaryText">
                      {(m.user?.username || m.user || 'U').charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-github-text">{m.user?.username || m.user || 'Unknown'}</p>
                    <span className="ml-auto text-xs text-github-secondaryText">{m.role}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <h2 className="text-sm font-medium text-github-secondaryText mb-4">Quick actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/issues?project=${project.id}`)}
                className="btn-secondary w-full py-2 text-sm text-left"
              >
                <Mail size={14} className="mr-2" /> View issues
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
