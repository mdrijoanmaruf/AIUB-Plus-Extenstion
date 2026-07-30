
(function () {
  // Sentinel so we know if state has been resolved yet
  const ATTR = 'data-aiub-ext';
  const ATTR_FEATURES = 'data-aiub-features';

  function dispatch(enabled, features) {
    // Store resolved state as a data attribute (synchronous read for MAIN world)
    document.documentElement.setAttribute(ATTR, enabled ? '1' : '0');
    if (features) {
      document.documentElement.setAttribute(ATTR_FEATURES, JSON.stringify(features));
    }

    // Also fire an event for any listener still waiting
    document.dispatchEvent(
      new CustomEvent('__aiubExt:state', { detail: { enabled: Boolean(enabled), features: features || {} } })
    );
  }

  // Initial state on page load
  chrome.storage.sync.get({ extensionEnabled: true, featureToggles: {} }, (r) => {
    dispatch(r.extensionEnabled, r.featureToggles);
  });

  // React to popup toggle without requiring a page reload
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if ('extensionEnabled' in changes || 'featureToggles' in changes) {
      chrome.storage.sync.get({ extensionEnabled: true, featureToggles: {} }, (r) => {
        dispatch(r.extensionEnabled, r.featureToggles);
      });
    }
  });
})();
