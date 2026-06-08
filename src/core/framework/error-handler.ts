export function handleGlobalError(error: Error, context?: string) {
  console.error(`[BAEX GLOBAL ERROR] ${context || 'Unknown Context'}:`, error);
  
  const loaderText = document.getElementById('loader-text');
  if (loaderText) {
    loaderText.textContent = 'Critical Error ⚠';
    loaderText.style.color = '#ff4d4d';
  }
  
  // Create a floating error toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff4d4d;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    cursor: pointer;
  `;
  toast.textContent = `Error: ${error.message}`;
  toast.onclick = () => toast.remove();
  document.body.appendChild(toast);
}

export function setupGlobalErrorHandling() {
  window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), 'Unhandled Promise');
  });

  window.addEventListener('error', (event) => {
    if (event.error) {
      handleGlobalError(event.error, 'Runtime Error');
    }
  });
}
