export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_SERVER_ERROR', errors = null) => {
  const payload = {
    success: false,
    message,
    code,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
