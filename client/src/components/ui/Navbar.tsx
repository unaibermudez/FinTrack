import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-[#2a2d3a] bg-[#0f1117]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-base font-bold text-slate-100 tracking-tight">
          Fin<span className="text-indigo-400">Track</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <span className="text-slate-700">|</span>
          <Link to="/profile" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
            {user?.name ?? user?.email}
          </Link>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};
