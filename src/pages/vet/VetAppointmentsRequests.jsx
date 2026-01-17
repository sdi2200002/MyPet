import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
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

function isValidPhoto(p) {
  return (
    typeof p === "string" &&
    (p.startsWith("/") || p.startsWith("data:") || p.startsWith("http"))
  );
}

function getPetPhotoFromProfile(pet) {
  const candidate = pet?.photo || pet?.photoUrl || pet?.image || pet?.avatar || pet?.img || "";
  return isValidPhoto(candidate) ? candidate : "";
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

/** ✅ Tabs όπως screenshot (ίδιο στυλ/μορφή) */
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

async function createNotification(payload) {
  return fetchJSON(`/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function makeNotif({ userId, type, title, message, meta }) {
  return {
    userId: String(userId),
    type: type || "info",            // info | success | warning | error
    title: title || "",
    message: message || "",
    meta: meta || {},                // π.χ. { apptId, petId, vetId }
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}

function StatusChip({ status }) {
  const s = status || "Εκκρεμές";
  const color =
    s === "Επιβεβαιωμένο"
      ? "success"
      : s === "Εκκρεμές"
      ? "warning"
      : s === "Ακυρωμένο"
      ? "error"
      : s === "Ολοκληρωμένο"
      ? "info"
      : "default";
  return <Chip size="small" label={s} color={color} variant="filled" />;
}

/** ✅ Row κάρτας όπως στη φωτο (εικόνα αριστερά, info, buttons δεξιά) */
function RequestRow({ appt, pet, ownerName, onView, onReject, onAccept, busy }) {
  const now = Date.now();
  const t = new Date(appt?.when || 0).getTime();

  const rawStatus = appt?.status || "Εκκρεμές";
  const status = rawStatus === "Ακυρωμένο" ? "Ακυρωμένο" : t && t < now ? "Ολοκληρωμένο" : rawStatus;

  const petPhoto = getPetPhotoFromProfile(pet);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        bgcolor: "white",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Box
                sx={{
                width: 70,
                height: 70,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #d5deeb",
                flex: "0 0 auto",
                bgcolor: "#eef1f4",
                display: "grid",
                placeItems: "center",
                }}
            >
                {petPhoto ? (
                <Box
                    component="img"
                    src={petPhoto}
                    alt={appt?.petName || "pet"}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = "none";
                    }}
                />
                ) : (
                <Typography sx={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>Χωρίς φωτο</Typography>
                )}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 900, color: TITLE }} noWrap>
                        {appt?.petName || pet?.name || "Κατοικίδιο"}
                    </Typography>
        
                    <Typography sx={{ fontSize: 12, color: MUTED }}>{appt?.service || "Ραντεβού"}</Typography>
        
                    <StatusChip status={status} />
                </Stack>
        
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: TITLE }}>
                    <Typography sx={{ fontSize: 12, color: TITLE }}>
                        {ownerName}
                        <br />
                        {fmtDate(appt?.when)} &nbsp;{fmtTime(appt?.when)}
                    </Typography>
                </Stack>
            </Box>
        </Stack>
    
        <Stack direction="column" spacing={1} alignItems="flex-end">
            <Typography sx={{ fontSize: 12, color: TITLE, mr: 1, display: { xs: "none", md: "block" } }}>
                Υποβλήθηκε: {appt?.createdAt ? new Date(appt.createdAt).toLocaleDateString("el-GR") : "—"}
            </Typography>

            {/* right buttons */}
            <Stack direction="row" spacing={1.2} alignItems="center">
                <Button
                    onClick={() => onView(appt)}
                    variant="contained"
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
                <Button
                    onClick={() => onAccept(appt)}
                    disabled={busy}
                    variant="contained"
                    sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 1.2,
                    px: 2.2,
                    bgcolor: "#2e7d32",
                    "&:hover": { bgcolor: "#1f5f23" },
                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    }}
                >
                    Αποδοχή
                </Button>
                <Button
                    onClick={() => onReject(appt)}
                    disabled={busy}
                    variant="contained"
                    sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 1.2,
                    px: 2.2,
                    bgcolor: "#c62828",
                    "&:hover": { bgcolor: "#8e1c1c" },
                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    }}
                >
                    Απόρριψη
                </Button>
            </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

function VetShell({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        {/* spacer ώστε το content να μην πάει κάτω από fixed sidebar */}
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

export default function VetAppointmentsRequests() {
  const navigate = useNavigate();
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

  const [appointments, setAppointments] = useState([]);
  const [petsById, setPetsById] = useState(new Map());
  const [ownersById, setOwnersById] = useState(new Map());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  // ✅ Pagination
  const rowsPerPage = 5;
  const [page, setPage] = useState(1);

  // ✅ Reject dialog state (σαν του owner)
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!user?.id) {
        if (!alive) return;
        setAppointments([]);
        setPetsById(new Map());
        setOwnersById(new Map());
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setLoading(false);
        return;
      }

      // ⚠️ Αν το vetId στα appointments είναι vets.id (πχ 1) και user.id είναι 2,
      // εδώ ίσως χρειάζεται user.vetProfileId αντί για user.id.
      const vetKey = String(user?.vetProfileId || user.id);

      const appts = await fetchJSON(
        `/api/appointments?vetId=${encodeURIComponent(vetKey)}&status=${encodeURIComponent("Εκκρεμές")}`
        );
      const pending = Array.isArray(appts) ? appts : [];



      const petIds = [
        ...new Set(pending.map((x) => String(x?.petId || "")).filter(Boolean)),
      ];
      const ownerIds = [
        ...new Set(pending.map((x) => String(x?.ownerId || "")).filter(Boolean)),
      ];

      const [petsArr, ownersArr] = await Promise.all([
        Promise.all(
          petIds.map((id) =>
            fetchJSON(`/api/pets/${encodeURIComponent(id)}`).catch(() => null)
          )
        ),
        Promise.all(
          ownerIds.map((id) =>
            fetchJSON(`/api/users/${encodeURIComponent(id)}`).catch(() => null)
          )
        ),
      ]);

      const petsMap = new Map();
      (petsArr || []).filter(Boolean).forEach((p) => petsMap.set(String(p.id), p));

      const ownersMap = new Map();
      (ownersArr || []).filter(Boolean).forEach((o) => ownersMap.set(String(o.id), o));

      if (!alive) return;

      setAppointments(pending);
      setPetsById(petsMap);
      setOwnersById(ownersMap);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης αιτημάτων από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [user?.id, user?.vetProfileId]);

  const sorted = useMemo(() => {
    const getTime = (x) => {
      const t = new Date(x?.when || 0).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const arr = [...appointments];
    arr.sort((a, b) => getTime(a) - getTime(b));
    return arr;
  }, [appointments]);

  // ✅ Pagination computed
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  }, [sorted.length, rowsPerPage]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const patchAppointment = async (id, payload) => {
    return fetchJSON(`/api/appointments/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // ✅ ανοίγει popup απόρριψης (αντί να κάνει patch κατευθείαν)
  const handleReject = (appt) => {
    if (!appt?.id) return;
    if (busyId) return;

    setRejectItem(appt);
    setRejectReason("");
    setRejectOpen(true);
  };

  const closeRejectDialog = () => {
    if (rejectSaving) return;
    setRejectOpen(false);
    setRejectItem(null);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectItem?.id) return;

    try {
        setRejectSaving(true);
        setBusyId(String(rejectItem.id));

        // 1) PATCH -> Ακυρωμένο (παίρνουμε updated)
        const updated = await patchAppointment(rejectItem.id, {
        status: "Ακυρωμένο",
        canceledAt: new Date().toISOString(),
        cancelReason: (rejectReason || "").trim() || "Απόρριψη από κτηνίατρο",
        });

        // 2) Notification στον ιδιοκτήτη
        const ownerId = updated?.ownerId ?? rejectItem?.ownerId;
        const apptId = String(updated?.id ?? rejectItem.id);
        const petName = String(updated?.petName ?? rejectItem?.petName ?? "κατοικίδιο");
        const vetName = String(updated?.vetName ?? user?.name ?? "Κτηνίατρος");
        const whenISO = String(updated?.when ?? rejectItem?.when ?? "");
        const reason = String(updated?.cancelReason ?? "").trim();

        const dateStr = whenISO ? fmtDate(whenISO) : "—";
        const timeStr = whenISO ? fmtTime(whenISO) : "—";

        if (ownerId) {
        await createNotification(
            makeNotif({
            userId: ownerId,
            type: "error",
            title: "Ακύρωση / Απόρριψη ραντεβού",
            message: `Το αίτημα ραντεβού σας με ${vetName} για ${petName} στις ${dateStr} ${timeStr} ακυρώθηκε/απορρίφθηκε.${reason ? ` Λόγος: ${reason}` : ""}`,
            meta: {
                apptId,
                vetId: String(updated?.vetId ?? rejectItem?.vetId ?? ""),
                ownerId: String(ownerId),
                petName,
                when: whenISO,
                status: "Ακυρωμένο",
                cancelReason: reason,
            },
            })
        );
        }

        // 3) Βγάλτο από τα αιτήματα
        setAppointments((prev) =>
        prev.filter((x) => String(x.id) !== String(rejectItem.id))
        );

        closeRejectDialog();
    } catch (e) {
        console.error(e);
        alert("Αποτυχία απόρριψης. Δοκίμασε ξανά.");
    } finally {
        setRejectSaving(false);
        setBusyId(null);
    }
  };


  const handleAccept = async (appt) => {
    if (!appt?.id) return;

    try {
        setBusyId(String(appt.id));

        // 1) PATCH -> Επιβεβαιωμένο (παίρνουμε και το updated)
        const updated = await patchAppointment(appt.id, {
        status: "Επιβεβαιωμένο",
        confirmedAt: new Date().toISOString(),
        });

        // 2) Notification στον ιδιοκτήτη
        const ownerId = updated?.ownerId ?? appt?.ownerId;
        const apptId = String(updated?.id ?? appt.id);
        const petName = String(updated?.petName ?? appt?.petName ?? "κατοικίδιο");
        const vetName = String(updated?.vetName ?? user?.name ?? "Κτηνίατρος");
        const whenISO = String(updated?.when ?? appt?.when ?? "");

        const dateStr = whenISO ? fmtDate(whenISO) : "—";
        const timeStr = whenISO ? fmtTime(whenISO) : "—";

        if (ownerId) {
        await createNotification(
            makeNotif({
            userId: ownerId,
            type: "success",
            title: "Επιβεβαίωση ραντεβού",
            message: `Το ραντεβού σας με ${vetName} για ${petName} στις ${dateStr} ${timeStr} επιβεβαιώθηκε.`,
            meta: {
                apptId,
                vetId: String(updated?.vetId ?? appt?.vetId ?? ""),
                ownerId: String(ownerId),
                petName,
                when: whenISO,
                status: "Επιβεβαιωμένο",
            },
            })
        );
        }

        // 3) Βγάλτο από τα αιτήματα (αφού πλέον δεν είναι εκκρεμές)
        setAppointments((prev) => prev.filter((x) => String(x.id) !== String(appt.id)));
    } catch (e) {
        console.error(e);
        alert("Αποτυχία αποδοχής. Δοκίμασε ξανά.");
    } finally {
        setBusyId(null);
    }
  };


  return (
    <VetShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <AppBreadcrumbs />

        {/* ✅ Tabs */}
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
          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 18, mb: 1 }}>
            Αιτήματα Ραντεβού
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
          ) : err ? (
            <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{err}</Typography>
          ) : sorted.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 900, color: TITLE }}>
                Δεν υπάρχουν αιτήματα αυτή τη στιγμή
              </Typography>
              <Typography sx={{ mt: 0.6, color: MUTED, fontWeight: 700 }}>
                Όταν κάποιος ιδιοκτήτης ζητήσει ραντεβού, θα εμφανιστεί εδώ.
              </Typography>
            </Box>
          ) : (
            <>
              <Stack spacing={1.2}>
                {pageRows.map((appt) => {
                  const pet = petsById.get(String(appt?.petId));
                  const owner = ownersById.get(String(appt?.ownerId));
                  const ownerName =
                    owner?.name || owner?.fullName || owner?.username || "";

                  return (
                    <RequestRow
                      key={appt.id}
                      appt={appt}
                      pet={pet}
                      ownerName={ownerName}
                        onView={(a) => navigate(`/vet/appointments/${a.id}`)}
                      busy={String(busyId) === String(appt.id)}
                      onReject={handleReject}
                      onAccept={handleAccept}
                    />
                  );
                })}
              </Stack>

              <Pager
                page={page}
                pageCount={pageCount}
                onChange={setPage}
                color={PRIMARY}
                maxButtons={4}
              />
            </>
          )}
        </Paper>

        {/* ✅ POPUP ΑΠΟΡΡΙΨΗΣ (ίδιο concept με Owner) */}
        <Dialog
          open={rejectOpen}
          onClose={closeRejectDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: TITLE }}>
            Απόρριψη αιτήματος
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ fontWeight: 900, color: "#111", mb: 1 }}>
              Είστε βέβαιοι ότι θέλετε να απορρίψετε το αίτημα;
            </Typography>

            <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mb: 1.2 }}>
              (Προαιρετικό) Γράψε τον λόγο απόρριψης:
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Π.χ. Δεν υπάρχει διαθέσιμη ώρα / απουσία κτηνιάτρου..."
            />

            <Typography sx={{ mt: 1.2, color: MUTED, fontWeight: 800, fontSize: 12 }}>
              {rejectItem?.petName ? `Κατοικίδιο: ${rejectItem.petName} • ` : ""}
              {rejectItem?.when ? `${fmtDate(rejectItem.when)} ${fmtTime(rejectItem.when)}` : ""}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={closeRejectDialog}
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
              onClick={confirmReject}
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
              {rejectSaving ? "Γίνεται απόρριψη..." : "Επιβεβαίωση"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </VetShell>
  );
}
