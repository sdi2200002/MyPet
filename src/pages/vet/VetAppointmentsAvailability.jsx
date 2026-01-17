import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  IconButton,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";
import { useAuth } from "../../auth/AuthContext";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const BORDER = "#8fb4e8";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

/** Tabs */
function TabPill({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 3.4,
          py: 1.8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          bgcolor: active ? PRIMARY : "#cfd6e6",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
          userSelect: "none",
          "&:hover": { bgcolor: active ? PRIMARY : "#bcc6da" },
          transition: "all .15s",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function VetShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: VET_SIDEBAR_W,
            flex: `0 0 ${VET_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
          }}
        />
        <VetNavbar mode="navbar" />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

/* ---------------- helpers ---------------- */
const DAYS = [
  { key: "mon", label: "Δευ" },
  { key: "tue", label: "Τρι" },
  { key: "wed", label: "Τετ" },
  { key: "thu", label: "Πεμ" },
  { key: "fri", label: "Παρ" },
  { key: "sat", label: "Σαβ" },
  { key: "sun", label: "Κυρ" },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildTimes() {
  // 09:00 -> 20:30 ανά 30'
  const out = [];
  for (let h = 9; h <= 20; h++) {
    out.push(`${pad2(h)}:00`);
    if (h !== 20) out.push(`${pad2(h)}:30`);
    else out.push(`20:30`);
  }
  // remove possible duplicates
  return Array.from(new Set(out));
}

function normalizeDateKey(yyyy_mm_dd) {
  // keep as YYYY-MM-DD (good for sorting)
  return String(yyyy_mm_dd || "").trim();
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/* ---------------- Page ---------------- */
export default function VetAppointmentsAvailability() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const TABS = useMemo(
    () => [
      { label: "Ραντεβού", to: "/vet/appointments" },
      { label: "Αιτήματα", to: "/vet/appointments/VetAppointmentsRequests" },
      { label: "Ενημερώσεις", to: "/vet/appointments/VetAppointmentsUpdates" },
      { label: "Διαθεσιμότητα", to: "/vet/appointments/VetAppointmentsAvailability" },
    ],
    []
  );

  // vet id/key
  const vetId = useMemo(() => String(user?.vetProfileId || user?.id || ""), [user?.id, user?.vetProfileId]);

  // form state
  const [workDays, setWorkDays] = useState(() => new Set(["mon", "tue", "wed", "thu", "fri"]));
  const TIMES = useMemo(() => buildTimes(), []);
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("09:00");

  const [closedInput, setClosedInput] = useState(""); // YYYY-MM-DD
  const [closedDates, setClosedDates] = useState([]); // array of YYYY-MM-DD

  // services (βάλε εδώ ό,τι έχεις στο app)
  const ALL_SERVICES = useMemo(
    () => [
      "Βασική Κλινική Εξέταση",
      "Εμβολιασμοί",
      "Αποπαρασίτωση",
      "Διαγνωστικές Εξετάσεις",
      "Μικροεπεμβάσεις",
      "Στείρωση",
      "Μικροτσίπ & Έγγραφα",
    ],
    []
  );
  const [services, setServices] = useState([]);

  // loading / saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState(null); // id of vetAvailability record

  // load availability
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      try {
        if (!vetId) {
          if (!alive) return;
          setLoading(false);
          return;
        }

        const list = await fetchJSON(`/api/vetAvailability?vetId=${encodeURIComponent(vetId)}`);
        const existing = Array.isArray(list) && list.length ? list[0] : null;

        if (!alive) return;

        if (existing) {
          setRowId(existing.id);

          setWorkDays(new Set(existing.workDays || ["mon", "tue", "wed", "thu", "fri"]));
          setFromTime(existing.fromTime || "09:00");
          setToTime(existing.toTime || "09:00");
          setClosedDates(Array.isArray(existing.closedDates) ? existing.closedDates : []);
          setServices(Array.isArray(existing.services) ? existing.services : []);
        } else {
          // default
          setRowId(null);
          setWorkDays(new Set(["mon", "tue", "wed", "thu", "fri"]));
          setFromTime("09:00");
          setToTime("09:00");
          setClosedDates([]);
          setServices([]);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [vetId]);

  // toggle day
  const toggleDay = (key) => {
    setWorkDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ensure time range is valid
  const timeIndex = (t) => TIMES.indexOf(t);
  useEffect(() => {
    // keep toTime >= fromTime
    if (timeIndex(toTime) < timeIndex(fromTime)) {
      setToTime(fromTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTime]);

  const addClosedDate = () => {
    const v = normalizeDateKey(closedInput);
    if (!v) return;

    setClosedDates((prev) => {
      const set = new Set(prev.map(normalizeDateKey));
      set.add(v);
      return Array.from(set).sort();
    });

    setClosedInput("");
  };

  const removeClosedDate = (d) => {
    setClosedDates((prev) => prev.filter((x) => x !== d));
  };

  const resetForm = () => {
    setWorkDays(new Set(["mon", "tue", "wed", "thu", "fri"]));
    setFromTime("09:00");
    setToTime("09:00");
    setClosedDates([]);
    setClosedInput("");
    setServices([]);
  };

  const save = async () => {
    if (!vetId) return;

    setSaving(true);
    try {
      const payload = {
        vetId: String(vetId),
        workDays: Array.from(workDays),
        fromTime,
        toTime,
        closedDates,
        services,
        updatedAt: new Date().toISOString(),
      };

      // ✅ json-server upsert by vetId
      const list = await fetchJSON(`/api/vetAvailability?vetId=${encodeURIComponent(String(vetId))}`);
      const existing = Array.isArray(list) && list.length ? list[0] : null;

      if (existing?.id) {
        // ✅ UPDATE (PUT)
        const updated = await fetchJSON(`/api/vetAvailability/${encodeURIComponent(String(existing.id))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...existing,
            ...payload,
            createdAt: existing.createdAt || new Date().toISOString(),
          }),
        });
        setRowId(updated?.id ?? existing.id);

      } else {
        // ✅ CREATE (POST)
        const created = await fetchJSON(`/api/vetAvailability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            createdAt: new Date().toISOString(),
            ...payload,
          }),
        });
        setRowId(created?.id ?? null);

      }

      alert("Η διαθεσιμότητα αποθηκεύτηκε ✅");
    } catch (e) {
      console.error(e);
      alert("Αποτυχία αποθήκευσης. Δοκίμασε ξανά.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VetShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <AppBreadcrumbs />

        {/* Tabs */}
        <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
          {TABS.map((t) => (
            <TabPill key={t.to} label={t.label} to={t.to} active={pathname === t.to} />
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 2,
            borderRadius: 2,
            border: `2px solid ${BORDER}`,
            boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
            p: 2.5,
            minHeight: 520,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 18, mb: 1 }}>
            Διαθεσιμότητα
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Typography sx={{ color: MUTED, fontWeight: 900 }}>Φόρτωση...</Typography>
          ) : (
            <Box sx={{ maxWidth: 520 }}>
              {/* Βασικό πρόγραμμα */}
              <Typography sx={{ fontWeight: 900, color: "#111", mb: 1.2 }}>
                Βασικό Πρόγραμμα Εργασίας
              </Typography>

              {/* Επιλογή ημερών */}
              <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12, mb: 0.8 }}>
                Επιλογή Ημερών
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                {DAYS.map((d) => {
                  const active = workDays.has(d.key);
                  return (
                    <Button
                      key={d.key}
                      onClick={() => toggleDay(d.key)}
                      variant="contained"
                      size="small"
                      sx={{
                        minWidth: 42,
                        px: 1.2,
                        borderRadius: 1.2,
                        textTransform: "none",
                        bgcolor: active ? PRIMARY : "#e9edf4",
                        color: active ? "#fff" : "#111",
                        fontWeight: 900,
                        boxShadow: "none",
                        "&:hover": { bgcolor: active ? PRIMARY_HOVER : "#dfe6f2" },
                      }}
                    >
                      {d.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* Επιλογή ωραρίου */}
              <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12, mb: 0.8 }}>
                Επιλογή Ωραρίου
              </Typography>

              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>Από:</Typography>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select value={fromTime} onChange={(e) => setFromTime(e.target.value)}>
                    {TIMES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>Μέχρι:</Typography>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select value={toTime} onChange={(e) => setToTime(e.target.value)}>
                    {TIMES.filter((t) => timeIndex(t) >= timeIndex(fromTime)).map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Εκτός λειτουργίας */}
              <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12, mb: 0.8 }}>
                Επιλογή ημερών εκτός λειτουργίας
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  type="date"
                  value={closedInput}
                  onChange={(e) => setClosedInput(e.target.value)}
                  inputProps={{ min: todayKey() }}
                  sx={{ width: 220 }}
                />
                <Button
                  onClick={addClosedDate}
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.2,
                    bgcolor: PRIMARY,
                    "&:hover": { bgcolor: PRIMARY_HOVER },
                    fontWeight: 900,
                  }}
                >
                  Προσθήκη
                </Button>

              </Stack>

              {closedDates.length > 0 ? (
                <Stack spacing={0.8} sx={{ mb: 2 }}>
                  {closedDates.map((d) => (
                    <Stack
                      key={d}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        border: "1px solid #d8e2f2",
                        borderRadius: 1.2,
                        px: 1.2,
                        py: 0.8,
                        bgcolor: "#fff",
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, color: "#111", fontSize: 13 }}>
                        {d}
                      </Typography>
                      <IconButton onClick={() => removeClosedDate(d)} size="small">
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12, mb: 2 }}>
                  (Καμία ημερομηνία ακόμη)
                </Typography>
              )}

              {/* Υπηρεσίες */}
              <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12, mb: 0.8 }}>
                Επιλογή Υπηρεσιών που προσφέρονται
              </Typography>

              <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                <Select
                  multiple
                  value={services}
                  onChange={(e) => setServices(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
                  renderValue={(selected) => (selected?.length ? selected.join(", ") : "Υπηρεσίες")}
                  displayEmpty
                >
                  {ALL_SERVICES.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={services.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Actions */}
              <Stack direction="row" spacing={1.2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  onClick={resetForm}
                  variant="contained"
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.2,
                    bgcolor: "#b7bcc3",
                    color: "#000",
                    "&:hover": { bgcolor: "#a9aeb6" },
                    fontWeight: 900,
                    px: 3,
                  }}
                >
                  Ακύρωση
                </Button>

                <Button
                  onClick={save}
                  variant="contained"
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.2,
                    bgcolor: PRIMARY,
                    "&:hover": { bgcolor: PRIMARY_HOVER },
                    fontWeight: 900,
                    px: 3,
                  }}
                >
                  {saving ? "Αποθήκευση..." : "Οριστική Υποβολή"}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </VetShell>
  );
}
