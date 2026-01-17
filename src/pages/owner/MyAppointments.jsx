import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Tabs,
  Tab,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext"; 
import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import Pager from "../../components/Pager"; 


const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function isValidPhoto(p) {
  return typeof p === "string" && (p.startsWith("/") || p.startsWith("data:") || p.startsWith("http"));
}

function getPetPhotoFromProfile(pet) {
  const candidate = pet?.photo || pet?.photoUrl || pet?.image || pet?.avatar || pet?.img || "";
  return isValidPhoto(candidate) ? candidate : "";
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
  const label = status || "Εκκρεμές";

  const color =
    label === "Επιβεβαιωμένο"
      ? "success"
      : label === "Εκκρεμές"
      ? "warning"
      : label === "Ακυρωμένο"
      ? "error"
      : label === "Ολοκληρωμένο"
      ? "info"
      : "default";

  return <Chip size="small" label={label} color={color} variant="filled" />;
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

function AppointmentRow({ item, pet, onView, onCancel }) {
  const now = Date.now();
  const t = new Date(item?.when || 0).getTime();

  const rawStatus = item?.status || "Εκκρεμές";
  const status = rawStatus === "Ακυρωμένο" ? "Ακυρωμένο" : t && t < now ? "Ολοκληρωμένο" : rawStatus;

  const canCancel = status !== "Ακυρωμένο" && status !== "Ολοκληρωμένο";
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
                alt={item?.petName || "pet"}
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
                {item?.petName || pet?.name || "Κατοικίδιο"}
              </Typography>

              <Typography sx={{ fontSize: 12, color: MUTED }}>{item?.service || "Ραντεβού"}</Typography>

              <StatusChip status={status} />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: TITLE }}>
              <Typography sx={{ fontSize: 12, color: TITLE }}>
                {item?.vetName ? (
                  <>
                    {item.vetName}
                    <br />
                  </>
                ) : null}
                {fmtDate(item?.when)} &nbsp;{fmtTime(item?.when)}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="column" spacing={1} alignItems="flex-end">
          <Typography sx={{ fontSize: 12, color: TITLE, mr: 1, display: { xs: "none", md: "block" } }}>
            Υποβλήθηκε: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString("el-GR") : "—"}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              onClick={() => onView(item)}
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

            {canCancel && (
              <Button
                onClick={() => onCancel(item)}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#d32f2f",
                  "&:hover": { bgcolor: "#b71c1c" },
                fontWeight: 900,
                }}
              >
                Ακύρωση
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);

  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Dialog state για ακύρωση
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelItem, setCancelItem] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);

  // ✅ Pagination
  const rowsPerPage = 5;          // άλλαξε το αν θες (π.χ. 3/5/6)
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!user?.id) {
        if (!alive) return;
        setAppointments([]);
        setPets([]);
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setLoading(false);
        return;
      }

      const [apptsData, petsData] = await Promise.all([
        fetchJSON(`/api/appointments?ownerId=${encodeURIComponent(String(user.id))}`),
        fetchJSON(`/api/pets?ownerId=${encodeURIComponent(String(user.id))}`),
      ]);

      if (!alive) return;
      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setPets(Array.isArray(petsData) ? petsData : []);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης ραντεβού από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const petMap = useMemo(() => new Map((pets || []).map((p) => [String(p.id), p])), [pets]);

  const all = useMemo(() => [...appointments], [appointments]);


  const filtered = useMemo(() => {
  const now = Date.now();

  const getTime = (x) => {
    const t = new Date(x?.when || 0).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  // 1) Φιλτράρισμα
  const base =
    tab === 0
      ? all.filter((x) => {
          const t = getTime(x);
          const status = x?.status || "Εκκρεμές";
          return t >= now && status !== "Ακυρωμένο";
        })
      : all.filter((x) => {
          const t = getTime(x);
          return t < now || x?.status === "Ακυρωμένο";
        });

    // 2) Sorting ανά tab
    base.sort((a, b) => {
      const ta = getTime(a);
      const tb = getTime(b);

      // Επερχόμενα: πιο σύντομο -> πιο μακρινό
      if (tab === 0) return ta - tb;

      // Ιστορικό: πιο πρόσφατο -> πιο παλιό
      return tb - ta;
    });

    return base;
  }, [all, tab]);

  // ✅ Page count + rows της τρέχουσας σελίδας
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / rowsPerPage)),
    [filtered.length, rowsPerPage]
  );

  // όταν αλλάζει tab, γύρνα στη σελίδα 1
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // αν μειωθεί ο αριθμός σελίδων (π.χ. ακύρωση), διόρθωσε page
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleCreate = () => navigate("/owner/vets");
  const handleView = (item) => navigate(`/owner/appointments/${item.id}`);

  // ✅ ανοίγει popup αντί για confirm
  const handleCancel = (item) => {
    const status = item?.status || "Εκκρεμές";
    const t = new Date(item?.when || 0).getTime();
    const computedStatus = status === "Ακυρωμένο" ? "Ακυρωμένο" : t && t < Date.now() ? "Ολοκληρωμένο" : status;
    if (computedStatus === "Ακυρωμένο" || computedStatus === "Ολοκληρωμένο") return;

    setCancelItem(item);
    setCancelReason("");
    setCancelOpen(true);
  };

  const closeCancelDialog = () => {
    if (cancelSaving) return;
    setCancelOpen(false);
    setCancelItem(null);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelItem?.id || !user?.id) return;

    try {
      setCancelSaving(true);

      // 1) PATCH appointment -> Ακυρωμένο
      const payload = {
        status: "Ακυρωμένο",
        canceledAt: new Date().toISOString(),
        cancelReason: cancelReason.trim() || "",
      };

      const updated = await fetchJSON(`/api/appointments/${encodeURIComponent(String(cancelItem.id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 2) Update local state για να φανεί άμεσα
      setAppointments((prev) =>
        prev.map((x) => (String(x.id) === String(cancelItem.id) ? { ...x, ...updated } : x))
      );

      // 3) Notifications (owner + vet)
      // Προσοχή: παίρνουμε ids από updated αν υπάρχουν, αλλιώς από cancelItem
      const apptId = String(updated?.id ?? cancelItem.id);
      const vetId = String(updated?.vetId ?? cancelItem.vetId ?? "");
      const vetName = String(updated?.vetName ?? cancelItem.vetName ?? "Κτηνίατρος");
      const petName = String(updated?.petName ?? cancelItem.petName ?? "κατοικίδιο");
      const whenISO = String(updated?.when ?? cancelItem.when ?? "");

      const dateStr = whenISO ? fmtDate(whenISO) : "—";
      const timeStr = whenISO ? fmtTime(whenISO) : "—";

      const ownerNotif = makeNotif({
        userId: user.id,
        type: "error",
        title: "Ακύρωση ραντεβού",
        message: `Ακυρώσατε το ραντεβού με ${vetName} για ${petName} στις ${dateStr} ${timeStr}.`,
        meta: { apptId, vetId, petName, when: whenISO },
      });

      const vetNotif = vetId
        ? makeNotif({
            userId: vetId, // ⚠️ Εδώ θεωρούμε ότι το "userId" του vet στα notifications είναι vetId
            type: "error",
            title: "Ακύρωση ραντεβού από ιδιοκτήτη",
            message: `Ακυρώθηκε ραντεβού για ${petName} στις ${dateStr} ${timeStr}.`,
            meta: { apptId, ownerId: String(user.id), petName, when: whenISO },
          })
        : null;

      // Κάνε POST (και τα 2 αν υπάρχει vetId)
      await createNotification(ownerNotif);
      if (vetNotif) await createNotification(vetNotif);

      // 4) Κλείσε dialog
      closeCancelDialog();
      setCancelSaving(false);
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ακύρωσης. Δοκίμασε ξανά.");
      setCancelSaving(false);
    }
  };

  function OwnerPageShell({ children }) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
        <PublicNavbar />

        <Box
          sx={{
            flex: 1,
            display: { xs: "block", lg: "flex" },
            alignItems: "flex-start",
          }}
        >
          {/* spacer ώστε το content να μην πάει κάτω από το fixed sidebar */}
          <Box
            sx={{
              width: OWNER_SIDEBAR_W,
              flex: `0 0 ${OWNER_SIDEBAR_W}px`,
              display: { xs: "none", lg: "block" },
            }}
          />

          {/* fixed sidebar κάτω από PublicNavbar */}
          <OwnerNavbar mode="navbar" />

          {/* main */}
          <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </Box>

        <Footer />
      </Box>
    );
  }


  return (
    <OwnerPageShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 28 }}>Ραντεβού</Typography>
            <Typography sx={{ mt: 0.6, color: MUTED, maxWidth: 820 }}>
              Εδώ θα βρείτε όλα τα ραντεβού που έχετε προγραμματίσει για τα κατοικίδιά σας.
              <br />
              Παρακολουθήστε την κατάστασή τους ή κλείστε ένα νέο ραντεβού εύκολα και γρήγορα.
            </Typography>
          </Box>

          <Button
            onClick={handleCreate}
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              bgcolor: PRIMARY,
              "&:hover": { bgcolor: PRIMARY_HOVER },
              boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
              fontWeight: 900,
            }}
          >
            Νέο Ραντεβού
          </Button>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid #d6e2f5",
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ bgcolor: "#ffffff" }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                px: 1,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 900,
                  color: TITLE,
                },
                "& .MuiTabs-indicator": {
                  height: 4,
                  borderRadius: 99,
                },
              }}
            >
              <Tab label="Επερχόμενα" />
              <Tab label="Ιστορικό" />
            </Tabs>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            {loading ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e6edf7",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
              </Paper>
            ) : err ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.12)",
                  bgcolor: "#fff3f3",
                }}
              >
                <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
              </Paper>
            ) : filtered.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  border: "1px solid #e6edf7",
                  bgcolor: "#ffffff",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: TITLE }}>Δεν υπάρχουν ραντεβού εδώ</Typography>
                <Typography sx={{ mt: 0.6, color: MUTED }}>
                  Πάτησε “+ Νέο Ραντεβού” για να κλείσεις ένα νέο.
                </Typography>
              </Paper>
            ) : (
              <>
                <Stack spacing={1.3}>
                  {pageRows.map((item) => (
                    <AppointmentRow
                      key={item.id}
                      item={item}
                      pet={petMap.get(String(item?.petId))}
                      onView={handleView}
                      onCancel={handleCancel}
                    />
                  ))}
                </Stack>

                {/* ✅ PAGER κάτω δεξιά */}
                <Pager page={page} pageCount={pageCount} onChange={setPage} color={PRIMARY} maxButtons={4} />
              </>
            )}
          </Box>
        </Paper>

        {/* ✅ POPUP ΑΚΥΡΩΣΗΣ (μένει ίδιο, απλά είναι μέσα στο shell) */}
        <Dialog
          open={cancelOpen}
          onClose={closeCancelDialog}
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
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Π.χ. Έκτακτο πρόβλημα / δεν μπορώ να παρευρεθώ..."
            />

            <Typography sx={{ mt: 1.2, color: MUTED, fontWeight: 800, fontSize: 12 }}>
              {cancelItem?.vetName ? `Κτηνίατρος: ${cancelItem.vetName} • ` : ""}
              {cancelItem?.when ? `${fmtDate(cancelItem.when)} ${fmtTime(cancelItem.when)}` : ""}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={closeCancelDialog}
              variant="contained"
              disabled={cancelSaving}
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
              disabled={cancelSaving}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
              }}
            >
              {cancelSaving ? "Γίνεται ακύρωση..." : "Επιβεβαίωση"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </OwnerPageShell>
  );
}
