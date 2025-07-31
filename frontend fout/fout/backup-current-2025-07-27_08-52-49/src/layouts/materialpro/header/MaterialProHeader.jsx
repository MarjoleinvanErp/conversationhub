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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const MaterialProHeader = ({ toggleMobileSidebar, toggleSidebar, isSidebarOpen, sidebarWidth = 270 }) => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  
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
            Mayo
          </Typography>
        )}

        {/* Status Indicators */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mr: 2 }}>
          {/* Recording Status */}
          <Chip
            icon={<FiberManualRecordIcon />}
            label={isRecording ? "Opname actief" : "Niet actief"}
            size="small"
            color={isRecording ? "error" : "default"}
            variant={isRecording ? "filled" : "outlined"}
          />
          
          {/* Privacy Status */}
          <Chip
            label="🔒 Privé modus"
            size="small"
            sx={{
              backgroundColor: "#10b981",
              color: "white",
              "&:hover": { backgroundColor: "#059669" },
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* New Meeting Button */}
          <Button
            variant="contained"
            startIcon={<VideoCallIcon />}
            onClick={handleNewMeeting}
            sx={{
              backgroundColor: "#3b82f6",
              "&:hover": { backgroundColor: "#2563eb" },
              borderRadius: 2,
              textTransform: "none",
              display: { xs: "none", md: "flex" },
            }}
          >
            Nieuw Gesprek
          </Button>

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationClick}
            sx={{ ml: 1 }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton color="inherit" onClick={handleUserClick} sx={{ ml: 1 }}>
            <Avatar
              sx={{
                width: 35,
                height: 35,
                backgroundColor: "#3b82f6",
                fontSize: "0.875rem",
              }}
            >
              JB
            </Avatar>
          </IconButton>
        </Box>

        {/* Notification Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: { 
              width: 300, 
              mt: 1,
              zIndex: 1300, // Hoger dan header
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
              Meldingen ({notificationCount})
            </Typography>
          </Box>
          <MenuItem onClick={handleClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Nieuwe transcriptie gereed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gesprek "Budget Meeting" - 2 min geleden
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Privacy controle voltooid
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Geen gevoelige informatie gedetecteerd - 5 min geleden
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Export gereed voor N8N
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Agenda items zijn doorgestuurd - 10 min geleden
              </Typography>
            </Box>
          </MenuItem>
        </Menu>

        {/* User Menu */}
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: { 
              width: 250, 
              mt: 1,
              zIndex: 1300, // Hoger dan header
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Jan van der Berg
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gesprekscoördinator
            </Typography>
          </Box>
          <MenuItem onClick={handleClose}>Profiel</MenuItem>
          <MenuItem onClick={handleClose}>Instellingen</MenuItem>
          <MenuItem onClick={handleClose}>Privacy Instellingen</MenuItem>
          <MenuItem onClick={handleClose} sx={{ color: "#dc2626" }}>
            Uitloggen
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default MaterialProHeader;