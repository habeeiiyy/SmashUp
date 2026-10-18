import { NavLink } from 'react-router-dom';
import { LogOut, Mail, User, Home, Briefcase } from 'lucide-react';

export const Navbar = ({ onLogout }) => {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-xl font-bold text-blue-400">
          SmashUp
        </NavLink>
        <div className="flex items-center gap-4">
          <NavLink to="/" className="hover:text-blue-300 flex items-center gap-2">
            <Home size={16} /> Home
          </NavLink>
          <NavLink
            to="/projects"
            className="hover:text-blue-300 flex items-center gap-2"
          >
            <Briefcase size={16} /> Projects
          </NavLink>
          <NavLink
            to="/profile"
            className="hover:text-blue-300 flex items-center gap-2"
          >
            <User size={16} /> Profile
          </NavLink>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export const Alert = ({ type = 'error', message }) => {
  const colors = {
    error: 'bg-red-100 text-red-700 border-red-400',
    success: 'bg-green-100 text-green-700 border-green-400',
    info: 'bg-blue-100 text-blue-700 border-blue-400',
  };
  return (
    <div className={`${colors[type]} border p-4 rounded mb-4`}>
      {message}
    </div>
  );
};

export const Loading = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);
