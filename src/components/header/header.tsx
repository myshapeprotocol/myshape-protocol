"use client";

import React, { useState, useEffect } from 'react';

const ProtocolHeader = () => {
  const [utcTime, setUtcTime] = useState("");

  // 实时更新 UTC 时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = now.toISOString().split('T')[1].split('.')[0] + " UTC";
      setUtcTime(timeString);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav style={styles.headerNav}>
      {/* 左侧：系统版本与状态 */}
      <div style={styles.leftSection}>
        <div className="status-pulse" />
        <span style={styles.versionText}>MYSHAPE_CORE_V1.92</span>
        <span style={styles.divider}>//</span>
        <span style={styles.statusText}>ENCRYPTION: ACTIVE</span>
      </div>

      {/* 中间：品牌标题 - 采用绝对定位实现真·居中 */}
      <div style={styles.centerSection}>
        M Y S H A P E
      </div>

      {/* 右侧：实时数据与节点 */}
      <div style={styles.rightSection}>
        <span style={styles.timeDisplay}>{utcTime}</span>
        <div style={styles.nodeBadge}>
          NODE_STK_042
        </div>
      </div>

      {/* 全局样式注入：处理呼吸灯动画 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes statusBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        .status-pulse {
          width: 4px;
          height: 4px;
          background-color: #90c8ff;
          border-radius: 50%;
          box-shadow: 0 0 8px #90c8ff;
          animation: statusBlink 2.5s infinite ease-in-out;
        }
      `}} />
    </nav>
  );
};

// 显式定义样式对象类型，确保 TypeScript 兼容性
const styles: { [key: string]: React.CSSProperties } = {
  headerNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(144, 200, 255, 0.1)',
    zIndex: 9999,
    fontFamily: 'monospace',
    color: '#90c8ff',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '10px',
    letterSpacing: '0.15em',
  },
  versionText: {
    fontWeight: 'bold',
  },
  divider: {
    opacity: 0.2,
  },
  statusText: {
    opacity: 0.6,
  },
  centerSection: {
    position: 'absolute', // ⭐ 核心修改：绝对定位
    left: '50%',          // 移动到容器 50% 位置
    transform: 'translateX(-50%)', // 向左平移自身宽度的一半，实现完美居中
    color: '#fff',
    fontSize: '13px',
    letterSpacing: '0.8em',
    fontWeight: 300,
    whiteSpace: 'nowrap',
    pointerEvents: 'none', // 确保不干扰点击
    textIndent: '0.8em',   // 抵消字母间距带来的视觉偏移
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    fontSize: '10px',
  },
  timeDisplay: {
    opacity: 0.8,
    letterSpacing: '0.1em',
  },
  nodeBadge: {
    border: '1px solid rgba(144, 200, 255, 0.4)',
    padding: '2px 8px',
    fontSize: '9px',
    background: 'rgba(144, 200, 255, 0.05)',
  }
};

export default ProtocolHeader;