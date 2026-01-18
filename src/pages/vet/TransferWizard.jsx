import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import WizardStepper from "../../components/WizardStepper";
import { useAuth } from "../../auth/AuthContext";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
  fieldBorder: "#a7b8cf",
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
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  if (!res.ok) {
    console.error("API ERROR:", { path, status: res.status, body: data });
    const msg = (data && (data.message || data.error)) || (typeof data === "string" ? data : "") || `HTTP ${res.status} on ${path}`;
    throw new Error(msg);
  }
  return data;
}

async function createNotification(payload) {
  return fetchJSON(`/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

function normalizePhone(raw) {
  return (raw || "").replace(/[^\d+]/g, "").trim();
}
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function PetPick({ pet, active, onClick }) {
  const photo = pet.photo;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        border: `3px solid ${active ? COLORS.primary : "rgba(199,212,232,1)"}`,
        bgcolor: active ? "rgba(11,61,145,0.06)" : "#fff",
        p: 1.2,
        width: 120,
        height: 150,
        boxSizing: "border-box",
        textAlign: "center",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        display: "grid",
        justifyItems: "center",
        alignContent: "start",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
        },
        userSelect: "none",
        flex: "0 0 auto",
      }}
    >
      <Box
        component="img"
        src={photo}
        alt={pet.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/dog1.png";
        }}
        sx={{
          width: 84,
          height: 94,
          borderRadius: 2,
          objectFit: "cover",
          border: "1px solid rgba(0,0,0,0.15)",
          bgcolor: "#fff",
          display: "block",
          mt: 0.2,
        }}
      />
      <Typography sx={{ mt: 0.8, fontWeight: 900, fontSize: 12, color: "#111" }} noWrap>
        {pet.name || "—"}
      </Typography>
    </Paper>
  );
}

function DeclarationsShell({ role, sidebarW, children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />
      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />
        {role === "vet" ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
      <Footer />
    </Box>
  );
}

const WIZARD_STEPS = ["Επιλογή Κατοικιδίου", "Στοιχεία Νέου Ιδιοκτήτη", "Συνθήκες Μεταβίβασης", "Επιβεβαίωση Μεταβίβασης"];

export default function TransferWizard({ role = "vet" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const base = role === "vet" ? "/vet" : "/owner";
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // pets
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsErr, setPetsErr] = useState("");

  // form
  const [form, setForm] = useState({
    vetId: "",

    petId: "",
    petName: "",
    sex: "",
    breedOrSpecies: "",
    color: "",
    microchip: "",

    // new owner
    newOwnerFirstName: "",
    newOwnerLastName: "",
    newOwnerPhone: "",
    newOwnerEmail: "",

    // transfer conditions (στη φωτο φαίνεται σαν τα άλλα)
    hasOtherPet: "",
    experience: "",
    notes: "",

    acceptTerms: false,
    createdAt: "",
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      setPetsLoading(true);
      setPetsErr("");

      if (!user?.id) {
        if (!alive) return;
        setPets([]);
        setPetsErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setPetsLoading(false);
        return;
      }

      try {
        const queryKey = role === "vet" ? "vetId" : "ownerId";
        const p = await fetchJSON(`/api/pets?${queryKey}=${encodeURIComponent(String(user.id))}`);
        if (!alive) return;
        setPets(Array.isArray(p) ? p : []);
        setPetsLoading(false);

        setForm((prev) => ({ ...prev, vetId: prev.vetId || user.id }));
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setPets([]);
        setPetsErr("Αποτυχία φόρτωσης κατοικιδίων από τον server.");
        setPetsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id, role]);

  // draft edit
  useEffect(() => {
    const draftId = location.state?.draftId;
    const targetStep = location.state?.step;
    if (!draftId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await fetchJSON(`/api/transferDeclarations/${encodeURIComponent(String(draftId))}`);
        if (!alive) return;

        setEditingId(String(draftId));
        setForm((p) => ({ ...p, ...draft, acceptTerms: false }));
        setActiveStep(typeof targetStep === "number" ? targetStep : 3);
      } catch (e) {
        console.error(e);
        alert("Δεν βρέθηκε το πρόχειρο.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [location.state]);

  const chosenPet = useMemo(
    () => pets.find((p) => String(p.id) === String(form.petId)) || null,
    [pets, form.petId]
  );

  useEffect(() => {
    if (!chosenPet) return;

    const breedOrSpecies = chosenPet.breed || chosenPet.species || chosenPet.kind || "";

    setForm((p) => ({
      ...p,
      petId: chosenPet.id,
      petName: chosenPet.name || "",
      sex: chosenPet.sex || "",
      breedOrSpecies,
      color: chosenPet.color || "",
      microchip: chosenPet.microchip || "",
      vetId: p.vetId || user?.id || "",
    }));
  }, [chosenPet, user?.id]);

  const [touched, setTouched] = useState({});
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const handleChange = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const errors = useMemo(() => {
    const e = {};
    if (!form.petId) e.petId = "Υποχρεωτικό πεδίο.";

    if (!form.newOwnerFirstName.trim()) e.newOwnerFirstName = "Υποχρεωτικό πεδίο.";
    if (!form.newOwnerLastName.trim()) e.newOwnerLastName = "Υποχρεωτικό πεδίο.";

    const phone = normalizePhone(form.newOwnerPhone);
    if (!phone) e.newOwnerPhone = "Υποχρεωτικό πεδίο.";
    else if (phone.length < 10) e.newOwnerPhone = "Βάλε έγκυρο τηλέφωνο.";

    if (!form.newOwnerEmail.trim()) e.newOwnerEmail = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.newOwnerEmail)) e.newOwnerEmail = "Μη έγκυρο email.";

    if (!form.hasOtherPet) e.hasOtherPet = "Υποχρεωτικό πεδίο.";
    if (!form.experience) e.experience = "Υποχρεωτικό πεδίο.";

    return e;
  }, [
    form.petId,
    form.newOwnerFirstName,
    form.newOwnerLastName,
    form.newOwnerPhone,
    form.newOwnerEmail,
    form.hasOtherPet,
    form.experience,
  ]);

  const isStep0Valid = !errors.petId;
  const isStep1Valid =
    !errors.newOwnerFirstName && !errors.newOwnerLastName && !errors.newOwnerPhone && !errors.newOwnerEmail;
  const isStep2Valid = !errors.hasOtherPet && !errors.experience;

  function next() {
    if (activeStep === 0) {
      ["petId"].forEach(touch);
      if (!isStep0Valid) return;
    }
    if (activeStep === 1) {
      ["newOwnerFirstName", "newOwnerLastName", "newOwnerPhone", "newOwnerEmail"].forEach(touch);
      if (!isStep1Valid) return;
    }
    if (activeStep === 2) {
      ["hasOtherPet", "experience"].forEach(touch);
      if (!isStep2Valid) return;
    }
    setActiveStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function back() {
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function buildPayload(status) {
    return {
      status,
      vetId: user?.id ?? form.vetId ?? "",

      petId: form.petId,
      petName: form.petName,
      sex: form.sex,
      breedOrSpecies: form.breedOrSpecies,
      color: form.color,
      microchip: form.microchip,

      newOwnerFirstName: form.newOwnerFirstName.trim(),
      newOwnerLastName: form.newOwnerLastName.trim(),
      newOwnerPhone: normalizePhone(form.newOwnerPhone),
      newOwnerEmail: form.newOwnerEmail.trim(),

      hasOtherPet: form.hasOtherPet,
      experience: form.experience,
      notes: (form.notes || "").trim(),

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function saveDraft() {
    ["petId", "newOwnerFirstName", "newOwnerLastName", "newOwnerPhone", "newOwnerEmail", "hasOtherPet", "experience"].forEach(
      touch
    );
    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Πρόχειρη");

      if (editingId) {
        await fetchJSON(`/api/transferDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/transferDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(String(created?.id));
      }

      navigate(`${base}/declarations/success`, { state: { type: "transfer", status: "Πρόχειρη" } });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Κάτι πήγε στραβά στην αποθήκευση.");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    ["petId", "newOwnerFirstName", "newOwnerLastName", "newOwnerPhone", "newOwnerEmail", "hasOtherPet", "experience"].forEach(
      touch
    );
    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) return;
    if (!form.acceptTerms) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Οριστική");

      let savedId = editingId;

      if (editingId) {
        await fetchJSON(`/api/transferDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/transferDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        savedId = String(created?.id);
        setEditingId(savedId);
      }

      try {
        await createNotification({
          userId: user?.id,
          type: "transfer_submitted",
          title: "Νέα δήλωση μεταβίβασης",
          message: `Υποβλήθηκε δήλωση μεταβίβασης για ${payload?.petName || "κατοικίδιο"} (${payload?.newOwnerLastName || "—"}).`,
          refType: "transferDeclaration",
          refId: String(savedId || ""),
          meta: { kind: "transfer", status: "Οριστική", petId: String(payload?.petId || ""), role },
        });
      } catch (e) {
        console.warn("Notification failed (ignored):", e);
      }

      navigate(`${base}/declarations/success`, { state: { type: "transfer", status: "Οριστική" } });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Κάτι πήγε στραβά στην υποβολή.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DeclarationsShell role={role} sidebarW={sidebarW}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>Μεταβίβαση Κατοικιδίου</Typography>

        <WizardStepper activeStep={activeStep} steps={WIZARD_STEPS} />

        {/* STEP 0 */}
        {activeStep === 0 && (
          <Panel>
            <Box sx={{ maxWidth: 760, mx: "auto" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Επιλογή Κατοικιδίου *</Typography>

              {petsLoading ? (
                <Typography sx={{ color: "#1a1a1a", opacity: 0.8, fontWeight: 800 }}>Φόρτωση...</Typography>
              ) : petsErr ? (
                <Paper elevation={0} sx={{ borderRadius: 2, p: 2, bgcolor: "#fff3f3", border: "1px solid rgba(0,0,0,0.12)" }}>
                  <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{petsErr}</Typography>
                </Paper>
              ) : pets.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: 2, p: 2, bgcolor: "#eef1f4", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>Δεν υπάρχουν καταχωρημένα κατοικίδια.</Typography>
                </Paper>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: 10 },
                    "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.08)", borderRadius: 99 },
                    "&::-webkit-scrollbar-thumb": { background: "rgba(11,61,145,0.35)", borderRadius: 99 },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridAutoFlow: "column",
                      gridAutoColumns: "120px",
                      gap: 1.6,
                      alignItems: "start",
                      width: "max-content",
                      pr: 1,
                    }}
                  >
                    {pets.map((p) => (
                      <PetPick
                        key={p.id}
                        pet={p}
                        active={String(p.id) === String(form.petId)}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, petId: p.id }));
                          touch("petId");
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {touched.petId && errors.petId && (
                <Typography sx={{ mt: 1.2, fontSize: 12, color: "#d32f2f", fontWeight: 800 }}>{errors.petId}</Typography>
              )}

              <Stack direction="row" justifyContent="right" spacing={3} sx={{ mt: 3 }}>
                <Button
                  onClick={next}
                  disabled={!isStep0Valid}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: COLORS.primary,
                    "&:hover": { bgcolor: COLORS.primaryHover },
                    fontWeight: 900,
                  }}
                >
                  Επόμενο
                </Button>
              </Stack>
            </Box>
          </Panel>
        )}

        {/* STEP 1: new owner */}
        {activeStep === 1 && (
          <Panel>
            <Box sx={{ maxWidth: 520, mx: "auto" }}>
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Όνομα *"
                  value={form.newOwnerFirstName}
                  onChange={handleChange("newOwnerFirstName")}
                  onBlur={() => touch("newOwnerFirstName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.newOwnerFirstName && !!touched.newOwnerFirstName}
                  helperText={touched.newOwnerFirstName ? errors.newOwnerFirstName || " " : " "}
                />

                <TextField
                  label="Επώνυμο *"
                  value={form.newOwnerLastName}
                  onChange={handleChange("newOwnerLastName")}
                  onBlur={() => touch("newOwnerLastName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.newOwnerLastName && !!touched.newOwnerLastName}
                  helperText={touched.newOwnerLastName ? errors.newOwnerLastName || " " : " "}
                />

                <TextField
                  label="Τηλέφωνο *"
                  value={form.newOwnerPhone}
                  onChange={handleChange("newOwnerPhone")}
                  onBlur={() => touch("newOwnerPhone")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.newOwnerPhone && !!touched.newOwnerPhone}
                  helperText={touched.newOwnerPhone ? errors.newOwnerPhone || " " : " "}
                />

                <TextField
                  label="Email *"
                  value={form.newOwnerEmail}
                  onChange={handleChange("newOwnerEmail")}
                  onBlur={() => touch("newOwnerEmail")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.newOwnerEmail && !!touched.newOwnerEmail}
                  helperText={touched.newOwnerEmail ? errors.newOwnerEmail || " " : " "}
                />
              </Box>

              <Stack direction="row" justifyContent="right" spacing={3} sx={{ mt: 3 }}>
                <Button
                  onClick={back}
                  variant="outlined"
                  sx={{ textTransform: "none", borderRadius: 2, borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 900 }}
                >
                  Πίσω
                </Button>

                <Button
                  onClick={next}
                  disabled={!isStep1Valid}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: COLORS.primary,
                    "&:hover": { bgcolor: COLORS.primaryHover },
                    fontWeight: 900,
                  }}
                >
                  Επόμενο
                </Button>
              </Stack>
            </Box>
          </Panel>
        )}

        {/* STEP 2: conditions */}
        {activeStep === 2 && (
          <Panel>
            <Box sx={{ maxWidth: 520, mx: "auto" }}>
              <Box sx={{ display: "grid", gap: 2 }}>
                <FormControl fullWidth sx={fieldSx} error={!!errors.hasOtherPet && !!touched.hasOtherPet}>
                  <InputLabel>Ζώο στο σπίτι; *</InputLabel>
                  <Select
                    label="Ζώο στο σπίτι; *"
                    value={form.hasOtherPet}
                    onChange={handleChange("hasOtherPet")}
                    onBlur={() => touch("hasOtherPet")}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="yes">Ναι</MenuItem>
                    <MenuItem value="no">Όχι</MenuItem>
                  </Select>
                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                    {touched.hasOtherPet ? errors.hasOtherPet || " " : " "}
                  </Typography>
                </FormControl>

                <FormControl fullWidth sx={fieldSx} error={!!errors.experience && !!touched.experience}>
                  <InputLabel>Εμπειρία με κατοικίδια *</InputLabel>
                  <Select
                    label="Εμπειρία με κατοικίδια *"
                    value={form.experience}
                    onChange={handleChange("experience")}
                    onBlur={() => touch("experience")}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="0-1">0 - 1 χρόνος</MenuItem>
                    <MenuItem value="2-5">2 - 5 χρόνια</MenuItem>
                    <MenuItem value="5+">5+ χρόνια</MenuItem>
                  </Select>
                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                    {touched.experience ? errors.experience || " " : " "}
                  </Typography>
                </FormControl>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή συνθηκών</Typography>
                  <TextField
                    multiline
                    minRows={6}
                    value={form.notes}
                    onChange={handleChange("notes")}
                    fullWidth
                    sx={fieldSx}
                    placeholder="Σημείωσε ό,τι σχετίζεται με τη μεταβίβαση (συνθήκες διαβίωσης, συμφωνίες κλπ)."
                  />
                </Box>
              </Box>

              <Stack direction="row" justifyContent="right" spacing={3} sx={{ mt: 3 }}>
                <Button
                  onClick={back}
                  variant="outlined"
                  sx={{ textTransform: "none", borderRadius: 2, borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 900 }}
                >
                  Πίσω
                </Button>

                <Button
                  onClick={next}
                  disabled={!isStep2Valid}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: COLORS.primary,
                    "&:hover": { bgcolor: COLORS.primaryHover },
                    fontWeight: 900,
                  }}
                >
                  Επόμενο
                </Button>
              </Stack>
            </Box>
          </Panel>
        )}

        {/* STEP 3: preview */}
        {activeStep === 3 && (
          <Panel>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 4,
                alignItems: "start",
              }}
            >
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Κατοικιδίου</Typography>

                {[
                  ["Όνομα", form.petName],
                  ["Φυλή / Είδος", form.breedOrSpecies],
                  ["Φύλο", form.sex],
                  ["Χρώμα", form.color],
                  ["Microchip", form.microchip],
                ].map(([label, val]) => (
                  <Box key={label}>
                    <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                    <TextField value={val || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Νέου Ιδιοκτήτη</Typography>

                {[
                  ["Όνομα", form.newOwnerFirstName],
                  ["Επώνυμο", form.newOwnerLastName],
                  ["Τηλέφωνο", normalizePhone(form.newOwnerPhone)],
                  ["Email", form.newOwnerEmail],
                ].map(([label, val]) => (
                  <Box key={label}>
                    <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                    <TextField value={val || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Συνθήκες Μεταβίβασης</Typography>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Ζώο στο σπίτι</Typography>
                  <TextField
                    value={form.hasOtherPet ? (form.hasOtherPet === "yes" ? "Ναι" : "Όχι") : "-"}
                    fullWidth
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Εμπειρία με κατοικίδια</Typography>
                  <TextField
                    value={
                      form.experience === "0-1"
                        ? "0 - 1 χρόνος"
                        : form.experience === "2-5"
                        ? "2 - 5 χρόνια"
                        : form.experience === "5+"
                        ? "5+ χρόνια"
                        : "-"
                    }
                    fullWidth
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Περιγραφή συνθηκών</Typography>
                  <TextField value={form.notes || "—"} fullWidth multiline minRows={6} sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={form.acceptTerms} onChange={handleChange("acceptTerms")} />}
                label="Συμφωνώ με τους όρους & προϋποθέσεις"
              />
            </Box>

            <Stack direction="row" justifyContent="right" spacing={2} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Button
                onClick={() => navigate(-1)}
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
                onClick={() => setActiveStep(2)}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  bgcolor: "#c9d0dd",
                  color: "#000",
                  "&:hover": { bgcolor: "#b8c0cf" },
                  fontWeight: 900,
                }}
              >
                Επεξεργασία
              </Button>

              <Button
                onClick={saveDraft}
                disabled={saving || !isStep0Valid || !isStep1Valid || !isStep2Valid}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#c9d0dd",
                  color: "#000",
                  "&:hover": { bgcolor: "#b8c0cf" },
                  fontWeight: 900,
                }}
              >
                Προσωρινή Αποθήκευση
              </Button>

              <Button
                onClick={submitFinal}
                disabled={saving || !isStep0Valid || !isStep1Valid || !isStep2Valid || !form.acceptTerms}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  fontWeight: 900,
                }}
              >
                Οριστική Υποβολή
              </Button>
            </Stack>
          </Panel>
        )}
      </Container>
    </DeclarationsShell>
  );
}
