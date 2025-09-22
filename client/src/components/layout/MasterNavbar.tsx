"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Button from "@mui/material/Button";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { logoutClient } from "@/features/auth/lib";

const drawerWidth = 240;

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/master", icon: <DashboardIcon /> },
  { label: "Businesses", href: "/master/businesses", icon: <BusinessIcon /> },
  { label: "Users", href: "/master/users", icon: <GroupIcon /> },
  // { label: "Global Settings", href: "/master/global-settings", icon: <SettingsIcon /> },
  // { label: "Support", href: "/master/support", icon: <SupportAgentIcon /> },
];

export default function MasterNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const router = useRouter();

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  const drawer = (
    <Box role="presentation" sx={{ width: drawerWidth }}>
      <Toolbar>
        <Typography variant="h6" component="div">
          Master Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const selected = pathname === item.href
          return (
            <ListItemButton
              key={item.href}
              component={Link as any}
              href={item.href}
              selected={!!selected}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleMobile}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Master Portal
          </Typography>
          <ThemeToggle />
          <Button
            onClick={() => logoutClient(router)}
            size="small"
            startIcon={<LogoutIcon />}
            sx={{ ml: 1 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Temporary drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        <Box>
          {drawer}
          <Divider />
          <List>
            <ListItemButton onClick={() => logoutClient(router)}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Permanent drawer for desktop */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}


