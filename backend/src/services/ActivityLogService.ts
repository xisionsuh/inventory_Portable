import { db } from '../config/database';
import { ActivityLog, CreateActivityLogDTO } from '../models/ActivityLog';

export class ActivityLogService {
  // 로그 생성
  async createLog(data: CreateActivityLogDTO): Promise<void> {
    const oldDataJson = data.old_data ? JSON.stringify(data.old_data) : null;
    const newDataJson = data.new_data ? JSON.stringify(data.new_data) : null;

    await db.run(
      `INSERT INTO activity_logs
       (user_id, action_type, table_name, record_id, old_data, new_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.action_type,
        data.table_name,
        data.record_id || null,
        oldDataJson,
        newDataJson,
        data.ip_address || null,
        data.user_agent || null
      ]
    );
  }

  // 모든 로그 조회
  async getAllLogs(limit: number = 100, offset: number = 0): Promise<ActivityLog[]> {
    return await db.all(
      `SELECT
        al.*,
        u.username,
        u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // 사용자별 로그 조회
  async getLogsByUser(userId: number, limit: number = 100): Promise<ActivityLog[]> {
    return await db.all(
      `SELECT * FROM activity_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  }

  // 테이블별 로그 조회
  async getLogsByTable(tableName: string, recordId?: number): Promise<ActivityLog[]> {
    if (recordId) {
      return await db.all(
        `SELECT
          al.*,
          u.username,
          u.full_name
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.table_name = ? AND al.record_id = ?
         ORDER BY al.created_at DESC`,
        [tableName, recordId]
      );
    }

    return await db.all(
      `SELECT
        al.*,
        u.username,
        u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.table_name = ?
       ORDER BY al.created_at DESC`,
      [tableName]
    );
  }

  // 날짜 범위로 로그 조회
  async getLogsByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    return await db.all(
      `SELECT
        al.*,
        u.username,
        u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE date(al.created_at) BETWEEN date(?) AND date(?)
       ORDER BY al.created_at DESC`,
      [startDate, endDate]
    );
  }

  // 작업 유형별 로그 조회
  async getLogsByActionType(actionType: string): Promise<ActivityLog[]> {
    return await db.all(
      `SELECT
        al.*,
        u.username,
        u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.action_type = ?
       ORDER BY al.created_at DESC`,
      [actionType]
    );
  }

  // 필터링된 로그 조회
  async getFilteredLogs(filters: {
    userId?: number;
    actionType?: string;
    tableName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ActivityLog[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      conditions.push('al.user_id = ?');
      params.push(filters.userId);
    }

    if (filters.actionType) {
      conditions.push('al.action_type = ?');
      params.push(filters.actionType);
    }

    if (filters.tableName) {
      conditions.push('al.table_name = ?');
      params.push(filters.tableName);
    }

    if (filters.startDate && filters.endDate) {
      conditions.push('date(al.created_at) BETWEEN date(?) AND date(?)');
      params.push(filters.startDate, filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countResult = await db.get(
      `SELECT COUNT(*) as count FROM activity_logs al ${whereClause}`,
      params
    );

    // Logs with pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    params.push(limit, offset);

    const logs = await db.all(
      `SELECT
        al.*,
        u.username,
        u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    return {
      logs,
      total: countResult.count
    };
  }
}
