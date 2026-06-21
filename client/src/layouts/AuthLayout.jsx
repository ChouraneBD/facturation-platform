import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Outlet />
    </Box>
  );
}
