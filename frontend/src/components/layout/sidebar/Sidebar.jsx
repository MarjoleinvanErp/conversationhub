import React from "react";
import {
  useMediaQuery,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";

const menuItems = [
  {
    title: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
    badge: null,
  },
  {
    title: "Alle Gesprekken",
    icon: HistoryIcon,
    href: "/alle-gesprekken",
    badge: null,
  },
  {
    title: "Gesprek",
    icon: VideoCallIcon,
    href: "/meetings/create",
    badge: null,
  },
];

const settingsItems = [
  {
    title: "Instellingen",
    icon: SettingsIcon,
    href: "/settings",
    badge: null,
  },
  {
    title: "Privacy & Beveiliging",
    icon: SecurityIcon,
    href: "/privacy",
    badge: null,
  },
];

const MaterialProSidebar = ({
  isSidebarOpen,
  isMobileSidebarOpen,
  onSidebarClose,
  sidebarWidth = 270,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const isActive = (href) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    if (href === "/meeting") return location.pathname.startsWith("/meeting/");
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href) => {
    // Voor "Gesprek" navigeer naar een voorbeeld meeting
    if (href === "/meeting") {
      navigate("/meeting/123");
    } else {
      navigate(href);
    }
    
    if (!lgUp) {
      onSidebarClose();
    }
  };

  const SidebarContent = (
    <Box sx={{ 
      height: "100%", 
      backgroundColor: "#1e293b",
      display: "flex", 
      flexDirection: "column"
    }}>
      {/* Logo Section */}
      <Box sx={{ 
        px: 3, 
        py: 3, 
        borderBottom: "1px solid #334155"
      }}>
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              backgroundColor: "#3b82f6",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "1.1rem",
              boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.4)"
            }}
          >
            M
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "white", lineHeight: 1 }}>
              Mayo
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", lineHeight: 1 }}>
              ConversationHub
            </Typography>
          </Box>
        </Typography>
        
        <Typography
          variant="caption"
          sx={{ 
            color: "#94a3b8", 
            mt: 1, 
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 500
          }}
        >
          Gemeente Meierijstad
        </Typography>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ px: 2, py: 3, flexGrow: 1 }}>
        <Typography
          variant="overline"
          sx={{
            color: "#94a3b8",
            fontSize: "0.75rem",
            fontWeight: 600,
            px: 2,
            mb: 2,
            display: "block",
            letterSpacing: "0.05em"
          }}
        >
          HOOFDMENU
        </Typography>
        
        <List disablePadding>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.href)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    backgroundColor: active ? "#3b82f6" : "transparent",
                    border: "1px solid transparent",
                    color: active ? "white" : "#cbd5e1",
                    "&:hover": {
                      backgroundColor: active ? "#2563eb" : "#334155",
                      transform: "translateY(-1px)",
                      boxShadow: active 
                        ? "0 4px 8px -2px rgba(0, 0, 0, 0.3)"
                        : "0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active ? "white" : "#94a3b8",
                      minWidth: 44,
                    }}
                  >
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.badge && (
                          <Badge
                            badgeContent={item.badge}
                            sx={{
                              "& .MuiBadge-badge": {
                                backgroundColor: active ? "white" : "#ef4444",
                                color: active ? "#3b82f6" : "white",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                minWidth: "18px",
                                height: "18px"
                              }
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "#334155", mx: 2, my: 3 }} />

        {/* Settings Section */}
        <Typography
          variant="overline"
          sx={{
            color: "#94a3b8",
            fontSize: "0.75rem",
            fontWeight: 600,
            px: 2,
            mb: 2,
            display: "block",
            letterSpacing: "0.05em"
          }}
        >
          BEHEER
        </Typography>
        
        <List disablePadding>
          {settingsItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.href)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    backgroundColor: active ? "#3b82f6" : "transparent",
                    border: "1px solid transparent",
                    color: active ? "white" : "#cbd5e1",
                    "&:hover": {
                      backgroundColor: active ? "#2563eb" : "#334155",
                      transform: "translateY(-1px)",
                      boxShadow: active 
                        ? "0 4px 8px -2px rgba(0, 0, 0, 0.3)"
                        : "0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active ? "white" : "#94a3b8",
                      minWidth: 44,
                    }}
                  >
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        {item.title}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer Info */}
      <Box sx={{ 
        p: 2, 
        borderTop: "1px solid #334155"
      }}>
        <Typography
          variant="caption"
          sx={{
            color: "#94a3b8",
            display: "block",
            textAlign: "center",
            fontSize: "0.7rem"
          }}
        >
          ConversationHub v2.1.0
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#64748b",
            display: "block",
            textAlign: "center",
            fontSize: "0.65rem",
            mt: 0.5
          }}
        >
          © 2025 Gemeente Meierijstad
        </Typography>
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        variant="persistent"
        PaperProps={{
          sx: {
            width: sidebarWidth,
            border: "0 !important",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            position: "fixed",
            height: "100vh",
            zIndex: 1200,
          },
        }}
      >
        {SidebarContent}
      </Drawer>
    );
  }

  // Mobile sidebar - overlay
  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          border: "0 !important",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      }}
    >
      {SidebarContent}
    </Drawer>
  );
};

export default MaterialProSidebar;