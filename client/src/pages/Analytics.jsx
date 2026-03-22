import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiCursorClick, HiClock, HiDesktopComputer, HiExternalLink, HiClipboardCopy, HiCalendar, HiGlobeAlt } from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { api } from '../utils/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const COLORS = ['#a855f7', '#3b82f6', '#f43f5e', '#22d3ee', '#facc15', '#34d399', '#fb923c', '#818cf8'];

const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const Analytics = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await api.getAnalytics(id);
      if (result.analytics.deviceStats) {
        result.analytics.deviceStats = result.analytics.deviceStats.map(d => ({
          ...d,
          device: capitalize(d.device)
        }));
      }
      if (result.analytics.recentVisits) {
        result.analytics.recentVisits = result.analytics.recentVisits.map(v => ({
          ...v,
          device: capitalize(v.device)
        }));
      }
      setData(result);
    } catch (err) {
      if (showLoading) setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

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
      if (data.urlId === id) {
        // Silent refetch to update charts seamlessly without loader jump
        fetchAnalytics(false);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Analytics Socket error:', err);
    });
    
    return () => newSocket.disconnect();
  }, [id, fetchAnalytics]);

  const handleCopy = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, ''); // Strip /api to get the root domain
    navigator.clipboard.writeText(`${baseUrl}/${data.url.shortCode}`);
    toast.success('Link copied!');
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const formatFullDate = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatChartDate = (dateStr) => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-loading">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card skeleton-tall">
                <div className="skeleton-line skeleton-lg"></div>
                <div className="skeleton-line skeleton-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="error-state">
            <h3>Failed to load analytics</h3>
            <p>{error}</p>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const { url, analytics } = data;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, ''); // Strip /api to get the root domain
  const shortUrl = `${baseUrl}/${url.shortCode}`;

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <motion.div
          className="analytics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/dashboard" className="back-link">
            <HiArrowLeft /> Back to Dashboard
          </Link>

          <div className="analytics-url-info">
            <div className="analytics-short-url">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                <span className="url-domain-prefix">https://</span>{url.shortCode}
              </a>
              <button onClick={handleCopy} className="copy-btn-sm"><HiClipboardCopy /></button>
            </div>
            <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="analytics-original-url">
              <HiExternalLink />
              {url.originalUrl.length > 80 ? url.originalUrl.substring(0, 80) + '...' : url.originalUrl}
            </a>
            {url.title && <p className="analytics-title">{url.title}</p>}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon"><HiCursorClick /></div>
            <div className="stat-card-content">
              <span className="stat-card-value">{analytics.totalClicks}</span>
              <span className="stat-card-label">Total Clicks</span>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon"><HiClock /></div>
            <div className="stat-card-content">
              <span className="stat-card-value">
                {analytics.lastVisit ? formatDateTime(analytics.lastVisit) : 'Never'}
              </span>
              <span className="stat-card-label">Last Visited</span>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon"><HiDesktopComputer /></div>
            <div className="stat-card-content">
              <span className="stat-card-value">
                {analytics.deviceStats?.length || 0}
              </span>
              <span className="stat-card-label">Device Types</span>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon"><HiCalendar /></div>
            <div className="stat-card-content">
              <span className="stat-card-value">
                {formatFullDate(url.createdAt)}
              </span>
              <span className="stat-card-label">Created</span>
            </div>
          </div>
        </motion.div>

        {/* Click Trend Chart */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Click Trend <span className="chart-subtitle">(Last 30 Days)</span></h3>
          {analytics.clicksByDay?.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.clicksByDay}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    stroke="#555"
                    fontSize={12}
                  />
                  <YAxis stroke="#555" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 15, 20, 0.95)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '10px',
                      color: '#e2e8f0',
                      fontSize: '13px'
                    }}
                    labelFormatter={(val) => formatDate(val)}
                    formatter={(val) => [val, 'Clicks']}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fill="url(#clickGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="no-data">No click data yet. Share your link to start tracking!</p>
          )}
        </motion.div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Browser Chart */}
          <motion.div
            className="chart-card chart-card-half"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Browsers</h3>
            {analytics.browserStats?.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.browserStats}
                      dataKey="count"
                      nameKey="browser"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ browser, percent }) => `${browser} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.browserStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 15, 20, 0.95)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '10px',
                        color: '#e2e8f0'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="no-data">No browser data yet</p>
            )}
          </motion.div>

          {/* Device Chart */}
          <motion.div
            className="chart-card chart-card-half"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>Devices</h3>
            {analytics.deviceStats?.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.deviceStats} layout="vertical">
                    <XAxis type="number" stroke="#555" fontSize={12} />
                    <YAxis dataKey="device" type="category" stroke="#555" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 15, 20, 0.95)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '10px',
                        color: '#e2e8f0'
                      }}
                      cursor={{fill: 'var(--text-muted)', opacity: 0.2}}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {analytics.deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="no-data">No device data yet</p>
            )}
          </motion.div>
        </div>

        {/* Global Traffic Hub */}
        <motion.div
          className="chart-card global-traffic-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3><HiGlobeAlt className="inline-icon"/> Global Traffic Hub <span className="chart-subtitle">(Geolocation)</span></h3>
          {analytics.countryStats?.length > 0 ? (
            <div className="geo-list-wrapper">
              <ul className="geo-pulse-list">
                {analytics.countryStats.map((stat, idx) => {
                  const maxCount = analytics.countryStats[0].count;
                  const percent = Math.round((stat.count / maxCount) * 100);
                  return (
                    <li key={idx} className="geo-pulse-item">
                      <div className="geo-info">
                        <span className="geo-dot"></span>
                        <span className="geo-country">{stat.country}</span>
                        <span className="geo-count">{stat.count} clicks</span>
                      </div>
                      <div className="geo-bar-track">
                        <motion.div 
                          className="geo-bar-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></motion.div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="no-data">No geolocation data mapped yet</p>
          )}
        </motion.div>

        {/* Recent Visits */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Recent Visits</h3>
          {analytics.recentVisits?.length > 0 ? (
            <div className="visits-table-wrapper">
              <table className="visits-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Browser</th>
                    <th>Device</th>
                    <th>OS</th>
                    <th>Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td>{formatDateTime(visit.timestamp)}</td>
                      <td>{visit.browser || '—'}</td>
                      <td>{visit.device || '—'}</td>
                      <td>{visit.os || '—'}</td>
                      <td className="referrer-cell">{visit.referrer || 'Direct'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No visits recorded yet</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
