/**
 * Extracts a user-friendly error message from an API error response.
 * Expects the backend to return { success: false, message: "Error details" }
 */
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred.';
};
