import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiLink, HiTag, HiCalendar, HiCode, HiArrowRight, HiCheckCircle, HiClipboardCopy, HiDocumentText, HiUpload, HiExclamationCircle } from 'react-icons/hi';
import { api } from '../utils/api';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const CreateUrl = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);

  // Single URL State
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errors, setErrors] = useState({});
  const [createdUrl, setCreatedUrl] = useState(null);

  // Bulk CSV State
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const navigate = useNavigate();

  const validateSingle = () => {
    const errs = {};
    if (!originalUrl) errs.originalUrl = 'URL is required';
    else {
      try {
        const urlObj = new URL(originalUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          errs.originalUrl = 'Please enter a valid URL';
        }
      } catch {
        errs.originalUrl = 'Please enter a valid URL';
      }
    }
    if (customAlias && (customAlias.length < 3 || customAlias.length > 30)) {
      errs.customAlias = 'Alias must be 3-30 characters';
    }
    if (customAlias && !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
      errs.customAlias = 'Only letters, numbers, hyphens, and underscores allowed';
    }

    if (expiresAt) {
      if (!/^(\d{2})-(\d{2})-(\d{4})$/.test(expiresAt)) {
        errs.expiresAt = 'Format must be dd-mm-yyyy';
      } else {
        const [dd, mm, yyyy] = expiresAt.split('-');
        const dateObj = new Date(`${yyyy}-${mm}-${dd}T23:59:59.000Z`);
        if (isNaN(dateObj.getTime())) {
          errs.expiresAt = 'Invalid date';
        } else if (dateObj < new Date()) {
          errs.expiresAt = 'Expiry date must be in the future';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    if (!validateSingle()) return;
    setLoading(true);
    try {
      const body = { originalUrl };
      if (customAlias) body.customAlias = customAlias;
      if (title) body.title = title;
      if (expiresAt) {
        const [dd, mm, yyyy] = expiresAt.split('-');
        body.expiresAt = new Date(`${yyyy}-${mm}-${dd}T23:59:59.000Z`).toISOString();
      }

      const data = await api.createUrl(body);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      setCreatedUrl({ ...data.url, shortUrl: `${backendUrl}/${data.url.shortCode}` });
      toast.success('Short link created! 🎉');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdUrl.shortUrl);
    toast.success('Copied to clipboard!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        return toast.error('Please upload a valid .csv file');
      }
      setCsvFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            toast.error('CSV file is empty or formatted incorrectly');
            setParsedData([]);
          } else {
            setParsedData(results.data);
            toast.success(`Parsed ${results.data.length} rows successfully`);
          }
        },
        error: (err) => {
          toast.error('Failed to parse CSV file: ' + err.message);
        }
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) return toast.error('No valid data parsed from CSV');
    setLoading(true);
    try {
      const data = await api.createUrlBulk(parsedData);
      setBulkResults({
        successCount: data.successCount,
        errors: data.errors,
        total: parsedData.length
      });
      toast.success(data.message || 'Bulk shortening processed!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setCreatedUrl(null);
    setBulkResults(null);
    setOriginalUrl('');
    setCustomAlias('');
    setTitle('');
    setExpiresAt('');
    setCsvFile(null);
    setParsedData([]);
    setErrors({});
  };

  if (createdUrl) {
    return (
      <div className="create-page">
        <motion.div
          className="success-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="success-icon"><HiCheckCircle /></div>
          <h2>Link Created Successfully!</h2>

          <div className="created-link-box">
            <div className="created-link-label">Your Short URL</div>
            <div className="created-link-url">
              <a href={createdUrl.shortUrl} target="_blank" rel="noopener noreferrer">
                <span className="url-domain-prefix">https://</span>{createdUrl.shortCode}
              </a>
              <button onClick={handleCopy} className="copy-btn">
                <HiClipboardCopy />
              </button>
            </div>
          </div>

          <div className="created-link-original">
            <span>Redirects to:</span>
            <a href={createdUrl.originalUrl} target="_blank" rel="noopener noreferrer">
              {createdUrl.originalUrl.length > 60
                ? createdUrl.originalUrl.substring(0, 60) + '...'
                : createdUrl.originalUrl}
            </a>
          </div>

          <div className="success-actions">
            <button onClick={resetState} className="btn btn-ghost">
              Create Another
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (bulkResults) {
    return (
      <div className="create-page">
        <motion.div
          className="success-card bulk-success-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="success-icon" style={{ color: bulkResults.errors.length > 0 ? '#f59e0b' : '#34d399' }}>
            {bulkResults.errors.length > 0 ? <HiExclamationCircle /> : <HiCheckCircle />}
          </div>
          <h2>Bulk Processing Complete</h2>
          <p className="bulk-summary-text">
            Successfully created <strong>{bulkResults.successCount}</strong> out of {bulkResults.total} short links.
          </p>

          {bulkResults.errors.length > 0 && (
            <div className="bulk-errors-box">
              <div className="bulk-errors-header">Failed specific rows:</div>
              <ul className="bulk-errors-list">
                {bulkResults.errors.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.error} <span className="err-url">({err.url?.substring(0, 30)}...)</span></li>
                ))}
              </ul>
            </div>
          )}

          <div className="success-actions">
            <button onClick={resetState} className="btn btn-ghost">
              Upload Another CSV
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              View Dashboard Links
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="create-page">
      <motion.div
        className="create-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="create-header">
          <h1>Create Short Link</h1>
          <p>Transform any long URL into a clean, trackable short link</p>
        </div>

        <div className="create-tabs">
          <button 
            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => { setActiveTab('single'); setErrors({}); }}
          >
            Single Link
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bulk'); setErrors({}); }}
          >
            Bulk CSV Upload
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'single' ? (
            <motion.form 
              key="single-form"
              onSubmit={handleSubmitSingle} 
              className="create-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="form-group">
                <label htmlFor="url">
                  <HiLink className="label-icon" />
                  Destination URL <span className="required">*</span>
                </label>
                <div className={`input-wrapper ${errors.originalUrl ? 'input-error' : ''}`}>
                  <input
                    id="url"
                    type="text"
                    placeholder="https://example.com/very-long-url-that-needs-shortening"
                    value={originalUrl}
                    onChange={(e) => { setOriginalUrl(e.target.value); setErrors(p => ({ ...p, originalUrl: '' })); }}
                  />
                </div>
                {errors.originalUrl && <span className="error-msg">{errors.originalUrl}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="alias">
                    <HiCode className="label-icon" />
                    Custom Alias <span className="optional">(optional)</span>
                  </label>
                  <div className={`input-wrapper ${errors.customAlias ? 'input-error' : ''}`}>
                    <input
                      id="alias"
                      type="text"
                      placeholder="my-custom-link"
                      value={customAlias}
                      onChange={(e) => { setCustomAlias(e.target.value); setErrors(p => ({ ...p, customAlias: '' })); }}
                    />
                  </div>
                  {errors.customAlias && <span className="error-msg">{errors.customAlias}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="expiry">
                    <HiCalendar className="label-icon" />
                    Expiry Date <span className="optional">(optional)</span>
                  </label>
                  <div className={`input-wrapper ${errors.expiresAt ? 'input-error' : ''}`}>
                    <input
                      id="expiry"
                      type="text"
                      placeholder="dd-mm-yyyy"
                      maxLength={10}
                      value={expiresAt}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d]/g, '');
                        if (val.length > 2) val = val.substring(0, 2) + '-' + val.substring(2);
                        if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5);
                        setExpiresAt(val);
                        setErrors(p => ({ ...p, expiresAt: '' }));
                      }}
                    />
                  </div>
                  {errors.expiresAt && <span className="error-msg">{errors.expiresAt}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  <HiTag className="label-icon" />
                  Title <span className="optional">(optional)</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="title"
                    type="text"
                    placeholder="E.g., Marketing campaign Q1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading ? (
                  <span className="btn-spinner"></span>
                ) : (
                  <>Shorten URL <HiArrowRight /></>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="bulk-form"
              className="create-form bulk-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="form-group">
                <label>
                  <HiDocumentText className="label-icon" />
                  Upload CSV File
                </label>
                <p className="bulk-help-text">
                  Your CSV must contain these exact headers: <br/> <code>originalUrl</code>, <code>customAlias</code>, <code>title</code>, <code>expiresAt</code>.
                </p>
                <div className="file-drop-zone">
                  <input 
                    type="file" 
                    id="csvFile" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                    className="file-input-hidden"
                  />
                  <label htmlFor="csvFile" className="file-drop-label">
                    <HiUpload className="upload-icon" />
                    <span className="upload-main-text">{csvFile ? csvFile.name : 'Click to upload or drag and drop'}</span>
                    <span className="upload-sub-text">CSV files only</span>
                  </label>
                </div>
                {parsedData.length > 0 && (
                  <div className="parsed-success">
                    <HiCheckCircle className="parsed-icon" /> Ready to process {parsedData.length} valid rows
                  </div>
                )}
              </div>

              <button 
                type="button" 
                onClick={handleBulkSubmit}
                className="btn btn-primary btn-lg btn-full" 
                disabled={loading || parsedData.length === 0}
              >
                {loading ? (
                  <span className="btn-spinner"></span>
                ) : (
                  <>Bulk Shorten {parsedData.length > 0 ? `${parsedData.length} URLs` : ''} <HiArrowRight /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default CreateUrl;
