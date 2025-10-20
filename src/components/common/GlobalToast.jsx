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

  return (
    <div className={`global-toast ${visible ? 'show' : ''} ${type === 'error' ? 'gt-error' : 'gt-success'}`}>
      <div className="global-toast__icon">
        {type === 'success' ? (
          <svg className="gt-icon-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"></path>
          </svg>
        ) : (
          <svg className="gt-icon-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
          </svg>
        )}
      </div>
      <div className="global-toast__message">{message}</div>
    </div>
  );
};

export default GlobalToast;


