import { AppError } from './errorHandler.js';

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    return next();
  }

  if (!apiKey) {
    throw new AppError('API key is required', 'authentication', 401);
  }

  if (apiKey !== expectedApiKey) {
    throw new AppError('Invalid API key', 'authentication', 401);
  }

  next();
};
