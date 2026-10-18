import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, projectMembersAPI } from '../api';
import { Loading, useToast, Toast } from '../components';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const { toast, show } = useToast();
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

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => {}}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <Link to="/issues" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          View All Issues
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
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
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 transition"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-slate-500">No projects yet. Create your first project above.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-slate-500 text-sm mt-1">
                  {project.description}
                </p>
              )}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400">Owner</span>
                <span className="text-xs text-slate-400">
                  {project.created_at?.slice(0, 10) || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projResp = await projectsAPI.get(id);
      setProject(projResp.data);

      // Get all members and filter for this project
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

  if (loading) return <Loading />;

  if (!project) return <div className="text-center py-10">Project not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Link to="/projects" className="text-slate-500 hover:text-slate-700">
          ← Back to Projects
        </Link>
        <button
          onClick={() => navigate(`/issues?project=${project.id}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          View Issues
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-slate-600 mb-6">{project.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded">
            <p className="text-xs text-slate-500 uppercase">Owner</p>
            <p className="font-medium">{project.owner || 'You'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded">
            <p className="text-xs text-slate-500 uppercase">Created</p>
            <p className="font-medium">
              {project.created_at?.slice(0, 10) || ''}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Members ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-slate-500">No members yet.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.id} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                  <span>{m.user?.username || m.user || 'Unknown'}</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                    {m.role}
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
