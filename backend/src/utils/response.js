/**
 * Send a standardized success response
 * @param {Response} res - Express response object
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
export const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 * @param {Response} res - Express response object
 * @param {number} statusCode
 * @param {string} message
 * @param {Array} errors - optional array of detailed errors
 */
export const sendError = (res, statusCode = 500, message = "Something went wrong", errors = []) => {
  const response = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
