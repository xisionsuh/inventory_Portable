import fs from 'fs';
import path from 'path';
import os from 'os';

export class BackupService {
  private backupDir: string;
  private dbPath: string;

  constructor() {
    // 윈도우 내 문서 폴더 경로
    const documentsPath = path.join(os.homedir(), 'Documents');
    this.backupDir = path.join(documentsPath, 'InventoryBackups');
    this.dbPath = path.join(__dirname, '../../data/inventory.db');

    // 백업 폴더 생성
    this.ensureBackupDirectory();
  }

  // 백업 디렉토리 생성
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`백업 폴더가 생성되었습니다: ${this.backupDir}`);
    }
  }

  // 백업 생성
  async createBackup(reason?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const dateStr = timestamp[0];
      const timeStr = timestamp[1].split('-').slice(0, 3).join('');
      const backupFileName = `inventory_backup_${dateStr}_${timeStr}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // 데이터베이스 파일 복사
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath);

        // 백업 메타데이터 파일 생성
        const metaData = {
          backup_time: new Date().toISOString(),
          reason: reason || 'auto',
          original_path: this.dbPath,
          file_size: fs.statSync(backupPath).size
        };

        const metaPath = backupPath + '.meta.json';
        fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));

        console.log(`백업이 생성되었습니다: ${backupPath}`);
        return backupPath;
      } else {
        throw new Error('데이터베이스 파일을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('백업 생성 중 오류 발생:', error);
      throw error;
    }
  }

  // 백업 목록 조회
  async listBackups(): Promise<Array<{
    filename: string;
    path: string;
    size: number;
    created_at: Date;
    meta?: any;
  }>> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.db'));

      const backups = backupFiles.map(filename => {
        const filePath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filePath);

        // 메타데이터 읽기
        let meta = null;
        const metaPath = filePath + '.meta.json';
        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }

        return {
          filename,
          path: filePath,
          size: stats.size,
          created_at: stats.mtime,
          meta
        };
      });

      // 최신순으로 정렬
      return backups.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    } catch (error) {
      console.error('백업 목록 조회 중 오류 발생:', error);
      throw error;
    }
  }

  // 백업 복구
  async restoreBackup(backupFileName: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);

      if (!fs.existsSync(backupPath)) {
        throw new Error('백업 파일을 찾을 수 없습니다');
      }

      // 현재 데이터베이스를 먼저 백업
      await this.createBackup('before_restore');

      // 백업 파일로 복구
      fs.copyFileSync(backupPath, this.dbPath);
      console.log(`백업이 복구되었습니다: ${backupFileName}`);
    } catch (error) {
      console.error('백업 복구 중 오류 발생:', error);
      throw error;
    }
  }

  // 오래된 백업 삭제 (지정된 일수 이상)
  async cleanOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.created_at < cutoffDate) {
          fs.unlinkSync(backup.path);

          // 메타데이터 파일도 삭제
          const metaPath = backup.path + '.meta.json';
          if (fs.existsSync(metaPath)) {
            fs.unlinkSync(metaPath);
          }

          deletedCount++;
        }
      }

      console.log(`${deletedCount}개의 오래된 백업이 삭제되었습니다.`);
      return deletedCount;
    } catch (error) {
      console.error('오래된 백업 삭제 중 오류 발생:', error);
      throw error;
    }
  }

  // 백업 삭제
  async deleteBackup(backupFileName: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);

      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);

        // 메타데이터 파일도 삭제
        const metaPath = backupPath + '.meta.json';
        if (fs.existsSync(metaPath)) {
          fs.unlinkSync(metaPath);
        }

        console.log(`백업이 삭제되었습니다: ${backupFileName}`);
      } else {
        throw new Error('백업 파일을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('백업 삭제 중 오류 발생:', error);
      throw error;
    }
  }

  // 백업 디렉토리 경로 반환
  getBackupDirectory(): string {
    return this.backupDir;
  }
}
