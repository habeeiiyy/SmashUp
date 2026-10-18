import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Mail, User, Home, Briefcase, AlertCircle } from 'lucide-react';

export const Navbar = ({ onLogout }) => {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
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

export const Loading = () => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-slate-600">Loading...</p>
    </div>
  </div>
);

export const Toast = ({ message, type = 'error', onClose }) => {
  const colors = {
    error: {
      bg: 'bg-red-500',
      text: 'text-white',
      border: 'border-red-400',
      icon: 'text-red-400',
    },
    success: {
      bg: 'bg-green-500',
      text: 'text-white',
      border: 'border-green-400',
      icon: 'text-green-400',
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-white',
      border: 'border-blue-400',
      icon: 'text-blue-400',
    },
  };
  const c = colors[type];

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] ${c.bg} ${c.border} ${c.text} px-8 py-6 rounded-xl shadow-2xl min-w-[400px] text-center border`}
      role="alert"
    >
      <div className="flex justify-center items-center gap-3 mb-4">
        <AlertCircle className="w-6 h-6" />
        <h3 className="text-lg font-bold">
          {type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}
        </h3>
      </div>
      <p className="text-sm leading-relaxed">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState(null);

  const show = (message, type = 'error') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 5000);
  };

  const hide = () => setToast(null);

  return { toast, show, hide };
};
