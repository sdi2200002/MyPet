import { useEffect, useState } from "react";
import { Box, Paper, Stack, Typography, Button } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const PRIMARY = "#0b3d91";
const TITLE = "#0d2c54";

export const OWNER_SIDEBAR_W = 280;

const NAVBAR_H = 72;  // ύψος PublicNavbar
const HERO_H = 240;   // ύψος hero (μόνο για dashboard)
const GAP = 12;

function Item({ icon, label, to, active, onClick }) {
  return (
    <Button
      onClick={() => onClick(to)}
      startIcon={icon}
      fullWidth
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: 900,
        borderRadius: 2,
        px: 1.2,
        py: 1,
        color: active ? "#fff" : TITLE,
        bgcolor: active ? PRIMARY : "transparent",
        "&:hover": {
          bgcolor: active ? PRIMARY : "rgba(11,61,145,0.08)",
        },
      }}
    >
      {label}
    </Button>
  );
}

export default function OwnerNavbar({ mode = "navbar" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout?.();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const go = (to) => navigate(to);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // ✅ mode="navbar": πάντα κάτω από PublicNavbar
  // ✅ mode="hero": ξεκινά κάτω από hero και με scroll ανεβαίνει
  const initialTop =
    mode === "hero" ? NAVBAR_H + HERO_H + GAP : NAVBAR_H;

  const [top, setTop] = useState(initialTop);

  useEffect(() => {
    // αν δεν είμαστε σε hero mode, δεν χρειάζεται scroll listener
    if (mode !== "hero") {
      setTop(NAVBAR_H);
      return;
    }

    const onScroll = () => {
      const y = window.scrollY || 0;
      const heroRemaining = Math.max(0, HERO_H - y);
      const nextTop = NAVBAR_H + heroRemaining + GAP;
      setTop(nextTop);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  return (
    <Box
      sx={{
        width: OWNER_SIDEBAR_W,
        position: "fixed",
        left: 0,
        top,
        height: `calc(100vh - ${top}px)`,
        display: { xs: "none", lg: "block" },
        zIndex: 1,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: "100%",
          borderRadius: 0,
          borderRight: "1px solid rgba(11,61,145,0.18)",
          bgcolor: "#fff",
          px: 1.6,
          py: 1.8,
          overflowY: "auto",
        }}
      >
        <Stack spacing={0.8}>
          <Item
            icon={<HomeRoundedIcon />}
            label="Επισκόπηση"
            to="/owner"
            active={location.pathname === "/owner"}
            onClick={go}
          />

          <Item
            icon={<PetsRoundedIcon />}
            label="Τα κατοικίδιά μου"
            to="/owner/pets"
            active={isActive("/owner/pets")}
            onClick={go}
          />

          <Item
            icon={<SearchRoundedIcon />}
            label="Αναζήτηση κτηνιάτρων"
            to="/owner/vets"
            active={isActive("/owner/vets")}
            onClick={go}
          />

          <Box sx={{ my: 0.8, height: 1, bgcolor: "rgba(0,0,0,0.08)" }} />

          <Item
            icon={<EventAvailableRoundedIcon />}
            label="Τα ραντεβού μου"
            to="/owner/appointments"
            active={isActive("/owner/appointments")}
            onClick={go}
          />

          <Item
            icon={<ReportProblemRoundedIcon />}
            label="Οι δηλώσεις μου"
            to="/owner/declarations"
            active={isActive("/owner/declarations")}
            onClick={go}
          />

          <Box sx={{ my: 0.8, height: 1, bgcolor: "rgba(0,0,0,0.08)" }} />

          <Item
            icon={<SettingsRoundedIcon />}
            label="Το προφίλ μου"
            to="/owner/profile"
            active={isActive("/owner/profile")}
            onClick={go}
          />

          <Box sx={{ my: 0.8, height: 1, bgcolor: "rgba(0,0,0,0.08)" }} />
          <LogoutItem onClick={handleLogout} />
        </Stack>
      </Paper>
    </Box>
  );
}

function LogoutItem({ onClick }) {
  return (
    <Button
      onClick={onClick}
      startIcon={<LogoutRoundedIcon />}
      fullWidth
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: 900,
        borderRadius: 2,
        px: 1.2,
        py: 1,
        color: "#b42318",
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "rgba(180,35,24,0.10)",
        },
      }}
    >
      Αποσύνδεση
    </Button>
  );
}
