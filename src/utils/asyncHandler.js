/**
 * Wrapper for async express route handlers to eliminate try-catch boilerplate
 * @param {Function} requestHandler - Controller async method
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
