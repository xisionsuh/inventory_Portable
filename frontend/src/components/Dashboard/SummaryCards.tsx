import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { InventorySummary } from '../../types';

interface SummaryCardsProps {
  summary: InventorySummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const cards = [
    {
      title: '총 제품 수',
      value: summary.total_products.toLocaleString(),
      subtitle: '등록된 제품',
      icon: <InventoryIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: '총 재고 가치',
      value: formatCurrency(summary.total_stock_value),
      subtitle: '현재 재고 기준',
      icon: <MoneyIcon />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
    },
    {
      title: '재고 부족',
      value: summary.low_stock_count.toLocaleString(),
      subtitle: '주의 필요 제품',
      icon: <WarningIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: '최근 거래',
      value: summary.recent_transactions_count.toLocaleString(),
      subtitle: '최근 7일간',
      icon: <TrendingIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: card.bgColor,
                    color: card.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {card.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;