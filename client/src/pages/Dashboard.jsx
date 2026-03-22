import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiTrash, HiClipboardCopy, HiExternalLink, HiChartBar, HiSearch, HiPencil, HiQrcode, HiLink, HiSparkles, HiGlobeAlt } from 'react-icons/hi';
import { api } from '../utils/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const data = await api.getUrls(searchQuery);
      setUrls(data.urls || []);
    } catch (err) {
      toast.error(err.message);
      setUrls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUrls(); }, [searchQuery]);

  // Real-time WebSockets
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, ''); // Strip /api to get root origin
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    
    newSocket.on('connect', () => {
      newSocket.emit('joinRoom', user.id);
    });
    
    newSocket.on('urlClicked', (data) => {
      setUrls(prevUrls => 
        prevUrls.map(u => 
          u.id === data.urlId 
            ? { 
                ...u, 
                _count: { ...u._count, clicks: (u._count?.clicks || 0) + 1 }, 
                totalClicks: (u.totalClicks || 0) + 1,
                lastClickedAt: new Date().toISOString()
              } 
            : u
        )
      );
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => newSocket.disconnect();
  }, []); // Keep [] to run once on mount, but user is typically ready by then on Dashboard

  const handleCopy = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUrl(id);
      setUrls(urls.filter(u => u.id !== id));
      toast.success('Link deleted successfully!');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleQr = async (id) => {
    try {
      const theme = document.documentElement.classList.contains('light-theme') ? 'white' : 'black';
      const data = await api.getQrCode(id, theme);
      setQrModal(data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getShortUrl = (url) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, ''); // Strip /api to get the root domain
    return `${baseUrl}/${url.shortCode}`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>My Links</h1>
            <p className="dashboard-subtitle">{urls.length} short link{urls.length !== 1 ? 's' : ''} created</p>
          </div>
          <Link to="/dashboard/create" className="btn btn-primary">
            <HiPlus /> Create New Link
          </Link>
        </motion.div>

        {/* Search */}
        <motion.div
          className="search-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <HiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by URL, short code, or title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </motion.div>

        {/* URL List */}
        {loading ? (
          <div className="dashboard-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line skeleton-lg"></div>
                <div className="skeleton-line skeleton-sm"></div>
                <div className="skeleton-line skeleton-md"></div>
              </div>
            ))}
          </div>
        ) : urls.length === 0 ? (
          searchQuery ? (
            <motion.div
              key="empty-search"
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="empty-icon"><HiSearch /></div>
              <h3>No results found</h3>
              <p>We couldn't find any links matching "{searchQuery}"</p>
              <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="btn btn-ghost">
                Clear Search
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty-no-links"
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="empty-icon"><HiLink /></div>
              <h3>No links yet</h3>
              <p>Create your first short link to get started!</p>
              <Link to="/dashboard/create" className="btn btn-primary">
                <HiPlus /> Create Your First Link
              </Link>
            </motion.div>
          )
        ) : (
          <div className="url-list">
            {urls.map((url) => (
              <div
                key={url.id}
                className={`url-card ${url.isExpired ? 'url-expired' : ''}`}
              >
                <div className="url-card-main">
                    <div className="url-info">
                      <div className="url-short-row">
                        <a
                          href={getShortUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="url-short"
                        >
                          <span className="url-domain-prefix">https://</span>{url.shortCode}
                        </a>
                        {url.customAlias && <span className="custom-badge-sparkle"><HiSparkles className="badge-icon" /> CUSTOM</span>}
                        {url.isExpired && <span className="badge badge-expired">Expired</span>}
                      </div>
                      <a
                        href={url.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-original"
                      >
                        <HiExternalLink />
                        {url.originalUrl.length > 70
                          ? url.originalUrl.substring(0, 70) + '...'
                          : url.originalUrl}
                      </a>
                      {url.title && <p className="url-title">{url.title}</p>}
                    </div>

                    <div className="url-meta">
                      <div className="url-stat">
                        <span className="url-stat-value">{url.totalClicks}</span>
                        <span className="url-stat-label">clicks</span>
                      </div>
                      <div className="url-stat">
                        <span className="url-stat-label">Created</span>
                        <span className="url-stat-value-sm">{formatDate(url.createdAt)}</span>
                      </div>
                      {url.lastClickedAt && (
                        <div className="url-stat">
                          <span className="url-stat-label">Last click</span>
                          <span className="url-stat-value-sm">{formatDate(url.lastClickedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="url-actions">
                    <button
                      onClick={() => handleCopy(getShortUrl(url))}
                      className="action-btn action-copy"
                      title="Copy link"
                    >
                      <HiClipboardCopy />
                    </button>
                    <button
                      onClick={() => handleQr(url.id)}
                      className="action-btn action-qr"
                      title="QR Code"
                    >
                      <HiQrcode />
                    </button>
                    <Link
                      to={`/dashboard/analytics/${url.id}`}
                      className="action-btn action-analytics"
                      title="Analytics"
                    >
                      <HiChartBar />
                    </Link>
                    <button
                      onClick={() => setEditModal(url)}
                      className="action-btn action-edit"
                      title="Edit"
                    >
                      <HiPencil />
                    </button>
                    <button
                      onClick={() => setDeleteId(url.id)}
                      className="action-btn action-delete"
                      title="Delete"
                    >
                      <HiTrash />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete this link?</h3>
              <p>This will permanently remove the short URL and all its analytics data.</p>
              <div className="modal-actions">
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <EditModal url={editModal} onClose={() => setEditModal(null)} onUpdate={(updated) => {
            setUrls(urls.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setEditModal(null);
          }} />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrModal(null)}
          >
            <motion.div
              className="modal-card qr-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>QR Code</h3>
              <p className="qr-url">{qrModal.shortUrl}</p>
              <img src={qrModal.qrCode} alt="QR Code" className="qr-image" />
              <a href={qrModal.qrCode} download="qrcode.png" className="btn btn-primary btn-full">
                Download QR Code
              </a>
              <button onClick={() => setQrModal(null)} className="btn btn-ghost btn-full" style={{ marginTop: '8px' }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditModal = ({ url, onClose, onUpdate }) => {
  const [originalUrl, setOriginalUrl] = useState(url.originalUrl);
  const [title, setTitle] = useState(url.title || '');
  const [expiresAt, setExpiresAt] = useState(url.expiresAt ? (() => {
    const d = new Date(url.expiresAt);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })() : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { originalUrl, title };
      if (expiresAt) {
        if (!/^(\d{2})-(\d{2})-(\d{4})$/.test(expiresAt)) {
          throw new Error('Expiry date must be in dd-mm-yyyy format');
        }
        const [dd, mm, yyyy] = expiresAt.split('-');
        body.expiresAt = new Date(`${yyyy}-${mm}-${dd}T23:59:59.000Z`).toISOString();
      } else {
        body.expiresAt = null;
      }
      const data = await api.updateUrl(url.id, body);
      toast.success('Link updated!');
      onUpdate(data.url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-card edit-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Edit Link</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Destination URL</label>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Expiry Date (optional)</label>
            <input
              type="text"
              value={expiresAt}
              placeholder="dd-mm-yyyy"
              maxLength={10}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d]/g, '');
                if (val.length > 2) val = val.substring(0, 2) + '-' + val.substring(2);
                if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5);
                setExpiresAt(val);
              }}
              className="form-input"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <span className="btn-spinner"></span> : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
