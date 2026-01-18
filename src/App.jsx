import { Box } from "@mui/material";
import Home from "./pages/public/Home";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <>
     <ScrollToTop />
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Σελίδα */}
      <Box sx={{ flex: 1 }}>
        <Home />
      </Box>
    </Box>
    </>
  );
}
