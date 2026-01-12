import { AppBar, Toolbar, Box, Button, Container, Typography } from "@mui/material";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

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

export default function OwnerNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation(); // ✅ εδώ

  const isOwnerHome = pathname === "/owner";
  const isPets = pathname.startsWith("/owner/pets");
  const isVets = pathname.startsWith("/owner/vets");
  const isDeclarations = pathname === "/owner/declarations";
  const isAppointments = pathname.startsWith("/owner/appointments"); // μόνο αν υπάρχει route

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "#eef1f4", color: "#0d2c54" }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ gap: 3, minHeight: 64 }}>
          {/* Logo */}
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
          <NavButton to="/owner" end>Ιδιοκτήτης</NavButton>
          <NavButton to="/owner/pets">Τα Κατοικίδια μου</NavButton>
          <NavButton to="/owner/vets">Αναζήτηση Κτηνιάτρων</NavButton>
          <NavButton to="/owner/declarations">Δηλώσεις</NavButton>

          {/* Βάλε αυτό μόνο αν έχεις route */}
          {/* 
          <Button onClick={() => navigate("/owner/appointments")} sx={linkSx(isAppointments)}>
            Ραντεβού
          </Button>
          */}

          {/* Profile icon */}
          <Box
            sx={{
              ml: 1,
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "#d9e3f2",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(0,0,0,0.12)",
              cursor: "pointer",
            }}
            title="Προφίλ"
            onClick={() => navigate("/owner")}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: "#0b3d91",
                opacity: 0.7,
              }}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
