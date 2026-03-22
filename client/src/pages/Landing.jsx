import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiChartBar, HiShieldCheck, HiLightningBolt, HiQrcode, HiClock, HiLink } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const features = [
  { icon: <HiLightningBolt />, title: 'Lightning Fast', desc: 'Create short links in milliseconds with our optimized infrastructure.' },
  { icon: <HiChartBar />, title: 'Rich Analytics', desc: 'Track clicks, devices, browsers and geographic data in real-time.' },
  { icon: <HiShieldCheck />, title: 'Secure & Private', desc: 'All links are protected with authentication. Your data stays yours.' },
  { icon: <HiQrcode />, title: 'QR Codes', desc: 'Generate beautiful QR codes for any shortened link instantly.' },
  { icon: <HiLink />, title: 'Custom Aliases', desc: 'Choose your own memorable short codes for better branding.' },
  { icon: <HiClock />, title: 'Link Expiry', desc: 'Set expiration dates for temporary campaigns and time-limited content.' },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-dot"></span>
            <span>Powerful URL Management Platform</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Shorten URLs.
            <br />
            <span className="gradient-text">Amplify Results.</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Transform long, complex URLs into clean, trackable short links.
            Get powerful analytics, custom aliases, and QR codes — all in one beautiful platform.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Link to={user ? '/dashboard/create' : '/signup'} className="btn btn-primary btn-lg">
              <HiLightningBolt />
              Start Shortening — Free
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-ghost btn-lg">
                Sign In
              </Link>
            )}
          </motion.div>

          <motion.div
            className="hero-stats"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="stat-item">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Links Created</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">50K+</span>
              <span className="stat-label">Total Clicks</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">
              A complete toolkit for URL management, analytics, and optimization.
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to get started?</h2>
            <p>Join thousands of users who trust SnipLink for their link management needs.</p>
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
              {user ? 'Go to Dashboard' : 'Create Free Account'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span>🔗</span>
              <span>SnipLink</span>
            </div>
            <p className="footer-text">
              © 2026 SnipLink. Built with ❤️ for the modern web.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
