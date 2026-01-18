// src/pages/vet/VetAppointments.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";
import { useAuth } from "../../auth/AuthContext";

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

/* ---------------- date/time helpers ---------------- */
const GREEK_DAYS = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("el-GR");
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function sameYMD(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtDayLabel(d) {
  const jsDay = d.getDay(); // 0 Sun ... 6 Sat
  const idx = jsDay === 0 ? 6 : jsDay - 1; // Monday=0 ... Sunday=6
  return `${GREEK_DAYS[idx]} ${pad2(d.getDate())} / ${pad2(d.getMonth() + 1)}`;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function buildSlots() {
  // 09:00 -> 20:30 ανά 30'
  const out = [];
  for (let h = 9; h <= 20; h++) {
    out.push({ h, m: 0, label: `${pad2(h)}:00` });
    if (h !== 20) out.push({ h, m: 30, label: `${pad2(h)}:30` });
  }
  out.push({ h: 20, m: 30, label: "20:30" });
  return out;
}

function isNowSlot(dayDate, slot) {
  const now = new Date();
  if (!sameYMD(dayDate, now)) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slotMin = slot.h * 60 + slot.m;
  return nowMin >= slotMin && nowMin < slotMin + 30;
}

/* ---------------- notifications helpers ---------------- */
async function createNotification(payload) {
  return fetchJSON(`/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
function makeNotif({ userId, type, title, message, meta, refType, refId }) {
  return {
    userId: String(userId),
    type: type || "info",
    title: title || "",
    message: message || "",
    meta: meta || {},
    refType: refType || meta?.refType,
    refId: refId || meta?.refId,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}

/* ---------------- owner helpers (resolve name from ownerId) ---------------- */
async function fetchOwnerNameById(ownerId) {
  if (!ownerId) return "—";
  try {
    // json-server: /users/:id
    const u = await fetchJSON(`/api/users/${encodeURIComponent(String(ownerId))}`);
    const full =
      (u?.name && String(u.name).trim()) || `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
    return full || "—";
  } catch (e) {
    // fallback: /users?id=...
    try {
      const arr = await fetchJSON(`/api/users?id=${encodeURIComponent(String(ownerId))}`);
      const u = Array.isArray(arr) ? arr[0] : null;
      const full =
        (u?.name && String(u.name).trim()) || `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
      return full || "—";
    } catch {
      return "—";
    }
  }
}

/* ---------------- Page ---------------- */
export default function VetAppointments() {
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

  // ⬅️ tick για να ανανεώνεται το highlight του "τώρα"
  const [, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const slots = useMemo(() => buildSlots(), []);

  // data
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [appts, setAppts] = useState([]);

  // selected appointment
  const [selected, setSelected] = useState(null);

  // cancel popup
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const vetKey = useMemo(
    () => String(user?.vetProfileId || user?.id || ""),
    [user?.id, user?.vetProfileId]
  );

  // ✅ SCROLL: refs
  const scrollRef = useRef(null);
  const nowRowRef = useRef(null);

  // ✅ owner name cache
  const [ownerNameById, setOwnerNameById] = useState(() => new Map());

  // load confirmed for week range
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!vetKey) {
        setAppts([]);
        setLoading(false);
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        return;
      }

      const startISO = new Date(weekStart);
      const endISO = addDays(weekStart, 7);

      const data = await fetchJSON(
        `/api/appointments?vetId=${encodeURIComponent(vetKey)}&status=${encodeURIComponent(
          "Επιβεβαιωμένο"
        )}`
      );
      const arr = Array.isArray(data) ? data : [];

      const inWeek = arr.filter((a) => {
        const t = new Date(a?.when || 0).getTime();
        return Number.isFinite(t) && t >= startISO.getTime() && t < endISO.getTime();
      });

      inWeek.sort((a, b) => new Date(a?.when || 0) - new Date(b?.when || 0));

      if (!alive) return;
      setAppts(inWeek);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης ραντεβού.");
      setLoading(false);
      setAppts([]);
    });

    return () => {
      alive = false;
    };
  }, [vetKey, weekStart]);

  // ✅ resolve owner names for the loaded appointments
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!appts?.length) return;

      const missing = Array.from(
        new Set(appts.map((a) => String(a?.ownerId || "")).filter(Boolean))
      ).filter((id) => !ownerNameById.has(id));

      if (!missing.length) return;

      const pairs = await Promise.all(missing.map(async (id) => [id, await fetchOwnerNameById(id)]));

      if (!alive) return;
      setOwnerNameById((prev) => {
        const next = new Map(prev);
        for (const [id, name] of pairs) next.set(id, name);
        return next;
      });
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appts]);

  // index by exact day+time
  const apptByKey = useMemo(() => {
    const map = new Map();
    for (const a of appts) {
      const d = new Date(a?.when || 0);
      if (!Number.isFinite(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
      map.set(key, a);
    }
    return map;
  }, [appts]);

  function apptFor(dayDate, slot) {
    const key = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}-${slot.h}-${slot.m}`;
    return apptByKey.get(key) || null;
  }

  const goPrevWeek = () => {
    setSelected(null);
    setWeekStart((w) => addDays(w, -7));
  };
  const goNextWeek = () => {
    setSelected(null);
    setWeekStart((w) => addDays(w, 7));
  };

  // ✅ AUTO-SCROLL: όταν φορτώσει η εβδομάδα, πήγαινε στο "τώρα" (αν η εβδομάδα περιέχει σήμερα)
  useEffect(() => {
    if (loading) return;

    const today = new Date();
    const inThisWeek = days.some((d) => sameYMD(d, today));

    if (!scrollRef.current) return;

    if (!inThisWeek) {
      scrollRef.current.scrollTop = 0;
      return;
    }

    if (nowRowRef.current?.scrollIntoView) {
      nowRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [loading, weekStart, days]);

  const patchAppointment = async (id, payload) => {
    return fetchJSON(`/api/appointments/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const confirmCancel = async () => {
    if (!selected?.id) return;

    try {
      setRejectSaving(true);
      setBusyId(String(selected.id));

      const updated = await patchAppointment(selected.id, {
        status: "Ακυρωμένο",
        canceledAt: new Date().toISOString(),
        cancelReason: (rejectReason || "").trim() || "Ακύρωση από κτηνίατρο",
      });

      const ownerId = updated?.ownerId ?? selected?.ownerId;
      const apptId = String(updated?.id ?? selected.id);
      const petName = String(updated?.petName ?? selected?.petName ?? "κατοικίδιο");
      const vetName = String(updated?.vetName ?? user?.name ?? "Κτηνίατρος");
      const whenISO = String(updated?.when ?? selected?.when ?? "");
      const reason = String(updated?.cancelReason ?? "").trim();

      const dateStr = whenISO ? fmtDate(whenISO) : "—";
      const timeStr = whenISO ? fmtTime(whenISO) : "—";

      if (ownerId) {
        await createNotification(
          makeNotif({
            userId: ownerId,
            type: "error",
            title: "Ακύρωση ραντεβού",
            message: `Το ραντεβού σας με ${vetName} για ${petName} στις ${dateStr} ${timeStr} ακυρώθηκε.${
              reason ? ` Λόγος: ${reason}` : ""
            }`,
            meta: {
              apptId,
              vetId: String(updated?.vetId ?? selected?.vetId ?? ""),
              ownerId: String(ownerId),
              petName,
              when: whenISO,
              status: "Ακυρωμένο",
              cancelReason: reason,
            },
            refType: "appointment",
            refId: apptId,
          })
        );
      }

      setAppts((prev) => prev.filter((x) => String(x.id) !== String(selected.id)));
      setSelected(null);
      setRejectOpen(false);
      setRejectReason("");
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ακύρωσης. Δοκίμασε ξανά.");
    } finally {
      setRejectSaving(false);
      setBusyId(null);
    }
  };

  const selectedDetails = useMemo(() => {
    if (!selected) return null;
    const whenISO = selected.when;

    const ownerId = selected?.ownerId ? String(selected.ownerId) : "";
    const ownerResolved =
      (selected?.ownerName || selected?.ownerFullName || "").trim() ||
      (ownerId ? ownerNameById.get(ownerId) : "") ||
      "—";

    return {
      petName: selected?.petName || "—",
      service: selected?.service || "—",
      ownerName: ownerResolved,
      date: whenISO ? fmtDate(whenISO) : "—",
      time: whenISO ? fmtTime(whenISO) : "—",
    };
  }, [selected, ownerNameById]);

  const selectedKey = useMemo(() => {
    if (!selected?.when) return "";
    const d = new Date(selected.when);
    if (!Number.isFinite(d.getTime())) return "";
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
  }, [selected]);

  const today = new Date();

  return (
    <VetShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <AppBreadcrumbs />

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
            p: 2,
            minHeight: 520,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 18 }}>
              Εβδομαδιαία Ραντεβού
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={goPrevWeek}
                variant="contained"
                sx={{
                  minWidth: 44,
                  px: 0,
                  borderRadius: 2,
                  bgcolor: "#d9dfec",
                  color: "#111",
                  "&:hover": { bgcolor: "#cbd3e3" },
                  fontWeight: 900,
                }}
              >
                <ChevronLeftRoundedIcon />
              </Button>

              <Typography sx={{ fontWeight: 900, color: TITLE, minWidth: 220, textAlign: "center" }}>
                {fmtDayLabel(days[0])} — {fmtDayLabel(days[6])}
              </Typography>

              <Button
                onClick={goNextWeek}
                variant="contained"
                sx={{
                  minWidth: 44,
                  px: 0,
                  borderRadius: 2,
                  bgcolor: "#d9dfec",
                  color: "#111",
                  "&:hover": { bgcolor: "#cbd3e3" },
                  fontWeight: 900,
                }}
              >
                <ChevronRightRoundedIcon />
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* ✅ Calendar */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "2px solid #c7d4e8",
              overflow: "hidden",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              bgcolor: "#fff",
            }}
          >
            <Box
              ref={scrollRef}
              sx={{
                maxHeight: 380,
                overflowY: "auto",
                scrollbarGutter: "stable",
                bgcolor: "#fff",
              }}
            >
              {/* sticky header */}
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  display: "grid",
                  gridTemplateColumns: "90px repeat(7, 1fr)",
                  borderBottom: "2px solid #c7d4e8",
                  bgcolor: "#fff",
                }}
              >
                <Box sx={{ p: 1.2, bgcolor: "#fff" }} />
                {days.map((d) => {
                  const todayCol = sameYMD(d, today);
                  const parts = fmtDayLabel(d).split(" ");
                  return (
                    <Box
                      key={d.toISOString()}
                      sx={{
                        p: 1,
                        bgcolor: todayCol ? "rgba(11,61,145,0.25)" : "#e9edf4",
                        borderLeft: "2px solid #c7d4e8",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        color: "#111",
                        boxShadow: todayCol ? `inset 0 -3px 0 rgba(11,61,145,0.35)` : "none",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{parts[0]}</Typography>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                        {parts.slice(1).join(" ")}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* body */}
              {loading ? (
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
                </Box>
              ) : err ? (
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{err}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)" }}>
                  {slots.map((slot) => {
                    const isNowRow = days.some((d) => isNowSlot(d, slot));
                    return (
                      <Box key={`${slot.h}:${slot.m}`} sx={{ display: "contents" }}>
                        {/* time label */}
                        <Box
                          ref={isNowRow ? nowRowRef : null}
                          sx={{
                            p: 1,
                            borderRight: "2px solid #c7d4e8",
                            borderBottom: "1px solid #d6e2f5",
                            bgcolor: isNowRow ? "rgba(42, 70, 118, 0.25)" : "#f4f7fb",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>
                            {slot.label}
                          </Typography>
                        </Box>

                        {days.map((dayDate) => {
                          const appt = apptFor(dayDate, slot);
                          const key = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}-${slot.h}-${slot.m}`;
                          const isSelected = selectedKey === key;

                          const todayCell = sameYMD(dayDate, today);
                          const nowCell = isNowSlot(dayDate, slot);
                          const cellBg = todayCell ? "rgba(11,61,145,0.04)" : "#fff";

                          return (
                            <Box
                              key={`${dayDate.toISOString()}-${slot.h}-${slot.m}`}
                              onClick={() => {
                                if (appt) setSelected(appt);
                                else setSelected(null);
                              }}
                              sx={{
                                borderLeft: "2px solid #c7d4e8",
                                borderBottom: "1px solid #d6e2f5",
                                p: 0.7,
                                bgcolor: cellBg,
                                cursor: appt ? "pointer" : "default",
                              }}
                            >
                              <Box
                                sx={{
                                  height: 28,
                                  borderRadius: 1.2,
                                  bgcolor: appt ? "#f6c7a8" : "#d6e7ff",
                                  border: nowCell
                                    ? `2px solid ${PRIMARY}`
                                    : appt
                                    ? `2px solid ${PRIMARY}`
                                    : "2px solid transparent",
                                  display: "grid",
                                  placeItems: "center",
                                  fontWeight: 900,
                                  color: "#111",
                                  opacity: appt ? 1 : 0.95,
                                  boxShadow: appt ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                                  outline: isSelected ? "3px solid rgba(11,61,145,0.25)" : "none",
                                }}
                              >
                                {appt ? (
                                  <Typography sx={{ fontWeight: 900, fontSize: 10 }} noWrap>
                                    {appt?.service || ""}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontSize: 11, color: "transparent" }}>—</Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Details */}
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              borderRadius: 2,
              border: "2px solid #c7d4e8",
              bgcolor: "#fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              p: 2,
              minHeight: 110,
            }}
          >
            <Typography sx={{ fontWeight: 900, color: "#111", mb: 1 }}>
              Λεπτομέρειες Ραντεβού
            </Typography>

            {!selectedDetails ? (
              <Typography sx={{ color: MUTED, fontWeight: 800 }}>
                Επίλεξε ένα επιβεβαιωμένο ραντεβού από το ημερολόγιο.
              </Typography>
            ) : (
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 14 }}>
                    Όνομα Κατοικίδιου: {selectedDetails.petName} &nbsp;&nbsp;&nbsp; Υπηρεσία:{" "}
                    {selectedDetails.service}
                  </Typography>
                  <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 14, mt: 0.6 }}>
                    Ημερομηνία: {selectedDetails.date} {selectedDetails.time} &nbsp;&nbsp;&nbsp;
                    Ιδιοκτήτης: {selectedDetails.ownerName}
                  </Typography>
                </Box>

                <Button
                  onClick={() => {
                    if (!selected?.id) return;
                    if (busyId) return;
                    setRejectReason("");
                    setRejectOpen(true);
                  }}
                  disabled={busyId && String(busyId) === String(selected?.id)}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.2,
                    px: 3,
                    bgcolor: "#c62828",
                    "&:hover": { bgcolor: "#8e1c1c" },
                    fontWeight: 900,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                  }}
                >
                  Ακύρωση
                </Button>
              </Stack>
            )}
          </Paper>

          {/* POPUP ΑΚΥΡΩΣΗΣ */}
          <Dialog
            open={rejectOpen}
            onClose={() => {
              if (rejectSaving) return;
              setRejectOpen(false);
              setRejectReason("");
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 900, color: TITLE }}>Ακύρωση ραντεβού</DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#111", mb: 1 }}>
                Είστε βέβαιοι ότι θέλετε να ακυρώσετε το ραντεβού;
              </Typography>

              <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mb: 1.2 }}>
                (Προαιρετικό) Γράψε τον λόγο ακύρωσης:
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Π.χ. Δεν υπάρχει διαθέσιμη ώρα / έκτακτο περιστατικό..."
              />

              <Typography sx={{ mt: 1.2, color: MUTED, fontWeight: 800, fontSize: 12 }}>
                {selected?.petName ? `Κατοικίδιο: ${selected.petName} • ` : ""}
                {selected?.when ? `${fmtDate(selected.when)} ${fmtTime(selected.when)}` : ""}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => {
                  if (rejectSaving) return;
                  setRejectOpen(false);
                  setRejectReason("");
                }}
                variant="contained"
                disabled={rejectSaving}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#b7bcc3",
                  color: "#000",
                  "&:hover": { bgcolor: "#a9aeb6" },
                  fontWeight: 900,
                }}
              >
                Ακύρωση
              </Button>

              <Button
                onClick={confirmCancel}
                variant="contained"
                disabled={rejectSaving}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: PRIMARY_HOVER },
                  fontWeight: 900,
                }}
              >
                {rejectSaving ? "Γίνεται ακύρωση..." : "Επιβεβαίωση"}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </VetShell>
  );
}
