import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Container,
  Typography,
  IconButton,
} from "@mui/material";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const navButtonSx = {
  textTransform: "none",
  color: "#0b3d91",
  fontWeight: 600,
  borderRadius: 0,
  px: 1.2,
  position: "relative",
  "&.active::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -6,
    height: 3,
    bgcolor: "#0b3d91",
    borderRadius: 99,
  },
};

function NavButton({ to, end = false, children }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? "active" : "")}
      sx={navButtonSx}
    >
      {children}
    </Button>
  );
}

// ✅ Button που ΔΕΝ είναι link (για owner/vet flow)
function NavAction({ onClick, children, active = false }) {
  return (
    <Button onClick={onClick} className={active ? "active" : ""} sx={navButtonSx}>
      {children}
    </Button>
  );
}

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  // ✅ σωστός έλεγχος login (όχι Boolean(user) γιατί μπορεί να είναι {})
  const resolvedUser = user?.user ?? user;
  const isLoggedIn = !!resolvedUser?.id;

  const role = (resolvedUser?.role ?? "").toString().toLowerCase();

  // ✅ αν θες να δείχνει underline στο "Ιδιοκτήτης/Κτηνίατρος" όταν είσαι σε αυτά τα routes
  const ownerActive = location.pathname.startsWith("/owner");
  const vetActive = location.pathname === "/vet" || location.pathname.startsWith("/vet/");

  const goOwner = () => {
    // όχι logged in -> login ως owner
    if (!isLoggedIn) {
      navigate("/login?from=/owner&role=owner");
      return;
    }

    // logged in αλλά λάθος ρόλος -> ξανά login ως owner
    if (role !== "owner" && role !== "ιδιοκτήτης") {
      navigate("/login?from=/owner&role=owner");
      return;
    }

    navigate("/owner");
  };

  const goVet = () => {
    if (!isLoggedIn) {
      navigate("/login?from=/vet&role=vet");
      return;
    }

    if (role !== "vet" && role !== "κτηνίατρος") {
      navigate("/login?from=/vet&role=vet");
      return;
    }

    navigate("/vet");
  };


  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (role === "vet" || role === "κτηνίατρος") {
      navigate("/vet/profile");
      return;
    }

    navigate("/owner/profile");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#eef1f4", color: "#0d2c54" }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ gap: 3, minHeight: 64 }}>
          {/* Logo + MyPet */}
          <Box
            component={Link}
            to="/"
            sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}
          >
            <img src="/images/logo.png" alt="MyPet" height={44} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0d2c54" }}>
              MyPet
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <NavButton to="/" end>
            Αρχική
          </NavButton>

          {/* ✅ εδώ αλλάξαμε: owner/vet δεν είναι πλέον link */}
          <NavAction onClick={goOwner} active={ownerActive}>
            Ιδιοκτήτης
          </NavAction>

          <NavAction onClick={goVet} active={vetActive}>
            Κτηνίατρος
          </NavAction>

          <NavButton to="/lost">Εύρεση / Απώλεια Κατοικιδίου</NavButton>
          <NavButton to="/contact">Επικοινωνία</NavButton>

          {/* ✅ Σύνδεση / προφίλ */}
          {!isLoggedIn ? (
            <Button
              onClick={() => navigate("/login")}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
                boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              Σύνδεση
            </Button>
          ) : (
            <IconButton onClick={handleProfileClick} sx={{ color: "#0b3d91" }}>
              <AccountCircleIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}

        </Toolbar>
      </Container>
    </AppBar>
  );
}
