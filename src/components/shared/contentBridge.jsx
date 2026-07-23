
(function () {
  // Sentinel so we know if state has been resolved yet
  const ATTR = 'data-aiub-ext';

  function dispatch(enabled) {
    // Store resolved state as a data attribute (synchronous read for MAIN world)
    document.documentElement.setAttribute(ATTR, enabled ? '1' : '0');
    // Also fire an event for any listener still waiting
    document.dispatchEvent(
      new CustomEvent('__aiubExt:state', { detail: { enabled: Boolean(enabled) } })
    );
  }

  // Initial state on page load
  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    dispatch(r && r.extensionEnabled);
  });

  // React to popup toggle without requiring a page reload
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !('extensionEnabled' in changes)) return;
    dispatch(changes.extensionEnabled.newValue);
  });
})();
