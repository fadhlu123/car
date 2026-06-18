export const extractErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  return error.message || 'An unexpected error occurred.';
};
