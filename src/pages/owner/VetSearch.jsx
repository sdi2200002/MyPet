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
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import { useLocation, useNavigate } from "react-router-dom";

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

// Δέχεται "13/01/2026" ή "2026-01-13" και επιστρέφει ISO "2026-01-13" (ή "")
function normalizeDateToISO(s) {
  if (!s) return "";
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

function hhmmFromISO(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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
          objectPosition: "top",
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
  const location = useLocation();

  // ✅ states (με date/time)
  const [area, setArea] = useState("");
  const [spec, setSpec] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 8;

  // ✅ 1) Διάβασε query params όταν αλλάζει το URL
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setArea(p.get("area") || "");
    setSpec(p.get("specialty") || "");
    setDate(p.get("date") || "");
    setTime(p.get("time") || "");
    setPage(1);
  }, [location.search]);

  // ✅ 2) Φόρτωσε ΟΛΑ από json-server (vets + appointments)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // άλλαξε αν το API σου είναι αλλού:
        const [vetsData, apptsData] = await Promise.all([
          fetchJSON("http://localhost:3001/vets"),
          fetchJSON("http://localhost:3001/appointments"),
        ]);

        if (!alive) return;
        setVets(Array.isArray(vetsData) ? vetsData : []);
        setAppointments(Array.isArray(apptsData) ? apptsData : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Αποτυχία φόρτωσης κτηνιάτρων από τον server.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ helper: appointments grouped by vetId
  const apptsByVetId = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const id = String(a?.vetId ?? "");
      if (!id) continue;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(a);
    }
    return map;
  }, [appointments]);

  // ✅ 3) Client-side filtering (σωστό)
  const filtered = useMemo(() => {
    const areaQ = area.trim();
    const specQ = spec.trim();
    const dateISO = normalizeDateToISO(date);
    const timeQ = time.trim();

    return vets
      .filter((v) => {
        if (areaQ && String(v.area || "").toLowerCase() !== areaQ.toLowerCase()) return false;
        if (specQ && String(v.specialty || "").toLowerCase() !== specQ.toLowerCase()) return false;

        // date/time match με appointments (αν έχεις βάλει date ή time)
        if (dateISO || timeQ) {
          const list = apptsByVetId.get(String(v.id)) || [];
          const ok = list.some((a) => {
            if (!a?.when) return false;
            const aDateISO = String(a.when).slice(0, 10); // YYYY-MM-DD
            const aTime = hhmmFromISO(a.when);            // HH:MM
            if (dateISO && aDateISO !== dateISO) return false;
            if (timeQ && aTime !== timeQ) return false;
            return true;
          });
          if (!ok) return false;
        }

        return true;
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [vets, area, spec, date, time, apptsByVetId]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ✅ 4) Το “Αναζήτηση” γράφει query params και σε φέρνει στο σωστό URL
  function applySearch() {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (spec) params.set("specialty", spec);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    navigate(`/owner/vets?${params.toString()}`);
  }

  function clearFilters() {
    setArea("");
    setSpec("");
    setDate("");
    setTime("");
    setPage(1);
    navigate("/owner/vets");
  }

  const pillSx = {
    minWidth: 160,
    bgcolor: "#fff",
    borderRadius: 999,
    "& .MuiOutlinedInput-root": { borderRadius: 999 },
    "& .MuiSelect-select": { fontWeight: 700, color: TITLE },
  };
  const placeholder = (t) => <span style={{ color: MUTED, fontWeight: 700 }}>{t}</span>;

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

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="center">
            {/* Περιοχή */}
            <FormControl size="small" sx={pillSx}>
              <Select
                value={area}
                displayEmpty
                onChange={(e) => setArea(e.target.value)}
                startAdornment={<LocationOnOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                renderValue={(v) => (v ? v : placeholder("Περιοχή"))}
              >
                <MenuItem value="">Περιοχή</MenuItem>
                <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
                <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
              </Select>
            </FormControl>

            {/* Ημερομηνία */}
            <TextField
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Ημερομηνία (πχ 13/01/2026)"
              sx={{
                minWidth: 230,
                bgcolor: "#fff",
                borderRadius: 999,
                "& .MuiOutlinedInput-root": { borderRadius: 999 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthOutlinedIcon sx={{ color: MUTED }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Ώρα */}
            <FormControl size="small" sx={{ ...pillSx, minWidth: 150 }}>
              <Select
                value={time}
                displayEmpty
                onChange={(e) => setTime(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <AccessTimeOutlinedIcon sx={{ color: MUTED, mr: 1 }} />
                  </InputAdornment>
                }
                renderValue={(v) => (v ? v : placeholder("Ώρα"))}
              >
                <MenuItem value="">Ώρα</MenuItem>
                <MenuItem value="10:00">10:00</MenuItem>
                <MenuItem value="12:00">12:00</MenuItem>
                <MenuItem value="17:30">17:30</MenuItem>
              </Select>
            </FormControl>

            {/* Ειδικότητα */}
            <FormControl size="small" sx={pillSx}>
              <Select
                value={spec}
                displayEmpty
                onChange={(e) => setSpec(e.target.value)}
                startAdornment={<LocalHospitalOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                renderValue={(v) => (v ? v : placeholder("Ειδικότητα"))}
              >
                <MenuItem value="">Ειδικότητα</MenuItem>
                <MenuItem value="Γενικός">Γενικός</MenuItem>
                <MenuItem value="Χειρουργός">Χειρουργός</MenuItem>
                <MenuItem value="Δερματολόγος">Δερματολόγος</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={applySearch}
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

            <Button
              variant="text"
              onClick={clearFilters}
              sx={{ textTransform: "none", fontWeight: 900, color: PRIMARY }}
            >
              Καθαρισμός
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
            <Typography sx={{ color: MUTED, fontWeight: 700 }}>Φόρτωση...</Typography>
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
            <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
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
                  <VetCard key={v.id} vet={v} onView={() => navigate(`/owner/vets/${v.id}`)} />
                ))
              )}
            </Stack>

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