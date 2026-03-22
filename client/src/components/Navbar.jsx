import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HiLogout, HiViewGrid, HiCog, HiChevronDown, HiSun, HiMoon } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-emoji">🔗</span>
          <span className="brand-text">SnipLink</span>
        </Link>

        <div className="navbar-links">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <HiSun /> : <HiMoon />}
          </button>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <HiViewGrid />
                <span>Dashboard</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="profile-dropdown" ref={dropdownRef}>
                <button
                  className="profile-trigger"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="nav-avatar">{user.name?.[0]?.toUpperCase()}</div>
                  <span className="nav-username">{user.name}</span>
                  <HiChevronDown className={`chevron ${profileOpen ? 'chevron-open' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="dropdown-menu"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">{user.name?.[0]?.toUpperCase()}</div>
                        <div className="dropdown-info">
                          <span className="dropdown-name">{user.name}</span>
                          <span className="dropdown-email">{user.email}</span>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link to="/settings" className="dropdown-item">
                        <HiCog />
                        <span>Account Settings</span>
                      </Link>
                      <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                        <HiLogout />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link nav-link-cta">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
