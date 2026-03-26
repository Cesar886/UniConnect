'use client'

import { useState, useEffect } from 'react'
import { getWaitlistStats } from '@/app/actions/waitlist'

export default function WaitlistPage() {
  const [count, setCount] = useState(47)
  const goal = 200

  useEffect(() => {
    async function loadStats() {
      const stats = await getWaitlistStats()
      if (stats.success) {
        setCount(stats.total)
      }
    }
    loadStats()
  }, [])

  const updateProgress = (n: number) => {
    const pct = Math.min((n / goal) * 100, 100)
    return pct.toFixed(1) + '%'
  }

  return (
    <div className="um-root">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap');

        .um-root {
          background: #0a0a0a;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #ededed;
          padding: 0;
          margin: 0;
          overflow: hidden;
          position: relative;
        }

        .um-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .um-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
        }

        .um-orb-1 {
          width: 420px; height: 420px;
          background: #ba0034;
          top: -100px; left: -80px;
          animation: drift1 8s ease-in-out infinite alternate;
        }

        .um-orb-2 {
          width: 300px; height: 300px;
          background: #e51245;
          bottom: 50px; right: -60px;
          animation: drift2 10s ease-in-out infinite alternate;
        }

        .um-orb-3 {
          width: 200px; height: 200px;
          background: #800020;
          top: 50%; left: 60%;
          animation: drift1 12s ease-in-out infinite alternate;
        }

        @keyframes drift1 {
          from { transform: translate(0, 0); }
          to { transform: translate(30px, 20px); }
        }

        @keyframes drift2 {
          from { transform: translate(0, 0); }
          to { transform: translate(-20px, -30px); }
        }

        .um-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(186,0,52,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(186,0,52,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .um-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 52px 24px 48px;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .um-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(186,0,52,0.15);
          border: 1px solid rgba(186,0,52,0.3);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ff8ca8;
          margin-bottom: 32px;
          animation: fadein 0.8s ease both;
        }

        .um-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #e51245;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .um-logo {
          font-family: 'Syne', sans-serif;
          font-size: 72px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 4px;
          animation: fadein 0.9s ease both 0.1s;
          background: linear-gradient(135deg, #ededed 30%, #ba0034 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .um-tagline {
          font-size: 15px;
          font-weight: 300;
          color: rgba(237,237,237,0.45);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 48px;
          animation: fadein 1s ease both 0.2s;
        }

        .um-counter-wrap {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(186,0,52,0.2);
          border-radius: 20px;
          padding: 32px 40px;
          text-align: center;
          width: 100%;
          max-width: 360px;
          margin-bottom: 24px;
          animation: fadein 1.1s ease both 0.3s;
          position: relative;
          overflow: hidden;
        }

        .um-counter-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(186,0,52,0.5), transparent);
        }

        .um-counter-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(237,237,237,0.4);
          margin-bottom: 10px;
          font-weight: 400;
        }

        .um-counter-num {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ededed;
          line-height: 1;
          margin-bottom: 6px;
          transition: all 0.3s ease;
        }

        .um-counter-num span {
          color: rgba(237,237,237,0.25);
          font-size: 32px;
          font-weight: 400;
        }

        .um-progress-track {
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          margin: 16px 0 10px;
          overflow: hidden;
        }

        .um-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ba0034, #e51245);
          transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
        }

        .um-progress-text {
          font-size: 11px;
          color: rgba(237,237,237,0.35);
          letter-spacing: 0.06em;
        }

        .um-reveal-card {
          background: rgba(186,0,52,0.07);
          border: 1px solid rgba(186,0,52,0.2);
          border-radius: 14px;
          padding: 18px 24px;
          text-align: center;
          width: 100%;
          max-width: 360px;
          margin-bottom: 32px;
          animation: fadein 1.2s ease both 0.4s;
        }

        .um-reveal-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(229,18,69,0.7);
          margin-bottom: 8px;
        }

        .um-reveal-count {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #e51245;
          margin-bottom: 4px;
        }

        .um-reveal-sub {
          font-size: 12px;
          color: rgba(229,18,69,0.5);
          font-weight: 300;
        }

        .um-profiles {
          display: flex;
          gap: -8px;
          margin-bottom: 4px;
          justify-content: center;
        }

        .um-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid #0a0a0a;
          margin-left: -8px;
          background: rgba(186,0,52,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: rgba(237,237,237,0.6);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
        }

        .um-avatar:first-child { margin-left: 0; background: rgba(186,0,52,0.4); }
        .um-avatar:nth-child(2) { background: rgba(229,18,69,0.35); }
        .um-avatar:nth-child(3) { background: rgba(128,0,32,0.4); }
        .um-avatar:nth-child(4) { background: rgba(186,0,52,0.25); font-size: 10px; color: rgba(237,237,237,0.4); }

        .um-input-row {
          display: flex;
          gap: 8px;
          width: 100%;
          max-width: 360px;
          margin-bottom: 16px;
          animation: fadein 1.3s ease both 0.5s;
        }

        .um-btn {
          background: linear-gradient(135deg, #ba0034, #e51245);
          border: none;
          border-radius: 12px;
          padding: 14px 42px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.02em;
          text-decoration: none;
        }

        .um-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .um-btn:active { transform: scale(0.97); }

        .um-features {
          display: flex;
          gap: 10px;
          width: 100%;
          max-width: 360px;
          margin-top: 8px;
          animation: fadein 1.4s ease both 0.6s;
        }

        .um-feat {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
        }

        .um-feat-icon {
          font-size: 18px;
          margin-bottom: 6px;
          display: block;
        }

        .um-feat-text {
          font-size: 11px;
          color: rgba(237,237,237,0.4);
          line-height: 1.4;
          font-weight: 300;
        }

        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes numflash {
          0% { transform: scale(1.08); color: #e51245; }
          100% { transform: scale(1); color: #ededed; }
        }

        .flash { animation: numflash 0.4s ease; }
      `}</style>

      <div className="um-bg">
        <div className="um-orb um-orb-1"></div>
        <div className="um-orb um-orb-2"></div>
        <div className="um-orb um-orb-3"></div>
        <div className="um-grid"></div>
      </div>

      <div className="um-content">
        <div className="um-badge">
          <div className="um-dot"></div>
          acceso anticipado
        </div>

        <div className="um-logo">umatch</div>
        <div className="um-tagline">tu universidad. tu gente.</div>

        <div className="um-counter-wrap">
          <div className="um-counter-label">miembros registrados</div>
          <div className="um-counter-num">
            <span>{count}</span><span> / 200</span>
          </div>
          <div className="um-profiles">
            <div className="um-avatar">?</div>
            <div className="um-avatar">?</div>
            <div className="um-avatar">?</div>
            <div className="um-avatar">+{Math.max(count - 3, 0)}</div>
          </div>
          <div className="um-progress-track">
            <div className="um-progress-fill" style={{ width: updateProgress(count) }}></div>
          </div>
          <div className="um-progress-text">
            faltan <b>{Math.max(goal - count, 0)}</b> para revelar todos los perfiles
          </div>
        </div>

        <div className="um-reveal-card">
          <div className="um-reveal-label">se revelan los perfiles cuando lleguemos a</div>
          <div className="um-reveal-count">200 miembros</div>
          <div className="um-reveal-sub">todos los perfiles son anónimos hasta entonces</div>
        </div>

        <div className="um-input-row" style={{ justifyContent: 'center' }}>
          <a href="/register" className="um-btn">
            ir al registro
          </a>
        </div>

        <div className="um-features">
          <div className="um-feat">
            <span className="um-feat-icon">◎</span>
            <div className="um-feat-text">perfiles anónimos hasta los 200</div>
          </div>
          <div className="um-feat">
            <span className="um-feat-icon">◈</span>
            <div className="um-feat-text">solo correos de tu universidad</div>
          </div>
          <div className="um-feat">
            <span className="um-feat-icon">◇</span>
            <div className="um-feat-text">conoce gente de tu campus</div>
          </div>
        </div>
      </div>
    </div>
  )
}
