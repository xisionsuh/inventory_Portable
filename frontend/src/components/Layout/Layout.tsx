import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { refreshData, loading } = useInventory();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleRefresh = () => {
    refreshData();
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Tooltip title="메뉴">
            <IconButton
              color="inherit"
              onClick={handleMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <InventoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            재고 관리 시스템
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.full_name} ({user?.role === 'admin' ? '관리자' : '사용자'})
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
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 1 }}
          >
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleNavigate('/')}>
          <DashboardIcon sx={{ mr: 1 }} />
          대시보드
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/activity-logs')}>
          <HistoryIcon sx={{ mr: 1 }} />
          작업 로그
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => handleNavigate('/users')}>
            <PeopleIcon sx={{ mr: 1 }} />
            사용자 관리
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem onClick={() => handleNavigate('/backups')}>
            <BackupIcon sx={{ mr: 1 }} />
            백업 관리
          </MenuItem>
        )}
      </Menu>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;