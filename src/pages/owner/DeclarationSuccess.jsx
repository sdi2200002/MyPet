import { Box, Button, Container, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
};

export default function DeclarationSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const type = state?.type === "found" ? "Εύρεσης" : "Απώλειας";
  const status = state?.status || "Οριστική";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Box sx={{ display: "grid", placeItems: "center", mt: 10 }}>
            <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 22, textAlign: "center" }}>
              Η Δήλωση σας υποβλήθηκε επιτυχώς!
            </Typography>

            <Box
              sx={{
                mt: 5,
                width: 110,
                height: 110,
                borderRadius: "50%",
                bgcolor: COLORS.primary,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontSize: 58,
                fontWeight: 900,
              }}
            >
              ✓
            </Box>

            <Typography sx={{ mt: 2, color: "#000", opacity: 0.7 }}>
              Δήλωση {type} • Κατάσταση: <b>{status}</b>
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/owner/declarations")}
              sx={{
                mt: 5,
                textTransform: "none",
                borderRadius: 2,
                px: 4,
                bgcolor: COLORS.primary,
                "&:hover": { bgcolor: COLORS.primaryHover },
              }}
            >
              Οι Δηλώσεις Μου
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
