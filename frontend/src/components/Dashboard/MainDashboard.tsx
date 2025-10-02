import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useInventory } from '../../contexts/InventoryContext';
import InventoryTable from './InventoryTable';
import SearchBar from './SearchBar';
import SummaryCards from './SummaryCards';
import ProductForm from '../Product/ProductForm';
import TransactionModal from '../Transaction/TransactionModal';
import DeleteProductDialog from '../Product/DeleteProductDialog';
import DeleteTransactionDialog from '../Transaction/DeleteTransactionDialog';
import TransactionHistoryTable from './TransactionHistoryTable';
import ExportButtons from './ExportButtons';
import ExcelUpload from '../Upload/ExcelUpload';

const MainDashboard: React.FC = () => {
  const { inventory, summary, transactions, loading, error, getProductById, refreshData } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTransactionDialogOpen, setDeleteTransactionDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');

  // 검색 필터링된 재고 목록
  const filteredInventory = (inventory || []).filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.internal_code.toLowerCase().includes(term) ||
      item.unique_code.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term)
    );
  });

  const handleInboundClick = (productId: number) => {
    setSelectedProductId(productId);
    setTransactionType('INBOUND');
    setTransactionModalOpen(true);
  };

  const handleOutboundClick = (productId: number) => {
    setSelectedProductId(productId);
    setTransactionType('OUTBOUND');
    setTransactionModalOpen(true);
  };

  const handleTransactionComplete = () => {
    setTransactionModalOpen(false);
    setSelectedProductId(null);
  };

  const handleEditClick = (productId: number) => {
    const product = getProductById(productId);
    if (product) {
      setEditingProduct(product);
      setProductFormOpen(true);
    }
  };

  const handleDeleteClick = (productId: number) => {
    setSelectedProductId(productId);
    setDeleteDialogOpen(true);
  };

  const handleProductFormClose = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteComplete = () => {
    setDeleteDialogOpen(false);
    setSelectedProductId(null);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setDeleteTransactionDialogOpen(true);
  };

  const handleDeleteTransactionComplete = () => {
    setDeleteTransactionDialogOpen(false);
    setSelectedTransactionId(null);
    refreshData(); // 데이터 새로고침
  };

  if (loading && inventory.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* 요약 카드 */}
      {summary && <SummaryCards summary={summary} />}

      {/* 검색 및 내보내기 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="제품명, 내부관리번호, 고유번호로 검색..."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="flex-end">
            <ExportButtons />
          </Box>
        </Grid>
      </Grid>

      {/* 재고 현황 테이블 */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            재고 현황
            {(filteredInventory || []).length !== (inventory || []).length && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({(filteredInventory || []).length}/{(inventory || []).length})
              </Typography>
            )}
          </Typography>
          <InventoryTable
            inventory={filteredInventory}
            onInboundClick={handleInboundClick}
            onOutboundClick={handleOutboundClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            loading={loading}
          />
        </Box>
      </Paper>

      {/* 제품 추가 버튼 */}
      <Tooltip title="새 제품 추가">
        <Fab
          color="primary"
          aria-label="add product"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setProductFormOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* 제품 등록/수정 폼 */}
      <ProductForm
        open={productFormOpen}
        onClose={handleProductFormClose}
        product={editingProduct}
        onComplete={() => {
          setEditingProduct(null);
        }}
      />

      {/* 거래 내역 섹션 */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            거래 내역
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({(transactions || []).length}건)
            </Typography>
          </Typography>
          <TransactionHistoryTable
            transactions={transactions}
            loading={loading}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </Box>
      </Paper>

      {/* 엑셀 업로드 섹션 */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            엑셀 일괄 등록
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <ExcelUpload uploadType="products" onUploadComplete={refreshData} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ExcelUpload uploadType="inbound" onUploadComplete={refreshData} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ExcelUpload uploadType="outbound" onUploadComplete={refreshData} />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* 제품 삭제 확인 다이얼로그 */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        product={selectedProductId ? getProductById(selectedProductId) || null : null}
        onComplete={handleDeleteComplete}
      />

      {/* 거래 내역 삭제 확인 다이얼로그 */}
      <DeleteTransactionDialog
        open={deleteTransactionDialogOpen}
        onClose={() => setDeleteTransactionDialogOpen(false)}
        transaction={selectedTransactionId ? transactions.find(t => t.id === selectedTransactionId) || null : null}
        onComplete={handleDeleteTransactionComplete}
      />

      {/* 입출고 모달 */}
      <TransactionModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        productId={selectedProductId}
        type={transactionType}
        onComplete={handleTransactionComplete}
      />
    </Box>
  );
};

export default MainDashboard;