import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  TextField,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import OwnerNavbar from "../../components/OwnerNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";


const PETS_KEY = "mypet_vet_pets";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";


function QuickAction({ icon, title, text, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%",
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


/** ✅ Placeholder μέχρι να φορτώσουμε δεδομένα */
function LatestUpdates() {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.2 }}>
        Τελευταίες Ενημερώσεις
      </Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#eef5ff",
          borderRadius: 3,
          p: 2.2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Typography sx={{ color: "#4b5b6b", fontWeight: 700, fontSize: 13 }}>
          Δεν έχετε καινούριες ενημερώσεις.
        </Typography>
      </Paper>
    </Box>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <PublicNavbar />

      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#eaf2fb",
          height: { xs: 230, md: 240 },
          position: "relative",
          overflow: "visible",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container maxWidth="lg" sx={{ height: "100%", position: "relative" }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Box sx={{ pt: { xs: 7, md: 3 } }}>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  fontWeight: 900,
                  color: "#1c2b39",
                  lineHeight: 1.1,
                }}
              >
                Ό,τι χρειάζεστε για τα κατοικίδια 
                <br />
                που παρακολουθείτε.
              </Typography>

              <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                Καταγραφή ζώων, ιατρικές πράξεις και ραντεβού με ένα κλικ.
              </Typography>
            </Box>
          </Box>
        </Container>

        <Box
          component="img"
          src="/images/vet1.png"
          alt="Vet"
          sx={{
            position: "absolute",
            right: 200,
            bottom: 0,
            width: { xs: 200, md: 180 },
            height: "auto",
            display: { xs: "none", md: "block" },
          }}
        />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>

          {/* TOP SECTION */}
          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: { xs: "1fr"},
              gap: 3,
              alignItems: "center",
            }}
          >
            
            {/* Center: quick actions */}
            <Box sx={{ pt: 0.2 }}>
              <Typography sx={{ fontWeight: 900, color: TITLE, mb: 6.5, fontSize: 20, textAlign: "center" }}>
                Γρήγορες Ενέργειες
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                <QuickAction
                  icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Απώλειας"
                  text="Καταχωρήστε την απώλεια του κατοικιδίου που παρακολουθείτε για άμεση ενημέρωση."
                  onClick={() => navigate("/vet/lost/new")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Εύρεσης"
                  text="Καταχωρήστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                  onClick={() => navigate("/vet/found/new")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Νέα Καταγραφή Κατοικιδίου"
                  text="Καταγράψτε τα στοιχεία νέου κατοικιδίου που παρακολουθείτε"
                  onClick={() => navigate("/vet")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Ιατρικές Πράξεις"
                  text="Καταχωρήστε τα στοιχεία των ιατρικών πράξεων που πραγματοποιούνται στο κατοικίδιο που επιθυμείτε."
                  onClick={() => navigate("/vet")}
                />
              </Stack>
            </Box>
          </Box>

          {/* SCROLL PART */}
          <Box sx={{ mt: 4 }}>
            <LatestUpdates />
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );

}
