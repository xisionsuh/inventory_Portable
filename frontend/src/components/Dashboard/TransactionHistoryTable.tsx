import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  TrendingUp as InboundIcon,
  TrendingDown as OutboundIcon,
} from '@mui/icons-material';
import { TransactionWithProduct } from '../../types';
// import { useInventory } from '../../contexts/InventoryContext';

interface TransactionHistoryTableProps {
  transactions: TransactionWithProduct[];
  loading?: boolean;
  onDeleteTransaction?: (transactionId: number) => void;
}

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  transactions,
  loading = false,
  onDeleteTransaction,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  // 필터링된 거래 내역
  const filteredTransactions = (transactions || []).filter(transaction => {
    if (typeFilter === 'ALL') return true;
    return transaction.type === typeFilter;
  });

  // 페이지네이션 적용
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'INBOUND' ? 'success' : 'warning';
  };

  const getTransactionTypeText = (type: string) => {
    return type === 'INBOUND' ? '입고' : '출고';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'INBOUND' ? <InboundIcon fontSize="small" /> : <OutboundIcon fontSize="small" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (loading && (transactions || []).length === 0) {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: 8 }).map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: 8 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box>
      {/* 필터 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>거래 유형</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'ALL' | 'INBOUND' | 'OUTBOUND');
                setPage(0);
              }}
              label="거래 유형"
            >
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="INBOUND">입고</MenuItem>
              <MenuItem value="OUTBOUND">출고</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {filteredTransactions.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {typeFilter === 'ALL' ? '거래 내역이 없습니다.' : `${getTransactionTypeText(typeFilter)} 내역이 없습니다.`}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>거래일자</TableCell>
                  <TableCell align="center">유형</TableCell>
                  <TableCell>제품명</TableCell>
                  <TableCell>제품코드</TableCell>
                  <TableCell align="right">수량</TableCell>
                  <TableCell align="right">단가</TableCell>
                  <TableCell align="right">총액</TableCell>
                  <TableCell>비고</TableCell>
                  <TableCell align="center">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(transaction.transaction_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(transaction.created_at)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getTransactionTypeIcon(transaction.type)}
                        label={getTransactionTypeText(transaction.type)}
                        color={getTransactionTypeColor(transaction.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.product_internal_code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.product_unique_code}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.quantity.toLocaleString()} {transaction.product_unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {transaction.unit_price ? formatCurrency(transaction.unit_price) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(transaction.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.type === 'INBOUND' 
                          ? transaction.supplier || '-'
                          : transaction.reason || '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {onDeleteTransaction && (
                        <Tooltip title="거래 내역 삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteTransaction(transaction.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 페이지네이션 */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} / 총 ${count !== -1 ? count : `${to}개 이상`}`
            }
          />
        </>
      )}
    </Box>
  );
};

export default TransactionHistoryTable;