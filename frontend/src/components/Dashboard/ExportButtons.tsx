import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Inventory as InventoryIcon,
  // SwapHoriz as TransactionIcon,
  Warning as WarningIcon,
  TrendingUp as InboundIcon,
  TrendingDown as OutboundIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { exportApi } from '../../services/api';
import DateRangeExportDialog from './DateRangeExportDialog';

const ExportButtons: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dateRangeDialogOpen, setDateRangeDialogOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'transactions' | 'inbound' | 'outbound'>('transactions');
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (type: string) => {
    // 날짜 범위가 필요한 내보내기 타입들
    if (type === 'transactions' || type === 'inbound' || type === 'outbound') {
      setSelectedExportType(type as 'transactions' | 'inbound' | 'outbound');
      setDateRangeDialogOpen(true);
      handleClose();
      return;
    }

    let url: string;
    
    switch (type) {
      case 'products':
        url = exportApi.exportProducts();
        break;
      case 'inventory':
        url = exportApi.exportInventory();
        break;
      case 'low-stock':
        url = exportApi.exportLowStock();
        break;
      default:
        return;
    }

    // 새 창에서 다운로드 실행
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleClose();
  };

  const exportOptions = [
    {
      key: 'inventory',
      label: '재고 현황',
      icon: <InventoryIcon fontSize="small" />,
      description: '현재 재고 현황을 엑셀로 내보내기',
    },
    {
      key: 'products',
      label: '제품 목록',
      icon: <InventoryIcon fontSize="small" />,
      description: '등록된 모든 제품 정보',
    },
    {
      key: 'low-stock',
      label: '재고 부족 제품',
      icon: <WarningIcon fontSize="small" />,
      description: '재고가 부족한 제품 목록',
    },
    { divider: true },
    {
      key: 'transactions',
      label: '전체 거래 내역',
      icon: <DateRangeIcon fontSize="small" />,
      description: '기간별 모든 입출고 거래 내역',
    },
    {
      key: 'inbound',
      label: '입고 내역',
      icon: <InboundIcon fontSize="small" />,
      description: '기간별 입고 거래 내역만',
    },
    {
      key: 'outbound',
      label: '출고 내역',
      icon: <OutboundIcon fontSize="small" />,
      description: '기간별 출고 거래 내역만',
    },
  ];

  return (
    <Box>
      <ButtonGroup variant="outlined">
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('inventory')}
        >
          재고 현황 내보내기
        </Button>
        <Button
          size="small"
          onClick={handleClick}
          sx={{ px: 1 }}
        >
          ▼
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 280 },
        }}
      >
        {exportOptions.map((option, index) => {
          if ('divider' in option) {
            return <Divider key={index} />;
          }

          return (
            <MenuItem
              key={option.key}
              onClick={() => handleExport(option.key)}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                {option.icon}
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                secondary={option.description}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary',
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>

      {/* 날짜 범위 선택 다이얼로그 */}
      <DateRangeExportDialog
        open={dateRangeDialogOpen}
        onClose={() => setDateRangeDialogOpen(false)}
        exportType={selectedExportType}
      />
    </Box>
  );
};

export default ExportButtons;