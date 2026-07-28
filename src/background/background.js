import { createWorker } from 'tesseract.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Notices
  if (request.type === 'FETCH_NOTICES') {
    fetch('https://aiub.edu/category/notices')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
      .then(html => sendResponse({ success: true, html }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // CAPTCHA Solve 
  if (request.type === 'SOLVE_CAPTCHA') {
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

// Main Pipeline 

let _tesseractWorker = null;

async function getTesseractWorker() {
  if (_tesseractWorker) return _tesseractWorker;
  
  console.log('[AIUB+ BG] Initializing local Tesseract worker...');
  _tesseractWorker = await createWorker('eng', 1, {
    workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
    corePath: chrome.runtime.getURL('tesseract/tesseract-core-simd-lstm.wasm.js'),
    langPath: chrome.runtime.getURL('tesseract/langs'),
    cacheMethod: 'none', 
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


function parseMath(text) {
  console.log('[AIUB+ BG] OCR raw:', JSON.stringify(text));

  // Normalize common OCR digit misreads
  const prep = text
    .replace(/[oO@Qq]/g, '0')
    .replace(/[lI|!]/g,  '1')
    .replace(/[Ss$]/g,   '5')
    .replace(/[Bb]/g,    '8')
    .replace(/[Zz]/g,    '2')
    .replace(/=.*/g,     '');

  console.log('[AIUB+ BG] Prepared:', JSON.stringify(prep));

  const re = /(\d{1,3})\s*([+\-*])\s*(\d{1,3})/g;
  let m;

  while ((m = re.exec(prep)) !== null) {
    const a  = parseInt(m[1], 10);
    const op = m[2];
    const b  = parseInt(m[3], 10);

    if (a < 1 || a > 99 || b < 1 || b > 99) continue;

    const result = (op === '-') ? (a - b) : (a + b);

    if (result >= 0 && result <= 100) {
      console.log(`[AIUB+ BG] ✅ ${a} ${op === '-' ? '-' : '+'} ${b} = ${result}`);
      return result;
    }
  }

  console.warn('[AIUB+ BG] No valid expression found in:', JSON.stringify(prep));
  return null;
}



