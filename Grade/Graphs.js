(function () {
  'use strict';

  const COLORS = {
    'A+': '#059669',
    'A': '#10b981',
    'B+': '#2563eb',
    'B': '#3b82f6',
    'C+': '#d97706',
    'C': '#f59e0b',
    'D+': '#dc2626',
    'D': '#ef4444',
    'F': '#991b1b',
    'W': '#6b7280',
    'Ongoing': '#7c3aed',
    'N/A': '#94a3b8',
    'Completed': '#059669',
    'Attempted': '#0ea5e9',
    'Withdrawn': '#ef4444',
    'Not Attempted': '#94a3b8',
    'Passed': '#059669',
    'Dropped': '#6b7280',
    'Failed': '#991b1b',
    'Locked': '#dc2626',
    'Unlocked': '#16a34a',
    'Credits': '#0369a1',
    'GPA': '#0f766e',
    'CGPA': '#1d4ed8',
  };

  const el = {
    emptyState: document.getElementById('emptyState'),
    dashboard: document.getElementById('dashboard'),
    kpiGrid: document.getElementById('kpiGrid'),
    insightsRow: document.getElementById('insightsRow'),
    lastUpdated: document.getElementById('lastUpdated'),
    refreshData: document.getElementById('refreshData'),
    gradeDistributionChart: document.getElementById('gradeDistributionChart'),
    statusDistributionChart: document.getElementById('statusDistributionChart'),
    prerequisiteChart: document.getElementById('prerequisiteChart'),
    cgpaTrendChart: document.getElementById('cgpaTrendChart'),
    semesterGpaChart: document.getElementById('semesterGpaChart'),
    semesterProgressChart: document.getElementById('semesterProgressChart'),
    attemptRateChart: document.getElementById('attemptRateChart'),
    gpaCreditsScatterChart: document.getElementById('gpaCreditsScatterChart'),
    creditsChart: document.getElementById('creditsChart'),
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function numberOrZero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMetric(v) {
    const n = numberOrZero(v);
    if (Math.abs(n % 1) < 0.001) return String(Math.round(n));
    return n.toFixed(1);
  }

  function toPercent(part, total) {
    if (!total) return 0;
    return (numberOrZero(part) / numberOrZero(total)) * 100;
  }

  function compactLabel(label, maxLen) {
    const text = String(label || '').trim();
    if (text.length <= maxLen) return text;
    return text.slice(0, Math.max(1, maxLen - 1)) + '.';
  }

  function formatTimestamp(iso) {
    if (!iso) return 'Open Grade Report pages once to sync your latest data.';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Open Grade Report pages once to sync your latest data.';
    return 'Data last synced: ' + d.toLocaleString();
  }

  function readGraphData() {
    return new Promise(resolve => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(null);
        return;
      }
      chrome.storage.local.get({ aiubGraphData: null }, res => {
        resolve(res.aiubGraphData || null);
      });
    });
  }

  function setEmptyMode(isEmpty) {
    if (el.emptyState) el.emptyState.hidden = !isEmpty;
    if (el.dashboard) el.dashboard.hidden = isEmpty;
  }

  function renderKpis(curriculum, semester) {
    if (!el.kpiGrid) return;

    const stateCredits = curriculum
      ? (curriculum.stateCredits || curriculum.stateCounts || {})
      : {};
    const passFailCredits = semester
      ? (semester.passFailCredits || semester.passFail || {})
      : {};
    const cgpa = curriculum && curriculum.cgpa > 0
      ? curriculum.cgpa
      : (semester && semester.latestCgpa > 0 ? semester.latestCgpa : 0);
    const totalCredits = numberOrZero((curriculum && curriculum.totalCredits) || (semester && semester.totalCredits));

    const cards = [
      {
        label: 'Student',
        value: curriculum && curriculum.studentName ? curriculum.studentName : (semester && semester.studentName ? semester.studentName : 'Unknown'),
        note: (curriculum && curriculum.studentId) || (semester && semester.studentId) || 'ID unavailable',
      },
      {
        label: 'Program',
        value: (curriculum && curriculum.program) || (semester && semester.program) || 'N/A',
        note: 'Academic profile',
      },
      {
        label: 'CGPA',
        value: cgpa > 0 ? cgpa.toFixed(2) : 'N/A',
        note: 'Latest cumulative GPA',
      },
      {
        label: 'Completed Credits',
        value: formatMetric(stateCredits.completed || passFailCredits.passed),
        note: totalCredits ? ('Out of ' + formatMetric(totalCredits) + ' credits') : 'Earned and passed credits',
      },
      {
        label: 'Ongoing Credits',
        value: formatMetric(stateCredits.ongoing || passFailCredits.ongoing),
        note: 'Credits currently running',
      },
      {
        label: 'Remaining Credits',
        value: formatMetric(stateCredits.notAttempted),
        note: curriculum
          ? ('Locked: ' + formatMetric(curriculum.prerequisite && (curriculum.prerequisite.lockedCredits || curriculum.prerequisite.locked)))
          : 'Curriculum page needed',
      },
    ];

    el.kpiGrid.innerHTML = cards.map(c => `
      <article class="kpi">
        <span class="kpi-label">${esc(c.label)}</span>
        <span class="kpi-value">${esc(c.value)}</span>
        <span class="kpi-note">${esc(c.note)}</span>
      </article>
    `).join('');
  }

  function renderInsights(curriculum, semester) {
    if (!el.insightsRow) return;

    const chips = [];
    if (curriculum && curriculum.prerequisite) {
      const locked = numberOrZero(curriculum.prerequisite.lockedCredits || curriculum.prerequisite.locked);
      const unlocked = numberOrZero(curriculum.prerequisite.unlockedCredits || curriculum.prerequisite.unlocked);
      const total = locked + unlocked;
      const unlockRate = total ? toPercent(unlocked, total).toFixed(1) : '0.0';
      chips.push({ color: COLORS.Unlocked, text: 'Unlock rate ' + unlockRate + '%' });
    }

    if (semester && Array.isArray(semester.semesterGpaTrend) && semester.semesterGpaTrend.length > 1) {
      const first = numberOrZero(semester.semesterGpaTrend[0].gpa);
      const last = numberOrZero(semester.semesterGpaTrend[semester.semesterGpaTrend.length - 1].gpa);
      const delta = (last - first).toFixed(2);
      const txt = delta >= 0 ? '+' + delta : delta;
      chips.push({ color: delta >= 0 ? COLORS.Completed : COLORS.Failed, text: 'Semester GPA change ' + txt });
    }

    if (semester && Array.isArray(semester.creditBySemester) && semester.creditBySemester.length) {
      const maxCredits = Math.max.apply(null, semester.creditBySemester.map(p => numberOrZero(p.credits)));
      chips.push({ color: COLORS.Credits, text: 'Peak credit load ' + maxCredits });
    }

    if (curriculum && (curriculum.stateCredits || curriculum.stateCounts)) {
      const stateSource = curriculum.stateCredits || curriculum.stateCounts;
      const attempted = numberOrZero(stateSource.completed) + numberOrZero(stateSource.ongoing) + numberOrZero(stateSource.withdrawn);
      const totalCredits = numberOrZero(curriculum.totalCredits || curriculum.totalCourses);
      const rate = totalCredits ? toPercent(attempted, totalCredits).toFixed(1) : '0.0';
      chips.push({ color: COLORS.Attempted, text: 'Curriculum credit attempt rate ' + rate + '%' });
    }

    el.insightsRow.innerHTML = chips.map(chip => `
      <span class="insight-chip">
        <span class="insight-dot" style="background:${esc(chip.color)}"></span>
        ${esc(chip.text)}
      </span>
    `).join('');
  }

  function renderEmptyChart(container, message) {
    if (!container) return;
    container.innerHTML = `<div class="chart-empty">${esc(message)}</div>`;
  }

  function renderLegend(container, items) {
    if (!container || !items || !items.length) return;
    const html = items.map(item => `
      <span class="chart-legend-item">
        <span class="chart-legend-swatch" style="background:${esc(item.color)}"></span>
        ${esc(item.label)}
      </span>
    `).join('');
    container.insertAdjacentHTML('beforeend', `<div class="chart-legend">${html}</div>`);
  }

  function renderBarChart(container, series, fallbackText) {
    if (!container) return;
    if (!series || !series.length) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const maxValue = Math.max.apply(null, series.map(s => numberOrZero(s.value)).concat([1]));
    const width = Math.max(660, series.length * 86 + 90);
    const height = 290;
    const m = { t: 20, r: 24, b: 78, l: 40 };
    const chartW = width - m.l - m.r;
    const chartH = height - m.t - m.b;
    const step = chartW / series.length;
    const barW = Math.min(46, step * 0.62);

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => {
      const y = m.t + chartH - chartH * p;
      const v = Math.round(maxValue * p * 10) / 10;
      return `
        <line x1="${m.l}" y1="${y}" x2="${width - m.r}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${m.l - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${esc(v)}</text>
      `;
    }).join('');

    const bars = series.map((s, i) => {
      const val = numberOrZero(s.value);
      const h = (val / maxValue) * chartH;
      const x = m.l + i * step + (step - barW) / 2;
      const y = m.t + chartH - h;
      const color = s.color || '#0369a1';
      return `
        <g>
          <title>${esc(s.label)}: ${val}</title>
          <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(h, 1)}" rx="6" fill="${esc(color)}" opacity="0.92"></rect>
          <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="#334155">${esc(formatMetric(val))}</text>
          <text x="${x + barW / 2}" y="${height - 18}" text-anchor="middle" font-size="10" fill="#475569">${esc(compactLabel(s.label, 16))}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <div class="chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Bar chart">
          ${gridLines}
          ${bars}
        </svg>
      </div>
    `;

    renderLegend(container, series.map(s => ({ label: s.label, color: s.color || '#0369a1' })));
  }

  function renderLineChart(container, points, fallbackText, options) {
    if (!container) return;
    if (!points || points.length < 2) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const cfg = Object.assign({
      maxY: 4,
      stroke: '#0f766e',
      point: '#0f766e',
      lineLabelPrefix: '',
      yTicks: [0, 1, 2, 3, 4],
    }, options || {});

    const width = Math.max(700, points.length * 92 + 80);
    const height = 280;
    const m = { t: 24, r: 24, b: 66, l: 44 };
    const chartW = width - m.l - m.r;
    const chartH = height - m.t - m.b;
    const maxVal = Math.max(cfg.maxY, ...points.map(p => numberOrZero(p.value)));
    const minVal = 0;

    function pxX(i) {
      return m.l + (i / (points.length - 1)) * chartW;
    }

    function pxY(v) {
      const n = (numberOrZero(v) - minVal) / Math.max(0.0001, maxVal - minVal);
      return m.t + chartH - (n * chartH);
    }

    const gridLines = cfg.yTicks.map(v => {
      const y = pxY(v);
      return `
        <line x1="${m.l}" y1="${y}" x2="${width - m.r}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${m.l - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${v.toFixed(1)}</text>
      `;
    }).join('');

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pxX(i)} ${pxY(p.value)}`).join(' ');
    const dots = points.map((p, i) => {
      const x = pxX(i);
      const y = pxY(p.value);
      const raw = numberOrZero(p.value);
      return `
        <g>
          <title>${esc(p.label)}: ${raw.toFixed(2)}</title>
          <circle cx="${x}" cy="${y}" r="4.8" fill="${cfg.point}"></circle>
          <text x="${x}" y="${height - 16}" text-anchor="middle" font-size="10" fill="#475569">${esc(compactLabel(p.label, 18))}</text>
          <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#334155">${esc(cfg.lineLabelPrefix + raw.toFixed(2))}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <div class="chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart">
          ${gridLines}
          <path d="${path}" fill="none" stroke="${cfg.stroke}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"></path>
          ${dots}
        </svg>
      </div>
    `;
  }

  function renderGroupedBarChart(container, groups, fallbackText) {
    if (!container) return;
    if (!groups || !groups.length) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const series = [
      { key: 'attempted', label: 'Attempted', color: COLORS.Attempted },
      { key: 'completed', label: 'Completed', color: COLORS.Completed },
    ];

    const maxValue = Math.max.apply(null, groups.flatMap(g => series.map(s => numberOrZero(g[s.key]))).concat([1]));
    const width = Math.max(760, groups.length * 102 + 90);
    const height = 300;
    const m = { t: 20, r: 24, b: 88, l: 40 };
    const chartW = width - m.l - m.r;
    const chartH = height - m.t - m.b;
    const groupStep = chartW / groups.length;
    const pairWidth = Math.min(62, groupStep * 0.62);
    const singleWidth = (pairWidth - 8) / 2;

    const bars = groups.map((g, i) => {
      const xBase = m.l + i * groupStep + (groupStep - pairWidth) / 2;
      return series.map((s, j) => {
        const val = numberOrZero(g[s.key]);
        const h = (val / maxValue) * chartH;
        const x = xBase + j * (singleWidth + 8);
        const y = m.t + chartH - h;
        return `
          <g>
            <title>${esc(g.label)} - ${esc(s.label)}: ${val}</title>
            <rect x="${x}" y="${y}" width="${singleWidth}" height="${Math.max(h, 1)}" rx="5" fill="${s.color}"></rect>
            <text x="${x + singleWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="#334155">${formatMetric(val)}</text>
          </g>
        `;
      }).join('') + `<text x="${xBase + pairWidth / 2}" y="${height - 20}" text-anchor="middle" font-size="10" fill="#475569">${esc(compactLabel(g.label, 14))}</text>`;
    }).join('');

    container.innerHTML = `
      <div class="chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grouped bar chart">
          ${bars}
        </svg>
      </div>
    `;

    renderLegend(container, series.map(s => ({ label: s.label, color: s.color })));
  }

  function renderDonutChart(container, parts, fallbackText) {
    if (!container) return;
    if (!parts || !parts.length) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const total = parts.reduce((sum, p) => sum + numberOrZero(p.value), 0);
    if (!total) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const size = 280;
    const center = size / 2;
    const radius = 86;
    const stroke = 28;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const arcs = parts.map(p => {
      const v = numberOrZero(p.value);
      const pct = v / total;
      const len = circumference * pct;
      const arc = `
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="none"
          stroke="${esc(p.color)}"
          stroke-width="${stroke}"
          stroke-dasharray="${len} ${circumference - len}"
          stroke-dashoffset="${-offset}"
          stroke-linecap="butt"
          transform="rotate(-90 ${center} ${center})"
        >
          <title>${esc(p.label)}: ${v} (${(pct * 100).toFixed(1)}%)</title>
        </circle>
      `;
      offset += len;
      return arc;
    }).join('');

    const dominant = parts.slice().sort((a, b) => numberOrZero(b.value) - numberOrZero(a.value))[0];
    const dominantPct = ((numberOrZero(dominant.value) / total) * 100).toFixed(1);

    container.innerHTML = `
      <div class="donut-wrap">
        <div class="chart">
          <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut chart">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"></circle>
            ${arcs}
            <text x="${center}" y="${center - 6}" text-anchor="middle" class="donut-center" font-size="13" fill="#0f172a">${esc(dominant.label)}</text>
            <text x="${center}" y="${center + 14}" text-anchor="middle" class="donut-center" font-size="11">${esc(dominantPct + '%')}</text>
          </svg>
        </div>
        <div>
          <p class="scatter-note">Dominant slice: ${esc(dominant.label)} (${esc(dominantPct)}%)</p>
        </div>
      </div>
    `;

    renderLegend(container, parts.map(p => ({ label: p.label + ' (' + formatMetric(p.value) + ' cr)', color: p.color })));
  }

  function renderAttemptRateChart(container, rows, fallbackText) {
    if (!container) return;
    if (!rows || !rows.length) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const html = rows.map(row => {
      const attemptedPct = Math.max(0, Math.min(100, toPercent(row.attempted, row.total)));
      const completedPct = Math.max(0, Math.min(100, toPercent(row.completed, row.total)));
      return `
        <div class="attempt-row">
          <div class="attempt-row-head">
            <strong>${esc(row.label)}</strong>
            <span>${esc(formatMetric(row.attempted) + '/' + formatMetric(row.total))} credits attempted</span>
          </div>
          <div class="attempt-track">
            <span class="attempt-fill-attempted" style="width:${attemptedPct.toFixed(2)}%"></span>
            <span class="attempt-fill-completed" style="width:${completedPct.toFixed(2)}%"></span>
          </div>
          <div class="attempt-row-note">Completed ${completedPct.toFixed(1)}% and attempted ${attemptedPct.toFixed(1)}%</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="attempt-stack">${html}</div>`;
  }

  function renderScatterChart(container, points, fallbackText) {
    if (!container) return;
    if (!points || points.length < 2) {
      renderEmptyChart(container, fallbackText);
      return;
    }

    const width = Math.max(760, points.length * 80 + 150);
    const height = 330;
    const m = { t: 22, r: 26, b: 76, l: 52 };
    const chartW = width - m.l - m.r;
    const chartH = height - m.t - m.b;

    const maxX = Math.max(1, ...points.map(p => numberOrZero(p.x)));
    const maxY = Math.max(4, ...points.map(p => numberOrZero(p.y)));

    function pxX(v) {
      return m.l + (numberOrZero(v) / maxX) * chartW;
    }

    function pxY(v) {
      return m.t + chartH - (numberOrZero(v) / maxY) * chartH;
    }

    const xTicks = [0, 0.25, 0.5, 0.75, 1].map(p => {
      const xVal = Math.round(maxX * p * 10) / 10;
      const x = pxX(xVal);
      return `
        <line x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t + chartH}" stroke="#eef2f7" stroke-width="1" />
        <text x="${x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="#64748b">${xVal}</text>
      `;
    }).join('');

    const yTicks = [0, 1, 2, 3, 4].map(v => {
      const y = pxY(v);
      return `
        <line x1="${m.l}" y1="${y}" x2="${m.l + chartW}" y2="${y}" stroke="#eef2f7" stroke-width="1" />
        <text x="${m.l - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${v.toFixed(1)}</text>
      `;
    }).join('');

    const dots = points.map(p => {
      const x = pxX(p.x);
      const y = pxY(p.y);
      const radius = 4 + Math.min(7, numberOrZero(p.x) / 4);
      return `
        <g>
          <title>${esc(p.label)}: ${formatMetric(p.x)} credits, GPA ${p.y.toFixed(2)}</title>
          <circle cx="${x}" cy="${y}" r="${radius}" fill="rgba(30, 64, 175, 0.72)" stroke="#1e40af" stroke-width="1.2"></circle>
          <text x="${x}" y="${y - radius - 6}" text-anchor="middle" font-size="10" fill="#334155">${esc(compactLabel(p.label, 16))}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <div class="chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Scatter chart">
          ${xTicks}
          ${yTicks}
          ${dots}
          <text x="${m.l + chartW / 2}" y="${height - 2}" text-anchor="middle" font-size="11" fill="#64748b">Credits Earned</text>
          <text x="14" y="${m.t + chartH / 2}" transform="rotate(-90 14 ${m.t + chartH / 2})" text-anchor="middle" font-size="11" fill="#64748b">Semester GPA</text>
        </svg>
      </div>
      <div class="scatter-note">Larger bubbles indicate higher credit load in that semester.</div>
    `;
  }

  function gradeDistributionData(curriculum) {
    if (!curriculum || !curriculum.gradeDistribution) return [];
    const order = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'W', 'Ongoing', 'N/A'];
    const dist = curriculum.gradeDistribution;
    const used = new Set();
    const out = [];

    order.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(dist, key)) {
        out.push({ label: key, value: numberOrZero(dist[key]), color: COLORS[key] || '#0369a1' });
        used.add(key);
      }
    });

    Object.keys(dist).forEach(key => {
      if (used.has(key)) return;
      out.push({ label: key, value: numberOrZero(dist[key]), color: COLORS[key] || '#0369a1' });
    });

    return out;
  }

  function statusDistributionData(curriculum, semester) {
    if (curriculum && (curriculum.stateCredits || curriculum.stateCounts)) {
      const state = curriculum.stateCredits || curriculum.stateCounts;
      return [
        { label: 'Completed Credits', value: numberOrZero(state.completed), color: COLORS.Completed },
        { label: 'Ongoing Credits', value: numberOrZero(state.ongoing), color: COLORS.Ongoing },
        { label: 'Withdrawn Credits', value: numberOrZero(state.withdrawn), color: COLORS.Withdrawn },
        { label: 'Not Attempted Credits', value: numberOrZero(state.notAttempted), color: COLORS['Not Attempted'] },
      ];
    }

    if (semester && (semester.passFailCredits || semester.passFail)) {
      const status = semester.passFailCredits || semester.passFail;
      return [
        { label: 'Passed Credits', value: numberOrZero(status.passed), color: COLORS.Passed },
        { label: 'Ongoing Credits', value: numberOrZero(status.ongoing), color: COLORS.Ongoing },
        { label: 'Dropped Credits', value: numberOrZero(status.dropped), color: COLORS.Dropped },
        { label: 'Failed Credits', value: numberOrZero(status.failed), color: COLORS.Failed },
      ];
    }

    return [];
  }

  function gpaTrendData(semester) {
    if (!semester || !Array.isArray(semester.semesterGpaTrend)) return [];
    return semester.semesterGpaTrend.map(s => ({ label: s.label, value: numberOrZero(s.gpa) }));
  }

  function cgpaTrendData(semester) {
    if (!semester || !Array.isArray(semester.cgpaTrend)) return [];
    return semester.cgpaTrend.map(s => ({ label: s.label, value: numberOrZero(s.cgpa) }));
  }

  function semesterProgressData(curriculum) {
    if (!curriculum || !Array.isArray(curriculum.semesterProgress)) return [];
    return curriculum.semesterProgress.map(s => ({
      label: s.label,
      total: numberOrZero(s.total),
      attempted: numberOrZero(s.attempted),
      completed: numberOrZero(s.completed),
    }));
  }

  function prerequisiteData(curriculum) {
    if (!curriculum || !curriculum.prerequisite) return [];
    const locked = numberOrZero(curriculum.prerequisite.lockedCredits || curriculum.prerequisite.locked);
    const unlocked = numberOrZero(curriculum.prerequisite.unlockedCredits || curriculum.prerequisite.unlocked);
    return [
      { label: 'Unlocked Credits', value: unlocked, color: COLORS.Unlocked },
      { label: 'Locked Credits', value: locked, color: COLORS.Locked },
    ];
  }

  function creditsData(semester) {
    if (!semester || !Array.isArray(semester.creditBySemester)) return [];
    return semester.creditBySemester.map(s => ({
      label: s.label,
      value: numberOrZero(s.credits),
      color: COLORS.Credits,
    }));
  }

  function gpaCreditsScatterData(semester) {
    if (!semester) return [];
    if (!Array.isArray(semester.creditBySemester) || !Array.isArray(semester.semesterGpaTrend)) return [];

    const creditsByLabel = new Map();
    semester.creditBySemester.forEach(item => {
      creditsByLabel.set(item.label, numberOrZero(item.credits));
    });

    const points = semester.semesterGpaTrend
      .map(g => ({
        label: g.label,
        x: numberOrZero(creditsByLabel.get(g.label)),
        y: numberOrZero(g.gpa),
      }))
      .filter(p => p.x > 0 && p.y > 0);

    if (points.length) return points;

    const n = Math.min(semester.semesterGpaTrend.length, semester.creditBySemester.length);
    const fallback = [];
    for (let i = 0; i < n; i += 1) {
      fallback.push({
        label: semester.semesterGpaTrend[i].label || ('Sem ' + (i + 1)),
        x: numberOrZero(semester.creditBySemester[i].credits),
        y: numberOrZero(semester.semesterGpaTrend[i].gpa),
      });
    }
    return fallback.filter(p => p.x > 0 && p.y > 0);
  }

  async function renderDashboard() {
    const data = await readGraphData();
    const curriculum = data && data.curriculum ? data.curriculum : null;
    const semester = data && data.semester ? data.semester : null;

    if (!curriculum && !semester) {
      setEmptyMode(true);
      if (el.lastUpdated) el.lastUpdated.textContent = formatTimestamp(null);
      return;
    }

    setEmptyMode(false);
    if (el.lastUpdated) {
      el.lastUpdated.textContent = formatTimestamp(data.updatedAt || (curriculum && curriculum.capturedAt) || (semester && semester.capturedAt));
    }

    renderKpis(curriculum, semester);
    renderInsights(curriculum, semester);

    renderBarChart(el.gradeDistributionChart, gradeDistributionData(curriculum), 'No curriculum grade distribution available yet.');
    renderBarChart(el.statusDistributionChart, statusDistributionData(curriculum, semester), 'No course status distribution available yet.');
    renderDonutChart(el.prerequisiteChart, prerequisiteData(curriculum), 'Visit Curriculum Grade Report to capture prerequisite lock data.');

    renderLineChart(el.cgpaTrendChart, cgpaTrendData(semester), 'Visit Semester Grade Report to capture CGPA trend data.', {
      maxY: 4,
      yTicks: [0, 1, 2, 3, 4],
      stroke: COLORS.CGPA,
      point: COLORS.CGPA,
    });

    renderLineChart(el.semesterGpaChart, gpaTrendData(semester), 'Visit Semester Grade Report to capture GPA trend data.', {
      maxY: 4,
      yTicks: [0, 1, 2, 3, 4],
      stroke: COLORS.GPA,
      point: COLORS.GPA,
    });

    const semesterProgress = semesterProgressData(curriculum);
    renderGroupedBarChart(el.semesterProgressChart, semesterProgress, 'Visit Curriculum Grade Report to capture semester completion data.');
    renderAttemptRateChart(el.attemptRateChart, semesterProgress, 'Visit Curriculum Grade Report to capture attempt rate data.');

    renderScatterChart(el.gpaCreditsScatterChart, gpaCreditsScatterData(semester), 'Need GPA and credits data from Semester Grade Report for this graph.');
    renderBarChart(el.creditsChart, creditsData(semester), 'Visit Semester Grade Report to capture credits data.');
  }

  function init() {
    if (el.refreshData) {
      el.refreshData.addEventListener('click', renderDashboard);
    }
    renderDashboard();
  }

  init();
})();