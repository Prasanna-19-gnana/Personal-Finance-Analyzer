import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, List, Target } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ fontWeight: '800', fontSize: '1.25rem', color: '#fff' }}>
        <span style={{ color: 'var(--primary)' }}>Fin</span>Analyzer
      </div>
      <div className="nav-links">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Home size={18} /> Dashboard
        </Link>
        <Link to="/transactions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={18} /> Transactions
        </Link>
        <Link to="/budgets" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} /> Budgets
        </Link>
        <div style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>
          {user?.username}
        </div>
        <button onClick={logout} className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
