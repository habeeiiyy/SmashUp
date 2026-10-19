import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, projectMembersAPI, projectJoinRequestsAPI } from '../api';
import { Mail, Copy, Check, Key, UserPlus } from 'lucide-react';
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
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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
      const msg = err.response?.data?.detail || 'Failed to load projects';
      show(msg, 'error');
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

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      show('Please enter a project code', 'error');
      return;
    }
    setJoining(true);
    try {
      await projectsAPI.joinByCode({
        code: joinCode.trim().toUpperCase(),
        message: joinMessage.trim(),
      });
      setJoinCode('');
      setJoinMessage('');
      setShowJoin(false);
      show('Join request submitted! The project owner will review your request.', 'success');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to submit join request. Check the code and try again.';
      show(msg, 'error');
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (e, code, projId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(projId);
    show(`Copied code: ${code}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
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
          <p className="text-github-secondaryText text-sm">Manage your projects, teams, and join codes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowJoin(!showJoin)}
            className="px-3 py-1.5 text-sm"
          >
            <Key size={14} className="mr-1.5" />
            {showJoin ? 'Close join form' : 'Join with code'}
          </Button>
          <Link
            to="/issues"
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            View all issues
          </Link>
        </div>
      </div>

      {showJoin && (
        <Card className="mb-6 border-github-blue/40 bg-github-secondary/40">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-github-text flex items-center gap-1.5">
              <Key size={16} className="text-github-blue" />
              Join an existing project
            </h2>
            <button
              onClick={() => setShowJoin(false)}
              className="text-xs text-github-secondaryText hover:text-github-text"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-github-secondaryText mb-4">
            Enter the unique project code shared by the project owner. A join request will be sent to the owner for approval.
          </p>
          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="label-github">Project Code *</label>
                <Input
                  type="text"
                  name="code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PRJ-8APK-0QJK-6PN9"
                  className="font-mono uppercase tracking-wider"
                  required
                />
              </div>
              <div className="form-group mb-0">
                <label className="label-github">Message to owner (optional)</label>
                <Input
                  type="text"
                  name="message"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Hi! I am joining as the backend engineer..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowJoin(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={joining}>
                <UserPlus size={14} className="mr-1.5" />
                {joining ? 'Sending request...' : 'Send join request'}
              </Button>
            </div>
          </form>
        </Card>
      )}

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
            <p className="text-github-secondaryText text-sm mb-4">Create your first project or join an existing one using a project code</p>
            <Button variant="secondary" onClick={() => setShowJoin(true)} className="text-xs">
              <Key size={14} className="mr-1" /> Join with code
            </Button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="card-github cursor-pointer hover:bg-github-secondary transition-colors duration-150 flex flex-col justify-between"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                  <Badge variant="secondary">Project</Badge>
                  {project.pending_requests_count > 0 && (
                    <Badge variant="orange" className="text-[10px]">
                      {project.pending_requests_count} pending request{project.pending_requests_count > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <span className="text-xs text-github-secondaryText ml-auto">{project.created_at?.slice(0, 10) || ''}</span>
                </div>
                <h3 className="font-semibold text-github-text mb-1">{project.name}</h3>
                {project.description && (
                  <p className="text-github-secondaryText text-xs mb-3 line-clamp-2">{project.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-github-border mt-2 space-y-2">
                {project.code && (
                  <div
                    onClick={(e) => copyCode(e, project.code, project.id)}
                    className="flex items-center justify-between px-2 py-1 bg-github-secondary rounded border border-github-border/60 hover:border-github-blue/50 text-xs transition-colors"
                    title="Click to copy join code"
                  >
                    <span className="text-[11px] text-github-secondaryText font-mono flex items-center gap-1">
                      <Key size={11} className="text-github-blue" />
                      {project.code}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] text-github-blue hover:underline flex items-center gap-0.5 ml-2"
                    >
                      {copiedId === project.id ? (
                        <>
                          <Check size={11} className="text-github-green" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-github-secondaryText">
                  <span className="font-medium text-github-text">Owner: {project.owner_username || (typeof project.owner === 'object' ? project.owner?.username : project.owner) || 'You'}</span>
                </div>
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
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingRequestId, setActingRequestId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const { toasts, show, hide } = useFlash();
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('user_id');
  const currentUsername = localStorage.getItem('username');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projResp = await projectsAPI.get(id);
      const projData = projResp.data;
      setProject(projData);

      const membersResp = await projectMembersAPI.list();
      const allMembers = membersResp.data.results || membersResp.data;
      const projectMembers = allMembers.filter(
        (m) => m.project === parseInt(id) || m.project === id
      );
      setMembers(projectMembers);

      // Check if user is owner or admin to load join requests
      const isOwner =
        String(projData.owner) === String(currentUserId) ||
        projData.owner_username === currentUsername ||
        projData.owner === currentUsername;
      const isAdmin = projectMembers.some(
        (m) => String(m.user) === String(currentUserId) && m.role === 'ADMIN'
      );

      if (isOwner || isAdmin) {
        try {
          const reqResp = await projectsAPI.getJoinRequests(id);
          setJoinRequests(reqResp.data || []);
        } catch {
          setJoinRequests([]);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load project details';
      show(msg, 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, role = 'DEVELOPER') => {
    setActingRequestId(requestId);
    try {
      await projectJoinRequestsAPI.accept(requestId, { role });
      show('Join request accepted! User is now a project member.', 'success');
      loadProject();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to accept join request';
      show(msg, 'error');
    } finally {
      setActingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActingRequestId(requestId);
    try {
      await projectJoinRequestsAPI.reject(requestId);
      show('Join request rejected', 'info');
      loadProject();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reject join request';
      show(msg, 'error');
    } finally {
      setActingRequestId(null);
    }
  };

  if (loading) return <div className="text-github-secondaryText text-sm p-8 text-center">Loading...</div>;

  if (!project) return <div className="text-github-secondaryText text-sm p-8 text-center">Project not found.</div>;

  const isOwner =
    String(project.owner) === String(currentUserId) ||
    project.owner_username === currentUsername ||
    project.owner === currentUsername;
  const isAdmin = members.some(
    (m) => String(m.user) === String(currentUserId) && m.role === 'ADMIN'
  );
  const canManage = isOwner || isAdmin;

  return (
    <div className="container mx-auto px-4 py-8">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={hide} />
      ))}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary">Project</Badge>
            <span className="text-xs text-github-secondaryText">Created {project.created_at?.slice(0, 10) || ''}</span>
            {canManage && (
              <Badge variant="blue" className="text-[10px]">
                {isOwner ? '👑 Owner' : '🛡️ Admin'}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold text-github-text">{project.name}</h1>
          {project.description && (
            <p className="text-github-secondaryText text-sm mt-1">{project.description}</p>
          )}

          {project.code && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-github-secondary/90 rounded-md border border-github-border max-w-fit">
              <span className="text-xs text-github-secondaryText flex items-center gap-1">
                <Key size={13} className="text-github-blue" />
                Join Code:
              </span>
              <span className="font-mono text-xs font-bold text-github-text tracking-wider">{project.code}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(project.code);
                  setCopiedCode(true);
                  show('Project code copied to clipboard! Share it with teammates.', 'info');
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="ml-2 text-xs px-2 py-0.5 rounded bg-github-card hover:bg-github-secondary text-github-text border border-github-border transition-colors flex items-center gap-1"
                title="Share this code with team members so they can join"
              >
                {copiedCode ? <Check size={12} className="text-github-green" /> : <Copy size={12} />}
                {copiedCode ? 'Copied' : 'Copy code'}
              </button>
            </div>
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
        <div className="md:col-span-2 space-y-6">
          {canManage && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-github-text">Pending Join Requests</h2>
                  <Badge variant={joinRequests.length > 0 ? 'orange' : 'secondary'} className="text-[10px]">
                    {joinRequests.length}
                  </Badge>
                </div>
              </div>
              {joinRequests.length === 0 ? (
                <p className="text-xs text-github-secondaryText py-2">
                  No pending requests. Share your project code (<span className="font-mono text-github-blue">{project.code}</span>) with colleagues to invite them.
                </p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-md bg-github-secondary border border-github-border flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-github-text">
                            {req.user_details?.username || req.user}
                          </span>
                          {req.user_details?.position && (
                            <Badge variant="blue" className="text-[10px]">
                              {req.user_details.position}
                            </Badge>
                          )}
                          {req.user_details?.company && (
                            <Badge variant="secondary" className="text-[10px]">
                              🏢 {req.user_details.company}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-github-secondaryText">
                          <span>Email:</span>
                          <span
                            className="font-mono filter blur-[3.5px] hover:blur-none select-none transition-all cursor-pointer bg-github-card px-1.5 py-0.5 rounded text-[11px]"
                            title="Email hidden for privacy (hover to unblur)"
                          >
                            {req.user_details?.email || 'email masked'}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-xs text-github-text italic bg-github-card/60 p-2 rounded mt-1">
                            &quot;{req.message}&quot;
                          </p>
                        )}
                        <span className="text-[10px] text-github-secondaryText block">
                          Requested on {req.created_at?.slice(0, 10)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="primary"
                          onClick={() => handleAcceptRequest(req.id, 'DEVELOPER')}
                          disabled={actingRequestId === req.id}
                          className="px-3 py-1 text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={actingRequestId === req.id}
                          className="px-3 py-1 text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-github-text">Members ({members.length})</h2>
              <span className="text-[11px] text-github-secondaryText">Emails blurred for privacy</span>
            </div>
            {members.length === 0 ? (
              <div className="p-4 text-center text-github-secondaryText text-sm">No members yet.</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const username = m.user_details?.username || m.user?.username || (typeof m.user === 'number' ? `User #${m.user}` : m.user) || 'Unknown';
                  const position = m.user_details?.position;
                  const company = m.user_details?.company;
                  const email = m.user_details?.email;
                  const isSelf = m.user_details?.is_self || String(m.user) === String(currentUserId);

                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-md hover:bg-github-secondary transition-colors gap-2 border border-transparent hover:border-github-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-github-secondary flex items-center justify-center text-xs text-github-secondaryText font-bold border border-github-border flex-shrink-0">
                          {String(username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium text-github-text">{username}</p>
                            {position && (
                              <span className="text-[11px] text-github-blue">• {position}</span>
                            )}
                            {company && (
                              <span className="text-[11px] text-github-secondaryText">({company})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-github-secondaryText mt-0.5">
                            {email ? (
                              isSelf ? (
                                <span className="font-mono text-[11px] text-github-secondaryText">
                                  {email} <span className="text-[10px] text-github-blue">(you)</span>
                                </span>
                              ) : (
                                <span
                                  className="font-mono text-[11px] filter blur-[3.5px] hover:blur-none select-none transition-all cursor-pointer bg-github-secondary/60 px-1 py-0.5 rounded"
                                  title="Personal detail: email blurred for other users (hover to unblur)"
                                >
                                  {email}
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-github-secondaryText font-mono bg-github-secondary px-2 py-0.5 rounded border border-github-border self-start sm:self-center">
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-github-text mb-4">Project Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-github-secondaryText mb-1">Owner</p>
                <p className="text-github-text text-sm font-medium">
                  {project.owner_username || (typeof project.owner === 'object' ? project.owner?.username : project.owner) || 'You'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-github-secondaryText mb-1">Unique Project Code</p>
                <div className="flex items-center gap-1 font-mono text-xs text-github-blue bg-github-secondary p-2 rounded border border-github-border">
                  <Key size={12} className="flex-shrink-0" />
                  <span className="select-all font-bold tracking-wider">{project.code}</span>
                </div>
                <p className="text-[10px] text-github-secondaryText mt-1">
                  Share this code with users so they can send join requests to this project.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-github-secondaryText mb-1">Created</p>
                <p className="text-github-text text-sm">{project.created_at?.slice(0, 10) || ''}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-github-text mb-4">Quick actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/issues?project=${project.id}`)}
                className="btn-secondary w-full py-2 text-sm text-left flex items-center"
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
