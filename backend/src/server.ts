import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, insertSampleData, resetSampleData } from './database/init';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000'] // 프로덕션에서는 실제 도메인으로 변경
    : true, // 개발 환경에서는 모든 origin 허용
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '재고 관리 시스템 API 서버가 실행 중입니다.',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// API 라우트 import
import productRoutes from './routes/productRoutes';
import transactionRoutes from './routes/transactionRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import exportRoutes from './routes/exportRoutes';

// API 라우트 설정
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/export', exportRoutes);

// 프로덕션 환경에서 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // SPA를 위한 catch-all 핸들러
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로 ${req.originalUrl}을 찾을 수 없습니다.`
  });
});

// 에러 핸들링 미들웨어
app.use(errorHandler);

// 서버 시작 함수
async function startServer() {
  try {
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 개발 환경에서만 샘플 데이터 삽입
    if (process.env.NODE_ENV !== 'production') {
      // 환경변수로 데이터 리셋 여부 결정
      if (process.env.RESET_DATA === 'true') {
        await resetSampleData();
      }
      await insertSampleData();
    }

    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
}

// 서버 시작
startServer();

// 프로세스 종료 시 정리 작업
process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n서버를 종료합니다...');
  process.exit(0);
});