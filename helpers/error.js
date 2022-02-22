exports.throwError = (message, status) => {
  const error = new Error(message);
  error.statusCode = status;
  throw error;
};

exports.validationError = (arr) => {
  if (arr.length > 0) {
    const error = new Error("Invalid input.");
    error.data = arr;
    error.status = 422;
    throw error;
  }
};
