import { sendError } from '../utils/response.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = schema.parse(dataToValidate);
      req[source] = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const firstError = error.errors[0]?.message || 'Validation error';
        return sendError(res, firstError, 400, 'VALIDATION_ERROR', error.errors);
      }
      return sendError(res, error.message || 'Validation error', 400, 'VALIDATION_ERROR');
    }
  };
};
