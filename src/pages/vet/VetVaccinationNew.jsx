import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useAuth } from "../../auth/AuthContext";

import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
  fieldBorder: "#a7b8cf",
  muted: "#6b7a90",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    borderRadius: 2,
    "& fieldset": { borderColor: COLORS.fieldBorder },
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function todayYMD() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Panel({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 6,
        bgcolor: COLORS.panelBg,
        border: `2px solid ${COLORS.panelBorder}`,
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
      }}
    >
      {children}
    </Paper>
  );
}

function AuthedShell({ children }) {
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

      <Box
        sx={{
          flex: 1,
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
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

/**
 * ✅ Vet-only page
 * Route suggestion:
 *   /vet/mypets/:id/booklet/vaccinations/new
 *
 * Saves into:
 *   PATCH /api/pets/:id
 *   { vaccinations: [...old, newVaccine], updatedAt: ... }
 */
export default function VetVaccinationNew() {
  const navigate = useNavigate();
  const { id } = useParams(); // petId (string in your db.json)
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [loadingPet, setLoadingPet] = useState(true);
  const [errPet, setErrPet] = useState("");

  const [saving, setSaving] = useState(false);

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const [form, setForm] = useState({
    vaccine: "",
    batch: "",
    vaccinatedAt: todayYMD(),
    expiresAt: "",
  });

  const handleChange = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  // -------- Vet guard ----------
  useEffect(() => {
    // If your app already guards vet routes, you can remove this.
    if (user && user.role !== "vet") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // -------- Load pet ----------
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingPet(true);
      setErrPet("");

      try {
        const p = await fetchJSON(`/api/pets/${encodeURIComponent(String(id))}`);
        if (!alive) return;

        // Optional: allow only if vet follows this pet (pet.vetId matches vet user id)
        // If your "pet.vetId" is not the same system as "users vet id", comment this out.
        // if (String(p?.vetId) !== String(user?.id)) {
        //   setErrPet("Δεν έχετε πρόσβαση σε αυτό το κατοικίδιο.");
        //   setPet(null);
        //   setLoadingPet(false);
        //   return;
        // }

        setPet(p);
        setLoadingPet(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErrPet("Δεν βρέθηκε το κατοικίδιο.");
        setPet(null);
        setLoadingPet(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const errors = useMemo(() => {
    const e = {};
    if (!String(form.vaccine || "").trim()) e.vaccine = "Υποχρεωτικό πεδίο.";
    if (!String(form.batch || "").trim()) e.batch = "Υποχρεωτικό πεδίο.";
    if (!form.vaccinatedAt) e.vaccinatedAt = "Υποχρεωτικό πεδίο.";
    if (!form.expiresAt) e.expiresAt = "Υποχρεωτικό πεδίο.";
    if (form.vaccinatedAt && form.expiresAt && form.expiresAt < form.vaccinatedAt) {
      e.expiresAt = "Η λήξη πρέπει να είναι μετά την ημερομηνία εμβολιασμού.";
    }
    return e;
  }, [form]);

  const isValid = !errors.vaccine && !errors.batch && !errors.vaccinatedAt && !errors.expiresAt;

  async function onSubmit() {
    ["vaccine", "batch", "vaccinatedAt", "expiresAt"].forEach(touch);
    if (!isValid) return;

    if (!user?.id) {
      alert("Δεν υπάρχει συνδεδεμένος χρήστης.");
      return;
    }

    setSaving(true);
    try {
      // 1) read latest pet
      const p = await fetchJSON(`/api/pets/${encodeURIComponent(String(id))}`);

      const newVaccine = {
        id: `v_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        vaccine: String(form.vaccine).trim(),
        batch: String(form.batch).trim(),
        vaccinatedAt: form.vaccinatedAt,
        expiresAt: form.expiresAt,
        vetId: String(user.id),
        vetName: user.name || user.firstName || "—",
        createdAt: new Date().toISOString(),
      };

      const nextVaccinations = [...(p?.vaccinations || []), newVaccine];

      // 2) patch pet
      await fetchJSON(`/api/pets/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccinations: nextVaccinations,
          updatedAt: new Date().toISOString(),
        }),
      });

      // go back to vaccinations list
      navigate(`/vet/mypets/${id}/booklet/vaccinations`);
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthedShell>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>
          Καταγραφή Εμβολίου
        </Typography>

        <Typography sx={{ color: COLORS.muted, fontWeight: 700, mt: 0.5 }}>
          {loadingPet
            ? "Φόρτωση κατοικιδίου..."
            : errPet
              ? errPet
              : `Κατοικίδιο: ${pet?.name || "—"} (Microchip: ${pet?.microchip || "—"})`}
        </Typography>

        <Panel>
          {loadingPet ? (
            <Typography sx={{ color: COLORS.muted, fontWeight: 800 }}>Φόρτωση...</Typography>
          ) : errPet ? (
            <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{errPet}</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                maxWidth: 760,
                mx: "auto",
                mt: 1,
              }}
            >
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Κατασκευαστής & ονομασία εμβολίου *"
                  value={form.vaccine}
                  onChange={handleChange("vaccine")}
                  onBlur={() => touch("vaccine")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.vaccine && !!touched.vaccine}
                  helperText={touched.vaccine ? errors.vaccine || " " : " "}
                />

                <TextField
                  label="Αριθμός παρτίδας *"
                  value={form.batch}
                  onChange={handleChange("batch")}
                  onBlur={() => touch("batch")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.batch && !!touched.batch}
                  helperText={touched.batch ? errors.batch || " " : " "}
                />
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Ημερομηνία εμβολιασμού *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.vaccinatedAt}
                  onChange={handleChange("vaccinatedAt")}
                  onBlur={() => touch("vaccinatedAt")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.vaccinatedAt && !!touched.vaccinatedAt}
                  helperText={touched.vaccinatedAt ? errors.vaccinatedAt || " " : " "}
                />

                <TextField
                  label="Λήξη ισχύος *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.expiresAt}
                  onChange={handleChange("expiresAt")}
                  onBlur={() => touch("expiresAt")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.expiresAt && !!touched.expiresAt}
                  helperText={touched.expiresAt ? errors.expiresAt || " " : " "}
                />
              </Box>
            </Box>
          )}

          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 4 }}>
            <Button
              onClick={() => navigate(`/vet/mypets/${id}/booklet/vaccinations`)}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 4,
                bgcolor: "#b7bcc3",
                color: "#000",
                "&:hover": { bgcolor: "#a9aeb6" },
                fontWeight: 900,
              }}
            >
              Ακύρωση
            </Button>

            <Button
              onClick={onSubmit}
              disabled={saving || loadingPet || !!errPet}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 4,
                bgcolor: COLORS.primary,
                "&:hover": { bgcolor: COLORS.primaryHover },
                boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                fontWeight: 900,
              }}
            >
              Υποβολή
            </Button>
          </Stack>
        </Panel>
      </Container>
    </AuthedShell>
  );
}
