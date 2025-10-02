import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { useInventory } from '../../contexts/InventoryContext';
import { InboundTransactionData, OutboundTransactionData } from '../../types';

dayjs.locale('ko');

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  productId: number | null;
  type: 'INBOUND' | 'OUTBOUND';
  onComplete?: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  onClose,
  productId,
  type,
  onComplete,
}) => {
  const { getProductById, processInbound, processOutbound, loading } = useInventory();
  const [formData, setFormData] = useState({
    quantity: '',
    unitPrice: '',
    supplier: '',
    reason: '',
    transactionDate: dayjs(),
  });
  const [error, setError] = useState<string | null>(null);

  const product = productId ? getProductById(productId) : null;
  const isInbound = type === 'INBOUND';

  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 폼 초기화
      setFormData({
        quantity: '',
        unitPrice: '',
        supplier: '',
        reason: '',
        transactionDate: dayjs(),
      });
      setError(null);
    }
  }, [open, productId, type]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        transactionDate: date,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      return '수량을 올바르게 입력해주세요.';
    }

    if (isInbound && formData.unitPrice && parseFloat(formData.unitPrice) < 0) {
      return '단가는 0 이상이어야 합니다.';
    }

    if (!isInbound && product && parseFloat(formData.quantity) > product.current_stock) {
      return `재고가 부족합니다. 현재 재고: ${product.current_stock}${product.unit}`;
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!product) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const quantity = parseFloat(formData.quantity);
      const transactionDate = formData.transactionDate.format('YYYY-MM-DD');

      if (isInbound) {
        const inboundData: InboundTransactionData = {
          product_id: product.id,
          quantity,
          transaction_date: transactionDate,
          unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
          supplier: formData.supplier || undefined,
        };
        await processInbound(inboundData);
      } else {
        const outboundData: OutboundTransactionData = {
          product_id: product.id,
          quantity,
          transaction_date: transactionDate,
          reason: formData.reason || undefined,
        };
        await processOutbound(outboundData);
      }

      onComplete?.();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  if (!product) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isInbound ? '입고 처리' : '출고 처리'}
        </DialogTitle>
        
        <DialogContent>
          {/* 제품 정보 */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              제품 정보
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {product.internal_code} | {product.unique_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              현재 재고: {product.current_stock.toLocaleString()} {product.unit}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* 수량 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="수량"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                InputProps={{
                  endAdornment: <Typography variant="body2">{product.unit}</Typography>,
                }}
                inputProps={{ min: 0, step: 1 }}
                required
              />
            </Grid>

            {/* 거래 날짜 */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="거래 날짜"
                value={formData.transactionDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* 입고 전용 필드 */}
            {isInbound && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="단가"
                    type="number"
                    value={formData.unitPrice}
                    onChange={handleInputChange('unitPrice')}
                    InputProps={{
                      startAdornment: <Typography variant="body2">₩</Typography>,
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="공급업체"
                    value={formData.supplier}
                    onChange={handleInputChange('supplier')}
                  />
                </Grid>
                {formData.quantity && formData.unitPrice && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary.contrastText">
                        총액: ₩{calculateTotal().toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

            {/* 출고 전용 필드 */}
            {!isInbound && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="출고 사유"
                  value={formData.reason}
                  onChange={handleInputChange('reason')}
                  multiline
                  rows={2}
                  placeholder="출고 사유를 입력하세요 (선택사항)"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.quantity}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? '처리 중...' : (isInbound ? '입고 처리' : '출고 처리')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TransactionModal;