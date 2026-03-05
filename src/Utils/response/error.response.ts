import { NextFunction, Request, Response } from "express";

export interface IError extends Error {
  statusCode?: number;
  cause?: unknown;
}

export class ApplicationException extends Error {
  public statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 404, options);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 401, options);
  }
}

export class UnAuthorizedException extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 403, options);
  }
}

export const globalErrorHandler = (
  err: IError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Something Went Wrong",
    stack: process.env.MODE === "DEV" ? err.stack : undefined,
    cause: err.cause,
  });
};
