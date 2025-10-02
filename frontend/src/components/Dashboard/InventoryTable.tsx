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
  TableSortLabel,
} from '@mui/material';
import {
  TrendingUp as InboundIcon,
  TrendingDown as OutboundIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { InventoryStatus } from '../../types';

interface InventoryTableProps {
  inventory: InventoryStatus[];
  onInboundClick: (productId: number) => void;
  onOutboundClick: (productId: number) => void;
  onEditClick?: (productId: number) => void;
  onDeleteClick?: (productId: number) => void;
  loading?: boolean;
}

type Order = 'asc' | 'desc';
type OrderBy = 'internal_code' | 'unique_code' | 'name' | 'unit_price' | 'current_stock' | 'min_stock' | 'total_value' | 'total_inbound' | 'total_outbound' | 'stock_status' | 'created_at';

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  onInboundClick,
  onOutboundClick,
  onEditClick,
  onDeleteClick,
  loading = false,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('stock_status');

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // 총재고금액 계산
  const calculateTotalValue = (item: InventoryStatus) => {
    return item.current_stock * (item.unit_price || 0);
  };

  // 재고 상태 우선순위 (재고없음 > 부족 > 정상)
  const getStockStatusPriority = (status: string) => {
    if (status === 'OUT_OF_STOCK') return 0;
    if (status === 'LOW') return 1;
    return 2;
  };

  // 정렬 함수
  const sortedInventory = [...inventory].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (orderBy) {
      case 'stock_status':
        aValue = getStockStatusPriority(a.stock_status);
        bValue = getStockStatusPriority(b.stock_status);
        break;
      case 'total_value':
        aValue = calculateTotalValue(a);
        bValue = calculateTotalValue(b);
        break;
      case 'internal_code':
        aValue = a.internal_code;
        bValue = b.internal_code;
        break;
      case 'unique_code':
        aValue = a.unique_code;
        bValue = b.unique_code;
        break;
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'unit_price':
        aValue = a.unit_price || 0;
        bValue = b.unit_price || 0;
        break;
      case 'current_stock':
        aValue = a.current_stock;
        bValue = b.current_stock;
        break;
      case 'min_stock':
        aValue = a.min_stock;
        bValue = b.min_stock;
        break;
      case 'total_inbound':
        aValue = a.total_inbound;
        bValue = b.total_inbound;
        break;
      case 'total_outbound':
        aValue = a.total_outbound;
        bValue = b.total_outbound;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // 페이지네이션 적용
  const paginatedInventory = sortedInventory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const getStockStatusColor = (status: string, isLowStock: boolean) => {
    if (status === 'OUT_OF_STOCK') return 'error';
    if (isLowStock) return 'warning';
    return 'success';
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return '재고없음';
      case 'LOW':
        return '부족';
      case 'NORMAL':
        return '정상';
      default:
        return '알수없음';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading && inventory.length === 0) {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: 12 }).map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: 12 }).map((_, cellIndex) => (
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

  if (inventory.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          등록된 제품이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'internal_code'}
                  direction={orderBy === 'internal_code' ? order : 'asc'}
                  onClick={() => handleRequestSort('internal_code')}
                >
                  내부관리번호
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'unique_code'}
                  direction={orderBy === 'unique_code' ? order : 'asc'}
                  onClick={() => handleRequestSort('unique_code')}
                >
                  제품고유번호
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  제품명
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'unit_price'}
                  direction={orderBy === 'unit_price' ? order : 'asc'}
                  onClick={() => handleRequestSort('unit_price')}
                >
                  단가
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'current_stock'}
                  direction={orderBy === 'current_stock' ? order : 'asc'}
                  onClick={() => handleRequestSort('current_stock')}
                >
                  현재재고
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'min_stock'}
                  direction={orderBy === 'min_stock' ? order : 'asc'}
                  onClick={() => handleRequestSort('min_stock')}
                >
                  최소재고
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'total_value'}
                  direction={orderBy === 'total_value' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_value')}
                >
                  총재고금액
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'total_inbound'}
                  direction={orderBy === 'total_inbound' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_inbound')}
                >
                  총입고
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'total_outbound'}
                  direction={orderBy === 'total_outbound' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_outbound')}
                >
                  총출고
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'stock_status'}
                  direction={orderBy === 'stock_status' ? order : 'asc'}
                  onClick={() => handleRequestSort('stock_status')}
                >
                  재고상태
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'created_at'}
                  direction={orderBy === 'created_at' ? order : 'asc'}
                  onClick={() => handleRequestSort('created_at')}
                >
                  등록일
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInventory.map((item) => (
            <TableRow
              key={item.id}
              hover
            >
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {item.internal_code}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {item.unique_code}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {item.name}
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="medium">
                  ₩{(item.unit_price || 0).toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={item.current_stock <= 0 ? 'error.main' : 'inherit'}
                >
                  {item.current_stock.toLocaleString()} {item.unit}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" color="text.secondary">
                  {item.min_stock.toLocaleString()} {item.unit}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  ₩{calculateTotalValue(item).toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  {item.total_inbound.toLocaleString()} {item.unit}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" color="warning.main" fontWeight="medium">
                  {item.total_outbound.toLocaleString()} {item.unit}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={getStockStatusText(item.stock_status)}
                  color={getStockStatusColor(item.stock_status, item.is_low_stock)}
                  size="small"
                  variant={item.stock_status === 'OUT_OF_STOCK' ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" color="text.secondary">
                  {formatDate(item.created_at)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" gap={0.5} justifyContent="center">
                  <Tooltip title="입고">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onInboundClick(item.id)}
                    >
                      <InboundIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="출고">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => onOutboundClick(item.id)}
                      disabled={item.current_stock <= 0}
                    >
                      <OutboundIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="수정">
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => onEditClick?.(item.id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="삭제">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteClick?.(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <TablePagination
      rowsPerPageOptions={[10, 20, 50, 100]}
      component="div"
      count={inventory.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="페이지당 행 수:"
      labelDisplayedRows={({ from, to, count }) =>
        `${from}-${to} / 총 ${count !== -1 ? count : `${to}개 이상`}`
      }
    />
  </Box>
  );
};

export default InventoryTable;