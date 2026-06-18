const KEYS = {
  ACCESS_TOKEN:  'am_access_token',
  REFRESH_TOKEN: 'am_refresh_token',
  USER:          'am_user',
  CART:          'am_cart',
};

export const storeAuth = ({ access_token, refresh_token, user }) => {
  localStorage.setItem(KEYS.ACCESS_TOKEN,  access_token);
  localStorage.setItem(KEYS.REFRESH_TOKEN, refresh_token);
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const updateTokens = (access_token, refresh_token) => {
  localStorage.setItem(KEYS.ACCESS_TOKEN, access_token);
  if (refresh_token) localStorage.setItem(KEYS.REFRESH_TOKEN, refresh_token);
};

export const getAccessToken  = () => localStorage.getItem(KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(KEYS.REFRESH_TOKEN);

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(KEYS.USER)); }
  catch { return null; }
};

export const updateStoredUser = (user) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const clearAuth = () => {
  [KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER].forEach((k) => localStorage.removeItem(k));
};

// ── Cart ──────────────────────────────────────────────────────────────────────

export const getStoredCartItems = () => {
  try { return JSON.parse(localStorage.getItem(KEYS.CART)) || []; }
  catch { return []; }
};

export const setStoredCartItems = (items) => {
  localStorage.setItem(KEYS.CART, JSON.stringify(items));
};
