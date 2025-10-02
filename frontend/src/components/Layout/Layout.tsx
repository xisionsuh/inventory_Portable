import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useInventory } from '../../contexts/InventoryContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { refreshData, loading } = useInventory();

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            재고 관리 시스템
          </Typography>
          <Tooltip title="데이터 새로고침">
            <IconButton
              color="inherit"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;