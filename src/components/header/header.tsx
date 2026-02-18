"use client";

import React, { useState, useEffect } from 'react';

const ProtocolHeader = () => {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // 保持 ISO 时间格式，增加科技感
      setUtcTime(now.getUTCHours().toString().padStart(2, '0') + ":" + 
                 now.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                 now.getUTCSeconds().toString().padStart(2, '0') + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav style={styles.headerNav}>
      {/* 渐变遮罩层 - 让星云过渡更平滑 */}
      <div style={styles.gradientOverlay} />

      <div style={styles.leftSection}>
        <div className="status-pulse" />
        <span style={styles.versionText} className="hide-mobile">MYSHAPE_CORE_V1.92</span>
        <span style={styles.divider} className="hide-mobile">//</span>
        <span style={styles.statusText}>E&C: ACTIVE</span>
      </div>

      <div style={styles.centerSection} className="brand-logo">
        M Y S H A P E
      </div>

      <div style={styles.rightSection}>
        <span style={styles.timeDisplay} className="hide-mobile">{utcTime}</span>
        <div style={styles.nodeBadge}>
          KFK_SPC_DC{new Date().getDate()} 
        </div>
      </div>

      <style jsx>{`
        @keyframes statusBlink {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(144, 200, 255, 0.6); }
          50% { opacity: 0.3; transform: scale(0.9); box-shadow: 0 0 2px rgba(144, 200, 255, 0.2); }
        }
        .status-pulse {
          width: 4px;
          height: 4px;
          background-color: #90c8ff;
          border-radius: 50%;
          animation: statusBlink 3s infinite ease-in-out;
        }
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .brand-logo { letter-spacing: 0.4em !important; font-size: 11px !important; }
        }
      `}</style>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  headerNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '60px', // 稍微加高一点点，更有呼吸感
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    background: 'linear-gradient(to bottom, rgba(2, 4, 10, 0.95) 0%, rgba(2, 4, 10, 0) 100%)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 9999,
    fontFamily: 'monospace',
    color: '#90c8ff',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(144, 200, 255, 0.2), transparent)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '9px',
    letterSpacing: '0.15em',
  },
  versionText: { fontWeight: 'bold', opacity: 0.8 },
  divider: { opacity: 0.2 },
  statusText: { opacity: 0.5 },
  centerSection: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: '14px',
    letterSpacing: '1em', // 极致的松散美学
    fontWeight: 300,
    whiteSpace: 'nowrap',
    textIndent: '1em',
    opacity: 0.9,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    fontSize: '9px',
  },
  timeDisplay: { opacity: 0.6, letterSpacing: '0.05em' },
  nodeBadge: {
    border: '1px solid rgba(144, 200, 255, 0.2)',
    padding: '3px 10px',
    fontSize: '8px',
    background: 'rgba(144, 200, 255, 0.03)',
    borderRadius: '2px',
  }
};

export default ProtocolHeader;