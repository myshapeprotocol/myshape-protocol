"use client";

import React, { useState, useEffect } from 'react';

const ProtocolFooter = () => {
  const [sysTime, setSysTime] = useState("");

  // 模拟实时系统时钟
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSysTime(now.toISOString().replace('T', ' ').substring(0, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const socialLinks = [
    { name: 'GITHUB', url: 'https://github.com/myshapeprotocol' },
    { name: 'X_PROTOCOL', url: 'https://x.com/myshapeprotocol' },
    { name: 'LINKEDIN', url: 'https://www.linkedin.com/company/myshapeprotocol/' },
    { name: 'DISCORD', url: 'https://discord.gg/BUkBMWWt' },
  ];

  return (
    <footer style={styles.footerContainer}>
      {/* 装饰性角标 - 增加科技质感 */}
      <div className="footer-deco decoration-left" />
      <div className="footer-deco decoration-right" />

      {/* 社交链接 */}
      <div style={styles.linkGrid}>
        {socialLinks.map((link, index) => (
          <React.Fragment key={link.name}>
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="f-link"
            >
              {link.name}
            </a>
            {index < socialLinks.length - 1 && (
              <span style={styles.separator}>//</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 底部声明 */}
      <div style={styles.legalInfo}>
        <div style={styles.statusLine}>
          <span style={styles.statusText}>SYSTEM_ID: MS_PROT_2026</span>
          <span className="blink-dot" />
          <span style={styles.statusText}>NODE_STATUS: <span className="status-active">OPERATIONAL</span></span>
          <span style={styles.timeText}>TIMESTAMP: {sysTime} UTC</span>
        </div>
        
        <p style={styles.copyrightText}>
          THE MOTION PROTOCOL IS A ZERO-KNOWLEDGE NEURAL LAYER. <br />
          ALL DATA IS SECURED VIA RSA-4096 ON-CHAIN ENCRYPTION.
        </p>
      </div>

      <style jsx>{`
        .f-link { 
          color: #90c8ff; 
          font-size: 10px; 
          letter-spacing: 0.3em; 
          text-decoration: none; 
          opacity: 0.4; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: monospace;
        }
        .f-link:hover { 
          color: #fff;
          opacity: 1; 
          letter-spacing: 0.45em; /* 悬停时字间距微调，增加“展开”感 */
          text-shadow: 0 0 15px rgba(144, 200, 255, 0.6);
        }

        .blink-dot {
          width: 4px;
          height: 4px;
          background: #90c8ff;
          border-radius: 50%;
          display: inline-block;
          margin: 0 15px;
          vertical-align: middle;
          animation: pulse 2s infinite;
        }

        .status-active {
          color: #fff;
          font-weight: bold;
        }

        .footer-deco {
          position: absolute;
          top: 0;
          width: 40px;
          height: 1px;
          background: rgba(144, 200, 255, 0.1);
        }
        .decoration-left { left: 40px; }
        .decoration-right { right: 40px; }

        @keyframes pulse {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 10px rgba(144, 200, 255, 0.5); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footerContainer: {
    padding: '80px 40px',
    textAlign: 'center',
    background: 'transparent',
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  linkGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '50px',
    flexWrap: 'wrap',
  },
  separator: {
    color: 'rgba(144, 200, 255, 0.1)',
    fontSize: '10px',
    fontFamily: 'monospace',
    margin: '0 5px'
  },
  legalInfo: {
    fontFamily: 'monospace',
    letterSpacing: '0.15em',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
    gap: '5px'
  },
  statusText: {
    color: '#90c8ff',
    fontSize: '9px',
    opacity: 0.3,
  },
  timeText: {
    color: '#90c8ff',
    fontSize: '9px',
    opacity: 0.3,
    marginLeft: '20px'
  },
  copyrightText: {
    color: '#fff',
    fontSize: '9px',
    opacity: 0.15,
    lineHeight: 2.2,
    maxWidth: '600px'
  }
};

export default ProtocolFooter;