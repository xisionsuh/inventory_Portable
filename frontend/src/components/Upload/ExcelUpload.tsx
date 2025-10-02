import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

interface UploadResult {
  message: string;
  total: number;
  success_count: number;
  failed_count: number;
  results: {
    success: any[];
    failed: any[];
  };
}

interface ExcelUploadProps {
  uploadType: 'products' | 'inbound' | 'outbound';
  onUploadComplete?: (result: UploadResult) => void;
}

const typeLabels = {
  products: '제품',
  inbound: '입고',
  outbound: '출고'
};

export default function ExcelUpload({ uploadType, onUploadComplete }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`/api/export/template/${uploadType}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${typeLabels[uploadType]}_양식.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || '템플릿 다운로드 실패');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`/api/export/upload/${uploadType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);

      if (onUploadComplete) {
        onUploadComplete(response.data);
      }

      setFile(null);
      const fileInput = document.getElementById(`file-input-${uploadType}`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              {typeLabels[uploadType]} 엑셀 업로드
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              size="small"
            >
              양식 다운로드
            </Button>
          </Box>

          <Box>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id={`file-input-${uploadType}`}
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor={`file-input-${uploadType}`}>
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ mb: 1, py: 2 }}
              >
                파일 선택
              </Button>
            </label>
            {file && (
              <Typography variant="body2" color="text.secondary">
                선택된 파일: {file.name}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUpload}
            disabled={!file || uploading}
            fullWidth
          >
            {uploading ? '업로드 중...' : '업로드'}
          </Button>

          {uploading && <LinearProgress />}

          {error && (
            <Alert severity="error" icon={<ErrorIcon />}>
              {error}
            </Alert>
          )}

          {result && (
            <Box>
              <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
                {result.message}
              </Alert>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`전체: ${result.total}건`} />
                <Chip label={`성공: ${result.success_count}건`} color="success" />
                <Chip label={`실패: ${result.failed_count}건`} color="error" />
              </Stack>

              {result.results.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    실패 항목:
                  </Typography>
                  <List dense>
                    {result.results.failed.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={item.internal_code || item.unique_code}
                            secondary={item.error}
                          />
                        </ListItem>
                        {index < result.results.failed.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
