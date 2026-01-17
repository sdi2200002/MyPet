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
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
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
function normalizeAfm(raw) {
  return (raw || "").replace(/[^\d]/g, "").trim();
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

const WIZARD_STEPS = ["Επιλογή Κατοικιδίου", "Στοιχεία Αναδόχου", "Συνθήκες Αναδοχής", "Επιβεβαίωση Αναδοχής"];

/**
 * ✅ Δήλωση Αναδοχής
 * role: "vet" | "owner" (εσύ το θες για vet, άρα default vet)
 */
export default function FosterWizard({ role = "vet" }) {
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

    // foster person
    fosterFirstName: "",
    fosterLastName: "",
    fosterAfm: "",
    fosterPhone: "",
    fosterEmail: "",

    // foster conditions (όπως στη φωτο – μπορείς να προσθέσεις/αλλάξεις εύκολα)
    hasOtherPet: "", // "yes" | "no"
    experience: "", // "0-1" | "2-5" | "5+"
    availability: "", // π.χ. "Μερική", "Πλήρης", "Καθημερινή" (ή ό,τι θες)
    conditionsNotes: "",

    acceptTerms: false,
    createdAt: "",
  });

  // load pets
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

  // load draft edit
  useEffect(() => {
    const draftId = location.state?.draftId;
    const targetStep = location.state?.step;
    if (!draftId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await fetchJSON(`/api/fosterDeclarations/${encodeURIComponent(String(draftId))}`);
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

  // when choose pet -> fill read-only
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

  // touched/errors
  const [touched, setTouched] = useState({});
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const handleChange = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const errors = useMemo(() => {
    const e = {};

    // step 0
    if (!form.petId) e.petId = "Υποχρεωτικό πεδίο.";

    // step 1 foster person
    if (!form.fosterFirstName.trim()) e.fosterFirstName = "Υποχρεωτικό πεδίο.";
    if (!form.fosterLastName.trim()) e.fosterLastName = "Υποχρεωτικό πεδίο.";

    const afm = normalizeAfm(form.fosterAfm);
    if (!afm) e.fosterAfm = "Υποχρεωτικό πεδίο.";
    else if (afm.length !== 9) e.fosterAfm = "Το ΑΦΜ πρέπει να έχει 9 ψηφία.";

    const phone = normalizePhone(form.fosterPhone);
    if (!phone) e.fosterPhone = "Υποχρεωτικό πεδίο.";
    else if (phone.length < 10) e.fosterPhone = "Βάλε έγκυρο τηλέφωνο.";

    if (!form.fosterEmail.trim()) e.fosterEmail = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.fosterEmail)) e.fosterEmail = "Μη έγκυρο email.";

    // step 2 conditions
    if (!form.hasOtherPet) e.hasOtherPet = "Υποχρεωτικό πεδίο.";
    if (!form.experience) e.experience = "Υποχρεωτικό πεδίο.";
    if (!form.availability) e.availability = "Υποχρεωτικό πεδίο.";

    return e;
  }, [
    form.petId,
    form.fosterFirstName,
    form.fosterLastName,
    form.fosterAfm,
    form.fosterPhone,
    form.fosterEmail,
    form.hasOtherPet,
    form.experience,
    form.availability,
  ]);

  const isStep0Valid = !errors.petId;
  const isStep1Valid =
    !errors.fosterFirstName &&
    !errors.fosterLastName &&
    !errors.fosterAfm &&
    !errors.fosterPhone &&
    !errors.fosterEmail;
  const isStep2Valid = !errors.hasOtherPet && !errors.experience && !errors.availability;

  function next() {
    if (activeStep === 0) {
      ["petId"].forEach(touch);
      if (!isStep0Valid) return;
    }
    if (activeStep === 1) {
      ["fosterFirstName", "fosterLastName", "fosterAfm", "fosterPhone", "fosterEmail"].forEach(touch);
      if (!isStep1Valid) return;
    }
    if (activeStep === 2) {
      ["hasOtherPet", "experience", "availability"].forEach(touch);
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

      fosterFirstName: form.fosterFirstName.trim(),
      fosterLastName: form.fosterLastName.trim(),
      fosterAfm: normalizeAfm(form.fosterAfm),
      fosterPhone: normalizePhone(form.fosterPhone),
      fosterEmail: form.fosterEmail.trim(),

      hasOtherPet: form.hasOtherPet,
      experience: form.experience,
      availability: form.availability,
      conditionsNotes: (form.conditionsNotes || "").trim(),

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function saveDraft() {
    ["petId", "fosterFirstName", "fosterLastName", "fosterAfm", "fosterPhone", "fosterEmail", "hasOtherPet", "experience", "availability"].forEach(
      touch
    );
    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Πρόχειρη");

      if (editingId) {
        await fetchJSON(`/api/fosterDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/fosterDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(String(created?.id));
      }

      navigate(`${base}/declarations/success`, { state: { type: "foster", status: "Πρόχειρη" } });
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    ["petId", "fosterFirstName", "fosterLastName", "fosterAfm", "fosterPhone", "fosterEmail", "hasOtherPet", "experience", "availability"].forEach(
      touch
    );
    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) return;
    if (!form.acceptTerms) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Οριστική");

      let savedId = editingId;

      if (editingId) {
        await fetchJSON(`/api/fosterDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/fosterDeclarations`, {
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
          type: "foster_submitted",
          title: "Νέα δήλωση αναδοχής",
          message: `Υποβλήθηκε δήλωση αναδοχής για ${payload?.petName || "κατοικίδιο"} (${payload?.fosterLastName || "—"}).`,
          refType: "fosterDeclaration",
          refId: String(savedId || ""),
          meta: { kind: "foster", status: "Οριστική", petId: String(payload?.petId || ""), role },
        });
      } catch (e) {
        console.warn("Notification failed (ignored):", e);
      }

      navigate(`${base}/declarations/success`, { state: { type: "foster", status: "Οριστική" } });
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά στην υποβολή.");
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

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>Δήλωση Αναδοχής</Typography>

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

        {/* STEP 1: foster person */}
        {activeStep === 1 && (
          <Panel>
            <Box sx={{ maxWidth: 520, mx: "auto" }}>
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Όνομα *"
                  value={form.fosterFirstName}
                  onChange={handleChange("fosterFirstName")}
                  onBlur={() => touch("fosterFirstName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.fosterFirstName && !!touched.fosterFirstName}
                  helperText={touched.fosterFirstName ? errors.fosterFirstName || " " : " "}
                />

                <TextField
                  label="Επώνυμο *"
                  value={form.fosterLastName}
                  onChange={handleChange("fosterLastName")}
                  onBlur={() => touch("fosterLastName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.fosterLastName && !!touched.fosterLastName}
                  helperText={touched.fosterLastName ? errors.fosterLastName || " " : " "}
                />

                <TextField
                  label="ΑΦΜ *"
                  value={form.fosterAfm}
                  onChange={handleChange("fosterAfm")}
                  onBlur={() => touch("fosterAfm")}
                  fullWidth
                  sx={fieldSx}
                  inputProps={{ inputMode: "numeric" }}
                  error={!!errors.fosterAfm && !!touched.fosterAfm}
                  helperText={touched.fosterAfm ? errors.fosterAfm || " " : " "}
                />

                <TextField
                  label="Τηλέφωνο *"
                  value={form.fosterPhone}
                  onChange={handleChange("fosterPhone")}
                  onBlur={() => touch("fosterPhone")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.fosterPhone && !!touched.fosterPhone}
                  helperText={touched.fosterPhone ? errors.fosterPhone || " " : " "}
                />

                <TextField
                  label="Email *"
                  value={form.fosterEmail}
                  onChange={handleChange("fosterEmail")}
                  onBlur={() => touch("fosterEmail")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.fosterEmail && !!touched.fosterEmail}
                  helperText={touched.fosterEmail ? errors.fosterEmail || " " : " "}
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

                <FormControl fullWidth sx={fieldSx} error={!!errors.availability && !!touched.availability}>
                  <InputLabel>Διαθεσιμότητα *</InputLabel>
                  <Select
                    label="Διαθεσιμότητα *"
                    value={form.availability}
                    onChange={handleChange("availability")}
                    onBlur={() => touch("availability")}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="full">Πλήρης</MenuItem>
                    <MenuItem value="partial">Μερική</MenuItem>
                    <MenuItem value="weekends">Σαβ/κα</MenuItem>
                  </Select>
                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                    {touched.availability ? errors.availability || " " : " "}
                  </Typography>
                </FormControl>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή συνθηκών</Typography>
                  <TextField
                    multiline
                    minRows={6}
                    value={form.conditionsNotes}
                    onChange={handleChange("conditionsNotes")}
                    fullWidth
                    sx={fieldSx}
                    placeholder="Σημείωσε συνθήκες διαβίωσης/χώρο, ωράριο, περίφραξη, οτιδήποτε σχετικό."
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

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Όνομα</Typography>
                  <TextField value={form.petName || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Φυλή / Είδος</Typography>
                  <TextField value={form.breedOrSpecies || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Φύλο</Typography>
                  <TextField value={form.sex || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Χρώμα</Typography>
                  <TextField value={form.color || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Microchip</Typography>
                  <TextField value={form.microchip || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Αναδόχου</Typography>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Όνομα</Typography>
                  <TextField value={form.fosterFirstName || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Επώνυμο</Typography>
                  <TextField value={form.fosterLastName || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>ΑΦΜ</Typography>
                  <TextField value={normalizeAfm(form.fosterAfm) || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Τηλέφωνο</Typography>
                  <TextField value={normalizePhone(form.fosterPhone) || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Email</Typography>
                  <TextField value={form.fosterEmail || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Συνθήκες Αναδοχής</Typography>

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
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Διαθεσιμότητα</Typography>
                  <TextField
                    value={
                      form.availability === "full"
                        ? "Πλήρης"
                        : form.availability === "partial"
                        ? "Μερική"
                        : form.availability === "weekends"
                        ? "Σαβ/κα"
                        : "-"
                    }
                    fullWidth
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Περιγραφή συνθηκών</Typography>
                  <TextField value={form.conditionsNotes || "—"} fullWidth multiline minRows={6} sx={fieldSx} InputProps={{ readOnly: true }} />
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
