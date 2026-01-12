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
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext"; // ✅ όπως MyPets

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function isValidPhoto(p) {
  return typeof p === "string" && (p.startsWith("/") || p.startsWith("data:") || p.startsWith("http"));
}

function getPetPhotoFromProfile(pet) {
  // ✅ πάρε από pet profile (δοκίμασε και εναλλακτικά keys)
  const candidate =
    pet?.photo ||
    pet?.photoUrl ||
    pet?.image ||
    pet?.avatar ||
    pet?.img ||
    "";

  return isValidPhoto(candidate) ? candidate : "";
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
  return d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

function AppointmentRow({ item, pet, onView, onCancel }) {
  const now = Date.now();
  const t = new Date(item?.when || 0).getTime();

  const rawStatus = item?.status || "Εκκρεμές";
  const status =
    rawStatus === "Ακυρωμένο" ? "Ακυρωμένο" : t && t < now ? "Ολοκληρωμένο" : rawStatus;

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
                  // ✅ δεν θέλεις fallback, άρα αν σπάσει -> κρύψ'το και δείξε text
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Typography sx={{ fontSize: 11, color: "#6b7a90", fontWeight: 700 }}>
                Χωρίς φωτο
              </Typography>
            )}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: 900, color: "#0d2c54" }} noWrap>
                {item?.petName || pet?.name || "Κατοικίδιο"}
              </Typography>

              <Typography sx={{ fontSize: 12, color: "#6b7a90" }}>
                {item?.service || "Ραντεβού"}
              </Typography>

              <StatusChip status={status} />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: "#0d2c54" }}>
              <Typography sx={{ fontSize: 12, color: "#0d2c54" }}>
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
          <Typography sx={{ fontSize: 12, color: "#0d2c54", mr: 1, display: { xs: "none", md: "block" } }}>
            Υποβλήθηκε: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString("el-GR") : "—"}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {canCancel && (
              <Button
                onClick={() => onCancel(item)}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#d32f2f",
                  "&:hover": { bgcolor: "#b71c1c" },
                }}
              >
                Ακύρωση
              </Button>
            )}

            <Button
              onClick={() => onView(item)}
              variant="contained"
              startIcon={<VisibilityOutlinedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
              }}
            >
              Προβολή
            </Button>
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

  // ✅ Load appointments + pets από server (μόνο του owner)
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

      // ✅ parallel fetch
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

  const petMap = useMemo(() => {
    return new Map((pets || []).map((p) => [String(p.id), p]));
  }, [pets]);

  const all = useMemo(() => {
    const merged = [...appointments];
    merged.sort((a, b) => new Date(a?.when || 0).getTime() - new Date(b?.when || 0).getTime());
    return merged;
  }, [appointments]);

  const filtered = useMemo(() => {
    const now = Date.now();

    const getTime = (x) => {
      const t = new Date(x?.when || 0).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    if (tab === 0) {
      // Επερχόμενα: μελλοντικά ΚΑΙ όχι ακυρωμένα
      return all.filter((x) => {
        const t = getTime(x);
        const status = x?.status || "Εκκρεμές";
        return t >= now && status !== "Ακυρωμένο";
      });
    }

    // Ιστορικό: όσα έχουν περάσει Ή είναι ακυρωμένα
    return all.filter((x) => {
      const t = getTime(x);
      return t < now || x?.status === "Ακυρωμένο";
    });
  }, [all, tab]);

  const handleCreate = () => navigate("/owner/vets");
  const handleView = (item) => navigate(`/owner/appointments/${item.id}`);

  const handleCancel = async (item) => {
    const status = item?.status || "Εκκρεμές";
    if (status === "Ακυρωμένο" || status === "Ολοκληρωμένο") return;

    const ok = confirm("Θες σίγουρα να ακυρώσεις το ραντεβού;");
    if (!ok) return;

    try {
      const updated = await fetchJSON(`/api/appointments/${encodeURIComponent(String(item.id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Ακυρωμένο" }),
      });

      setAppointments((prev) =>
        prev.map((x) => (String(x.id) === String(item.id) ? { ...x, ...updated } : x))
      );
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ακύρωσης. Δοκίμασε ξανά.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0d2c54", fontSize: 28 }}>
                Ραντεβού
              </Typography>
              <Typography sx={{ mt: 0.6, color: "#6b7a90", maxWidth: 820 }}>
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
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
                boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
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
                    color: "#0d2c54",
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
                  <Typography sx={{ color: "#6b7a90", fontWeight: 800 }}>Φόρτωση...</Typography>
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
                  <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>
                    Δεν υπάρχουν ραντεβού εδώ
                  </Typography>
                  <Typography sx={{ mt: 0.6, color: "#6b7a90" }}>
                    Πάτησε “+ Νέο Ραντεβού” για να κλείσεις ένα νέο.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.3}>
                  {filtered.map((item) => (
                    <AppointmentRow
                      key={item.id}
                      item={item}
                      pet={petMap.get(String(item?.petId))}
                      onView={handleView}
                      onCancel={handleCancel}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
