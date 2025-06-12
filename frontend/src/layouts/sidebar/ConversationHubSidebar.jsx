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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import TranscribeIcon from "@mui/icons-material/RecordVoiceOver";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";
import GroupIcon from "@mui/icons-material/Group";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const sidebarWidth = 270;

const menuItems = [
  {
    title: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
  },
  {
    title: "Nieuw Gesprek",
    icon: VideoCallIcon,
    href: "/meetings/create",
  },
  {
    title: "Live Transcriptie",
    icon: TranscribeIcon,
    href: "/transcription/live",
  },
  {
    title: "Gesprekken",
    icon: HistoryIcon,
    href: "/meetings",
  },
  {
    title: "Deelnemers",
    icon: GroupIcon,
    href: "/participants",
  },
  {
    title: "Rapportages",
    icon: AnalyticsIcon,
    href: "/reports",
  },
];

const settingsItems = [
  {
    title: "Privacy Instellingen",
    icon: SecurityIcon,
    href: "/settings/privacy",
  },
  {
    title: "Algemene Instellingen",
    icon: SettingsIcon,
    href: "/settings",
  },
];

const ConversationHubSidebar = ({
  isSidebarOpen,
  isMobileSidebarOpen,
  onSidebarClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const isActive = (href) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href) => {
    navigate(href);
    if (!lgUp) {
      onSidebarClose();
    }
  };

  const SidebarContent = (
    <Box sx={{ height: "100%", backgroundColor: "#1e293b" }}>
      {/* Logo Section */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#3b82f6",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            C
          </Box>
          ConversationHub
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#94a3b8", mt: 0.5, display: "block" }}
        >
          Nederlandse Overheid
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "#334155" }} />

      {/* Main Navigation */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "#94a3b8",
            fontSize: "0.75rem",
            fontWeight: 600,
            px: 2,
            mb: 1,
            display: "block",
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
                    backgroundColor: active ? "#3b82f6" : "transparent",
                    color: active ? "white" : "#cbd5e1",
                    "&:hover": {
                      backgroundColor: active ? "#2563eb" : "#334155",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active ? "white" : "#94a3b8",
                      minWidth: 40,
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: active ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "#334155", mx: 2 }} />

      {/* Settings Section */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "#94a3b8",
            fontSize: "0.75rem",
            fontWeight: 600,
            px: 2,
            mb: 1,
            display: "block",
          }}
        >
          INSTELLINGEN
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
                    backgroundColor: active ? "#3b82f6" : "transparent",
                    color: active ? "white" : "#cbd5e1",
                    "&:hover": {
                      backgroundColor: active ? "#2563eb" : "#334155",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active ? "white" : "#94a3b8",
                      minWidth: 40,
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: active ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Privacy Badge */}
      <Box sx={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
        <Box
          sx={{
            backgroundColor: "#10b981",
            color: "white",
            px: 2,
            py: 1,
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            🔒 GDPR/AVG Compliant
          </Typography>
        </Box>
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
          },
        }}
      >
        {SidebarContent}
      </Drawer>
    );
  }

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
        },
      }}
    >
      {SidebarContent}
    </Drawer>
  );
};

export default ConversationHubSidebar;