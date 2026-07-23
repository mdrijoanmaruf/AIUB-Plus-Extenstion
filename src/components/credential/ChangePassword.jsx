import { createRoot } from 'react-dom/client';
import { FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import React from 'react';

// Wait for the main content area to load
const init = setInterval(() => {
  const mainContent = document.querySelector('#main-content');
  const panel = mainContent ? mainContent.querySelector('.panel') : null;

  if (panel) {
    clearInterval(init);
    redesignChangePassword(panel);
  }
}, 100);

function redesignChangePassword(panel) {
  // Basic structural elements
  const heading = panel.querySelector('.panel-heading');
  const body = panel.querySelector('.panel-body');
  const form = panel.querySelector('form');

  if (!form) return;

  // Remove old styles
  panel.style.cssText = `
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    margin-bottom: 24px;
  `;

  if (heading) {
    heading.style.cssText = `
      background: linear-gradient(to right, #f8fafc, #ffffff);
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 24px;
    `;
    const title = heading.querySelector('.panel-title');
    if (title) {
      title.style.cssText = `
        color: #0f172a;
        font-size: 18px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
      `;
    }
  }

  if (body) {
    body.style.cssText = `
      padding: 32px 24px;
    `;
  }

  // Process all form groups
  const formGroups = form.querySelectorAll('.form-group');
  formGroups.forEach(group => {
    group.style.cssText = `
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    `;

    const label = group.querySelector('label');
    if (label) {
      label.style.cssText = `
        color: #334155;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        width: 100%;
        text-align: left;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      // Remove bootstrap col classes from label to let it be 100% width above the input
      label.className = '';
    }

    const inputContainer = group.querySelector('div[class^="col-"]');
    if (inputContainer) {
      // Remove bootstrap col classes to make it full width under the label
      inputContainer.className = '';
      inputContainer.style.cssText = `
        width: 100%;
      `;

      const input = inputContainer.querySelector('input:not([type="hidden"]):not([type="submit"])');
      if (input) {
        // Add Placeholders
        if (input.name === 'OldPassword') input.placeholder = 'Enter current password';
        else if (input.name === 'NewPassword') input.placeholder = 'Enter new password';
        else if (input.name === 'ConfirmPassword') input.placeholder = 'Confirm new password';

        // Wrap input to constrain relative positioning for the button
        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = `
          position: relative;
          width: 100%;
        `;
        input.parentNode.insertBefore(inputWrapper, input);
        inputWrapper.appendChild(input);

        // Style the input field
        input.style.cssText = `
          width: 100%;
          padding: 12px 48px 12px 16px; /* Extra padding on right for the eye icon */
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 15px;
          color: #1e293b;
          background-color: #f8fafc;
          transition: all 0.2s ease-in-out;
          font-family: system-ui, -apple-system, sans-serif;
          height: auto;
          box-shadow: none;
        `;
        
        input.addEventListener('focus', () => {
          input.style.borderColor = '#3b82f6';
          input.style.backgroundColor = '#ffffff';
          input.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
        });
        input.addEventListener('blur', () => {
          input.style.borderColor = '#cbd5e1';
          input.style.backgroundColor = '#f8fafc';
          input.style.boxShadow = 'none';
        });

        // Add Eye Button if it's a password field
        if (input.type === 'password') {
          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
            outline: none;
          `;
          
          toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.color = '#3b82f6');
          toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.color = '#64748b');
          
          inputWrapper.appendChild(toggleBtn);
          
          const root = createRoot(toggleBtn);
          
          let isVisible = false;
          
          const EyeToggle = ({ visible }) => visible ? <FiEyeOff size={20} /> : <FiEye size={20} />;
          
          root.render(<EyeToggle visible={isVisible} />);
          
          toggleBtn.addEventListener('click', () => {
            isVisible = !isVisible;
            input.type = isVisible ? 'text' : 'password';
            root.render(<EyeToggle visible={isVisible} />);
          });
        }
      }

      // Style validation spans
      const validationSpan = inputContainer.querySelector('span.field-validation-valid, span.field-validation-error');
      if (validationSpan) {
        validationSpan.style.cssText = `
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
        `;
      }
    }
  });

  // Style Submit Button and Policy Link
  const submitGroup = form.querySelector('input[type="submit"]')?.closest('.form-group');
  if (submitGroup) {
    submitGroup.style.cssText = `
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    `;

    const submitContainer = submitGroup.querySelector('div[class^="col-"]');
    if (submitContainer) {
      submitContainer.className = '';
      submitContainer.style.cssText = `
        width: 100%;
        display: flex;
        align-items: center;
        gap: 16px;
      `;
      
      const submitBtn = submitContainer.querySelector('input[type="submit"]');
      if (submitBtn) {
        submitBtn.className = '';
        submitBtn.style.cssText = `
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          font-family: system-ui, -apple-system, sans-serif;
        `;
        submitBtn.addEventListener('mouseenter', () => {
          submitBtn.style.transform = 'translateY(-1px)';
          submitBtn.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
        });
        submitBtn.addEventListener('mouseleave', () => {
          submitBtn.style.transform = 'translateY(0)';
          submitBtn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
        });
      }

      const policyLink = submitContainer.querySelector('a.tooltip-password-policy');
      if (policyLink) {
        policyLink.style.cssText = `
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        `;
        
        const originalText = policyLink.textContent;
        policyLink.textContent = ''; // clear original text
        
        const iconSpan = document.createElement('span');
        iconSpan.style.display = 'flex';
        iconSpan.style.alignItems = 'center';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = originalText;
        
        policyLink.appendChild(iconSpan);
        policyLink.appendChild(textSpan);
        
        const infoRoot = createRoot(iconSpan);
        infoRoot.render(<FiInfo size={16} />);
        
        policyLink.addEventListener('mouseenter', () => policyLink.style.color = '#3b82f6');
        policyLink.addEventListener('mouseleave', () => policyLink.style.color = '#64748b');
      }
      
      // Remove empty text nodes like &nbsp;
      Array.from(submitContainer.childNodes).forEach(node => {
        if (node.nodeType === 3 && node.textContent.trim() === '') {
          node.remove();
        }
      });
    }
  }
}
