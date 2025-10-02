import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Refresh as RefreshIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Backup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const BackupManagementPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupReason, setBackupReason] = useState('');

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/backups');
      setBackups(response.data);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      setError('백업 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBackups();
    }
  }, [isAdmin]);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await axios.post('/api/backups', { reason: backupReason });
      setSuccess('백업이 성공적으로 생성되었습니다.');
      setOpenCreateDialog(false);
      setBackupReason('');
      fetchBackups();
    } catch (error: any) {
      setError(error.response?.data?.error || '백업 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setLoading(true);
      await axios.post('/api/backups/restore', {
        backupFileName: selectedBackup.file_name,
      });
      setSuccess('백업이 성공적으로 복구되었습니다. 페이지를 새로고침하세요.');
      setOpenRestoreDialog(false);
      setSelectedBackup(null);
    } catch (error: any) {
      setError(error.response?.data?.error || '백업 복구에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    if (!window.confirm('정말 이 백업을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/api/backups/${encodeURIComponent(fileName)}`);
      setSuccess('백업이 삭제되었습니다.');
      fetchBackups();
    } catch (error: any) {
      setError(error.response?.data?.error || '백업 삭제에 실패했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isAdmin) {
    return (
      <Box>
        <Alert severity="error">
          이 페이지는 관리자만 접근할 수 있습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          백업 관리
        </Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={fetchBackups} disabled={loading} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={() => setOpenCreateDialog(true)}
            disabled={loading}
          >
            백업 생성
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>파일명</TableCell>
              <TableCell>백업 시간</TableCell>
              <TableCell>사유</TableCell>
              <TableCell>파일 크기</TableCell>
              <TableCell>원본 경로</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  백업이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.file_name} hover>
                  <TableCell>{backup.file_name}</TableCell>
                  <TableCell>
                    {dayjs(backup.backup_time).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={backup.reason || 'auto'}
                      color={backup.reason === 'manual' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {backup.original_path}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="복구">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setOpenRestoreDialog(true);
                        }}
                        color="primary"
                      >
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBackup(backup.file_name)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Backup Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>백업 생성</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="백업 사유 (선택사항)"
            value={backupReason}
            onChange={(e) => setBackupReason(e.target.value)}
            margin="normal"
            placeholder="예: 버전 업데이트 전 백업"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>취소</Button>
          <Button onClick={handleCreateBackup} variant="contained" disabled={loading}>
            백업 생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog
        open={openRestoreDialog}
        onClose={() => setOpenRestoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>백업 복구</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            현재 데이터베이스가 선택한 백업으로 교체됩니다. 계속하시겠습니까?
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>파일명:</strong> {selectedBackup.file_name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>백업 시간:</strong>{' '}
                {dayjs(selectedBackup.backup_time).format('YYYY-MM-DD HH:mm:ss')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>파일 크기:</strong> {formatFileSize(selectedBackup.file_size)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>취소</Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            color="error"
            disabled={loading}
          >
            복구 실행
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupManagementPage;
