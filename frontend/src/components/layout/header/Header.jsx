import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Button,
  Chip,
  useMediaQuery,
  Divider,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AddIcon from "@mui/icons-material/Add";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";

const MaterialProHeader = ({ toggleMobileSidebar, toggleSidebar, isSidebarOpen, sidebarWidth = 270 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const { user, logout } = useAuth();
  
  // State for menus
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);

  // Mock data - later vervangen door echte data
  const [isRecording, setIsRecording] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleUserClick = (event) => {
    setUserAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setNotificationAnchor(null);
    setUserAnchor(null);
  };

  const handleNewMeeting = () => {
    console.log("Starting new meeting...");
    navigate("/meetings/create");
  };

  const handleProfile = () => {
    handleClose();
    navigate("/profile");
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Gebruiker';
  };

  return (
    <AppBar
      sx={{
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        backgroundColor: "white",
        color: "#1f2937",
        borderBottom: "1px solid #e5e7eb",
        zIndex: 1100, // Lager dan sidebar (1200) maar hoger dan content
        position: "fixed",
        // Belangrijk: width aanpassen op basis van sidebar status
        width: lgUp && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%",
        marginLeft: lgUp && isSidebarOpen ? `${sidebarWidth}px` : 0,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
      color="default"
    >
      <Toolbar sx={{ minHeight: "70px !important" }}>
        {/* Mobile Menu Button */}
        {!lgUp && (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Desktop Sidebar Toggle */}
        {lgUp && (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo Section - alleen op mobile wanneer sidebar dicht is */}
        {!lgUp && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#3b82f6",
              mr: 2,
            }}
          >
            ConversationHub
          </Typography>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          
          {/* NEW: Nieuw Gesprek Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewMeeting}
            sx={{
              backgroundColor: "#10b981",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              py: 1,
              boxShadow: "0 2px 4px -1px rgba(16, 185, 129, 0.3)",
              "&:hover": {
                backgroundColor: "#059669",
                boxShadow: "0 4px 8px -2px rgba(16, 185, 129, 0.4)",
                transform: "translateY(-1px)"
              },
              transition: "all 0.2s ease-in-out",
              display: { xs: "none", sm: "flex" } // Verberg op mobile
            }}
          >
            Nieuw Gesprek
          </Button>

          {/* Mobile: Compact New Meeting Button */}
          <IconButton
            onClick={handleNewMeeting}
            sx={{
              backgroundColor: "#10b981",
              color: "white",
              "&:hover": {
                backgroundColor: "#059669",
              },
              display: { xs: "flex", sm: "none" } // Alleen op mobile
            }}
          >
            <AddIcon />
          </IconButton>

          {/* Recording Status Indicator */}
          {isRecording && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ color: "#ef4444 !important" }} />}
              label="Recording"
              size="small"
              sx={{
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                fontWeight: 500,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.7 },
                },
              }}
            />
          )}



          {/* User Menu */}
          <IconButton color="inherit" onClick={handleUserClick} sx={{ ml: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "#3b82f6",
                fontSize: "0.875rem",
              }}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>
        </Box>

 
        {/* User Menu */}
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: { 
              width: 250, 
              mt: 1,
              zIndex: 1300, 
            },
          }}
        >
          {/* User Info Header */}
          <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#3b82f6",
                  fontSize: "1rem",
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getDisplayName()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role || 'Gesprekscoördinator'}
                </Typography>
                {user?.email && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {user.email}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>


          <Divider />

          <MenuItem onClick={handleLogout} sx={{ color: "#dc2626" }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: "#dc2626" }} />
            </ListItemIcon>
            <ListItemText>Uitloggen</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default MaterialProHeader;