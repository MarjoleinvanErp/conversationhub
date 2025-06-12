import React, { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { styled, Container, Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import MaterialProHeader from "./header/MaterialProHeader.jsx";
import MaterialProSidebar from "./sidebar/MaterialProSidebar.jsx";

// ConversationHub Material-UI Theme
const conversationHubTheme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6", // Blue-500
      light: "#60a5fa", // Blue-400
      dark: "#1d4ed8", // Blue-700
    },
    secondary: {
      main: "#10b981", // Emerald-500
      light: "#34d399", // Emerald-400
      dark: "#059669", // Emerald-600
    },
    background: {
      default: "#f8fafc", // Slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b", // Slate-800
      secondary: "#64748b", // Slate-500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
});

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const ContentWrapper = styled("div")(({ theme, sidebarOpen, sidebarWidth }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  minHeight: "100vh",
  marginLeft: sidebarOpen ? `${sidebarWidth}px` : 0,
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down("lg")]: {
    marginLeft: 0,
  },
}));

const MaterialProLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarWidth = 270;

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleMobileSidebarToggle = () => {
    setMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <ThemeProvider theme={conversationHubTheme}>
      <CssBaseline />
      <MainWrapper>
        {/* ConversationHub Sidebar */}
        <MaterialProSidebar
          isSidebarOpen={isSidebarOpen}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSidebarClose={() => setMobileSidebarOpen(false)}
          sidebarWidth={sidebarWidth}
        />
        
        {/* Main Content Area */}
        <ContentWrapper
          sidebarOpen={isSidebarOpen}
          sidebarWidth={sidebarWidth}
        >
          {/* ConversationHub Header */}
          <MaterialProHeader 
            toggleMobileSidebar={handleMobileSidebarToggle}
            toggleSidebar={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />
          
          {/* Page Content */}
          <Container
            sx={{
              paddingTop: "20px",
              paddingBottom: "20px",
              maxWidth: "1200px",
              flexGrow: 1,
            }}
            maxWidth={false}
          >
            <Box sx={{ minHeight: "calc(100vh - 140px)" }}>
              <Outlet />
            </Box>
          </Container>
        </ContentWrapper>
      </MainWrapper>
    </ThemeProvider>
  );
};

export default MaterialProLayout;