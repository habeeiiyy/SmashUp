import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectsPage, ProjectDetailPage } from './pages/ProjectsPage';
import { IssuesPage, IssueDetailPage } from './pages/IssuesPage';
import { ProfilePage } from './pages/ProfilePage';
import { authAPI } from './api';

const ProtectedLayout = () => {
  const token = localStorage.getItem('access_token');

  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await authAPI.logout(refresh);
      } catch {
        // Ignore logout network errors
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <Outlet />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
