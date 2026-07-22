import { createRoot } from 'react-dom/client';
import '../../content.css';

function parseAmount(text) {
  const n = parseFloat((text || '').replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function fmtAmt(num) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Enhanced table via DOM augmentation + React summary cards ────────────────

function SummaryCards({ totalDebit, totalCredit, finalBalance }) {
  return (
    <div style={{ boxSizing: 'border-box' }}>
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold text-[#0f172a] m-0 mb-2 tracking-tight">
          Financial <span style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Dashboard</span>
        </h1>
        <p className="text-[13px] text-[#64748b] m-0 font-medium">View your tuition charges, payments, and current balance</p>
      </div>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Total Charged */}
        <div className="rounded-[16px] p-5 border border-[#e2e8f0] bg-white transition-all hover:shadow-md flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Total Charged
          </div>
          <div className="text-[26px] font-extrabold text-[#1e293b]">৳{fmtAmt(totalDebit)}</div>
          <div className="text-[11px] text-[#94a3b8] mt-1 font-medium">Cumulative charges</div>
        </div>

        {/* Total Paid */}
        <div className="rounded-[16px] p-5 border border-[#e2e8f0] bg-white transition-all hover:shadow-md flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Total Paid
          </div>
          <div className="text-[26px] font-extrabold text-[#1e293b]">৳{fmtAmt(totalCredit)}</div>
          <div className="text-[11px] text-[#94a3b8] mt-1 font-medium">Payments received</div>
        </div>

        {/* Balance Due */}
        <div className="rounded-[16px] p-5 border transition-all hover:shadow-md flex flex-col justify-center" style={{
          background: finalBalance === 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderColor: finalBalance === 0 ? '#dcfce7' : '#bfdbfe',
        }}>
          <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${finalBalance === 0 ? 'text-green-700' : 'text-blue-700'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {finalBalance === 0 ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
            </svg>
            {finalBalance === 0 ? 'Balance Clear' : 'Balance Due'}
          </div>
          <div className={`text-[26px] font-extrabold ${finalBalance === 0 ? 'text-green-700' : 'text-blue-700'}`}>
            ৳{fmtAmt(finalBalance)}
          </div>
          <div className={`text-[11px] mt-1 font-medium ${finalBalance === 0 ? 'text-green-600' : 'text-blue-600'}`}>
            {finalBalance === 0 ? 'No pending balance' : 'Please pay the due amount'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Self-mount: augments existing table, mounts summary above it ─────────────

(function mount() {
  if (window.__aiubFinanceMounted) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const panelBody = document.querySelector('#main-content .panel-body');
      const table = panelBody?.querySelector('table.table-details');
      if (!table) { setTimeout(init, 200); return; }

      if (window.__aiubFinanceMounted) return;
      window.__aiubFinanceMounted = true;

      const panel = panelBody.closest('.panel');
      if (panel) {
        panel.style.cssText = 'border:none!important;box-shadow:none!important';
        const heading = panel.querySelector('.panel-heading');
        if (heading) heading.style.display = 'none';
      }
      panelBody.style.cssText = 'background:transparent!important;border:none!important;box-shadow:none!important;padding:16px 4px!important';

      // Append hover style and set table ID
      table.id = 'aiub-financials-table';
      if (!document.getElementById('aiub-financials-style')) {
        const style = document.createElement('style');
        style.id = 'aiub-financials-style';
        style.textContent = `
          #aiub-financials-table tbody tr.finance-item:hover td {
            background: #f8fafc !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Augment table with Tailwind-compatible inline styles
      table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Inter",Roboto,sans-serif';

      let totalDebit = 0, totalCredit = 0, finalBalance = 0;

      table.querySelectorAll('tbody tr').forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells.length) return;

        if (cells[0].hasAttribute('colspan') || cells[0].textContent.trim().toLowerCase() === 'total') {
          row.style.background = '#f8fafc';
          row.style.fontWeight = '800';
          if (cells.length >= 3) {
            const debCell = cells.length >= 4 ? cells[1] : cells[cells.length - 3];
            const credCell = cells.length >= 4 ? cells[2] : cells[cells.length - 2];
            // Total row has an extra empty footable-last-visible TD at the end; balance is second-to-last
            const bCell = cells[cells.length - 2];

            totalDebit   = parseAmount(debCell.querySelector('label')?.textContent || debCell.textContent);
            totalCredit  = parseAmount(credCell.textContent);
            finalBalance = parseAmount(bCell.textContent);
            
            // Style the total cells
            debCell.style.cssText = 'padding:16px!important;text-align:right!important;border-top:2px solid #e2e8f0!important;color:#ef4444!important;font-size:14px!important';
            credCell.style.cssText = 'padding:16px!important;text-align:right!important;border-top:2px solid #e2e8f0!important;color:#10b981!important;font-size:14px!important';
            bCell.style.cssText = 'padding:16px!important;text-align:right!important;border-top:2px solid #e2e8f0!important;color:#3b82f6!important;font-size:15px!important';
            cells[0].style.cssText = 'padding:16px!important;text-align:right!important;border-top:2px solid #e2e8f0!important;color:#1e293b!important;text-transform:uppercase;font-size:13px!important;letter-spacing:1px;font-weight:600!important';
          }
          return;
        }
        if (cells.length < 5) return;

        row.classList.add('finance-item');
        row.style.transition = 'background-color 0.2s';

        const dateCell = cells[0];
        const partCell = cells[1];
        const debitCell = cells[2];
        const creditCell = cells[3];
        const balCell = cells[cells.length - 1];

        const rawText = partCell.textContent.trim();
        if (rawText.startsWith('**')) {
          row.classList.remove('finance-item');
          
          // Clean the title text
          const titleText = rawText.replace(/\*\*/g, '').trim();
          
          // Handle inner HTML for title (in case there's an anchor tag somehow, though unlikely for section titles)
          partCell.textContent = titleText;
          
          // Apply section header styling
          dateCell.style.cssText = 'display:table-cell!important;color:#1e293b!important;white-space:nowrap;font-size:13px!important;font-weight:700!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #e2e8f0!important;border-top:2px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;background:#f8fafc!important';
          partCell.style.cssText = 'display:table-cell!important;max-width:320px;padding:16px 14px!important;border:none!important;border-bottom:1px solid #e2e8f0!important;border-top:2px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;vertical-align:middle;background:#f8fafc!important;color:#1e3a8a!important;font-weight:800!important;text-transform:uppercase;letter-spacing:0.5px!important';
          debitCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:700!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #e2e8f0!important;border-top:2px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;font-size:13px!important;background:#f8fafc!important;color:#1e293b!important';
          creditCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:700!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #e2e8f0!important;border-top:2px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;font-size:13px!important;background:#f8fafc!important;color:#1e293b!important';
          balCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:700!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #e2e8f0!important;border-top:2px solid #e2e8f0!important;font-size:13px!important;background:#f8fafc!important;color:#1e293b!important';
          
          return; // Skip normal styling for this row
        }

        dateCell.style.cssText = 'display:table-cell!important;color:#475569!important;white-space:nowrap;font-size:13px!important;font-weight:500!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;border-right:1px solid #e2e8f0!important;background:#fff!important';
        partCell.style.cssText = 'display:table-cell!important;max-width:320px;padding:16px 14px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;border-right:1px solid #e2e8f0!important;vertical-align:middle;background:#fff!important;color:#334669!important;font-weight:500!important;line-height:1.5!important';
        debitCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:600!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;border-right:1px solid #e2e8f0!important;font-size:13px!important;background:#fff!important';
        creditCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:600!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;border-right:1px solid #e2e8f0!important;font-size:13px!important;background:#fff!important';
        balCell.style.cssText = 'display:table-cell!important;text-align:right;white-space:nowrap;font-weight:700!important;padding:16px 14px!important;border:none!important;border-bottom:1px solid #f1f5f9!important;font-size:13px!important;background:#fff!important';

        const dAmt = parseAmount(debitCell.textContent);
        const cAmt = parseAmount(creditCell.textContent);
        const bAmt = parseAmount(balCell.textContent);
        debitCell.style.color = dAmt === 0 ? '#cbd5e1' : '#ef4444';
        creditCell.style.color = cAmt === 0 ? '#cbd5e1' : '#10b981';
        balCell.style.color = bAmt === 0 ? '#10b981' : '#2563eb';

        const modalLink = partCell.querySelector('a[data-toggle="modal"]');
        if (modalLink) {
          const badge = document.createElement('span');
          badge.style.cssText = 'display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-right:10px;background:#eff6ff;color:#2563eb;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border:1px solid #dbeafe';
          badge.textContent = 'Assessment';
          modalLink.style.color = '#1e293b';
          modalLink.style.textDecoration = 'none';
          modalLink.style.fontWeight = '600';
          modalLink.before(badge);
        } else if (partCell.textContent.trim().toLowerCase().includes('semester payment')) {
          partCell.insertAdjacentHTML('afterbegin', '<span style="display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-right:10px;background:#f0fdf4;color:#16a34a;text-transform:uppercase;white-space:nowrap;border:1px solid #dcfce7;letter-spacing:.5px">Payment</span>');
        } else {
          partCell.insertAdjacentHTML('afterbegin', '<span style="display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-right:10px;background:#f8fafc;color:#475569;text-transform:uppercase;white-space:nowrap;border:1px solid #e2e8f0;letter-spacing:.5px">Fee</span>');
        }
      });

      // Style table header
      const thead = table.querySelector('thead');
      if (thead) {
        thead.style.background = '#eef2f9';
        thead.querySelectorAll('th').forEach((th) => {
          th.style.cssText = 'padding:14px 16px!important;font-weight:700!important;font-size:11px!important;color:#334669!important;text-transform:uppercase;letter-spacing:.6px;border:none!important;border-bottom:1px solid #e2e8f0!important;border-right:1px solid #e2e8f0!important;white-space:nowrap;background:inherit!important';
        });
        const lastTh = thead.querySelector('th:last-child');
        if (lastTh) {
            lastTh.style.borderRight = 'none!important';
        }
      }

      // Wrap table
      const wrap = document.createElement('div');
      wrap.style.cssText = 'overflow-x:auto;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.05);background:#fff';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);

      // Mount summary cards above wrap
      const summaryContainer = document.createElement('div');
      wrap.parentNode.insertBefore(summaryContainer, wrap);
      createRoot(summaryContainer).render(
        <SummaryCards totalDebit={totalDebit} totalCredit={totalCredit} finalBalance={finalBalance} />
      );

      // Style assessment modal
      const modal = document.getElementById('assesmentModal');
      if (modal) {
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) dialog.style.cssText = 'max-width:680px;margin:40px auto;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)';
        const content = modal.querySelector('.modal-content');
        if (content) content.style.cssText = 'border:none;border-radius:16px;box-shadow:none;overflow:hidden';
        const mHeader = modal.querySelector('.modal-header');
        if (mHeader) mHeader.style.cssText = 'background:linear-gradient(135deg, #0f172a 0%, #0284c7 100%);border:none;padding:20px 24px;border-radius:16px 16px 0 0';
        const mTitle = modal.querySelector('.modal-header h4');
        if (mTitle) mTitle.style.cssText = 'color:#fff;font-weight:700;margin:0;font-size:16px;letter-spacing:.3px';

        const divDetails = document.getElementById('divAssessmentDetails');
        if (divDetails) {
          new MutationObserver(() => {
            divDetails.querySelectorAll('table').forEach((t) => {
              t.style.cssText = 'width:100%!important;border-collapse:collapse!important;font-size:13px;margin-bottom:20px';
              t.querySelectorAll('thead th').forEach((th) => {
                th.style.cssText = 'padding:12px 14px;font-weight:700;font-size:12px;color:#1f2937;background:linear-gradient(to right, #f1f5f9, #e0f2fe);border:none;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:.4px';
              });
              t.querySelectorAll('tbody td').forEach((td) => {
                td.style.cssText = 'padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#374151;background:#fff';
              });
            });
          }).observe(divDetails, { childList: true, subtree: true });
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
