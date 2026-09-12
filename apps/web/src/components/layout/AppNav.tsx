'use client';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FeedbackIcon from '@mui/icons-material/Feedback';
import HistoryIcon from '@mui/icons-material/History';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLogout } from '@/features/auth/hooks';
import { FEEDBACK_URL } from '@/lib/env';
import { useThemeMode } from '@/providers/ThemeProvider';
import { SandboxBanner } from './SandboxBanner';

export const DRAWER_WIDTH = 240;

/** §50 routes. No entries for out-of-scope features (§3). */
const NAV: Array<{ href: string; label: string; icon: React.ReactNode }> = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/clients', label: 'Kunden', icon: <PeopleIcon /> },
  { href: '/invoices', label: 'Rechnungen', icon: <ReceiptIcon /> },
  { href: '/expenses', label: 'Ausgaben', icon: <ShoppingCartIcon /> },
  { href: '/receipts', label: 'Belege', icon: <ReceiptLongIcon /> },
  { href: '/banking', label: 'Bank', icon: <AccountBalanceIcon /> },
  { href: '/reports/euer', label: 'EÜR', icon: <AssessmentIcon /> },
  { href: '/reports/vat', label: 'Umsatzsteuer', icon: <AssessmentIcon /> },
  { href: '/exports/datev', label: 'DATEV-Export', icon: <UploadFileIcon /> },
  { href: '/audit', label: 'Protokoll', icon: <HistoryIcon /> },
  { href: '/settings/business', label: 'Unternehmen', icon: <SettingsIcon /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const logout = useLogout();

  const drawer = (
    <Box role="navigation" sx={{ width: DRAWER_WIDTH }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700}>
          Buchhaltung
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV.map((n) => (
          <ListItemButton
            key={n.href}
            component={Link}
            href={n.href}
            selected={pathname === n.href || pathname.startsWith(`${n.href}/`)}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon>{n.icon}</ListItemIcon>
            <ListItemText primary={n.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton component="a" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
          <ListItemIcon>
            <FeedbackIcon />
          </ListItemIcon>
          <ListItemText primary="Feedback senden" />
        </ListItemButton>
        <ListItemButton
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Abmelden" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <SandboxBanner />
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Menü">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            Freelancer Accounting — Sandbox
          </Typography>
          <IconButton onClick={toggle} aria-label="Theme wechseln">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', pt: '48px' },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
        >
          {drawer}
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 14, md: 15 },
          maxWidth: 1200,
          width: '100%',
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
