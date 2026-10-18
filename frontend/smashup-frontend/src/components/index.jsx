import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, Mail, User, Home, Briefcase, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const Navbar = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Issues', href: '/issues', icon: Mail },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href) => location.pathname === href || (href !== '/' && location.pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-50">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-orange-600/20 blur-[80px]"></div>
        <div className="relative container mx-auto px-6 py-4 flex justify-between items-center">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[1.2rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-glow-purple">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Smash<span className="text-purple-400">Up</span></span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-2 px-4 py-2.5 rounded-[1rem] bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white shadow-glow-purple'
                    : 'flex items-center gap-2 px-4 py-2.5 rounded-[1rem] text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300'
                }
              >
                <item.icon size={16} />
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 rounded-[1rem] bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 text-sm font-medium flex items-center gap-2"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const GlassCard = ({ children, className = '', hoverable = true }) => {
  return (
    <div
      className={`relative rounded-[1.875rem] border border-glass-border bg-glass-bg p-6 backdrop-blur-md shadow-glass transition-all duration-300 ${hoverable ? 'hover:border-purple-500/40 hover:shadow-glow-purple' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const GradientButton = ({ children, className = '', onClick, type = 'button', disabled }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-[1rem] font-semibold text-white transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none ${className}`}
      style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%)',
        boxShadow: disabled ? 'none' : '0 4px 15px -5px rgba(168, 85, 247, 0.4)',
      }}
    >
      {children}
    </button>
  );
};

export const BtnOutline = ({ children, className = '', onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-[1rem] font-semibold text-white transition-all duration-300 border border-white/20 bg-white/5 backdrop-blur-sm ${className}`}
    >
      {children}
    </button>
  );
};

export const InputModern = ({ ...props }) => {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-[1rem] border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 ${props.className || ''}`}
    />
  );
};

export const SelectModern = ({ ...props }) => {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-[1rem] border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer ${props.className || ''}`}
    />
  );
};

export const Badge = ({ children, variant = 'purple', className = '' }) => {
  const variants = {
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    pink: 'bg-pink-500/10 text-pink-400 border border-pink-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border border-green-500/30',
    slate: 'bg-slate-700 text-slate-300 border border-slate-600',
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusPill = ({ status }) => {
  const config = {
    OPEN: { variant: 'blue', label: 'Open' },
    IN_PROGRESS: { variant: 'purple', label: 'In Progress' },
    IN_REVIEW: { variant: 'pink', label: 'In Review' },
    RESOLVED: { variant: 'green', label: 'Resolved' },
    CLOSED: { variant: 'slate', label: 'Closed' },
  };
  const c = config[status] || config.slate;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

export const PriorityPill = ({ priority }) => {
  const config = {
    LOW: { variant: 'green', label: 'Low' },
    MEDIUM: { variant: 'orange', label: 'Medium' },
    HIGH: { variant: 'pink', label: 'High' },
    CRITICAL: { variant: 'purple', label: 'Critical' },
  };
  const c = config[priority] || config.green;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

export const Toast = ({ message, type = 'error', onClose }) => {
  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500',
      title: 'text-red-800',
      iconComp: AlertCircle,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-500',
      title: 'text-green-800',
      iconComp: CheckCircle,
    },
    info: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: 'text-slate-500',
      title: 'text-slate-800',
      iconComp: Info,
    },
  };
  const c = colors[type];
  const Icon = c.iconComp;

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[80] ${c.bg} ${c.border} ${c.text} px-6 py-4 rounded-[1.5rem] shadow-glass-lg min-w-[360px] text-left border animate-slide-up`}
      role="alert"
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-sm font-bold {c.title}">
            {type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="opacity-50 hover:opacity-100 text-current"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed">{message}</p>
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

export const Loading = () => (
  <div className="fixed inset-0 z-[90] bg-dark-900/90 backdrop-blur-sm flex justify-center items-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-purple-400"
            style={{
              strokeDasharray: '282.74',
              strokeDashoffset: '200',
              animation: 'rotate 1.5s linear infinite',
            }}
          />
        </svg>
      </div>
      <p className="text-white/60 text-sm font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);
