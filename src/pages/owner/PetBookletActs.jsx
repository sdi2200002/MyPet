import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { Link, useParams } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";


const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const PANEL_BG = "#dfeeff";

function Tab({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          bgcolor: active ? PRIMARY : "#cfd7e8",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 16,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function Cell({ children }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: PANEL_BG,
          borderRadius: 999,
          px: 2,
          py: 0.9,
          border: "1px solid rgba(0,0,0,0.10)",
          height: 18,                 // ✅ σταθερό ύψος pill
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: MUTED,
            fontWeight: 800,
            fontSize: 12,
            whiteSpace: "nowrap",      // ✅ να μην “σπάει” περίεργα
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Typography>
      </Paper>
    </Box>
  );
}

export default function PetBookletActs() {
  const { id } = useParams();

  // demo data (αργότερα το αλλάζεις σε localStorage)
  const actsData = useMemo(
    () => [
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },{
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        description: "Αιματολογικός έλεγχος",
        date: "12/11/2025",
        vet: "Δρ. Παπαδόπουλος",
      },
      
      // βάλε κι άλλα όταν φορτώνεις αληθινά
    ],
    []
  );

  const rowsPerPage = 6;
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(actsData.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return actsData.slice(start, start + rowsPerPage);
  }, [actsData, safePage]);

  // γεμίζουμε με κενές για να φαίνεται όπως στο mock
  const paddedRows = useMemo(() => {
    const missing = Math.max(0, rowsPerPage - pageRows.length);
    return [
      ...pageRows,
      ...Array.from({ length: missing }).map(() => ({
        description: "",
        date: "",
        vet: "",
        _empty: true,
      })),
    ];
  }, [pageRows]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      {/* ✅ 2-column layout: sidebar + content */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: spacer column */}
        <Box
          sx={{
            width: OWNER_SIDEBAR_W,
            flex: `0 0 ${OWNER_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />

        {/* Sidebar κάτω από PublicNavbar */}
        <OwnerNavbar mode="navbar" />

        {/* RIGHT: content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            <Box>
              <AppBreadcrumbs />
            </Box>

            <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
              <Tab label="Στοιχεία Κατοικιδίου" to={`/owner/pets/${id}/booklet`} />
              <Tab label="Εμβολιασμοί" to={`/owner/pets/${id}/booklet/vaccinations`} />
              <Tab active label="Ιατρικές Πράξεις" to={`/owner/pets/${id}/booklet/acts`} />
            </Stack>

            <Paper
              elevation={0}
              sx={{
                position: "relative",
                zIndex: 1,
                borderRadius: 2,
                border: `2px solid ${BORDER}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                p: 3,
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 1.2, mb: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                  Περιγραφή
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                  Ημερομηνία
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                  Εγκεκριμένος κτηνίατρος
                </Typography>
              </Box>

              {paddedRows.map((row, i) => (
                <Box
                  key={`${safePage}-${i}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: 1.2,
                    mb: 1.1,
                    alignItems: "center",
                  }}
                >
                  <Cell>{row.description || "\u00A0"}</Cell>
                  <Cell>{row.date || "\u00A0"}</Cell>
                  <Cell>{row.vet || "\u00A0"}</Cell>
                </Box>
              ))}

              <Pager
                page={safePage}
                pageCount={pageCount}
                onChange={(p) => setPage(Math.min(Math.max(1, p), pageCount))}
              />
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: PRIMARY_HOVER },
                  fontWeight: 900,
                  px: 3,
                }}
                onClick={() => window.print()}
              >
                Εκτύπωση
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );

}
