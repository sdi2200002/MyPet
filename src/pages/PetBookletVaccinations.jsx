import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Pagination,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import OwnerNavbar from "../../components/OwnerNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";


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


export default function PetBookletVaccinations() {
  const { id } = useParams();

  // ✅ demo data (αργότερα θα το φορτώνεις από storage / backend)
  const vaccinations = useMemo(
    () => [
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },{
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        vaccine: "Nobivac DHPPi",
        batch: "83920394",
        dates: "12/10/25 → 12/10/26",
        vet: "Δρ. Παπαδόπουλος",
      },
      
      // βάλε κι άλλα για να δεις paging να δουλεύει
      // { vaccine: "...", batch: "...", dates: "...", vet: "..." },
    ],
    []
  );

  // ✅ “λετζίτ” σελιδοποίηση
  const rowsPerPage = 6; // όπως στο mock: 1 γεμάτη + 5 σειρές
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(vaccinations.length / rowsPerPage));

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return vaccinations.slice(start, start + rowsPerPage);
  }, [vaccinations, page]);

  // αν σβηστούν δεδομένα και μείνεις σε page που δεν υπάρχει
  if (page > totalPages) setPage(totalPages);

  // για να κρατάμε πάντα 6 σειρές (γεμάτες + κενές)
  const paddedRows = useMemo(() => {
    const missing = rowsPerPage - pageRows.length;
    if (missing <= 0) return pageRows;
    return [
      ...pageRows,
      ...Array.from({ length: missing }).map(() => ({
        vaccine: "\u00A0",
        batch: "\u00A0",
        dates: "\u00A0",
        vet: "\u00A0",
      })),
    ];
  }, [pageRows]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1, }}>
            <Tab label="Στοιχεία Κατοικιδίου" to={`/owner/pets/${id}/booklet`} />
            <Tab active label="Εμβολιασμοί" to={`/owner/pets/${id}/booklet/vaccinations`} />
            <Tab label="Ιατρικές Πράξεις" to={`/owner/pets/${id}/booklet/acts`} />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              position: "relative",
              zIndex: 2,
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 3,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1fr 1.2fr 1fr",
                gap: 1.2,
                mb: 1,
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                Κατασκευαστής &amp; ονομασία εμβολίου
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                Αριθμός παρτίδας
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                Ημερομηνία εμβολιασμού &amp; λήξη ισχύος
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                Εγκεκριμένος κτηνίατρος
              </Typography>
            </Box>

            {/* Rows */}
            {paddedRows.map((row, i) => (
              <Box
                key={`${page}-${i}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1.2fr 1fr",
                  gap: 1.2,
                  mb: 1,
                }}
              >
                <Cell>{row.vaccine}</Cell>
                <Cell>{row.batch}</Cell>
                <Cell>{row.dates}</Cell>
                <Cell>{row.vet}</Cell>
              </Box>
            ))}

            {/* ✅ Pagination (λειτουργικό) */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Pager
                page={page}
                pageCount={totalPages}
                onChange={setPage}
                color={PRIMARY}
                maxButtons={4}
              />
            </Box>

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

      <Footer />
    </Box>
  );
}
