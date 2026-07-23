import { createRoot } from 'react-dom/client';
import { FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiCreditCard, FiAlertCircle, FiArrowUpRight } from 'react-icons/fi';
import '../../content.css';

function fmtAmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryCards({ totalSuccess, totalFailed, totalPending, txCount }) {
  return (
    <div style={{ boxSizing: 'border-box' }}>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#0f172a] m-0 mb-2 tracking-tight">
          Online Payment{' '}
          <span style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Transactions
          </span>
        </h1>
        <p className="text-[13px] text-[#64748b] m-0 font-medium">Full history of your online payments on the AIUB portal</p>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="rounded-[16px] p-5 border border-[#e2e8f0] bg-white transition-all hover:shadow-md flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5">
            <FiCheckCircle className="text-green-500" size={14} strokeWidth="2.5" /> Total Paid
          </div>
          <div className="text-[26px] font-bold text-[#1e293b]">৳{fmtAmt(totalSuccess)}</div>
          <div className="text-[11px] text-[#94a3b8] mt-1 font-medium">Successful transactions</div>
        </div>

        <div className="rounded-[16px] p-5 border border-[#e2e8f0] bg-white transition-all hover:shadow-md flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5">
            <FiXCircle className="text-red-400" size={14} strokeWidth="2.5" /> Failed / Cancelled
          </div>
          <div className="text-[26px] font-bold text-[#1e293b]">৳{fmtAmt(totalFailed)}</div>
          <div className="text-[11px] text-[#94a3b8] mt-1 font-medium">Unsuccessful attempts</div>
        </div>

        <div className="rounded-[16px] p-5 border border-[#e2e8f0] bg-white transition-all hover:shadow-md flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5">
            <FiClock className="text-amber-500" size={14} strokeWidth="2.5" /> Pending
          </div>
          <div className="text-[26px] font-bold text-[#1e293b]">৳{fmtAmt(totalPending)}</div>
          <div className="text-[11px] text-[#94a3b8] mt-1 font-medium">Awaiting confirmation</div>
        </div>

        <div className="rounded-[16px] p-5 border border-[#bfdbfe] flex flex-col justify-center"
          style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
            <FiCreditCard size={14} strokeWidth="2.5" /> Transactions
          </div>
          <div className="text-[26px] font-bold text-blue-700">{txCount}</div>
          <div className="text-[11px] text-blue-500 mt-1 font-medium">Total records found</div>
        </div>
      </div>
    </div>
  );
}

function statusConfig(status) {
  const s = (status || '').toLowerCase();
  if (s === 'success') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: FiCheckCircle, label: 'Success' };
  if (s === 'failed')  return { bg: '#fff1f2', color: '#dc2626', border: '#fecaca', Icon: FiXCircle,     label: 'Failed' };
  if (s === 'cancel')  return { bg: '#fef9c3', color: '#a16207', border: '#fde68a', Icon: FiAlertCircle, label: 'Cancelled' };
  if (s === 'create')  return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', Icon: FiClock,       label: 'Pending' };
  return                       { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', Icon: FiRefreshCw,  label: status };
}

function StatusBadge({ status }) {
  const cfg = statusConfig(status);
  const { Icon } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 9999, padding: '3px 10px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Icon size={11} strokeWidth="2.5" /> {cfg.label}
    </span>
  );
}

