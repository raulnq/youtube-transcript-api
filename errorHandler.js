import { ProblemDocument } from 'http-problem-details';

export class AppError extends Error {
  constructor(error, type, status, data = null) {
    super(error);
    this.type = type;
    this.status = status;
    this.detail = error;
    this.data = data;
  }
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(`Error ${err.status || 500}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof AppError) {
    const problem = new ProblemDocument({
      type: '/problems/' + err.type,
      title: err.type,
      status: err.status,
      detail: err.detail,
      instance: req.originalUrl,
    });

    if (err.data) {
      Object.assign(problem, err.data);
    }

    res.status(err.status).json(problem);
  } else {
    res.status(500).json(
      new ProblemDocument({
        type: '/problems/internal-server-error',
        title: 'InternalServerError',
        status: 500,
        instance: req.originalUrl,
      })
    );
  }
};
