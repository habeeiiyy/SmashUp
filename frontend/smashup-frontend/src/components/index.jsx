import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, Mail, User, Home, Briefcase, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const Navbar = ({ onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Issues', href: '/issues', icon: Mail },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="navbar-github">
      <div className="container mx-auto px-4 flex justify-between items-center h-10">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-github-text text-lg tracking-tight">
          <span className="text-github-purple">Smash</span><span className="text-github-orange">Up</span>
        </NavLink>

        <div className="hidden md:flex items-center gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: navActive }) =>
                  navActive || isActive
                    ? 'text-github-blue font-medium'
                    : 'text-github-secondaryText hover:text-github-text transition-colors'
                }
              >
                <item.icon size={14} className="mr-1" />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-github-secondaryText hover:text-github-text hover:bg-github-card rounded-md"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-github-border bg-github-card text-github-text hover:bg-github-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-github-blue/50"
          >
            <LogOut size={14} className="mr-1" /> Sign out
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-github-card border-t border-github-border p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive: navActive }) =>
                    navActive || isActive
                      ? 'block text-github-blue font-medium py-2 px-3 rounded-md bg-github-secondary'
                      : 'block text-github-secondaryText hover:text-github-text hover:bg-github-secondary py-2 px-3 rounded-md transition-colors'
                  }
                >
                  <item.icon size={14} className="mr-2" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export const FlashError = ({ message }) => (
  <div className="flash-error" role="alert">
    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
    {message}
  </div>
);

export const FlashSuccess = ({ message }) => (
  <div className="flash-success" role="alert">
    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
    {message}
  </div>
);

export const useFlash = () => {
  const [toasts, setToasts] = React.useState([]);

  const show = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const hide = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, show, hide };
};

export const Toast = ({ toast, onClose }) => {
  const colors = {
    error: {
      bg: 'bg-[#F85149]/10',
      border: 'border-[#F85149]/30',
      text: 'text-[#F85149]',
      icon: 'text-[#F85149]',
      title: 'text-[#F85149]',
      Icon: AlertCircle,
    },
    success: {
      bg: 'bg-[#238636]/10',
      border: 'border-[#238636]/30',
      text: 'text-[#238636]',
      icon: 'text-[#238636]',
      title: 'text-[#238636]',
      Icon: CheckCircle,
    },
    info: {
      bg: 'bg-[#388BFD]/10',
      border: 'border-[#388BFD]/30',
      text: 'text-[#388BFD]',
      icon: 'text-[#388BFD]',
      title: 'text-[#388BFD]',
      Icon: Info,
    },
  };
  const c = colors[toast.type];
  const Icon = c.Icon;

  return (
    <div
      className={`fixed top-4 right-4 z-[80] ${c.bg} ${c.border} ${c.text} px-4 py-3 rounded-[8px] shadow-lg min-w-[320px] text-left border`}
      role="alert"
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <h3 className="text-xs font-semibold {c.title}">
            {toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Success' : 'Info'}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={() => onClose(toast.id)}
            className="opacity-50 hover:opacity-100 text-current"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed">{toast.message}</p>
    </div>
  );
};

export const Button = ({ children, variant = 'primary', onClick, type = 'button', disabled, className = '' }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-github-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150';
  const variants = {
    primary: 'border border-transparent bg-github-green text-white hover:bg-github-green/90 focus:ring-github-green/50',
    secondary: 'border border-github-border bg-github-card text-github-text hover:bg-github-secondary focus:ring-github-blue/50',
    danger: 'border border-transparent bg-github-red text-white hover:bg-github-red/90 focus:ring-github-red/50',
    outline: 'border border-github-border bg-transparent text-github-text hover:bg-github-secondary focus:ring-github-blue/50',
  };
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ ...props }) => {
  return (
    <input
      {...props}
      className={`block w-full px-3 py-2 text-sm text-github-text bg-github-secondary border border-github-border rounded-md focus:outline-none focus:border-github-blue transition-colors duration-150 ${props.className || ''}`}
    />
  );
};

export const Select = ({ ...props }) => {
  return (
    <select
      {...props}
      className={`block w-full px-3 py-2 text-sm text-github-text bg-github-secondary border border-github-border rounded-md focus:outline-none focus:border-github-blue transition-colors duration-150 appearance-none cursor-pointer ${props.className || ''}`}
    />
  );
};

export const Badge = ({ children, variant = 'secondary', className = '' }) => {
  const variants = {
    primary: 'bg-github-purple/10 text-github-purple border border-github-purple/30',
    green: 'bg-github-green/10 text-github-green border border-github-green/30',
    orange: 'bg-github-orange/10 text-github-orange border border-github-orange/30',
    blue: 'bg-github-blue/10 text-github-blue border border-github-blue/30',
    red: 'bg-github-red/10 text-github-red border border-github-red/30',
    secondary: 'bg-github-secondary text-github-secondaryText border border-github-border',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const config = {
    OPEN: { variant: 'blue', label: 'Open' },
    IN_PROGRESS: { variant: 'primary', label: 'In progress' },
    IN_REVIEW: { variant: 'purple', label: 'In review' },
    RESOLVED: { variant: 'green', label: 'Resolved' },
    CLOSED: { variant: 'secondary', label: 'Closed' },
  };
  const c = config[status] || config.secondary;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

export const PriorityBadge = ({ priority }) => {
  const config = {
    LOW: { variant: 'green', label: 'Low' },
    MEDIUM: { variant: 'blue', label: 'Medium' },
    HIGH: { variant: 'orange', label: 'High' },
    CRITICAL: { variant: 'red', label: 'Critical' },
  };
  const c = config[priority] || config.green;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`card-github ${className}`}>
      {children}
    </div>
  );
};

export const Table = ({ children }) => (
  <table className="table-github">{children}</table>
);

export const Tbody = ({ children }) => <tbody>{children}</tbody>;
export const Thead = ({ children }) => <thead>{children}</thead>;
export const Tr = ({ children, ...props }) => <tr {...props}>{children}</tr>;
export const Th = ({ children, ...props }) => <th {...props}>{children}</th>;
export const Td = ({ children, ...props }) => <td {...props}>{children}</td>;
