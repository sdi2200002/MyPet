import { useState } from "react";
import {  AppBar, Toolbar, Button, Box, Container, Typography, Menu, MenuItem, ListItemText, IconButton, } from "@mui/material";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AppBreadcrumbs from "./Breadcrumbs";
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


export default function PublicNavbar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const { user, logout } = useAuth();
  const isLoggedIn = Boolean(user);

  const handleLogout = () => {
    handleClose();
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
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0d2c54" }}>MyPet</Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <NavButton to="/" end>Αρχική</NavButton>
          <NavButton to="/owner">Ιδιοκτήτης</NavButton>
          <NavButton to="/vet">Κτηνίατρος</NavButton>
          <NavButton to="/lost">Εύρεση / Απώλεια Κατοικιδίου</NavButton>
          <NavButton to="/contact">Επικοινωνία</NavButton>

          {/* ✅ Σύνδεση dropdown */}
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
            <IconButton
              onClick={() => navigate("/owner/profile")}
              sx={{ color: "#0b3d91" }}
            >
              <AccountCircleIcon sx={{ fontSize: 40 }} />
            </IconButton>

          )}
        </Toolbar>
      </Container>
    </AppBar>
    
  );
}
