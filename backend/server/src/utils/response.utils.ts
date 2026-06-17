import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response<ApiResponse<T>> =>
  res.status(statusCode).json({ success: true, message, data });

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response<ApiResponse<T>> => sendSuccess(res, data, message, 201);

export const sendNoContent = (res: Response): Response => res.status(204).send();
