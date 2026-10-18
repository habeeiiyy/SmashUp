import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI, projectMembersAPI } from '../api';
import { Loading, useToast, Toast, GlassCard, GradientButton, InputModern, BtnOutline, Badge, StatusPill } from '../components';

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
    <div className="container mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">My Projects</h1>
          <p className="text-white/50 text-sm">Manage your projects and teams</p>
        </div>
        <Link
          to="/issues"
          className="btn-outline px-5 py-3 text-sm"
        >
          View All Issues
        </Link>
      </div>

      <GlassCard className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">Create New Project</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-white/80 mb-2">Project Name</label>
            <InputModern
              type="text"
              name="name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="e.g. Mobile App Redesign"
              required
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
            <InputModern
              type="text"
              name="description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Brief description of the project"
            />
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col">
            <GradientButton
              type="submit"
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </GradientButton>
          </div>
        </form>
      </GlassCard>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full glass-card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white/30">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">Create your first project to start tracking issues</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="glass-card cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:border-purple-500/40"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant="purple">Project</Badge>
                <span className="text-xs text-white/40">{project.created_at?.slice(0, 10) || ''}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{project.name}</h3>
              {project.description && (
                <p className="text-white/50 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px]">
                    {project.owner?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                  <span className="text-xs text-white/70 font-medium">{project.owner || 'You'}</span>
                </div>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md">Owner</span>
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
  const { show } = useToast();
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

  if (loading) return <Loading />;

  if (!project) return <div className="text-center py-20 text-white/50">Project not found.</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="purple">Project</Badge>
            <span className="text-xs text-white/40">{project.created_at?.slice(0, 10) || ''}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-white/50 text-lg line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link to="/projects" className="btn-outline px-5 py-3 text-sm">
            ← Back
          </Link>
          <button
            onClick={() => navigate(`/issues?project=${project.id}`)}
            className="btn-gradient px-6 py-3 text-sm"
          >
            View Issues
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Project Details</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-[1.5rem]">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Owner</p>
              <p className="text-white font-medium">{project.owner || 'You'}</p>
            </div>
            <div className="glass-card p-5 rounded-[1.5rem]">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Created</p>
              <p className="text-white font-medium">{project.created_at?.slice(0, 10) || ''}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Members ({members.length})</h3>
            {members.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <p className="text-white/50 text-sm">No members yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="glass-card p-4 rounded-[1.2rem] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px]">
                        {(m.user?.username || m.user || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{m.user?.username || m.user || 'Unknown'}</p>
                        <p className="text-xs text-white/50">{m.role}</p>
                      </div>
                    </div>
                    <Badge variant="slate">{m.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-[1.875rem]">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/issues?project=${project.id}`)}
              className="btn-outline w-full py-3 text-sm text-left"
            >
              <Mail size={16} className="mr-2" /> View Issues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
