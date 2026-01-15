import { useMemo, useRef, useState, useEffect } from "react";
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtDDMMYYYY(value) {
  if (!value) return "";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function todayYMD() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function oneYearAgoYMD() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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


const WIZARD_STEPS = ["Επιλογή Κατοικιδίου", "Στοιχεία Απώλειας", "Προεπισκόπηση Αναφοράς"];

/**
 * ✅ Shared page
 * role: "owner" | "vet"
 */
export default function LostWizard({ role = "owner" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const base = role === "vet" ? "/vet" : "/owner";
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---------- Pets ----------
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsErr, setPetsErr] = useState("");

  // ---------- Photo upload state ----------
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function setSelectedPhoto(file) {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      alert("Επέλεξε εικόνα JPG/PNG/WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Μέγιστο μέγεθος 5MB.");
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);

    setPhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPhoto(file);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedPhoto(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function removePhoto() {
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoFile(null);
    setForm((p) => ({ ...p, photoDataUrl: "" }));
  }

  // ---------- Form ----------
  const [form, setForm] = useState({
    finderId: "",
    petId: "",
    petName: "",
    sex: "",
    breedOrSpecies: "",
    color: "",
    microchip: "",
    phone: "",
    email: "",
    firstName: "",
    lastName: "",
    date: "",
    area: "",
    notes: "",
    acceptTerms: false,
    photoDataUrl: "",
    createdAt: "",
  });

  // ✅ load pets from server
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
        // ✅ Αν το schema σου είναι ίδιο και για vet, αυτό μένει ίδιο.
        // Αν οι pets του vet είναι αλλού, εδώ αλλάζεις query.
        const queryKey = role === "vet" ? "vetId" : "ownerId";
        const p = await fetchJSON(`/api/pets?${queryKey}=${encodeURIComponent(String(user.id))}`);

        if (!alive) return;
        setPets(Array.isArray(p) ? p : []);
        setPetsLoading(false);
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
  }, [user?.id]);

  // ✅ apply draft edit from route state
  useEffect(() => {
    const draftId = location.state?.draftId;
    const targetStep = location.state?.step;
    if (!draftId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(draftId))}`);
        if (!alive) return;

        setEditingId(String(draftId));
        setForm((p) => ({ ...p, ...draft, acceptTerms: false }));

        if (draft.photoDataUrl) {
          setPhotoPreview(draft.photoDataUrl);
          setPhotoFile(null);
        } else {
          setPhotoPreview("");
          setPhotoFile(null);
        }

        setActiveStep(typeof targetStep === "number" ? targetStep : 2);
      } catch (e) {
        console.error(e);
        alert("Δεν βρέθηκε το πρόχειρο.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [location.state]);

  const chosenPet = useMemo(() => pets.find((p) => String(p.id) === String(form.petId)) || null, [pets, form.petId]);

  // όταν επιλέξεις pet: fill τα read-only
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

      finderId: p.finderId || user?.id || "",
      firstName: p.firstName || user?.firstName || user?.name || "",
      lastName: p.lastName || user?.lastName || "",
      phone: p.phone || user?.phone || "",
      email: p.email || user?.email || "",
    }));
  }, [chosenPet, user?.id, user?.firstName, user?.lastName, user?.name, user?.phone, user?.email]);

  // touched/errors
  const [touched, setTouched] = useState({});
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const handleChange = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const errors = useMemo(() => {
    const e = {};
    if (!form.petId) e.petId = "Υποχρεωτικό πεδίο.";

    if (!form.date) e.date = "Υποχρεωτικό πεδίο.";
    if (form.date && form.date > todayYMD()) e.date = "Δεν επιτρέπεται μελλοντική ημερομηνία.";
    if (form.date && form.date < oneYearAgoYMD()) e.date = "Μπορείς να επιλέξεις έως 1 χρόνο πίσω.";

    if (!form.area) e.area = "Υποχρεωτικό πεδίο.";
    return e;
  }, [form.petId, form.date, form.area]);

  const isStep0Valid = !errors.petId;
  const isStep1Valid = !errors.date && !errors.area;

  function next() {
    if (activeStep === 0) {
      ["petId"].forEach(touch);
      if (!isStep0Valid) return;
    }
    if (activeStep === 1) {
      ["date", "area"].forEach(touch);
      if (!isStep1Valid) return;
    }
    setActiveStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function back() {
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function buildPayload(status) {
    let photoDataUrl = form.photoDataUrl || "";
    if (photoFile) photoDataUrl = await fileToBase64(photoFile);

    return {
      finderId: user?.id ?? form.finderId ?? "",
      status,
      petId: form.petId,
      petName: form.petName,
      sex: form.sex,
      breedOrSpecies: form.breedOrSpecies,
      color: form.color,
      microchip: form.microchip,

      firstName: form.firstName,
      lastName: form.lastName,
      phone: normalizePhone(form.phone),
      email: form.email,

      date: form.date,
      area: form.area,
      notes: (form.notes || "").trim(),

      photoDataUrl,
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function saveDraft() {
    ["petId", "date", "area"].forEach(touch);
    if (!isStep0Valid || !isStep1Valid) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Πρόχειρη");

      if (editingId) {
        await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/lostDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(String(created?.id));
      }

      // ✅ base-aware
      navigate(`${base}/declarations/success`, { state: { type: "lost", status: "Πρόχειρη" } });
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    ["petId", "date", "area"].forEach(touch);
    if (!isStep0Valid || !isStep1Valid) return;
    if (!form.acceptTerms) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Οριστική");

      let savedId = editingId;

      if (editingId) {
        await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/lostDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        savedId = String(created?.id);
        setEditingId(savedId);
      }

      // notification (non-blocking)
      try {
        await createNotification({
          userId: user?.id,
          type: "lost_submitted",
          title: "Νέα δήλωση απώλειας",
          message: `Υποβλήθηκε δήλωση απώλειας για ${payload?.petName || "κατοικίδιο"} (${payload?.area || "—"}) στις ${
            fmtDDMMYYYY(payload?.date)
          }.`,
          refType: "lostDeclaration",
          refId: String(savedId || ""),
          meta: {
            kind: "lost",
            status: "Οριστική",
            petId: String(payload?.petId || ""),
            area: payload?.area || "",
            date: payload?.date || "",
            role,
          },
        });
      } catch (e) {
        console.warn("Notification failed (ignored):", e);
      }

      // ✅ base-aware
      navigate(`${base}/declarations/success`, { state: { type: "lost", status: "Οριστική" } });
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

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>
          Δήλωση Απολεσθέντος Κατοικιδίου
        </Typography>

        <WizardStepper activeStep={activeStep} steps={WIZARD_STEPS} />

        {/* STEP 0 */}
        {activeStep === 0 && (
          <Panel>
            <Box sx={{ maxWidth: 760, mx: "auto" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Επιλογή Κατοικιδίου *</Typography>
              <Typography sx={{ fontSize: 12, color: "#1a1a1a", opacity: 0.75, mb: 2 }}>
                Διάλεξε το κατοικίδιο για το οποίο θα κάνεις δήλωση απώλειας.
              </Typography>

              {petsLoading ? (
                <Typography sx={{ color: "#1a1a1a", opacity: 0.8, fontWeight: 800 }}>Φόρτωση...</Typography>
              ) : petsErr ? (
                <Paper
                  elevation={0}
                  sx={{ borderRadius: 2, p: 2, bgcolor: "#fff3f3", border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{petsErr}</Typography>
                </Paper>
              ) : pets.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{ borderRadius: 2, p: 2, bgcolor: "#eef1f4", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>
                    Δεν έχεις καταχωρήσει κατοικίδια.
                  </Typography>
                  <Typography sx={{ color: "#6b7a90", fontWeight: 700, fontSize: 12, mt: 0.6 }}>
                    Πήγαινε στα «Τα Κατοικίδια μου» για να προσθέσεις.
                  </Typography>
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
                <Typography sx={{ mt: 1.2, fontSize: 12, color: "#d32f2f", fontWeight: 800 }}>
                  {errors.petId}
                </Typography>
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

        {/* ================== STEP 1: LOSS DETAILS ================== */}
        {activeStep === 1 && (
          <Panel>
            <Box sx={{ maxWidth: 520, mx: "auto" }}>
              <Box sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Ημερομηνία Απώλειας *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={handleChange("date")}
                  onBlur={() => touch("date")}
                  fullWidth
                  sx={fieldSx}
                  inputProps={{ max: todayYMD(), min: oneYearAgoYMD() }}
                  error={!!errors.date && !!touched.date}
                  helperText={touched.date ? errors.date || " " : " "}
                />

                <FormControl fullWidth sx={fieldSx} error={!!errors.area && !!touched.area}>
                  <InputLabel>Περιοχή *</InputLabel>
                  <Select
                    label="Περιοχή *"
                    value={form.area}
                    onChange={handleChange("area")}
                    onBlur={() => touch("area")}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                    <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
                    <MenuItem value="Πάτρα">Πάτρα</MenuItem>
                    <MenuItem value="Άλλη">Άλλη</MenuItem>
                  </Select>

                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                    {touched.area ? errors.area || " " : " "}
                  </Typography>
                </FormControl>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή</Typography>
                  <TextField
                    multiline
                    minRows={5}
                    value={form.notes}
                    onChange={handleChange("notes")}
                    fullWidth
                    sx={fieldSx}
                    placeholder="Περιγράψτε εμφανισιακά χαρακτηριστικά, λουράκι, σημάδια, συμπεριφορά ή ό,τι άλλο βοηθάει."
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Φωτογραφία Κατοικιδίου</Typography>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onPickFile}
                  />

                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    sx={{
                      height: 140,
                      borderRadius: 3,
                      border: "2px solid #000",
                      bgcolor: "#bfc8d3",
                      display: "grid",
                      placeItems: "center",
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      position: "relative",
                    }}
                    title="Κλικ για επιλογή εικόνας ή σύρε αρχείο εδώ"
                  >
                    {!photoPreview ? (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
                        Ανεβάστε μια καθαρή
                        <br />
                        φωτογραφία του κατοικιδίου.
                        <br />
                        <span style={{ fontWeight: 600, opacity: 0.8 }}>(Click ή Drag & Drop)</span>
                      </Typography>
                    ) : (
                      <Box component="img" src={photoPreview} alt="Preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Επιλογή
                    </Button>

                    <Button
                      variant="outlined"
                      disabled={!photoPreview}
                      onClick={removePhoto}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Αφαίρεση
                    </Button>

                    <Box sx={{ flex: 1 }} />
                    <Typography sx={{ fontSize: 12, color: "#000", opacity: 0.7, alignSelf: "center" }}>
                      {photoFile ? photoFile.name : ""}
                    </Typography>
                  </Stack>
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

        {/* ================== STEP 2: PREVIEW ================== */}
        {activeStep === 2 && (
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
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Ιδιοκτήτη</Typography>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Όνομα</Typography>
                  <TextField value={form.firstName || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Επώνυμο</Typography>
                  <TextField value={form.lastName || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Τηλέφωνο</Typography>
                  <TextField value={normalizePhone(form.phone) || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Email</Typography>
                  <TextField value={form.email || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Απώλειας</Typography>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Ημερομηνία Απώλειας</Typography>
                  <TextField value={form.date ? fmtDDMMYYYY(form.date) : "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Περιοχή</Typography>
                  <TextField value={form.area || "-"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Περιγραφή</Typography>
                  <TextField value={form.notes || "—"} fullWidth multiline minRows={5} sx={fieldSx} InputProps={{ readOnly: true }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Φωτογραφία Κατοικιδίου</Typography>
                  <Box
                    sx={{
                      height: 140,
                      borderRadius: 3,
                      border: "2px solid #000",
                      bgcolor: "#bfc8d3",
                      display: "grid",
                      placeItems: "center",
                      p: 2,
                      textAlign: "center",
                      overflow: "hidden",
                    }}
                  >
                    {!photoPreview ? (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
                        Ανεβάστε μια καθαρή
                        <br />
                        φωτογραφία του κατοικιδίου.
                      </Typography>
                    ) : (
                      <Box component="img" src={photoPreview} alt="Preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </Box>
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
                onClick={() => setActiveStep(1)}
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
                disabled={saving || !isStep0Valid || !isStep1Valid}
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
                disabled={saving || !isStep0Valid || !isStep1Valid || !form.acceptTerms}
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
