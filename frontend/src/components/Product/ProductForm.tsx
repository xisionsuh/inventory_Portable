import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { useInventory } from '../../contexts/InventoryContext';
import { CreateProductData, UpdateProductData, Product } from '../../types';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null; // 수정 모드일 때 전달
  onComplete?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  product = null,
  onComplete,
}) => {
  const { createProduct, updateProduct, loading } = useInventory();
  const [formData, setFormData] = useState({
    uniqueCode: '',
    name: '',
    description: '',
    unit: '',
    unitPrice: '',
    minStock: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(product);

  // 일반적인 단위 옵션
  const unitOptions = [
    '개',
    'EA',
    'SET',
    'kg',
    'g',
    'L',
    'mL',
    'm',
    'cm',
    'mm',
    '박스',
    '포',
    '롤',
    '장',
  ];

  useEffect(() => {
    if (open) {
      if (isEditMode && product) {
        // 수정 모드: 기존 제품 데이터로 초기화
        setFormData({
          uniqueCode: product.unique_code,
          name: product.name,
          description: product.description || '',
          unit: product.unit,
          unitPrice: product.unit_price.toString(),
          minStock: product.min_stock.toString(),
        });
      } else {
        // 생성 모드: 빈 폼으로 초기화
        setFormData({
          uniqueCode: '',
          name: '',
          description: '',
          unit: '',
          unitPrice: '0',
          minStock: '0',
        });
      }
      setError(null);
    }
  }, [open, isEditMode, product]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.uniqueCode.trim()) {
      return '제품 고유 번호를 입력해주세요.';
    }
    if (!formData.name.trim()) {
      return '제품명을 입력해주세요.';
    }
    if (!formData.unit.trim()) {
      return '단위를 선택해주세요.';
    }
    if (formData.unitPrice && parseFloat(formData.unitPrice) < 0) {
      return '단가는 0 이상이어야 합니다.';
    }
    if (formData.minStock && parseFloat(formData.minStock) < 0) {
      return '최소 재고량은 0 이상이어야 합니다.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (isEditMode && product) {
        // 수정 모드
        const updateData: UpdateProductData = {
          unique_code: formData.uniqueCode.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          unit: formData.unit.trim(),
          unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
          min_stock: formData.minStock ? parseInt(formData.minStock) : 0,
        };
        await updateProduct(product.id, updateData);
      } else {
        // 생성 모드
        const createData: CreateProductData = {
          unique_code: formData.uniqueCode.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          unit: formData.unit.trim(),
          unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
          min_stock: formData.minStock ? parseInt(formData.minStock) : 0,
        };
        await createProduct(createData);
      }

      onComplete?.();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || '처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? '제품 정보 수정' : '새 제품 등록'}
      </DialogTitle>
      
      <DialogContent>
        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* 제품 고유 번호 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="제품 고유 번호"
              value={formData.uniqueCode}
              onChange={handleInputChange('uniqueCode')}
              placeholder="예: LAPTOP-001, MOUSE-BT-001"
              required
              helperText="제품을 식별할 수 있는 고유한 번호를 입력하세요"
            />
          </Grid>

          {/* 제품명 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="제품명"
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="예: 노트북 컴퓨터, 무선 마우스"
              required
            />
          </Grid>

          {/* 제품 설명 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="제품 설명"
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={2}
              placeholder="제품에 대한 상세 설명 (선택사항)"
            />
          </Grid>

          {/* 단위 */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>단위</InputLabel>
              <Select
                value={formData.unit}
                onChange={handleSelectChange('unit')}
                label="단위"
              >
                {unitOptions.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 단가 */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="단가"
              type="number"
              value={formData.unitPrice}
              onChange={handleInputChange('unitPrice')}
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₩</Typography>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="제품 단가 (원)"
            />
          </Grid>

          {/* 최소 재고량 */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="최소 재고량"
              type="number"
              value={formData.minStock}
              onChange={handleInputChange('minStock')}
              inputProps={{ min: 0, step: 1 }}
              helperText="재고 부족 알림 기준"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.uniqueCode || !formData.name || !formData.unit}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? '처리 중...' : (isEditMode ? '수정' : '등록')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;