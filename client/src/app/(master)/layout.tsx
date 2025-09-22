"use client";

import React from "react";
import MasterNavbar from "@/components/layout/MasterNavbar";
import Box from "@mui/material/Box";

const drawerWidth = 240;

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MasterNavbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: { xs: 7, md: 8 }, ml: { md: `${drawerWidth}px` } }}>
        {children}
      </Box>
    </div>
  );
}


