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

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { listNotifications, markAllRead, markNotificationRead } from "../../api/notifications";
import Pager from "../../components/Pager"; // βάλε το σωστό path

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";


import { useAuth } from "../../auth/AuthContext";

const MUTED = "#6b7a90";
const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

function dateToISO(d) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ✅ fallback μόνο αν για κάποιο λόγο το auth context δεν έχει user */
function readUserFromLocalStorageFallback() {
  const keys = ["auth_user", "user", "mypet_auth_user", "mypet_user"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      return parsed?.user ?? parsed;
    } catch {
      // ignore
    }
  }
  return null;
}

/** ✅ MiniCalendar (owner appointments) */
/** ✅ πιο “μαζεμένο” calendar όπως στο mock */
function MiniCalendar() {
  const { user } = useAuth?.() || {};

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ re-render trigger for time-based status changes
  const [tick, setTick] = useState(0);

  // --- ownerId (useAuth ή fallback)
  const ownerId = useMemo(() => {
    const idFromAuth = user?.id ?? user?.user?.id;
    if (idFromAuth != null) return String(idFromAuth);

    try {
      const raw = localStorage.getItem("auth_user") || localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return String(parsed?.id ?? parsed?.user?.id ?? "");
    } catch {
      return "";
    }
  }, [user]);

  // --- fetch appointments (μία φορά)
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

  /**
   * ✅ 4 statuses για calendar:
   * completed  -> μπλε
   * accepted   -> πράσινο (ο κτηνίατρος το δέχτηκε)
   * pending    -> πορτοκαλί (περιμένει αποδοχή)
   * canceled   -> κόκκινο
   */

  const COLORS = useMemo(
    () => ({
      completed: "#2563eb", // blue
      accepted: "#16a34a",  // green
      pending: "#f59e0b",   // orange
      canceled: "#e11d48",  // red
    }),
    []
  );

  // ✅ προτεραιότητα ανά μέρα (όταν υπάρχουν πολλά μαζί)
  // Εδώ διάλεξα: pending > accepted > completed > canceled
  // (μπορείς να αλλάξεις ranks όπως θες)
  const PRIORITY = useMemo(
    () => ({
      pending: 4,
      accepted: 3,
      completed: 2,
      canceled: 1,
    }),
    []
  );

  // 1) base status από DB (πριν το "ολοκληρώθηκε λόγω ώρας")
  function normalizeBaseStatus(a) {
    const s = String(a?.status ?? "").trim().toLowerCase();

    // ακυρωμένο από οποιονδήποτε
    if (s === "ακυρωμένο" || s === "canceled" || s === "cancelled") return "canceled";

    // εκκρεμές (waiting acceptance)
    if (s === "εκκρεμές" || s === "pending") return "pending";

    // αποδεκτό/προγραμματισμένο από κτηνίατρο (future accepted)
    if (s === "προγραμματισμένο" || s === "αποδεκτό" || s === "accepted") return "accepted";

    // fallback: αν δεν ξέρουμε, κράτα accepted για future (ή άλλαξέ το αν θες)
    return "accepted";
  }

  // 2) effective status για calendar (λαμβάνει υπόψη το χρόνο)
  function effectiveStatus(a, nowMs) {
    const base = normalizeBaseStatus(a);

    const whenStr = String(a?.when || "");
    const whenMs = Date.parse(whenStr);

    // αν δεν μπορώ να το διαβάσω, επιστρέφω base
    if (!Number.isFinite(whenMs)) return base;

    // canceled πάντα canceled
    if (base === "canceled") return "canceled";

    // αν πέρασε η ώρα => completed (μπλε)
    if (whenMs <= nowMs) return "completed";

    // αλλιώς: pending ή accepted (future)
    return base; // pending/accepted
  }

  // --- Χρώμα ανά μέρα (ISO yyyy-mm-dd) με priority
  const dayColorByISO = useMemo(() => {
    const map = new Map();
    const nowMs = Date.now();

    const myAppts = appts.filter((a) => String(a?.ownerId ?? "") === String(ownerId));

    for (const a of myAppts) {
      const when = String(a?.when ?? "");
      if (!when) continue;

      const dateISO = when.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;

      const key = effectiveStatus(a, nowMs); // completed/accepted/pending/canceled
      const color = COLORS[key];

      const prev = map.get(dateISO);
      if (!prev) {
        map.set(dateISO, { key, color });
      } else {
        if (PRIORITY[key] > PRIORITY[prev.key]) {
          map.set(dateISO, { key, color });
        }
      }
    }

    // store only color for rendering
    const flat = new Map();
    for (const [k, v] of map.entries()) flat.set(k, v.color);
    return flat;
  }, [appts, ownerId, tick, COLORS, PRIORITY]);

  // ✅ Live refresh: βρίσκει το επόμενο ραντεβού που θα "αλλάξει" σε completed
  // (δηλαδή το νωρίτερο future appointment time) και κάνει re-render όταν περάσει
  useEffect(() => {
    if (!ownerId) return;
    if (!appts.length) return;

    const nowMs = Date.now();
    const myAppts = appts.filter((a) => String(a?.ownerId ?? "") === String(ownerId));

    const nextChangeMs = myAppts
      .map((a) => {
        const whenMs = Date.parse(String(a?.when || ""));
        if (!Number.isFinite(whenMs)) return null;
        if (whenMs <= nowMs) return null; // already completed
        // canceled δεν χρειάζεται time-based αλλαγή, αλλά δεν πειράζει κι αν μπει
        return whenMs;
      })
      .filter((x) => x != null)
      .sort((a, b) => a - b)[0];

    if (!nextChangeMs) return;

    const delay = Math.max(1000, nextChangeMs - nowMs + 1000); // +1s safety
    const id = setTimeout(() => setTick((x) => x + 1), delay);
    return () => clearTimeout(id);
  }, [appts, ownerId]);

  // --- days grid
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // Sun..Sat
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
    if (!c) return "1px solid rgba(0,0,0,0.10)";
    return `2px solid ${c}`;
  };

  const bgFor = (iso) => {
    const c = dayColorByISO.get(iso);
    if (!c) return "transparent";
    return "rgba(11,61,145,0.04)";
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
        width: 330, // κάν’ το 310/300 αν το θες ακόμα πιο μικρό
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

          {Array.from({ length: daysInThisMonth }, (_, i) => i + 1).map((day) => {
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
                  userSelect: "none",
                }}
              >
                {day}
              </Box>
            );
          })}
        </Box>

        {/* Legend (4 statuses) */}
        <Box sx={{ mt: 1.4, fontSize: 12, color: TITLE }}>
          <Stack spacing={0.6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS.accepted }} />
              <Typography sx={{ fontSize: 12 }}>Προγραμματισμένο</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS.pending }} />
              <Typography sx={{ fontSize: 12 }}>Εκκρεμές</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS.completed }} />
              <Typography sx={{ fontSize: 12 }}>Ολοκληρωμένο</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS.canceled }} />
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




