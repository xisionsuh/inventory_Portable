import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// 요청 본문 유효성 검사 미들웨어
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field] && req.body[field] !== 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new AppError(
        `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
        400
      );
    }

    next();
  };
};

// 숫자 유효성 검사
export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): number => {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new AppError(`${fieldName}은(는) 유효한 숫자여야 합니다.`, 400);
  }

  if (min !== undefined && num < min) {
    throw new AppError(`${fieldName}은(는) ${min} 이상이어야 합니다.`, 400);
  }

  if (max !== undefined && num > max) {
    throw new AppError(`${fieldName}은(는) ${max} 이하여야 합니다.`, 400);
  }

  return num;
};

// 문자열 유효성 검사
export const validateString = (value: any, fieldName: string, minLength?: number, maxLength?: number): string => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName}은(는) 문자열이어야 합니다.`, 400);
  }

  const trimmed = value.trim();

  if (minLength !== undefined && trimmed.length < minLength) {
    throw new AppError(`${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`, 400);
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new AppError(`${fieldName}은(는) 최대 ${maxLength}자 이하여야 합니다.`, 400);
  }

  return trimmed;
};

// 날짜 유효성 검사
export const validateDate = (value: any, fieldName: string): string => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName}은(는) 문자열 형태의 날짜여야 합니다.`, 400);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName}은(는) 유효한 날짜 형식이어야 합니다. (YYYY-MM-DD)`, 400);
  }

  // YYYY-MM-DD 형식으로 반환
  return date.toISOString().split('T')[0];
};

// ID 파라미터 유효성 검사 미들웨어
export const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    throw new AppError('유효하지 않은 ID입니다.', 400);
  }

  req.params.id = id.toString();
  next();
};