(function mount() {
  if (window.__aiubPayHistoryMounted) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const fieldset = document.querySelector('#main-content .margin5 fieldset');
      const table = fieldset?.querySelector('table.table-bordered');
      if (!table) { setTimeout(init, 200); return; }
      if (window.__aiubPayHistoryMounted) return;
      window.__aiubPayHistoryMounted = true;

      const legend = fieldset.querySelector('legend');
      if (legend) legend.style.display = 'none';

      const allRows = Array.from(table.querySelectorAll('tbody tr'));
      const headerRow = allRows.find(tr => tr.querySelector('td b'));
      const dataRows  = allRows.filter(tr => tr !== headerRow && tr.querySelectorAll('td').length >= 5);

      let totalSuccess = 0, totalFailed = 0, totalPending = 0;
      dataRows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        const amount = parseFloat(cells[3]?.textContent.trim() || '0') || 0;
        const status = (cells[4]?.textContent.trim() || '').toLowerCase();
        if (status === 'success') totalSuccess += amount;
        else if (status === 'failed' || status === 'cancel') totalFailed += amount;
        else if (status === 'create') totalPending += amount;
      });

      // Style header row
      if (headerRow) {
        headerRow.style.background = '#f1f5f9';
        Array.from(headerRow.querySelectorAll('td')).forEach(td => {
          const b = td.querySelector('b');
          if (b) td.textContent = b.textContent;
          td.style.cssText = 'padding:12px 16px!important;font-size:11px!important;font-weight:700!important;color:#334155!important;text-transform:uppercase;letter-spacing:0.6px;border:none!important;border-bottom:1px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;white-space:nowrap;background:inherit!important;';
        });
      }

      const BASE = 'padding:14px 16px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;border-right:1px solid #e8edf3!important;background:#fff!important;font-size:13px!important;vertical-align:middle!important;';

      dataRows.forEach(tr => {
        tr.addEventListener('mouseenter', () => Array.from(tr.querySelectorAll('td')).forEach(td => { td.style.background = '#f8fafc'; }));
        tr.addEventListener('mouseleave', () => Array.from(tr.querySelectorAll('td')).forEach(td => { td.style.background = '#fff'; }));

        const cells = Array.from(tr.querySelectorAll('td'));
        const [idCell, semCell, dateCell, amtCell, statusCell, actionCell] = cells;

        idCell.style.cssText   = BASE + 'font-family:"Courier New",monospace!important;font-size:11px!important;color:#64748b!important;white-space:nowrap;';
        semCell.style.cssText  = BASE + 'color:#334155!important;font-weight:500!important;';
        dateCell.style.cssText = BASE + 'color:#475569!important;white-space:nowrap;';

        const rawAmt = parseFloat(amtCell.textContent.trim()) || 0;
        amtCell.style.cssText = BASE + 'font-weight:600!important;color:#0f172a!important;text-align:right!important;';
        amtCell.textContent = '৳' + fmtAmt(rawAmt);

        // Status badge via React
        const status = statusCell.textContent.trim();
        statusCell.style.cssText = BASE;
        statusCell.innerHTML = '';
        const badgeWrap = document.createElement('span');
        statusCell.appendChild(badgeWrap);
        createRoot(badgeWrap).render(<StatusBadge status={status} />);

        // Action cell
        if (actionCell) {
          const link = actionCell.querySelector('a');
          if (link) {
            link.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff!important;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(59,130,246,0.3);transition:opacity 0.15s;white-space:nowrap;';
            const iconWrap = document.createElement('span');
            iconWrap.style.display = 'inline-flex';
            link.prepend(iconWrap);
            createRoot(iconWrap).render(<FiArrowUpRight size={13} strokeWidth="2.5" />);
            link.addEventListener('mouseenter', () => { link.style.opacity = '0.85'; });
            link.addEventListener('mouseleave', () => { link.style.opacity = '1'; });
          } else {
            actionCell.style.cssText = BASE + 'color:#94a3b8!important;font-size:12px!important;border-right:none!important;';
            const b = actionCell.querySelector('b');
            if (b) actionCell.textContent = b.textContent;
          }
        }
      });

      // Table & wrap
      table.style.cssText = 'width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Inter",sans-serif;';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow-x:auto;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);background:#fff;';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);


      fieldset.style.cssText = 'border:none!important;padding:0!important;margin:0!important;';
      const margin5 = document.querySelector('#main-content .margin5');
      if (margin5) margin5.style.cssText = 'padding:8px 0!important;';
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();

