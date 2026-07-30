import { createWorker } from 'tesseract.js';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { BiLoaderAlt } from 'react-icons/bi';

// Math Parser (AIUB-constrained)
function parseMath(text) {
  console.log('[AIUB+] OCR raw:', JSON.stringify(text));
  
  // Clean up common OCR mistakes and strip anything after the equals sign
  let prep = text.split('=')[0]; // Strip = and everything after it
  
  prep = prep
    .replace(/[oO@DdQCcU]/g, '0')
    .replace(/[lI|!i]/g,   '1')
    .replace(/[Zz]/g,     '2')
    .replace(/[JjE]/g,    '3')
    .replace(/[AahHy]/g,  '4')
    .replace(/[Ss$]/g,    '5')
    .replace(/[G]/g,      '6')
    .replace(/[Tt]/g,     '7')
    .replace(/[BbR]/g,    '8')
    .replace(/[gPpq]/g,   '9')
    .replace(/\s+/g, ''); // Remove spaces
    
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

// Tesseract Pipeline
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

// Main Execution 
const IMG_ID   = 'CaptchaImage';
const INPUT_ID = 'CaptchaInputText';

// Image Filter 
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
  const savedState = localStorage.getItem('aiub_captcha_solver_enabled');
  const isEnabled = savedState === null ? true : savedState === 'true';
  
  let badge = document.getElementById('aiub-plus-captcha-badge');
  
  if (!isEnabled) {
    if (badge) badge.remove();
    return;
  }
  
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'aiub-plus-captcha-badge';
    badge.style.cssText = `
      position: fixed; top: 75px; right: 20px; padding: 6px 12px;
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
    loading: renderToString(createElement(BiLoaderAlt, { className: 'animate-spin h-4 w-4 text-white' })),
    success: renderToString(createElement(FiCheckCircle, { className: 'h-4 w-4 text-white' })),
    error: renderToString(createElement(FiXCircle, { className: 'h-4 w-4 text-white' }))
  };

  const colors = { loading: '#3b82f6', success: '#10b981', error: '#ef4444' };

  badge.innerHTML = `${icons[state]} <span>${text}</span>`;
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
const MAX_RETRIES = 30;

async function attemptSolve() {
  if (isSolving) return;

  const savedState = localStorage.getItem('aiub_captcha_solver_enabled');
  const isEnabled = savedState === null ? true : savedState === 'true';
  if (!isEnabled) return;

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
    let possibleBtns = Array.from(img.parentElement.querySelectorAll('a, button'));
    if (possibleBtns.length === 0 && img.parentElement.parentElement) {
      possibleBtns = Array.from(img.parentElement.parentElement.querySelectorAll('a, button'));
    }
    
    let refreshBtn = possibleBtns.find(btn => {
      const text = btn.textContent.toLowerCase();
      const isSubmit = btn.type === 'submit' || text.includes('login') || text.includes('sign');
      return !isSubmit;
    });
    
    if (refreshBtn) {
      refreshBtn.click();
    } else {
      img.click(); // Fallback
    }
    
    // Safety timeout: if the click didn't trigger a src change within 2 seconds, reset state.
    setTimeout(() => {
      if (isSolving) {
        isSolving = false;
        updateBadge('error', 'Failed', dataUrl);
      }
    }, 2000);
    
  } else {
    updateBadge('error', 'Failed', dataUrl);
    retryCount = 0; // Give up, reset for next manual attempt
    isSolving = false;
  }
}

function injectToggleUI() {
  if (document.getElementById('aiub-captcha-toggle-container')) return;

  const container = document.createElement('div');
  container.id = 'aiub-captcha-toggle-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: white;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: sans-serif;
    border: 1px solid #e5e7eb;
  `;

  const label = document.createElement('span');
  label.textContent = 'Captcha Solver';
  label.style.cssText = `
    font-weight: bold;
    color: #374151;
    font-size: 14px;
  `;

  const toggleWrapper = document.createElement('label');
  toggleWrapper.style.cssText = `
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  `;

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.style.cssText = `
    opacity: 0;
    width: 0;
    height: 0;
  `;
  
  const savedState = localStorage.getItem('aiub_captcha_solver_enabled');
  const isEnabled = savedState === null ? true : savedState === 'true';
  toggleInput.checked = isEnabled;

  const slider = document.createElement('span');
  slider.style.cssText = `
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${isEnabled ? '#10b981' : '#ccc'};
    transition: .4s;
    border-radius: 20px;
  `;

  const circle = document.createElement('span');
  circle.style.cssText = `
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: ${isEnabled ? '22px' : '2px'};
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  `;

  slider.appendChild(circle);
  toggleWrapper.appendChild(toggleInput);
  toggleWrapper.appendChild(slider);

  toggleInput.addEventListener('change', (e) => {
    const checked = e.target.checked;
    localStorage.setItem('aiub_captcha_solver_enabled', checked);
    slider.style.backgroundColor = checked ? '#10b981' : '#ccc';
    circle.style.left = checked ? '22px' : '2px';
    
    if (checked) {
      attemptSolve();
    }
  });

  container.appendChild(label);
  container.appendChild(toggleWrapper);
  document.body.appendChild(container);
}

// Setup 
function initCaptchaSolver() {
  injectToggleUI();
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

function setupCaptchaSolver() {
  if (!window.location.href.includes('portal.aiub.edu')) return;
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get({ featureToggles: {} }, (result) => {
      const toggles = result.featureToggles || {};
      if (toggles.captchaSolver === false) {
        localStorage.setItem('aiub_captcha_solver_enabled', false);
      }
      initCaptchaSolver();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.featureToggles) {
        const newToggles = changes.featureToggles.newValue || {};
        if (newToggles.captchaSolver !== undefined) {
          const isEnabled = newToggles.captchaSolver;
          localStorage.setItem('aiub_captcha_solver_enabled', isEnabled);
          
          // Try to update UI if it exists
          const toggleInput = document.getElementById('aiub-captcha-toggle-input');
          if (toggleInput && toggleInput.checked !== isEnabled) {
            toggleInput.checked = isEnabled;
            // Dispatch change event to trigger the visual updates
            toggleInput.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  } else {
    initCaptchaSolver();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCaptchaSolver);
} else {
  setupCaptchaSolver();
}
