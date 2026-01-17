import { useMemo } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  title: "#0d2c54",
  primary: "#0b3d91",
  primaryHover: "#08316f",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
};

function QuickAction({ icon, title, onClick, size = "md" }) {
  const isSm = size === "sm";

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        borderRadius: 3,
        px: isSm ? 3.2 : 3.6,
        py: isSm ? 2.4 : 2.8,
        minWidth: isSm ? 210 : 230,
        bgcolor: COLORS.primary,
        color: "#fff",
        boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
        transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
        display: "grid",
        placeItems: "center",
        gap: 1.2,
        "&:hover": {
          transform: "translateY(-2px)",
          bgcolor: COLORS.primaryHover,
          boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
        },
        "&:active": { transform: "translateY(0px)" },
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center" }}>{icon}</Box>

      <Typography
        sx={{
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.15,
          fontSize: isSm ? 15 : 16,
          whiteSpace: "pre-line",
        }}
      >
        {title}
      </Typography>
    </Paper>
  );
}

function HeroIcon() {
  return (
    <Box
      sx={{
        width: 120,
        height: 120,
        borderRadius: 4,
        bgcolor: "rgba(11,61,145,0.06)",
        border: `2px solid rgba(11,61,145,0.18)`,
        display: "grid",
        placeItems: "center",
        mx: "auto",
        mb: 3,
      }}
    >
      <EditNoteOutlinedIcon sx={{ fontSize: 70, color: COLORS.primary }} />
    </Box>
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

  useMemo(() => null, []);

  const ownerActions = [
    {
      title: "Δήλωση\nΑπώλειας",
      icon: <CampaignIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/lost/new`,
    },
    {
      title: "Δήλωση\nΕύρεσης",
      icon: <SearchIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/found/new`,
    },
  ];

  const vetActions = [
    {
      title: "Νέα\nΚαταγραφή",
      icon: <NoteAddOutlinedIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/newPet/new`, // 🔧 άλλαξέ το αν έχεις άλλο route
    },
    {
      title: "Δήλωση\nΑπώλειας",
      icon: <CampaignIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/lost/new`,
    },
    {
      title: "Δήλωση\nΕύρεσης",
      icon: <SearchIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/found/new`,
    },
    {
      title: "Υιοθεσία\nΚατοικιδίου",
      icon: <VolunteerActivismOutlinedIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/adoption/new`, // ✅ αυτό που φτιάξαμε πριν
    },
    {
      title: "Αναδοχή\nΚατοικιδίου",
      icon: <HomeWorkOutlinedIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/foster/new`, // 🔧 αν δεν υπάρχει, άλλαξέ το
    },
    {
      title: "Μεταβίβαση\nΚατοικιδίου",
      icon: <SwapHorizOutlinedIcon sx={{ fontSize: 44, color: "#fff" }} />,
      to: `${base}/declarations/transfer/new`, // 🔧 αν δεν υπάρχει, άλλαξέ το
    },
  ];

  const actions = role === "vet" ? vetActions : ownerActions;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
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
                minHeight: "calc(100vh - 220px)",
                display: "grid",
                placeItems: "center",
                py: { xs: 4, md: 6 },
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 980 }}>
                <HeroIcon />

                <Typography
                  sx={{
                    fontWeight: 900,
                    color: COLORS.title,
                    mb: 4,
                    fontSize: 22,
                    textAlign: "center",
                  }}
                >
                  Επιλέξτε Νέα Δήλωση
                </Typography>

                {/* OWNER: 2 buttons centered */}
                {role !== "vet" && (
                  <Stack direction="row" spacing={4} justifyContent="center" alignItems="center" sx={{ flexWrap: "wrap" }}>
                    {actions.map((a) => (
                      <QuickAction key={a.title} icon={a.icon} title={a.title} onClick={() => navigate(a.to)} size="md" />
                    ))}
                  </Stack>
                )}

                {/* VET: 2x3 grid */}
                {role === "vet" && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                      gap: 3,
                      justifyItems: "center",
                    }}
                  >
                    {actions.map((a) => (
                      <QuickAction key={a.title} icon={a.icon} title={a.title} onClick={() => navigate(a.to)} size="sm" />
                    ))}
                  </Box>
                )}

                {/* μικρή υποσημείωση */}
                <Typography sx={{ mt: 4, textAlign: "center", fontSize: 12, color: "#6b7a90", fontWeight: 700 }}>
                  {role === "vet"
                    ? "Επιλέξτε τον τύπο δήλωσης που θέλετε να δημιουργήσετε."
                    : "Επιλέξτε τον τύπο δήλωσης που θέλετε να υποβάλετε."}
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