function PetTile({ pet, onOpenBook }) {
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
          mx: "auto",
          display: "block",
        }}
      />
      <Typography sx={{ mt: 1, fontWeight: 900, color: TITLE, fontSize: 14 }}>{pet.name}</Typography>

      <Button
        variant="contained"
        size="small"
        onClick={() => onOpenBook(pet.id)}
        sx={{
          mt: 1,
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
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
      <Box sx={{ height: 160, bgcolor: PANEL_BG, borderBottom: "2px solid #3b3b3b", display: "grid", placeItems: "center" }}>
        {icon}
      </Box>
      <Box sx={{ p: 1.4 }}>
        <Typography sx={{ mt: 2, fontWeight: 900, color: PRIMARY, textAlign: "center" }}>{title}</Typography>
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "#4b5b6b", textAlign: "center" }}>{text}</Typography>
      </Box>
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

function VetsSearchPanel() {
  const navigate = useNavigate();
  const [vetArea, setVetArea] = useState("");
  const [vetSpecialty, setVetSpecialty] = useState("");
  const [vetDate, setVetDate] = useState("");
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
      <Typography sx={{ fontWeight: 800, mb: 1.8, color: "#1c2b39" }}>Αναζήτηση Κτηνιάτρων</Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.6} alignItems="center">
        <FormControl
          size="small"
          hiddenLabel
          sx={{ minWidth: 170, bgcolor: "white", borderRadius: 999, "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
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
            renderValue={(selected) => <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>{selected || "Περιοχή"}</span>}
          >
            <MenuItem value="">Όλες</MenuItem>
            <MenuItem value="Αθήνα">Αθήνα</MenuItem>
            <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
            <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={vetDateObj}
            minDate={dayjs()} // ✅ δεν επιτρέπει “χτες”
            maxDate={dayjs().add(1, "year")}
            onChange={(newValue) => {
              setVetDateObj(newValue);
              setVetDate(dateToISOFromDayjs(newValue)); // ✅ ISO
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

        <FormControl
          size="small"
          hiddenLabel
          sx={{ minWidth: 170, bgcolor: "white", borderRadius: 999, "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
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
            renderValue={(selected) => <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>{selected || "Ειδικότητα"}</span>}
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
            bgcolor: PRIMARY,
            "&:hover": { bgcolor: PRIMARY_HOVER },
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
            sx={{ ml: 0.6, width: 42, height: 42, bgcolor: "white", border: "1px solid rgba(0,0,0,0.12)", "&:hover": { bgcolor: "rgba(0,0,0,0.04)" } }}
          >
            <CloseRoundedIcon sx={{ fontSize: 20, color: "#6b7a90" }} />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

function fmtShort(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function routeForNotification(n) {
  if (n?.refType === "appointment" && n?.refId) return `/owner/appointments/${n.refId}`;
  if (n?.refType === "pet" && n?.refId) return `/owner/pets/${n.refId}`;
  if (n?.refType === "lostDeclaration" && n?.refId) return `/owner/lost/${n.refId}`; // ✅ ταιριάζει με το refType που έχεις ήδη
  if (n?.refType === "lost" && n?.refId) return `/owner/lost/${n.refId}`;
  if (n?.refType === "found" && n?.refId) return `/owner/found/${n.refId}`;
  return "";
}

// ✅ συμβατό με isRead + readAt
function isUnread(n) {
  if (n?.readAt) return false;
  if (typeof n?.isRead === "boolean") return n.isRead === false;
  return true;
}

function LatestUpdates({ limit = 5 }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const uid = useMemo(() => String(user?.id ?? user?.user?.id ?? ""), [user]);

  const [allItems, setAllItems] = useState([]);   // ⬅️ ΟΛΑ τα notifications (τελευταία)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);            // ⬅️ σελίδα

  const unreadCount = useMemo(
    () => (Array.isArray(allItems) ? allItems.filter(isUnread).length : 0),
    [allItems]
  );

  const pageCount = useMemo(() => {
    const total = Array.isArray(allItems) ? allItems.length : 0;
    return Math.max(1, Math.ceil(total / limit));
  }, [allItems, limit]);

  // ⬅️ items που θα εμφανιστούν στην τρέχουσα σελίδα
  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return (Array.isArray(allItems) ? allItems : []).slice(start, start + limit);
  }, [allItems, page, limit]);

  async function load() {
    if (!uid) {
      setLoading(true);
      return;
    }

    setLoading(true);
    try {
      const data = await listNotifications({ userId: uid, limit: 200 }); // φέρνουμε πολλά
      const normalizeId = (v) => String(v ?? "").replace(/^u_/, "");

      const all = Array.isArray(data) ? data : [];

      // μόνο του χρήστη
      const mine = all.filter((n) => normalizeId(n?.userId) === normalizeId(uid));

      // newest first
      const sorted = [...mine].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      );

      setAllItems(sorted);
    } catch (e) {
      console.error(e);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }

  // όταν αλλάζει user -> σελίδα 1
  useEffect(() => {
    setPage(1);
  }, [uid]);

  // αν μειωθούν items και η σελίδα βγει εκτός -> φέρ' την μέσα
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, limit]);

  async function onClickItem(n) {
    if (isUnread(n)) {
      if (n?.readAt !== undefined) {
        const updated = await markNotificationRead(n.id);
        setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updated } : x)));
      } else {
        await fetch(`/api/notifications/${encodeURIComponent(String(n.id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      }
    }

    const to = routeForNotification(n);
    if (to) navigate(to);
  }

  async function onMarkAll() {
    if (!uid) return;
    await markAllRead(uid);
    await load();
    setPage(1);
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
        <Typography sx={{ fontWeight: 900, color: TITLE }}>
          Τελευταίες Ενημερώσεις
          {unreadCount > 0 ? (
            <Typography component="span" sx={{ ml: 1, color: PRIMARY, fontWeight: 900 }}>
              ({unreadCount})
            </Typography>
          ) : null}
        </Typography>

        {allItems.length > 0 && unreadCount > 0 && (
          <Button
            onClick={onMarkAll}
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              bgcolor: PRIMARY,
              "&:hover": { bgcolor: PRIMARY_HOVER },
              fontWeight: 900,
            }}
          >
            Όλα ως διαβασμένα
          </Button>
        )}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#eef5ff",
          borderRadius: 3,
          p: 2.2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
        ) : allItems.length === 0 ? (
          <Typography sx={{ color: MUTED, fontWeight: 700 }}>Δεν έχετε καινούριες ενημερώσεις.</Typography>
        ) : (
          <>
            <Stack spacing={1.2}>
              {pageItems.map((n) => {
                const unread = isUnread(n);
                return (
                  <Box
                    key={n.id}
                    onClick={() => onClickItem(n)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <Typography
                      sx={{
                        color: unread ? "#1c2b39" : MUTED,
                        fontWeight: unread ? 900 : 700,
                        fontSize: 13.5,
                        lineHeight: 1.25,
                      }}
                    >
                      • {fmtShort(n.createdAt)} — {n.message || n.title || "Ενημέρωση"}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            {/* ✅ Pager */}
            <Pager
              page={page}
              pageCount={pageCount}
              onChange={(p) => setPage(p)}
              maxButtons={4}
              color={PRIMARY}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}



export default function OwnerDashboard() {
  const navigate = useNavigate();

  // ✅ ΠΗΓΗ ΑΛΗΘΕΙΑΣ: AuthContext
  const auth = useAuth();
  const authUser = auth?.user?.user ?? auth?.user ?? null;

  // ✅ fallback σε localStorage μόνο αν είναι null
  const fallbackUser = useMemo(() => readUserFromLocalStorageFallback(), []);
  const user = authUser || fallbackUser;

  const ownerId = useMemo(() => (user?.id != null ? String(user.id) : ""), [user]);

  const [pets, setPets] = useState([]);
  const [petIndex, setPetIndex] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingPets(true);
        const res = await fetch("/api/pets");
        const all = await res.json();
        if (!alive) return;

        const mine = Array.isArray(all) ? all.filter((p) => String(p?.ownerId) === ownerId) : [];
        setPets(mine);
        setPetIndex(0);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setPets([]);
      } finally {
        if (alive) setLoadingPets(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [ownerId]);

  const canUp = petIndex > 0;
  const canDown = petIndex < Math.max(0, pets.length - 2);
  const visiblePets = pets.slice(petIndex, petIndex + 2);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <PublicNavbar />

      <Box sx={{ bgcolor: "#eaf2fb", height: { xs: 230, md: 240 }, position: "relative", overflow: "visible", display: "flex", alignItems: "flex-start" }}>
        <Container maxWidth="lg" sx={{ height: "100%", position: "relative" }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Box sx={{ pt: { xs: 7, md: 3 } }}>
            <Typography sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 900, color: "#1c2b39", lineHeight: 1.1 }}>
              Όλες οι ανάγκες του κατοικιδίου σας,
              <br />
              συγκεντρωμένες εδώ.
            </Typography>
            <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
              Ραντεβού, κτηνίατροι, βιβλιάρια και δηλώσεις με ένα κλικ.
            </Typography>
          </Box>
        </Container>

        <Box component="img" src="/images/owner.png" alt="Owner" sx={{ position: "absolute", right: 200, bottom: 0, width: { xs: 200, md: 180 }, height: "auto", display: { xs: "none", md: "block" } }} />
      </Box>

      <Box sx={{ display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box sx={{ width: OWNER_SIDEBAR_W, flex: `0 0 ${OWNER_SIDEBAR_W}px`, display: { xs: "none", lg: "block" }, alignSelf: "flex-start" }}>
          <Box sx={{ position: "sticky", top: 16, maxHeight: "calc(100vh - 16px)" }}>
            <OwnerNavbar mode="hero" />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            {/* ✅ 3 στήλες για να μην χαλάει το layout */}
            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr 360px" },gap: 4,  alignItems: "start", justifyContent: "center", justifyItems: "center", }}>
              <Box sx={{ pt: 0.2 }}>
                <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.2, fontSize: 20, textAlign: "center" }}>
                  Τα Κατοικίδια μου
                </Typography>

                <Stack alignItems="center" spacing={1.2}>
                  <IconButton
                    disabled={!canUp}
                    onClick={() => setPetIndex((p) => Math.max(0, p - 1))}
                    sx={{ width: 44, height: 32, borderRadius: 2, bgcolor: "rgba(11,61,145,0.08)", "&:hover": { bgcolor: "rgba(11,61,145,0.14)" } }}
                  >
                    <KeyboardArrowUpIcon sx={{ color: PRIMARY }} />
                  </IconButton>

                  <Stack spacing={2}>
                    {loadingPets ? (
                      <Typography sx={{ color: MUTED, fontWeight: 700 }}>Φόρτωση κατοικιδίων...</Typography>
                    ) : !ownerId ? (
                      <Typography sx={{ color: MUTED, fontWeight: 700, textAlign: "center" }}>
                        Δεν βρέθηκε logged χρήστης.
                      </Typography>
                    ) : pets.length === 0 ? (
                      <Typography sx={{ color: MUTED, fontWeight: 700, textAlign: "center" }}>
                        Δεν βρέθηκαν κατοικίδια για αυτόν τον χρήστη.
                      </Typography>
                    ) : (
                      visiblePets.map((p) => (
                        <PetTile key={p.id} pet={p} onOpenBook={(id) => navigate(`/owner/pets/${id}/booklet`)} />
                      ))
                    )}
                  </Stack>

                  <IconButton
                    disabled={!canDown}
                    onClick={() => setPetIndex((p) => Math.min(Math.max(0, pets.length - 2), p + 1))}
                    sx={{ width: 44, height: 32, borderRadius: 2, bgcolor: "rgba(11,61,145,0.08)", "&:hover": { bgcolor: "rgba(11,61,145,0.14)" } }}
                  >
                    <KeyboardArrowDownIcon sx={{ color: PRIMARY }} />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ pt: 0.2 }}>
                <Typography sx={{ fontWeight: 900, color: TITLE, mb: 6.5, fontSize: 20, textAlign: "center" }}>
                  Γρήγορες Ενέργειες
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <QuickAction
                    icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Απώλειας"
                    text="Καταχωρίστε την απώλεια του κατοικιδίου σας για άμεση ενημέρωση."
                    onClick={() => navigate("/owner/declarations/lost/new")}
                  />
                  <QuickAction
                    icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                    title="Δήλωση Εύρεσης"
                    text="Καταχωρίστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                    onClick={() => navigate("/owner/declarations/found/new")}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  pt: 10.0, 
                }}
              >
  <MiniCalendar />
</Box>

            </Box>

            <Divider sx={{ my: 4 }} />

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
