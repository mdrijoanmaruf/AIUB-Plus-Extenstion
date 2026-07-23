import { createRoot } from 'react-dom/client';
import { FiPrinter, FiCreditCard, FiShield, FiLock, FiChevronDown, FiClock, FiMoreVertical } from 'react-icons/fi';
import React from 'react';

// ─── Bootstrap into the page ─────────────────────────────────────────────────
chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
  if (!r.extensionEnabled) return;

  const init = setInterval(() => {
    const body = document.querySelector('.portal-body .margin5');
    if (body) {
      clearInterval(init);
      redesign(body);
    }
  }, 100);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseInfoTable(container) {
  const data = {};
  const credits = {};
  const rows = container.querySelectorAll('table.table-bordered tr');

  rows.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td'));
    // Credits row
    if (cells[0]?.textContent.trim() === 'Credits') {
      const labels = tr.querySelectorAll('label');
      for (let j = 0; j < labels.length - 1; j += 2) {
        const name = labels[j]?.textContent.trim();
        const val = labels[j + 1]?.textContent.trim();
        if (name && val !== undefined) credits[name] = val;
      }
    } else {
      // Label : Value pattern
      for (let i = 0; i < cells.length; i++) {
        if (cells[i]?.textContent.trim() === ':') {
          const label = cells[i - 1]?.textContent.trim();
          const value = cells[i + 1]?.textContent.trim();
          if (label && value) data[label] = value;
        }
      }
    }
  });
  return { ...data, credits };
}

function parsePanels(container) {
  return Array.from(container.querySelectorAll('.panel')).map(panel => {
    const btns = panel.querySelectorAll('a.btn');
    const printBtn = btns[0];
    const payBtn = btns[1];
    return {
      title: panel.querySelector('.panel-title')?.textContent.trim() || '',
      amount: panel.querySelector('.panel-body h1')?.textContent.trim() || '',
      colorClass: panel.classList.contains('panel-info') ? 'blue' : 'green',
      printOnClick: printBtn?.getAttribute('onclick') || '',
      payHref: payBtn?.getAttribute('href') || '#',
    };
  });
}

function parseAlertItems(container) {
  return Array.from(container.querySelectorAll('.alert li')).map(li => li.textContent.trim());
}

function parseBankOptions(container) {
  return Array.from(container.querySelectorAll('#Bank option')).map(o => ({
    value: o.value,
    text: o.textContent.trim(),
  }));
}

// ─── Main Redesign ────────────────────────────────────────────────────────────
function redesign(wrapper) {
  const table = wrapper.querySelector('table.table-bordered');
  if (!table) return;

  const info = parseInfoTable(wrapper);
  const panels = parsePanels(wrapper);
  const alerts = parseAlertItems(wrapper);
  const banks = parseBankOptions(wrapper);
  const paymentHistoryHref = wrapper.querySelector('a[href*="Payment/List"]')?.getAttribute('href') || '#';

  const mountDiv = document.createElement('div');
  mountDiv.id = 'aiub_reg_print_root';
  mountDiv.style.cssText = 'padding: 8px 0;';
  wrapper.parentElement.insertBefore(mountDiv, wrapper);
  wrapper.style.display = 'none';

  const root = createRoot(mountDiv);
  root.render(
    <RegistrationPrintUI
      info={info}
      panels={panels}
      alerts={alerts}
      banks={banks}
      paymentHistoryHref={paymentHistoryHref}
    />
  );
}

