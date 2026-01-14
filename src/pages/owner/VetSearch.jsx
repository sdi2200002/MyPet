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
  IconButton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import InputAdornment from "@mui/material/InputAdornment";
import { useLocation, useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

/* ====== THEME ====== */
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

/* ====== API ====== */
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

/* ====== DATE HELPERS ====== */
// Δέχεται "13/01/2026" ή "2026-01-13" και επιστρέφει ISO "2026-01-13" (ή "")
function normalizeDateToISO(s) {
  if (!s) return "";
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}
function dateToISO(d) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function todayISO() {
  return dateToISO(new Date());
}
function isPastISODate(dateISO) {
  if (!dateISO) return false;
  return dateISO < todayISO();
}
function dateISOFromWhen(when) {
  if (!when) return "";
  return String(when).slice(0, 10);
}
function timeHHMMFromWhen(when) {
  if (!when) return "";
  const s = String(when);
  const t = s.indexOf("T");
  if (t !== -1 && s.length >= t + 6) {
    const hhmm = s.slice(t + 1, t + 6);
    if (/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  }
  return "";
}
function blocksSlot(status) {
  // Με βάση τα data σου: "Ακυρωμένο" δεν μπλοκάρει slot
  const st = String(status || "").trim().toLowerCase();
  return st !== "ακυρωμένο";
}

/* ====== SLOTS ====== */
// Σταθερά slots (γιατί στο vets schema δεν έχεις ωράριο)
// ταιριάζει με το UI σου (30' βήμα)
const POSSIBLE_SLOTS = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
];

function getAvailableSlotsForVetOnDate(vet, dateISO, appointments) {
  if (!dateISO) return POSSIBLE_SLOTS;

  const booked = new Set(
    appointments
      .filter((a) => String(a?.vetId) === String(vet?.id))
      .filter((a) => dateISOFromWhen(a?.when) === dateISO)
      .filter((a) => blocksSlot(a?.status))
      .map((a) => timeHHMMFromWhen(a?.when))
      .filter(Boolean)
  );

  return POSSIBLE_SLOTS.filter((t) => !booked.has(t));
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
          <Typography sx={{ fontWeight: 900, fontSize: 12 }}>⭐ {vet.rating ?? "—"}</Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
            ({vet.reviewsCount ?? 0})
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>• {vet.area || "—"}</Typography>
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

/** ✅ δέχεται "YYYY-MM-DD" ή "DD/MM/YYYY" ή "DD-MM-YYYY" και το κάνει "YYYY-MM-DD" */
function normalizeGreekDateToISO(s) {
  if (!s) return "";
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

function dateToISOFromDayjs(dj) {
  if (!dj) return "";
  const d = dj.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function VetSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  // filters (χωρίς ώρα)
  const [area, setArea] = useState("");
  const [spec, setSpec] = useState("");
  const [date, setDate] = useState(""); // ISO "YYYY-MM-DD"
  const [dateObj, setDateObj] = useState(null); // Date | null

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 8;

  // ✅ Read query params when URL changes
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setArea(p.get("area") || "");
    setSpec(p.get("specialty") || "");

    const d = p.get("date") || "";
    setDate(d);
    setDateObj(d ? dayjs(d) : null);

    setPage(1);
  }, [location.search]);

  // ✅ Load data
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [vetsData, apptsData] = await Promise.all([
          fetchJSON("/api/vets"),
          fetchJSON("/api/appointments"),
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

  // ✅ filtering based on real availability
  const filtered = useMemo(() => {
    const areaQ = area.trim();
    const specQ = spec.trim();
    const dateISO = normalizeDateToISO(date);

    // Αν διάλεξε παρελθοντική ημερομηνία → κανένας
    if (dateISO && isPastISODate(dateISO)) return [];

    return vets
      .filter((v) => {
        if (areaQ && String(v.area || "").toLowerCase() !== areaQ.toLowerCase()) return false;
        if (specQ && String(v.specialty || "").toLowerCase() !== specQ.toLowerCase()) return false;

        // ✅ Αν υπάρχει date filter: κρατάμε μόνο όσους έχουν τουλάχιστον 1 διαθέσιμο slot
        if (dateISO) {
          const available = getAvailableSlotsForVetOnDate(v, dateISO, appointments);
          return available.length > 0;
        }

        return true;
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [vets, appointments, area, spec, date]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasFilters = useMemo(() => !!area.trim() || !!spec.trim() || !!date.trim(), [area, spec, date]);

  function applySearch() {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (spec) params.set("specialty", spec);
    if (date) params.set("date", normalizeDateToISO(date));
    navigate(`/owner/vets?${params.toString()}`);
  }

  function clearFilters() {
    setArea("");
    setSpec("");
    setDate("");
    setDateObj(null);
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

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: OWNER_SIDEBAR_W,
            flex: `0 0 ${OWNER_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />

        <OwnerNavbar mode="navbar" />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
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

                {/* ✅ Ημερομηνία - dropdown calendar */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dateObj}
                    minDate={dayjs()}
                    maxDate={dayjs().add(1, "year")}
                    onChange={(newValue) => {
                      setDateObj(newValue);
                      setDate(dateToISOFromDayjs(newValue));
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        placeholder: "Ημερομηνία",
                        sx: {
                          bgcolor: "white",
                          borderRadius: 999,
                          minWidth: 230,
                          "& .MuiOutlinedInput-root": { borderRadius: 999 },
                          "& input::placeholder": { color: MUTED, opacity: 1 },
                        },
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthOutlinedIcon sx={{ color: MUTED }} />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>

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

                {hasFilters && (
                  <IconButton
                    onClick={clearFilters}
                    aria-label="Καθαρισμός φίλτρων"
                    sx={{
                      ml: 0.6,
                      width: 42,
                      height: 42,
                      bgcolor: "white",
                      border: "1px solid rgba(0,0,0,0.12)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 20, color: MUTED }} />
                  </IconButton>
                )}
              </Stack>
            </Paper>

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
                  <Pager page={page} pageCount={totalPages} onChange={setPage} color={PRIMARY} maxButtons={4} />
                </Box>
              </>
            )}
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
