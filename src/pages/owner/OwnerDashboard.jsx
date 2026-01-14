import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InputAdornment from "@mui/material/InputAdornment";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";


import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";;







// Αν έχεις auth context:
import { useAuth } from "../../auth/AuthContext";
// ✅ public/images -> ΔΕΝ κάνουμε import, βάζουμε απευθείας paths
const dog1 = "/images/dog1.png";
const cat1 = "/images/cat1.png";

const PETS_KEY = "mypet_owner_pets";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function isLikelyValidPhotoPath(p) {
  if (!p) return false;
  if (typeof p !== "string") return false;
  return p.startsWith("/") || p.startsWith("data:");
}

function dateToISO(d) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


// status colors
const STATUS_COLOR = {
  pending: "red",       // Εκκρεμές
  canceled: "orange",   // Ακυρωμένο
  scheduled: "blue",    // Προγραμματισμένο / άλλο
};

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODateLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
// We want Sunday=0...Saturday=6 like your labels
function sundayFirstDayIndex(d) {
  // JS getDay() already returns 0..6 Sunday..Saturday
  return d.getDay();
}
function monthLabel(d) {
  // Ελληνικό label (ταιριάζει με UI)
  return d.toLocaleString("el-GR", { month: "long" });
}
function normalizeStatusToKey(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "εκκρεμές") return "pending";
  if (s === "ακυρωμένο") return "canceled";
  return "scheduled";
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

