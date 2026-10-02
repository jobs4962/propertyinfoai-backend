import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';

  return sendError(res, message, statusCode, code);
};
