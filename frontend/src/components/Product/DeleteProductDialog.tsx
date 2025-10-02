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
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useInventory } from '../../contexts/InventoryContext';
import { Product } from '../../types';

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onComplete?: () => void;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  open,
  onClose,
  product,
  onComplete,
}) => {
  const { deleteProduct, loading } = useInventory();
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProduct(product.id);
      onComplete?.();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        제품 삭제 확인
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            다음 제품을 정말 삭제하시겠습니까?
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              제품 정보
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              내부관리번호: {product.internal_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              제품고유번호: {product.unique_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              현재재고: {product.current_stock.toLocaleString()} {product.unit}
            </Typography>
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>주의:</strong> 제품을 삭제하면 관련된 모든 거래 내역도 함께 삭제됩니다. 
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </Alert>

        {product.current_stock > 0 && (
          <Alert severity="error">
            <Typography variant="body2">
              <strong>경고:</strong> 현재 재고가 {product.current_stock.toLocaleString()} {product.unit} 
              남아있습니다. 재고가 있는 제품을 삭제하시겠습니까?
            </Typography>
          </Alert>
        )}
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

export default DeleteProductDialog;