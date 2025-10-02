import { Request, Response, NextFunction } from 'express';

// 에러 타입 정의
interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 에러 핸들링 미들웨어
export const errorHandler = (
  err: IAppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 기본 에러 상태 코드 설정
  let statusCode = err.statusCode || 500;
  let message = err.message || '내부 서버 오류가 발생했습니다.';

  // SQLite 에러 처리
  if (err.message.includes('UNIQUE constraint failed')) {
    statusCode = 409;
    if (err.message.includes('internal_code')) {
      message = '내부 관리 번호가 중복되었습니다.';
    } else if (err.message.includes('unique_code')) {
      message = '제품 고유 번호가 중복되었습니다.';
    } else {
      message = '중복된 데이터가 존재합니다.';
    }
  } else if (err.message.includes('FOREIGN KEY constraint failed')) {
    statusCode = 400;
    message = '참조하는 데이터가 존재하지 않습니다.';
  } else if (err.message.includes('CHECK constraint failed')) {
    statusCode = 400;
    message = '데이터 유효성 검사에 실패했습니다.';
  }

  // 개발 환경에서는 상세한 에러 정보 제공
  const errorResponse: any = {
    error: true,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.message;
  }

  // 에러 로깅
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    statusCode
  });

  res.status(statusCode).json(errorResponse);
};

// 비동기 함수 에러 처리 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 커스텀 에러 클래스
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}