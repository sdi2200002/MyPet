import { useMemo } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PANEL_BG = "#cfe3ff";

/* ίδια κάρτα quick action */
function QuickAction({ icon, title, text, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: 260,
        height: 410,
        borderRadius: 2,
        bgcolor: "#fff",
        border: "2px solid #3b3b3b",
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: PANEL_BG,
          borderBottom: "2px solid #3b3b3b",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ p: 1.4 }}>
        <Typography sx={{ mt: 2, fontWeight: 900, color: PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "#4b5b6b", textAlign: "center" }}>
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}

/**
 * ✅ Shared page
 * role: "owner" | "vet"
 */
export default function DeclarationsNew({ role = "owner" }) {
  const navigate = useNavigate();

  const base = role === "vet" ? "/vet" : "/owner";
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  // προαιρετικό memo
  useMemo(() => null, []);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        {/* spacer ώστε το content να μη μπαίνει κάτω απ’ το sidebar */}
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />

        {role === "vet" ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            <Box>
              <AppBreadcrumbs />
            </Box>

            <Box
              sx={{
                minHeight: "calc(100vh - 220px)", // λίγο “air” ώστε να φαίνεται center
                display: "grid",
                placeItems: "center",
                py: { xs: 4, md: 6 },
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 900 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: TITLE,
                    mb: 5,
                    fontSize: 22,
                    textAlign: "center",
                  }}
                >
                  Επιλέξτε Νέα Δήλωση
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={6}
                  justifyContent="center"
                  alignItems="center"
                >
                  <QuickAction
                    icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Απώλειας"
                    text="Καταχωρίστε την απώλεια του κατοικιδίου σας για άμεση ενημέρωση."
                    onClick={() => navigate(`${base}/declarations/lost/new`)}
                  />

                  <QuickAction
                    icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Εύρεσης"
                    text="Καταχωρίστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                    onClick={() => navigate(`${base}/declarations/found/new`)}
                  />
                </Stack>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
