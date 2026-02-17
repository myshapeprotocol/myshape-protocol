"use client";

import React from 'react';

const ProtocolFooter = () => {
  const socialLinks = [
    { name: 'GITHUB', url: 'https://github.com/myshapeprotocol' },
    { name: 'X_PROTOCOL', url: 'https://x.com/myshapeprotocol' },
    { name: 'LINKEDIN', url: 'https://www.linkedin.com/company/myshapeprotocol/' },
    { name: 'DISCORD', url: 'https://discord.gg/BUkBMWWt' },
  ];

  return (
    <footer style={styles.footerContainer}>
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
              <span style={styles.separator}>/</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 底部声明 */}
      <div style={styles.legalInfo}>
        <p style={styles.statusText}>SYSTEM_ID: MS_PROT_2026 // NODE_STATUS: OPERATIONAL</p>
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
          transition: all 0.4s ease;
          font-family: monospace;
        }
        .f-link:hover { 
          color: #fff;
          opacity: 1; 
          text-shadow: 0 0 15px rgba(144, 200, 255, 0.8);
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footerContainer: {
    padding: '40px 20px 80px', // 减少了顶部 padding，因为没有线了，不需要撑开太远
    textAlign: 'center',
    background: 'transparent',
    // ⭐ 这里已经删除了 borderTop，彻底去掉那条横线
    marginTop: '0px', 
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  linkGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  separator: {
    color: 'rgba(144, 200, 255, 0.1)',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
  legalInfo: {
    fontFamily: 'monospace',
    letterSpacing: '0.15em',
  },
  statusText: {
    color: '#90c8ff',
    fontSize: '9px',
    opacity: 0.3,
    marginBottom: '12px',
  },
  copyrightText: {
    color: '#fff',
    fontSize: '9px',
    opacity: 0.2,
    lineHeight: 2,
  }
};

export default ProtocolFooter;