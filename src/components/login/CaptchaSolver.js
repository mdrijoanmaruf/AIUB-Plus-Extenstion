import { createWorker } from 'tesseract.js';

// ─── Math Parser (AIUB-constrained)
function parseMath(text) {
  console.log('[AIUB+] OCR raw:', JSON.stringify(text));
  
  // Clean up common OCR mistakes and strip anything after the equals sign
  let prep = text.split('=')[0]; // Strip = and everything after it
  
  prep = prep
    .replace(/[oO@QqD]/g, '0')
    .replace(/[lI|!]/g,   '1')
    .replace(/[Zz]/g,     '2')
    .replace(/[Ss$]/g,    '5')
    .replace(/[Bb]/g,     '8')
    .replace(/[^0-9+\-]/g, ''); // Remove everything except digits, +, and -
    
  console.log('[AIUB+] Prepared:', JSON.stringify(prep));
  
  // Strict matching for math expression
  const re = /^(\d{1,2})([+-])(\d{1,2})$/;
  const match = prep.match(re);
  
  if (!match) return null;
  
  const a = parseInt(match[1], 10);
  const operator = match[2];
  const b = parseInt(match[3], 10);
  
  // Compute and enforce bounds
  const result = operator === '+' ? (a + b) : (a - b);
  
  if (result >= 0 && result <= 100) {
    return result;
  }
  
  return null;
}

