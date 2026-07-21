import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import '../../content.css';

function DropView({ pct, angularNode, rulesNode }) {
  const pctNum = parseFloat(pct);
  const isGood = pctNum > 0;
  const mainRef = useRef(null);

  useEffect(() => {
    if (!mainRef.current) return;
    if (rulesNode) mainRef.current.appendChild(rulesNode);
    if (angularNode) mainRef.current.appendChild(angularNode);
  }, [angularNode, rulesNode]);

  return (
    <div className="text-[13px] text-slate-800" style={{ boxSizing: 'border-box', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight m-0">
          Course <span style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Drop</span> Application
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isGood ? '#f0fdf4' : '#fff1f2', borderRadius: '10px', padding: '8px 16px' }}>
          <FiDollarSign style={{ fontSize: '15px', color: isGood ? '#15803d' : '#be123c' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: isGood ? '#15803d' : '#be123c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Refund</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isGood ? '#166534' : '#991b1b', fontFamily: 'ui-monospace, monospace' }}>{pct}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: isGood ? '#dcfce7' : '#ffe4e6', color: isGood ? '#15803d' : '#be123c' }}>
            {isGood ? <FiCheckCircle style={{ fontSize: '11px' }} /> : <FiXCircle style={{ fontSize: '11px' }} />}
            {isGood ? 'Eligible' : 'Not Eligible'}
          </span>
        </div>
      </div>

      <div ref={mainRef} />
    </div>
  );
}

(function mount() {
  if (window.__aiubDropMounted) return;
  if (!window.location.href.includes('/Student/Adrop/DropApplication')) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const courses = document.querySelectorAll(
        '[ng-controller="DropApplicationController2"] [ng-repeat].ng-scope'
      );
      if (!courses.length) { setTimeout(init, 300); return; }
      if (window.__aiubDropMounted) return;
      window.__aiubDropMounted = true;

      const style = document.createElement('style');
      style.id = 'aiub-drop-style';
      style.textContent = `
        .portal-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; }
        .alert.alert-warning { display: none !important; }

        /* Rules toggle button */
        [data-target="#Rules"] .label.label-info {
          font-size: 12px !important; padding: 6px 14px !important; border-radius: 6px !important;
          background: #dbeafe !important; color: #0284c7 !important; border: 1px solid #bfdbfe !important;
          font-weight: 600 !important; cursor: pointer !important;
        }

        /* Rules table */
        #Rules .table { border-collapse: collapse !important; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0 !important; background: #fff !important; }
        #Rules .table th { background: linear-gradient(to right, #f8fafc, #f1f5f9) !important; font-size: 11px !important; text-transform: uppercase; letter-spacing: .6px; color: #64748b !important; font-weight: 700 !important; border-bottom: 1px solid #e2e8f0 !important; padding: 11px 14px !important; }
        #Rules .table td { font-size: 12px !important; padding: 9px 14px !important; color: #475569 !important; border-color: #f1f5f9 !important; }
        #Rules .table tbody tr:hover { background: #f8fafc !important; }

        /* ── COURSE CARDS ── */
        [ng-controller="DropApplicationController2"] .ng-scope > [ng-repeat] { display: none !important; }

        [ng-controller="DropApplicationController2"] [ng-repeat].ng-scope {
          background: linear-gradient(135deg, #f8fbff 0%, #eff6ff 50%, #dbeafe 100%) !important;
          border: 1px solid #bfdbfe !important;
          border-radius: 16px !important;
          margin-bottom: 16px !important;
          padding: 0 !important;
          overflow: hidden !important;
          transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
          box-shadow: 0 1px 4px 0 rgba(0,0,0,0.06) !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat].ng-scope:hover {
          box-shadow: 0 6px 20px -4px rgba(0,0,0,0.1) !important;
          border-color: #bfdbfe !important;
        }

        /* Card with error/warning highlight */
        [ng-controller="DropApplicationController2"] [ng-repeat].ng-scope:has(.col-md-2 span.ng-binding:not(.ng-hide)) {
          border-color: #fecdd3 !important;
          background: linear-gradient(135deg, #fff8f8 0%, #fff1f2 50%, #ffe4e6 100%) !important;
        }

        /* ── CARD INNER ROW ── */
        [ng-controller="DropApplicationController2"] [ng-repeat].ng-scope > .row {
          margin: 0 !important;
          padding: 20px 24px !important;
          display: flex !important;
          align-items: center !important;
          gap: 20px !important;
        }

        /* ── LEFT: Course Number Icon ── */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-1 {
          flex: 0 0 auto !important;
          padding: 0 !important;
          width: auto !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-1 > span[style*="steelblue"] {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 64px !important;
          height: 64px !important;
          background: linear-gradient(135deg, #eff6ff, #dbeafe) !important;
          border-radius: 14px !important;
          color: #2563eb !important;
          font-family: ui-monospace, monospace !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          letter-spacing: 0.02em !important;
          text-transform: uppercase !important;
          padding: 0 !important;
          text-align: center !important;
          line-height: 1.2 !important;
        }

        /* ── MIDDLE: Course Info ── */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-6 {
          flex: 1 1 auto !important;
          padding: 0 !important;
          min-width: 0 !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-6 > span[style*="slateblue"] {
          color: #0f172a !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          display: block !important;
          margin-bottom: 8px !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat].ng-scope:has(.col-md-2 span.ng-binding:not(.ng-hide)) .col-md-6 > span[style*="slateblue"] {
          text-decoration: line-through !important;
          color: #94a3b8 !important;
        }

        /* Schedule tags row */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-6 small.ng-binding {
          display: inline-flex !important;
          align-items: center !important;
          margin: 0 6px 6px 0 !important;
          font-size: 11px !important;
          color: #334155 !important;
          background: #f1f5f9 !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
          border: 1px solid #e2e8f0 !important;
        }

        /* Supervisors row */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-6 small.text-muted,
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-6 small:not(.ng-binding) {
          display: block !important;
          font-size: 11px !important;
          color: #64748b !important;
          margin-top: 4px !important;
        }

        /* ── RIGHT: Credits, Capacity & Drop Button ── */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-2 {
          flex: 0 0 auto !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-end !important;
          gap: 10px !important;
          min-width: 200px !important;
        }

        /* Credits & Capacity pill boxes */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-2 small.ng-binding {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: #f8fafc !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 5px 12px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #475569 !important;
        }

        /* Error badge */
        [ng-controller="DropApplicationController2"] [ng-repeat] .col-md-2 span.ng-binding:not(.ng-hide) {
          display: inline-flex !important;
          align-items: center !important;
          background: #fef2f2 !important;
          color: #991b1b !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          padding: 3px 10px !important;
          border-radius: 6px !important;
          border: none !important;
        }

        /* Drop button */
        [ng-controller="DropApplicationController2"] [ng-repeat] a.btn.btn-danger {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          background: #fff1f2 !important;
          color: #e11d48 !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 8px 24px !important;
          width: 100% !important;
          box-shadow: none !important;
          transition: all .2s ease !important;
          cursor: pointer !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          outline: none !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat] a.btn.btn-danger:hover {
          background: #ffe4e6 !important;
          box-shadow: 0 4px 12px -2px rgba(239,68,68,0.15) !important;
        }
        [ng-controller="DropApplicationController2"] [ng-repeat] a.btn.btn-danger::before {
          content: '' !important;
          display: none !important;
        }

        /* Warning label */
        [ng-controller="DropApplicationController2"] [ng-repeat] .label.label-warning {
          background: #fef3c7 !important; color: #92400e !important; border-radius: 5px !important;
          font-size: 11px !important; padding: 4px 10px !important; font-weight: 700 !important;
        }

        /* Section heading */
        [ng-controller="DropApplicationController2"] h5.text-center {
          font-size: 14px !important; font-weight: 700 !important; color: #1e293b !important; margin: 12px 0 !important;
        }

        /* Summary table */
        [ng-controller="DropApplicationController2"] .table-condensed th {
          font-size: 11px !important; text-transform: uppercase; letter-spacing: .6px; color: #64748b !important;
          background: linear-gradient(to right, #f8fafc, #f1f5f9) !important; border-bottom: 1px solid #e2e8f0 !important;
          padding: 10px 12px !important; font-weight: 700 !important;
        }
        [ng-controller="DropApplicationController2"] .table-condensed td {
          font-size: 12px !important; padding: 9px 12px !important; color: #475569 !important; border-color: #f1f5f9 !important;
        }
        [ng-controller="DropApplicationController2"] .table-condensed tbody tr:hover { background: #eff6ff !important; }
      `;
      document.head.appendChild(style);

      const alert = document.querySelector('.alert.alert-warning');
      let pct = '0%';
      if (alert) {
        const badge = alert.querySelector('.label-danger b') || alert.querySelector('.label-danger');
        if (badge) pct = badge.textContent.trim();
      }

      const target = document.querySelector('[ng-controller="DropApplicationController2"]');
      const rulesRow = document.querySelector('.portal-body > .row');

      const insertBefore = rulesRow || target;
      if (!insertBefore) return;

      const container = document.createElement('div');
      insertBefore.parentNode.insertBefore(container, insertBefore);
      createRoot(container).render(
        <DropView pct={pct} angularNode={target} rulesNode={rulesRow} />
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
