// Forward existing confirmation and password recovery callbacks on this origin.
(() => {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  const keys = ['access_token', 'refresh_token', 'token_hash', 'code', 'error_description', 'error_code'];
  if (keys.some(key => query.has(key) || fragment.has(key))) {
    location.replace('/vendeai.html' + location.search + location.hash);
  }
})();
