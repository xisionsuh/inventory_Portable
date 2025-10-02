export interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  table_name: string;
  record_id?: number;
  old_data?: string;
  new_data?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateActivityLogDTO {
  user_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  table_name: string;
  record_id?: number;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
}