// ─── React Components ─────────────────────────────────────────────────────────
function RegistrationPrintUI({ info, panels, alerts, banks, paymentHistoryHref }) {
  const [selectedBank, setSelectedBank] = React.useState('');
  const credits = info.credits || {};
  const creditEntries = Object.entries(credits);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#0f172a', maxWidth: '100%' }}>

      {/* ── Info Card ── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '18px 24px', marginBottom: 14,
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <InfoField label="Student ID" value={info['Student ID'] || '—'} />
        <Divider />
        <InfoField label="Printout For" value={info['Printout For'] || '—'} />
        <Divider />
        <InfoField label="Payment Option" value={info['Payment Option'] || '—'} highlight />
        <Divider />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Credits</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {creditEntries.map(([name, val]) => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>{name}</span>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{val}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', color: '#94a3b8', cursor: 'pointer' }}>
          <FiMoreVertical size={18} />
        </div>
      </div>

      {/* ── Alert Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%)',
        border: '1px solid #fecaca', borderRadius: 16,
        padding: '14px 18px 14px 24px', marginBottom: 14,
        display: 'flex', gap: 14, alignItems: 'flex-start',
        boxShadow: '0 1px 4px rgba(239,68,68,0.06)',
      }}>

        <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'disc', flex: 1 }}>
          {alerts.map((a, i) => (
            <li key={i} style={{ fontSize: 13, color: '#7f1d1d', fontWeight: 500, marginBottom: i < alerts.length - 1 ? 5 : 0, lineHeight: 1.5 }}>{a}</li>
          ))}
        </ul>
        <a
          href={paymentHistoryHref}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#ffffff', border: '1px solid #fca5a5', color: '#dc2626',
            borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <FiClock size={14} /> Online Payment History
        </a>
      </div>

      {/* ── Bank Select ── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '4px 20px', marginBottom: 22, position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <FiLock size={16} color="#64748b" style={{ flexShrink: 0 }} />
        <select
          value={selectedBank}
          onChange={e => setSelectedBank(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: selectedBank ? '#0f172a' : '#64748b',
            fontFamily: 'inherit', padding: '14px 0', cursor: 'pointer',
            appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          {banks.map(b => (
            <option key={b.value} value={b.value}>{b.text}</option>
          ))}
        </select>
        <FiChevronDown size={16} color="#94a3b8" style={{ flexShrink: 0, pointerEvents: 'none' }} />
      </div>

      {/* ── Payment Cards ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        {panels.map((p, i) => <PaymentCard key={i} panel={p} />)}
      </div>

      {/* ── Footer Trust Bar ── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        gap: 28, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <TrustItem icon={<FiShield size={17} color="#3b82f6" />} title="Secure Payment" desc="Your payment is secure and encrypted." />
        <Divider />
        <TrustItem icon={<FiLock size={17} color="#10b981" />} title="Trusted by Thousands" desc="Safe and reliable transactions" />
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Need Help?</div>
          <a href="mailto:studenthelp@aiub.edu" style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: highlight ? 700 : 600, color: highlight ? '#1d4ed8' : '#0f172a' }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 36, background: '#e2e8f0', flexShrink: 0 }} />;
}

function PaymentCard({ panel }) {
  const isBlue = panel.colorClass === 'blue';
  const accentColor = isBlue ? '#3b82f6' : '#10b981';
  const accentBg = isBlue ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #10b981, #059669)';
  const lightBg = isBlue ? '#eff6ff' : '#f0fdf4';

  function handlePrint() {
    const m = panel.printOnClick.match(/Confirmation3\('([^']+)'\)/);
    if (m) {
      const path = m[1];
      try { window.Confirmation3 && window.Confirmation3(path); }
      catch (_) { window.location.href = 'https://portal.aiub.edu' + path; }
    }
  }

  return (
    <div
      style={{
        flex: '1 1 270px', background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: 20, padding: '22px 22px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s',
        minWidth: 250,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${accentColor}40`,
          }}>
            <FiCreditCard size={19} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{panel.title}</span>
        </div>
        <span style={{
          background: lightBg, color: accentColor,
          border: `1px solid ${accentColor}30`, borderRadius: 99,
          padding: '3px 10px', fontSize: 11, fontWeight: 700,
        }}>Due Payment</span>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
          {panel.amount}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handlePrint}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: accentBg, color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: `0 4px 12px ${accentColor}35`,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <FiPrinter size={15} /> Print
        </button>
        <a
          href={'https://portal.aiub.edu' + panel.payHref}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: '#ffffff', color: accentColor, border: `1.5px solid ${accentColor}`,
            borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', transition: 'background 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = lightBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <FiCreditCard size={15} /> Pay Online
        </a>
      </div>
    </div>
  );
}

function TrustItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: '#f8fafc',
        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
      </div>
    </div>
  );
}
