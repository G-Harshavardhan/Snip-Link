import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiTrash, HiLockClosed } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password to confirm deletion.');
      return;
    }
    setLoading(true);
    try {
      await api.deleteAccount(password);
      toast.success('Account deleted successfully.');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <motion.div
          className="settings-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/dashboard" className="back-link">
            <HiArrowLeft /> Back to Dashboard
          </Link>
          <h1>Account Settings</h1>
          <p>Manage your SnipLink account</p>
        </motion.div>

        {/* Account Info */}
        <motion.div
          className="settings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}><strong>Name:</strong> {user?.name}</p>
            <p style={{ margin: 0 }}><strong>Email:</strong> {user?.email}</p>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          className="settings-section danger-zone"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><HiTrash /> Delete Account</h3>
          <p>
            Once you delete your account, all your data will be permanently removed.
            This includes all your shortened URLs, analytics data, and click history.
            This action cannot be undone.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-danger"
            >
              <HiTrash /> Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: '#ef4444', marginBottom: '6px', display: 'block' }}>
                  Enter your password to confirm deletion
                </label>
                <div className="input-wrapper">
                  <HiLockClosed className="input-icon" />
                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(false); setPassword(''); }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-danger">
                  {loading ? <span className="btn-spinner"></span> : 'Permanently Delete Account'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
