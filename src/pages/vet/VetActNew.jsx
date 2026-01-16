import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box sx={{ width: VET_SIDEBAR_W, flex: `0 0 ${VET_SIDEBAR_W}px`, display: { xs: "none", lg: "block" } }} />
        <VetNavbar mode="navbar" />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

/**
 * ✅ Vet-only page
 * Route:
 *   /vet/mypets/:id/booklet/acts/new
 *
 * Saves into:
 *   PATCH /api/pets/:id
 *   { acts: [...old, newAct], updatedAt: ... }
 */
export default function VetActNew() {
  const navigate = useNavigate();
  const { id } = useParams(); // petId
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [loadingPet, setLoadingPet] = useState(true);
  const [errPet, setErrPet] = useState("");

  const [saving, setSaving] = useState(false);

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));

  // ✅ notes removed
  const [form, setForm] = useState({
    description: "",
    date: todayYMD(),
  });

  const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // -------- Vet guard ----------
  useEffect(() => {
    if (user && user.role !== "vet") navigate("/", { replace: true });
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

        // OPTIONAL access control:
        // if (String(p?.vetId) !== String(user?.id)) { ... }

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
    if (!String(form.description || "").trim()) e.description = "Υποχρεωτικό πεδίο.";
    if (!form.date) e.date = "Υποχρεωτικό πεδίο.";
    return e;
  }, [form]);

  const isValid = !errors.description && !errors.date;

  async function onSubmit() {
    ["description", "date"].forEach(touch);
    if (!isValid) return;

    if (!user?.id) {
      alert("Δεν υπάρχει συνδεδεμένος χρήστης.");
      return;
    }

    setSaving(true);
    try {
      // 1) read latest pet
      const p = await fetchJSON(`/api/pets/${encodeURIComponent(String(id))}`);
      const currentActs = Array.isArray(p?.acts) ? p.acts : [];

      const newAct = {
        id: `a_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        description: String(form.description).trim(),
        date: form.date, // (θα το μορφοποιείς στην προβολή σε ΗΗ/ΜΜ/ΕΕΕΕ)
        vetId: String(user.id),
        vetName: user.name || user.firstName || "—",
        createdAt: new Date().toISOString(),
      };

      // 2) patch pet
      await fetchJSON(`/api/pets/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acts: [...currentActs, newAct],
          updatedAt: new Date().toISOString(),
        }),
      });

      navigate(`/vet/mypets/${id}/booklet/acts`);
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
          Καταγραφή Ιατρικής Πράξης
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
                maxWidth: 760,
                mx: "auto",
                mt: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" },
                gap: 3,
              }}
            >
              {/* LEFT: big description (like notes) */}
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Περιγραφή Πράξης *"
                  value={form.description}
                  onChange={handleChange("description")}
                  onBlur={() => touch("description")}
                  fullWidth
                  multiline
                  minRows={6}
                  sx={fieldSx}
                  placeholder="Περιγράψτε την ιατρική πράξη (π.χ. εξέταση, θεραπεία, αγωγή, παρατηρήσεις, οδηγίες κ.λπ.)"
                  error={!!errors.description && !!touched.description}
                  helperText={touched.description ? errors.description || " " : " "}
                />
              </Box>

              {/* RIGHT: date + vet */}
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Ημερομηνία *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={handleChange("date")}
                  onBlur={() => touch("date")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.date && !!touched.date}
                  helperText={touched.date ? errors.date || " " : " "}
                />

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.12)",
                    p: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 14 }}>
                    Κτηνίατρος
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: COLORS.muted, fontWeight: 800, fontSize: 13 }}>
                    {user?.name || "—"}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}

          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 4 }}>
            <Button
              onClick={() => navigate(`/vet/mypets/${id}/booklet/acts`)}
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
