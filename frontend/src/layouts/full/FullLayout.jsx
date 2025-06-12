import React, { useState } from "react";
import { styled, Container, Box, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import ConversationHubHeader from "./header/ConversationHubHeader.jsx";
import ConversationHubSidebar from "./sidebar/ConversationHubSidebar.jsx";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

const FullLayout = () => {
  const theme = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <MainWrapper className="mainwrapper">
      {/* ConversationHub Sidebar */}
      <ConversationHubSidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <PageWrapper className="page-wrapper">
        {/* ConversationHub Header */}
        <ConversationHubHeader 
          toggleMobileSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        />
        
        {/* Page Content */}
        <Container
          sx={{
            paddingTop: "20px",
            maxWidth: "1200px",
          }}
          maxWidth={false}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
            <Outlet />
          </Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
};

export default FullLayout;