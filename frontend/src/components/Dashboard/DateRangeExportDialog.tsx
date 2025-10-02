import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { exportApi } from '../../services/api';

dayjs.locale('ko');

interface DateRangeExportDialogProps {
  open: boolean;
  onClose: () => void;
  exportType: 'transactions' | 'inbound' | 'outbound';
}

const DateRangeExportDialog: React.FC<DateRangeExportDialogProps> = ({
  open,
  onClose,
  exportType,
}) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [quickRange, setQuickRange] = useState<string>('30days');

  const quickRangeOptions = [
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '90days', label: '최근 90일' },
    { value: '1year', label: '최근 1년' },
    { value: 'custom', label: '직접 선택' },
  ];

  const handleQuickRangeChange = (value: string) => {
    setQuickRange(value);
    
    const today = dayjs();
    switch (value) {
      case '7days':
        setStartDate(today.subtract(7, 'day'));
        setEndDate(today);
        break;
      case '30days':
        setStartDate(today.subtract(30, 'day'));
        setEndDate(today);
        break;
      case '90days':
        setStartDate(today.subtract(90, 'day'));
        setEndDate(today);
        break;
      case '1year':
        setStartDate(today.subtract(1, 'year'));
        setEndDate(today);
        break;
      case 'custom':
        // 사용자가 직접 선택
        break;
    }
  };

  const handleExport = () => {
    if (!startDate || !endDate) return;

    const params = {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
    };

    let url: string;
    switch (exportType) {
      case 'transactions':
        url = exportApi.exportTransactions(params);
        break;
      case 'inbound':
        url = exportApi.exportInbound(params);
        break;
      case 'outbound':
        url = exportApi.exportOutbound(params);
        break;
      default:
        return;
    }

    // 다운로드 실행
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  const getDialogTitle = () => {
    switch (exportType) {
      case 'transactions':
        return '거래 내역 내보내기';
      case 'inbound':
        return '입고 내역 내보내기';
      case 'outbound':
        return '출고 내역 내보내기';
      default:
        return '내보내기';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              기간 선택
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>빠른 선택</InputLabel>
                  <Select
                    value={quickRange}
                    onChange={(e) => handleQuickRangeChange(e.target.value)}
                    label="빠른 선택"
                  >
                    {quickRangeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="시작 날짜"
                  value={startDate}
                  onChange={setStartDate}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="종료 날짜"
                  value={endDate}
                  onChange={setEndDate}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </Grid>

            {startDate && endDate && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  선택된 기간: {startDate.format('YYYY년 MM월 DD일')} ~ {endDate.format('YYYY년 MM월 DD일')}
                  ({endDate.diff(startDate, 'day') + 1}일)
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={!startDate || !endDate || startDate.isAfter(endDate)}
          >
            내보내기
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DateRangeExportDialog;