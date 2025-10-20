import React, { useEffect, useState, useRef } from 'react';
import './GlobalToast.css';

const GlobalToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success'); // 'success' | 'error'
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handleNotify = (e) => {
      const detail = e?.detail || {};
      const nextType = detail.type === 'error' ? 'error' : 'success';
      const nextMessage = typeof detail.message === 'string' && detail.message.trim().length > 0
        ? detail.message
        : nextType === 'error' ? 'Something went wrong' : 'Operation completed successfully';

      setType(nextType);
      setMessage(nextMessage);
      setVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    window.addEventListener('api:notify', handleNotify);
    return () => {
      window.removeEventListener('api:notify', handleNotify);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(false);
  };

  return (
    <div className={`global-toast ${visible ? 'show' : ''} ${type === 'error' ? 'gt-error' : 'gt-success'}`}>
      <button
        type="button"
        className="global-toast__close"
        aria-label="Close notification"
        onClick={handleClose}
      >
        ×
      </button>
      <span className="global-toast__text">{message}</span>
    </div>
  );
};

export default GlobalToast;


