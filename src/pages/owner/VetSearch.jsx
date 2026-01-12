import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";

/* ====== THEME ====== */
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

/* ====== HELPERS ====== */
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function VetCard({ vet, onView }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        p: 1.6,
        display: "grid",
        gridTemplateColumns: "86px 1fr 120px",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box
        component="img"
        src={vet.photo || "/images/demo-vet-avatar.png"}
        alt={vet.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/demo-vet-avatar.png";
        }}
        sx={{
          width: 74,
          height: 74,
          borderRadius: 2,
          objectFit: "cover",
          border: "1px solid rgba(0,0,0,0.15)",
          bgcolor: "#fff",
        }}
      />

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, color: "#111" }} noWrap>
          {vet.name || "—"}
        </Typography>
        <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }} noWrap>
          {vet.clinic || "—"}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 0.6, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
            ⭐ {vet.rating ?? "—"}
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
            ({vet.reviewsCount ?? 0})
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
            • {vet.area || "—"}
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
            • {vet.specialty || "—"}
          </Typography>
        </Stack>

        <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mt: 0.4 }}>
          Ιδιωτικό Ιατρείο: {vet.priceRange || "—"}
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={onView}
        startIcon={<VisibilityOutlinedIcon />}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
        }}
      >
        Προβολή
      </Button>
    </Paper>
  );
}

export default function VetSearch() {
  const navigate = useNavigate();

  const [area, setArea] = useState("");
  const [spec, setSpec] = useState("");

  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 8;

  // ✅ Load vets from server (JSON "database")
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      // Προαιρετικά: αν ο server υποστηρίζει filtering,
      // στείλ' τα ως query params (αλλιώς δεν πειράζει).
      const params = new URLSearchParams();
      if (area) params.set("area", area);
      if (spec) params.set("specialty", spec);

      const url = params.toString() ? `/api/vets?${params}` : `/api/vets`;

      const data = await fetchJSON(url);

      if (!alive) return;
      setVets(Array.isArray(data) ? data : []);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης κτηνιάτρων από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [area, spec]);

  // ✅ Αν ο server ΔΕΝ φιλτράρει, κάνε client-side filter (δεν χαλάει τίποτα)
  const filtered = useMemo(() => {
    return vets.filter((v) => {
      if (area && v.area !== area) return false;
      if (spec && v.specialty !== spec) return false;
      return true;
    });
  }, [vets, area, spec]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // keep page valid
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pillSx = {
    minWidth: 160,
    bgcolor: "#fff",
    borderRadius: 999,
    "& .MuiOutlinedInput-root": { borderRadius: 999 },
    "& .MuiSelect-select": { fontWeight: 700, color: TITLE },
  };
  const placeholder = (t) => (
    <span style={{ color: MUTED, fontWeight: 700 }}>{t}</span>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      <Container maxWidth="lg" sx={{ py: 2.5, flex: 1 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Paper
          elevation={0}
          sx={{
            bgcolor: PANEL_BG,
            borderRadius: 4,
            p: 2.5,
            border: `2px solid ${PANEL_BORDER}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.6 }}>
            Αναζήτηση Κτηνιάτρων
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <FormControl size="small" sx={pillSx}>
              <Select
                value={area}
                displayEmpty
                onChange={(e) => {
                  setArea(e.target.value);
                  setPage(1);
                }}
                startAdornment={
                  <LocationOnOutlinedIcon sx={{ mr: 1, color: MUTED }} />
                }
                renderValue={(v) => (v ? v : placeholder("Περιοχή"))}
              >
                <MenuItem value="">Περιοχή</MenuItem>
                <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
                <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={pillSx}>
              <Select
                value={spec}
                displayEmpty
                onChange={(e) => {
                  setSpec(e.target.value);
                  setPage(1);
                }}
                startAdornment={
                  <LocalHospitalOutlinedIcon sx={{ mr: 1, color: MUTED }} />
                }
                renderValue={(v) => (v ? v : placeholder("Ειδικότητα"))}
              >
                <MenuItem value="">Ειδικότητα</MenuItem>
                <MenuItem value="Γενικός">Γενικός</MenuItem>
                <MenuItem value="Χειρουργός">Χειρουργός</MenuItem>
                <MenuItem value="Δερματολόγος">Δερματολόγος</MenuItem>
              </Select>
            </FormControl>

            {/* Το κουμπί "Αναζήτηση" είναι πλέον καθαρά UI (τα φίλτρα κάνουν fetch μόνα τους) */}
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => {
                // αν θες να κάνει “manual” refresh:
                // απλά ξανα-τρέχει το useEffect αλλάζοντας ένα nonce.
                // Εδώ το αφήνω no-op επίτηδες.
              }}
              sx={{
                ml: { md: "auto" },
                borderRadius: 999,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
              }}
            >
              Αναζήτηση
            </Button>
          </Stack>
        </Paper>

        {/* states */}
        {loading && (
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              borderRadius: 2,
              p: 2,
              bgcolor: "#f6f8fb",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <Typography sx={{ color: MUTED, fontWeight: 700 }}>
              Φόρτωση...
            </Typography>
          </Paper>
        )}

        {!loading && err && (
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              borderRadius: 2,
              p: 2,
              bgcolor: "#fff3f3",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <Typography sx={{ color: "#b00020", fontWeight: 800 }}>
              {err}
            </Typography>
          </Paper>
        )}

        {!loading && !err && (
          <>
            <Stack spacing={1.8} sx={{ mt: 2.5 }}>
              {view.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.12)",
                    p: 2,
                    bgcolor: "#f6f8fb",
                  }}
                >
                  <Typography sx={{ color: MUTED, fontWeight: 700 }}>
                    Δεν βρέθηκαν κτηνίατροι.
                  </Typography>
                </Paper>
              ) : (
                view.map((v) => (
                  <VetCard
                    key={v.id}
                    vet={v}
                    onView={() => navigate(`/owner/vets/${v.id}`)}
                  />
                ))
              )}
            </Stack>

            {/* Pager κάτω από τα cards */}
            <Box sx={{ display: "flex", justifyContent: "right", mt: 1.5 }}>
              <Pager
                page={page}
                pageCount={totalPages}
                onChange={setPage}
                color={PRIMARY}
                maxButtons={4}
              />
            </Box>
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
