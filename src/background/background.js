import { createWorker } from 'tesseract.js';

/**
 * background.js — AIUB Portal+ Service Worker
 *
 * CAPTCHA Solve Pipeline:
 *   1. Content script reads img element via canvas → base64 PNG (no re-fetch!)
 *   2. background.js receives imageBase64
 *   3. Uses local offline Tesseract.js to OCR the image
 *   4. Parse the math expression → return the answer
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Notices ────────────────────────────────────────────────────────────────
  if (request.type === 'FETCH_NOTICES') {
    fetch('https://aiub.edu/category/notices')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
      .then(html => sendResponse({ success: true, html }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── CAPTCHA Solve ──────────────────────────────────────────────────────────
  if (request.type === 'SOLVE_CAPTCHA') {
    // imageBase64 = PNG from content script canvas (already extracted from DOM)
    const base64 = request.imageBase64;
    if (!base64) {
      sendResponse({ success: false, error: 'No image data received' });
      return true;
    }
    solveCaptcha(base64)
      .then(result => sendResponse(result))
      .catch(err   => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ─── Main Pipeline (Tesseract) ────────────────────────────────────────────────

let _tesseractWorker = null;

async function getTesseractWorker() {
  if (_tesseractWorker) return _tesseractWorker;
  
  console.log('[AIUB+ BG] Initializing local Tesseract worker...');
  _tesseractWorker = await createWorker('eng', 1, {
    workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
    corePath: chrome.runtime.getURL('tesseract/tesseract-core-simd-lstm.wasm.js'),
    langPath: chrome.runtime.getURL('tesseract/langs'),
    cacheMethod: 'none', // extensions don't need IndexedDB caching, assets are local
    gzip: true,
    logger: m => console.log('[Tesseract]', m.status, Math.round(m.progress * 100) + '%')
  });

  return _tesseractWorker;
}

async function solveCaptcha(base64) {
  console.log('[AIUB+ BG] Received image for local OCR, size:', base64.length, 'chars');

  let rawText = '';
  
  try {
    const worker = await getTesseractWorker();
    const dataUrl = `data:image/png;base64,${base64}`;
    const result = await worker.recognize(dataUrl);
    rawText = (result.data.text || '').trim();
    console.log('[AIUB+ BG] Tesseract raw:', JSON.stringify(rawText));
  } catch (e) {
    console.error('[AIUB+ BG] Tesseract failed:', e);
    return { success: false, error: `Tesseract crash: ${e.message}` };
  }

  if (!rawText) {
    return { success: false, error: 'OCR returned empty text' };
  }

  const answer = parseMath(rawText);
  
  if (answer === null) {
    return { success: false, error: `OCR parse failed. Raw: "${rawText}"` };
  }

  return { success: true, answer };
}


// ─── Math Parser (AIUB-constrained) ──────────────────────────────────────────
//
//  AIUB CAPTCHA facts:
//   • Operators: only + or −  (never × or ÷)
//   • Operands:  each 1–99
//   • Answer:    always 0–100
//   • OCR often misreads + as * (the cross shape looks similar in noisy images)
//   → We accept * and treat it as + for the purposes of evaluation.

function parseMath(text) {
  console.log('[AIUB+ BG] OCR raw:', JSON.stringify(text));

  // Normalize common OCR digit misreads
  const prep = text
    .replace(/[oO@Qq]/g, '0')
    .replace(/[lI|!]/g,  '1')
    .replace(/[Ss$]/g,   '5')
    .replace(/[Bb]/g,    '8')
    .replace(/[Zz]/g,    '2')
    .replace(/=.*/g,     ''); // strip "=?" and everything after

  console.log('[AIUB+ BG] Prepared:', JSON.stringify(prep));

  // Scan for NUMBER OP NUMBER  (op = + | - | * where * means misread +)
  const re = /(\d{1,3})\s*([+\-*])\s*(\d{1,3})/g;
  let m;

  while ((m = re.exec(prep)) !== null) {
    const a  = parseInt(m[1], 10);
    const op = m[2];
    const b  = parseInt(m[3], 10);

    // Skip operands outside the expected AIUB range
    if (a < 1 || a > 99 || b < 1 || b > 99) continue;

    // Evaluate: * is treated as + (OCR misread — AIUB never uses multiplication)
    const result = (op === '-') ? (a - b) : (a + b);

    // Validate answer range
    if (result >= 0 && result <= 100) {
      console.log(`[AIUB+ BG] ✅ ${a} ${op === '-' ? '-' : '+'} ${b} = ${result}`);
      return result;
    }
  }

  console.warn('[AIUB+ BG] No valid expression found in:', JSON.stringify(prep));
  return null;
}