// ─── Tesseract Pipeline
let _tesseractWorker = null;
async function getTesseractWorker() {
  if (_tesseractWorker) return _tesseractWorker;
  console.log('[AIUB+] Initializing local Tesseract worker in Content Script...');
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

// ─── Main Execution 
const IMG_ID   = 'CaptchaImage';
const INPUT_ID = 'CaptchaInputText';

// ─── Image Filter 
function getImageBase64() {
  const img = document.getElementById(IMG_ID);
  if (!img) return null;

  const w = img.width * 4;
  const h = img.height * 4;

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Draw raw scaled pixels
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);

  // Initial B&W Threshold
  let imageData = ctx.getImageData(0, 0, w, h);
  let data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const intensity = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
    if (intensity > 150) {
      data[i] = data[i+1] = data[i+2] = 255; // White
    } else {
      data[i] = data[i+1] = data[i+2] = 0;   // Black
    }
  }

  // Erase small noise blobs (Connected Components)
  const visited = new Uint8Array(w * h);
  const minArea = 50;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (data[idx * 4] === 0 && visited[idx] === 0) {
        const queue = [idx];
        visited[idx] = 1;
        const blob = [idx];
        
        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);
          
          // 8-way neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (data[nIdx * 4] === 0 && visited[nIdx] === 0) {
                  visited[nIdx] = 1;
                  queue.push(nIdx);
                  blob.push(nIdx);
                }
              }
            }
          }
        }
        
        // If blob is too small, erase it (turn it white)
        if (blob.length < minArea) {
          for (let i = 0; i < blob.length; i++) {
            const bIdx = blob[i] * 4;
            data[bIdx] = data[bIdx+1] = data[bIdx+2] = 255;
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Blur to fill honeycomb centers
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.filter = 'blur(2px)';
  ctx.drawImage(tempCanvas, 0, 0, w, h);
  ctx.filter = 'none';

  // Final solidifying threshold
  imageData = ctx.getImageData(0, 0, w, h);
  data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 230) {
      data[i] = data[i+1] = data[i+2] = 255;
    } else {
      data[i] = data[i+1] = data[i+2] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  try {
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error(e);
    return null;
  }
}

function fillAnswer(answer) {
  const input = document.getElementById(INPUT_ID);
  if (!input) return false;
  input.value = answer;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function updateBadge(state, text, base64 = null) {
  let badge = document.getElementById('aiub-plus-captcha-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'aiub-plus-captcha-badge';
    badge.style.cssText = `
      position: absolute; top: 10px; right: 10px; padding: 6px 12px;
      border-radius: 20px; font-size: 13px; font-weight: bold; color: white;
      z-index: 999999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease; opacity: 0; transform: translateY(-10px); cursor: pointer;
    `;
    document.body.appendChild(badge);
    requestAnimationFrame(() => {
      badge.style.opacity = '1';
      badge.style.transform = 'translateY(0)';
    });
  }

  const icons = {
    loading: '<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>',
    success: '✅',
    error: '❌'
  };

  const colors = { loading: '#3b82f6', success: '#10b981', error: '#ef4444' };

  badge.innerHTML = `${icons[state]} <span>${text}</span>`;
  if (state === 'error') badge.innerHTML += ` <span style="text-decoration:underline">(Click to download image)</span>`;
  badge.style.backgroundColor = colors[state];

  // Allow downloading the base64 by clicking the badge
  badge.onclick = () => {
    if (base64) {
      const link = document.createElement('a');
      link.href = base64;
      link.download = 'aiub_captcha_debug.png';
      link.click();
    }
  };

  if (state === 'success') {
    setTimeout(() => {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(-10px)';
      setTimeout(() => badge.remove(), 300);
    }, 3000);
  }
}

let isSolving = false;
let retryCount = 0;
const MAX_RETRIES = 20;

async function attemptSolve() {
  if (isSolving) return;
  const img = document.getElementById(IMG_ID);
  
  if (!img || img.clientWidth === 0 || img.naturalWidth === 0) return;

  isSolving = true;
  updateBadge('loading', retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRIES})` : 'Solving CAPTCHA...');

  const dataUrl = getImageBase64();
  if (!dataUrl) {
    updateBadge('error', 'Failed to read CAPTCHA image');
    isSolving = false;
    return;
  }

  try {
    const worker = await getTesseractWorker();
    const result = await worker.recognize(dataUrl);
    const rawText = (result.data.text || '').trim();
    
    if (!rawText) {
      handleFail('OCR returned empty text', dataUrl, img);
      return;
    }

    const answer = parseMath(rawText);
    if (answer !== null) {
      fillAnswer(answer);
      updateBadge('success', `Solved: ${answer}`);
      retryCount = 0; // reset on success
    } else {
      handleFail(`Parse failed: "${rawText}"`, dataUrl, img);
    }
  } catch (err) {
    console.error('[AIUB+] Tesseract error:', err);
    handleFail(err.message || 'OCR failed', dataUrl, img);
  }
  
  isSolving = false;
}

function handleFail(msg, dataUrl, img) {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`[AIUB+] CAPTCHA failed. Auto-retrying (${retryCount}/${MAX_RETRIES})...`);
    
    // The AIUB server rejects custom query params (like '?retry=...') and returns a black error image.
    // Instead, we will simulate a click on the actual blue refresh button on the page.
    let refreshBtn = img.parentElement.querySelector('a, button');
    if (!refreshBtn && img.parentElement.parentElement) {
      refreshBtn = img.parentElement.parentElement.querySelector('a, button');
    }
    
    if (refreshBtn) {
      refreshBtn.click();
    } else {
      img.click(); // Fallback
    }
    
    // Safety timeout: if the click didn't trigger a src change within 2 seconds, reset state.
    setTimeout(() => {
      if (isSolving) {
        isSolving = false;
        updateBadge('error', 'Auto-retry failed. Please manually refresh.', dataUrl);
      }
    }, 2000);
    
  } else {
    updateBadge('error', msg, dataUrl);
    retryCount = 0; // Give up, reset for next manual attempt
    isSolving = false;
  }
}

// Setup 
function setupCaptchaSolver() {
  if (!window.location.href.includes('portal.aiub.edu')) return;
  if (document.getElementById(IMG_ID)) {
    const img = document.getElementById(IMG_ID);
    
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (img.complete && img.naturalWidth > 0) {
            attemptSolve();
          } else {
            img.addEventListener('load', attemptSolve, { once: true });
          }
        }
      });
    });
    visibilityObserver.observe(img);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          if (mutation.target.id === IMG_ID) {
            isSolving = false;
            mutation.target.addEventListener('load', attemptSolve, { once: true });
          }
        }
      });
    });
    observer.observe(img, { attributes: true, attributeFilter: ['src'] });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCaptchaSolver);
} else {
  setupCaptchaSolver();
}