/** ✅ πιο “μαζεμένο” calendar όπως στο mock */
function MiniCalendar() {
  const { user } = useAuth?.() || {};
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- helper: πάρε logged-in ownerId (useAuth ή localStorage fallback)
  const ownerId = useMemo(() => {
    const idFromAuth = user?.id ?? user?.user?.id;
    if (idFromAuth != null) return String(idFromAuth);

    // fallback σε localStorage (αν το project σου αποθηκεύει κάτι τέτοιο)
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return String(parsed?.id ?? parsed?.user?.id ?? "");
    } catch {
      return "";
    }
  }, [user]);

  // --- fetch appointments
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error("Failed to fetch /api/appointments");
        const data = await res.json();
        if (!alive) return;
        setAppts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setAppts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // --- Month label (Ελληνικά)
  const monthNamesGenitive = [
    "Ιανουαρίου",
    "Φεβρουαρίου",
    "Μαρτίου",
    "Απριλίου",
    "Μαΐου",
    "Ιουνίου",
    "Ιουλίου",
    "Αυγούστου",
    "Σεπτεμβρίου",
    "Οκτωβρίου",
    "Νοεμβρίου",
    "Δεκεμβρίου",
  ];

  const monthLabel = `${monthNamesGenitive[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;

  // --- Εξάγουμε status ανά μέρα (timezone-safe: ISO date από string)
  // Χρωματική προτεραιότητα:
  // Ακυρωμένο (κόκκινο) > Εκκρεμές (πορτοκαλί) > άλλο/προγραμματισμένο (μπλε)
  const dayColorByISO = useMemo(() => {
    const map = new Map(); // dateISO -> "blue" | "orange" | "red"

    const myAppts = appts.filter((a) => String(a?.ownerId ?? "") === String(ownerId));

    for (const a of myAppts) {
      const when = String(a?.when ?? "");
      if (!when) continue;

      const dateISO = when.slice(0, 10); // ✅ YYYY-MM-DD (χωρίς timezone shift)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;

      const status = String(a?.status ?? "");
      let c = "blue";
      if (status === "Εκκρεμές") c = "orange";
      if (status === "Ακυρωμένο") c = "red";

      const prev = map.get(dateISO);

      // priority: red > orange > blue
      const rank = (x) => (x === "red" ? 3 : x === "orange" ? 2 : 1);
      if (!prev || rank(c) > rank(prev)) {
        map.set(dateISO, c);
      }
    }

    return map;
  }, [appts, ownerId]);

  // --- days for current month grid
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Θέλουμε εβδομάδα Sun..Sat για να ταιριάζει με το mock σου (Sun Mon Tue...)
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  const padStart = firstDow;

  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const borderFor = (iso) => {
    const c = dayColorByISO.get(iso);
    if (c === "red") return "2px solid #e11d48"; // ακυρωμένο
    if (c === "orange") return "2px solid #f59e0b"; // εκκρεμές
    if (c === "blue") return "2px solid #2563eb"; // προγραμματισμένο
    return "1px solid rgba(0,0,0,0.10)";
  };

  const bgFor = (iso) => {
    const c = dayColorByISO.get(iso);
    if (!c) return "transparent";
    return "rgba(11,61,145,0.04)";
  };

  const isInThisMonth = (iso) => {
    if (!iso) return false;
    return iso.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`);
  };

  function goPrevMonth() {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function goNextMonth() {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function goToday() {
    const d = new Date();
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: 360,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "2px solid #c7d4e8",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 16 }}>
          {monthLabel}
        </Typography>

        <Stack direction="row" spacing={0.6} alignItems="center">
          <IconButton
            size="small"
            onClick={goPrevMonth}
            sx={{ width: 34, height: 34, border: "1px solid rgba(0,0,0,0.10)" }}
          >
            ‹
          </IconButton>
          <IconButton
            size="small"
            onClick={goNextMonth}
            sx={{ width: 34, height: 34, border: "1px solid rgba(0,0,0,0.10)" }}
          >
            ›
          </IconButton>

          <IconButton
            size="small"
            onClick={goToday}
            sx={{ width: 34, height: 34, border: "1px solid rgba(0,0,0,0.10)" }}
            title="Σήμερα"
          >
            <CalendarMonthOutlinedIcon sx={{ color: PRIMARY }} fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2, pb: 1.8 }}>
        {/* Weekdays */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.7,
            fontSize: 12,
            color: MUTED,
            mb: 1,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Box key={d} sx={{ textAlign: "center", fontWeight: 800 }}>
              {d}
            </Box>
          ))}
        </Box>

        {/* Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.7 }}>
          {Array.from({ length: padStart }).map((_, i) => (
            <Box key={`pad-${i}`} sx={{ height: 34 }} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = iso === todayISO;

            return (
              <Box
                key={iso}
                sx={{
                  height: 34,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12.5,
                  fontWeight: 900,
                  color: TITLE,
                  border: borderFor(iso),
                  bgcolor: bgFor(iso),
                  boxShadow: isToday ? "inset 0 0 0 2px rgba(11,61,145,0.18)" : "none",
                  opacity: isInThisMonth(iso) ? 1 : 0.5,
                  userSelect: "none",
                }}
              >
                {day}
              </Box>
            );
          })}
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 1.4, fontSize: 12, color: TITLE }}>
          <Stack spacing={0.6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#2563eb" }} />
              <Typography sx={{ fontSize: 12 }}>Προγραμματισμένο ραντεβού</Typography>
            </Stack>

            {/* ✅ Εκκρεμές = πορτοκαλί */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b" }} />
              <Typography sx={{ fontSize: 12 }}>Εκκρεμές</Typography>
            </Stack>

            {/* ✅ Ακυρωμένο = κόκκινο */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#e11d48" }} />
              <Typography sx={{ fontSize: 12 }}>Ακυρωμένο</Typography>
            </Stack>

            {loading && (
              <Typography sx={{ mt: 0.6, color: MUTED, fontWeight: 700, fontSize: 12 }}>
                Φόρτωση ραντεβού...
              </Typography>
            )}
            {!loading && !ownerId && (
              <Typography sx={{ mt: 0.6, color: MUTED, fontWeight: 700, fontSize: 12 }}>
                Δεν βρέθηκε χρήστης (ownerId).
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}



function PetTile({ pet }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: PANEL_BG,
        border: `2px solid ${PANEL_BORDER}`,
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
        p: 1.2,
        width: 190,
        textAlign: "center",
      }}
    >
      <Box
        component="img"
        src={pet.photo}
        alt={pet.name}
        sx={{
          width: 110,
          height: 110,
          borderRadius: 2,
          objectFit: "cover",
          bgcolor: "#fff",
          border: "1px solid rgba(0,0,0,0.10)",
          display: "block",
          mx: "auto",
        }}
      />
      <Typography sx={{ mt: 1, fontWeight: 900, color: TITLE, fontSize: 14 }}>
        {pet.name}
      </Typography>
      <Button
        variant="contained"
        size="small"
        sx={{
          mt: 1,
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
          boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
        }}
      >
        Βιβλιάριο Υγείας
      </Button>
    </Paper>
  );
}

function QuickAction({ icon, title, text, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: 260,
        height: 410,
        borderRadius: 2,
        bgcolor: "#fff",
        border: "2px solid #3b3b3b",
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: PANEL_BG,
          borderBottom: "2px solid #3b3b3b",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ p: 1.4 }}>
        <Typography sx={{ mt: 2, fontWeight: 900, color: PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "#4b5b6b", textAlign: "center" }}>
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}

