/**
 * Executor script - Runs in MAIN world to execute arbitrary code
 * This script receives code via CustomEvent and executes it
 */

// Listen for execution requests
window.addEventListener('__chrome_cli_exec__', (event) => {
  const { code, id } = event.detail;

  try {
    // Execute code by injecting script tag
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          window.__chrome_cli_result_${id} = ${code};
        } catch (e) {
          window.__chrome_cli_result_${id} = { __error: e.message };
        }
      })();
    `;

    document.documentElement.appendChild(script);
    script.remove();

    // Send result back via event
    const result = window['__chrome_cli_result_' + id];
    delete window['__chrome_cli_result_' + id];

    window.dispatchEvent(new CustomEvent('__chrome_cli_result__', {
      detail: { id, result }
    }));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('__chrome_cli_result__', {
      detail: { id, error: error.message }
    }));
  }
});
