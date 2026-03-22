import { motion } from 'framer-motion';

const LoadingScreen = () => (
  <div className="loading-screen">
    <motion.div
      className="loading-spinner"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    >
      <div className="spinner-ring"></div>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="loading-text"
    >
      Loading...
    </motion.p>
  </div>
);

export default LoadingScreen;
