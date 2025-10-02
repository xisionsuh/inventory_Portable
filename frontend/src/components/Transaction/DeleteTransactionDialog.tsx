import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Warning as WarningIcon, TrendingUp as InboundIcon, TrendingDown as OutboundIcon } from '@mui/icons-material';
import { useInventory } from '../../contexts/InventoryContext';
import { TransactionWithProduct } from '../../types';

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionWithProduct | null;
  onComplete?: () => void;
}

const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  open,
  onClose,
  transaction,
  onComplete,
}) => {
  const { deleteTransaction, loading } = useInventory();
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!transaction) return;

    try {
      setError(null);
      await deleteTransaction(transaction.id);
      onComplete?.();
      onClose();
    } catch (error: any) {
      setError(error.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const getTransactionTypeText = (type: string) => {
    return type === 'INBOUND' ? '입고' : '출고';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'INBOUND' ? <InboundIcon fontSize="small" /> : <OutboundIcon fontSize="small" />;
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'INBOUND' ? 'success' : 'warning';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        거래 내역 삭제 확인
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            다음 거래 내역을 정말 삭제하시겠습니까?
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                icon={getTransactionTypeIcon(transaction.type)}
                label={getTransactionTypeText(transaction.type)}
                color={getTransactionTypeColor(transaction.type)}
                size="small"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {formatDate(transaction.transaction_date)}
              </Typography>
            </Box>
            
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              {transaction.product_name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              제품코드: {transaction.product_internal_code} | {transaction.product_unique_code}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              수량: {transaction.quantity.toLocaleString()} {transaction.product_unit}
            </Typography>
            
            {transaction.unit_price && (
              <Typography variant="body2" color="text.secondary">
                단가: {formatCurrency(transaction.unit_price)}
              </Typography>
            )}
            
            {transaction.total_amount && (
              <Typography variant="body2" color="text.secondary">
                총액: {formatCurrency(transaction.total_amount)}
              </Typography>
            )}
            
            {transaction.type === 'INBOUND' && transaction.supplier && (
              <Typography variant="body2" color="text.secondary">
                공급업체: {transaction.supplier}
              </Typography>
            )}
            
            {transaction.type === 'OUTBOUND' && transaction.reason && (
              <Typography variant="body2" color="text.secondary">
                출고사유: {transaction.reason}
              </Typography>
            )}
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>주의:</strong> 거래 내역을 삭제하면 해당 제품의 재고 수량이 자동으로 조정됩니다.
            {transaction.type === 'INBOUND' 
              ? ` 현재 재고에서 ${transaction.quantity}${transaction.product_unit}가 차감됩니다.`
              : ` 현재 재고에 ${transaction.quantity}${transaction.product_unit}가 추가됩니다.`
            }
          </Typography>
        </Alert>

        <Alert severity="error">
          <Typography variant="body2">
            <strong>경고:</strong> 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? '삭제 중...' : '삭제'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTransactionDialog;