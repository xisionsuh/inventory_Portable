import sqlite3 from 'sqlite3';
import path from 'path';

// 데이터베이스 파일 경로 설정
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '../../data/inventory.db');

// SQLite 데이터베이스 연결 클래스
export class Database {
  private static instance: Database;
  private db: sqlite3.Database;

  private constructor() {
    // 데이터 디렉토리 생성 (메모리 DB가 아닌 경우)
    if (DB_PATH !== ':memory:') {
      const fs = require('fs');
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        this.enableForeignKeys();
      }
    });
  }

  // 싱글톤 패턴으로 데이터베이스 인스턴스 관리
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // 외래 키 제약 조건 활성화
  private enableForeignKeys(): void {
    this.db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('외래 키 활성화 실패:', err.message);
      }
    });
  }

  // 데이터베이스 인스턴스 반환
  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  // 쿼리 실행 (Promise 래퍼)
  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  // 단일 행 조회 (Promise 래퍼)
  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 다중 행 조회 (Promise 래퍼)
  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 트랜잭션 시작
  public beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 트랜잭션 커밋
  public commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 트랜잭션 롤백
  public rollback(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 데이터베이스 연결 종료
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('데이터베이스 연결이 종료되었습니다.');
          resolve();
        }
      });
    });
  }
}

// 데이터베이스 인스턴스 내보내기
export const db = Database.getInstance();