/** ✅ Searchbar (Owner Dashboard): χωρίς ώρα + calendar dropdown + minDate=σήμερα */
function VetsSearchPanel() {
  const navigate = useNavigate();

  const [vetArea, setVetArea] = useState("");
  const [vetSpecialty, setVetSpecialty] = useState("");

  // date: ISO + picker object
  const [vetDate, setVetDate] = useState(""); // "YYYY-MM-DD"
  const [vetDateObj, setVetDateObj] = useState(null);

  const hasActiveVetFilters = Boolean(vetArea?.trim() || vetDate?.trim() || vetSpecialty?.trim());

  function goToVetsSearch() {
    const params = new URLSearchParams();
    if (vetArea) params.set("area", vetArea);
    if (vetSpecialty) params.set("specialty", vetSpecialty);
    if (vetDate) params.set("date", vetDate);
    navigate(`/owner/vets?${params.toString()}`);
  }

  function clearVetFilters() {
    setVetArea("");
    setVetSpecialty("");
    setVetDate("");
    setVetDateObj(null);
  }

  return (
    <Paper elevation={0} sx={{ bgcolor: "#cfe0f7", borderRadius: 4, p: 2.2 }}>
      <Typography sx={{ fontWeight: 800, mb: 1.8, color: "#1c2b39" }}>
        Αναζήτηση Κτηνιάτρων
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.6} alignItems="center">
        {/* Περιοχή */}
        <FormControl
          size="small"
          hiddenLabel
          sx={{
            minWidth: 170,
            bgcolor: "white",
            borderRadius: 999,
            "& .MuiOutlinedInput-root": { borderRadius: 999 },
          }}
        >
          <Select
            value={vetArea}
            onChange={(e) => setVetArea(e.target.value)}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <LocationOnOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
              </InputAdornment>
            }
            renderValue={(selected) => (
              <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                {selected || "Περιοχή"}
              </span>
            )}
          >
            <MenuItem value="">Όλες</MenuItem>
            <MenuItem value="Αθήνα">Αθήνα</MenuItem>
            <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
            <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
          </Select>
        </FormControl>

        {/* Ημερομηνία */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            value={vetDateObj}
            onChange={(newValue) => {
              setVetDateObj(newValue);
              setVetDate(dateToISO(newValue));
            }}
            format="dd/MM/yyyy"
            minDate={new Date()}
            slotProps={{
              textField: {
                size: "small",
                placeholder: "Ημερομηνία",
                sx: {
                  bgcolor: "white",
                  borderRadius: 999,
                  minWidth: 230,
                  "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  "& input::placeholder": { color: "#6b7a90", opacity: 1 },
                },
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthOutlinedIcon sx={{ color: "#6b7a90" }} />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        </LocalizationProvider>

        {/* Ειδικότητα */}
        <FormControl
          size="small"
          hiddenLabel
          sx={{
            minWidth: 170,
            bgcolor: "white",
            borderRadius: 999,
            "& .MuiOutlinedInput-root": { borderRadius: 999 },
          }}
        >
          <Select
            value={vetSpecialty}
            onChange={(e) => setVetSpecialty(e.target.value)}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <LocalHospitalOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
              </InputAdornment>
            }
            renderValue={(selected) => (
              <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                {selected || "Ειδικότητα"}
              </span>
            )}
          >
            <MenuItem value="">Όλες</MenuItem>
            <MenuItem value="Γενικός">Γενικός</MenuItem>
            <MenuItem value="Χειρουργός">Χειρουργός</MenuItem>
            <MenuItem value="Δερματολόγος">Δερματολόγος</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={goToVetsSearch}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 3.2,
            ml: { md: "auto" },
            bgcolor: "#0b3d91",
            "&:hover": { bgcolor: "#08316f" },
            boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
            minWidth: 140,
            fontWeight: 800,
          }}
        >
          Αναζήτηση
        </Button>

        {hasActiveVetFilters && (
          <IconButton
            onClick={clearVetFilters}
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
            <CloseRoundedIcon sx={{ fontSize: 20, color: "#6b7a90" }} />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

function LatestUpdates() {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.2 }}>Τελευταίες Ενημερώσεις</Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#eef5ff",
          borderRadius: 3,
          p: 2.2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Typography sx={{ color: "#4b5b6b", fontWeight: 700, fontSize: 13 }}>
          Δεν έχετε καινούριες ενημερώσεις.
        </Typography>
      </Paper>
    </Box>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  // ✅ demo pets
  const pets = useMemo(() => {
    const stored = safeLoad(PETS_KEY);

    const fallback = [
      { id: "p1", name: "Μπρούνο", photo: dog1 },
      { id: "p2", name: "Λούνα", photo: cat1 },
    ];

    if (!stored.length) {
      safeSave(PETS_KEY, fallback);
      return fallback;
    }

    const normalized = stored.slice(0, 2).map((p, idx) => ({
      id: p?.id || fallback[idx].id,
      name: p?.name || fallback[idx].name,
      photo: isLikelyValidPhotoPath(p?.photo) ? p.photo : fallback[idx].photo,
    }));

    safeSave(PETS_KEY, normalized);
    return normalized;
  }, []);

  const [petIndex, setPetIndex] = useState(0);
  const canUp = petIndex > 0;
  const canDown = petIndex < Math.max(0, pets.length - 2);
  const visiblePets = pets.slice(petIndex, petIndex + 2);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <PublicNavbar />

      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#eaf2fb",
          height: { xs: 230, md: 240 },
          position: "relative",
          overflow: "visible",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container maxWidth="lg" sx={{ height: "100%", position: "relative" }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Box sx={{ pt: { xs: 7, md: 3 } }}>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  fontWeight: 900,
                  color: "#1c2b39",
                  lineHeight: 1.1,
                }}
              >
                Όλες οι ανάγκες του κατοικιδίου σας,
                <br />
                συγκεντρωμένες εδώ.
              </Typography>

              <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                Ραντεβού, κτηνίατροι, βιβλιάρια και δηλώσεις με ένα κλικ.
              </Typography>
            </Box>
          </Box>
        </Container>

        <Box
          component="img"
          src="/images/owner.png"
          alt="Owner"
          sx={{
            position: "absolute",
            right: 200,
            bottom: 0,
            width: { xs: 200, md: 180 },
            height: "auto",
            display: { xs: "none", md: "block" },
          }}
        />
      </Box>

      {/* ✅ 2-column layout: sidebar + content */}
      <Box
        sx={{
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: sticky sidebar column */}
        <Box
          sx={{
            width: OWNER_SIDEBAR_W,
            flex: `0 0 ${OWNER_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 16,
              maxHeight: "calc(100vh - 16px)",
            }}
          >
            <OwnerNavbar mode="hero" />
          </Box>
        </Box>

        {/* RIGHT: content column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            {/* TOP SECTION */}
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "260px 1fr 300px" },
                gap: 3,
                alignItems: "start",
              }}
            >
              {/* Left: pets panel */}
              <Box sx={{ pt: 0.2 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: TITLE,
                    mb: 1.2,
                    fontSize: 20,
                    textAlign: "center",
                  }}
                >
                  Τα Κατοικίδια μου
                </Typography>

                <Stack alignItems="center" spacing={1.2}>
                  <IconButton
                    disabled={!canUp}
                    onClick={() => setPetIndex((p) => Math.max(0, p - 1))}
                    sx={{
                      width: 44,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: "rgba(11,61,145,0.08)",
                      "&:hover": { bgcolor: "rgba(11,61,145,0.14)" },
                    }}
                  >
                    <KeyboardArrowUpIcon sx={{ color: PRIMARY }} />
                  </IconButton>

                  <Stack spacing={2}>
                    {visiblePets.map((p) => (
                      <PetTile key={p.id} pet={p} />
                    ))}
                  </Stack>

                  <IconButton
                    disabled={!canDown}
                    onClick={() => setPetIndex((p) => Math.min(pets.length - 2, p + 1))}
                    sx={{
                      width: 44,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: "rgba(11,61,145,0.08)",
                      "&:hover": { bgcolor: "rgba(11,61,145,0.14)" },
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ color: PRIMARY }} />
                  </IconButton>
                </Stack>
              </Box>

              {/* Center: quick actions */}
              <Box sx={{ pt: 0.2 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: TITLE,
                    mb: 6.5,
                    fontSize: 20,
                    textAlign: "center",
                  }}
                >
                  Γρήγορες Ενέργειες
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <QuickAction
                    icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Απώλειας"
                    text="Καταχωρίστε την απώλεια του κατοικιδίου σας για άμεση ενημέρωση."
                    onClick={() => navigate("/owner/lost/new")}
                  />

                  <QuickAction
                    icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Εύρεσης"
                    text="Καταχωρίστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                    onClick={() => navigate("/owner/found/new")}
                  />
                </Stack>
              </Box>

              {/* Right: calendar */}
              <Box sx={{ pt: 10, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                <MiniCalendar />
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* SCROLL PART */}
            <Box sx={{ mt: 1 }}>
              <VetsSearchPanel />
              <LatestUpdates />
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
