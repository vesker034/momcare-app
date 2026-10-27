import { ErrorRequestHandler } from 'express';

import { HttpError } from '../errors/http-error';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
      ...(error.details ?? {}),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: 'Internal server error' });
};
