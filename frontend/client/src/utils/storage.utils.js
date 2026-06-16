const USER_INFO_KEY = 'userInfo';
const CART_ITEMS_KEY = 'cartItems';

export const getStoredUserInfo = () => {
  try {
    const data = localStorage.getItem(USER_INFO_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

export const setStoredUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

export const clearStoredUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

export const getStoredCartItems = () => {
  try {
    const data = localStorage.getItem(CART_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const setStoredCartItems = (items) => {
  localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
};
