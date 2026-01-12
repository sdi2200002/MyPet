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

const STORAGE_KEY = "mypet_found_declarations";

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  return `fd_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  const v = (email || "").trim();
  // simple but solid enough for UI
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const WIZARD_STEPS = [
  "Στοιχεία Εύρεσης",
  "Στοιχεία Ευρετή",
  "Προεπισκόπηση Αναφοράς",
];

export default function FoundWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---------- Photo upload state ----------
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(""); // objectURL for preview
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
    finderId: 1,

    // Step 1
    date: "",
    area: "",
    sex: "",
    species: "",
    color: "",
    notes: "",

    // Step 2
    firstName: "",
    lastName: "",
    phone: "",
    email: "",

    // Step 3
    acceptTerms: false,
  });

  useEffect(() => {
    const draftId = location.state?.draftId;
    const targetStep = location.state?.step;

    if (!draftId) return;

    const list = loadFromStorage();
    const draft = list.find((x) => x.id === draftId);

    if (!draft) {
      alert("Δεν βρέθηκε το πρόχειρο.");
      return;
    }

    setEditingId(draftId);

    setForm((p) => ({
      ...p,
      ...draft,
      acceptTerms: false,
    }));

    if (draft.photoDataUrl) {
      setPhotoPreview(draft.photoDataUrl); // dataURL
      setPhotoFile(null);
    } else {
      setPhotoPreview("");
      setPhotoFile(null);
    }

    // preview είναι step 2 (γιατί έχεις 0,1,2)
    setActiveStep(typeof targetStep === "number" ? targetStep : 2);
  }, [location.state]);

  // touched/errors for required fields
  const [touched, setTouched] = useState({});
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const handleChange = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const errors = useMemo(() => {
    const e = {};

    // required step 1
    if (!form.date) e.date = "Υποχρεωτικό πεδίο.";
    if (!form.area) e.area = "Υποχρεωτικό πεδίο.";
    if (!form.species.trim()) e.species = "Υποχρεωτικό πεδίο.";
    if (!form.color.trim()) e.color = "Υποχρεωτικό πεδίο.";

    // required step 2
    if (!form.firstName.trim()) e.firstName = "Υποχρεωτικό πεδίο.";
    if (!form.lastName.trim()) e.lastName = "Υποχρεωτικό πεδίο.";

    const phone = normalizePhone(form.phone);
    if (!phone) e.phone = "Υποχρεωτικό πεδίο.";
    else if (phone.replace("+", "").length < 10) e.phone = "Βάλε έγκυρο τηλέφωνο (τουλάχιστον 10 ψηφία).";

    if (!form.email.trim()) e.email = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";

    return e;
  }, [form]);

  const isStep1Valid = !errors.date && !errors.area && !errors.species && !errors.color;
  const isStep2Valid = !errors.firstName && !errors.lastName && !errors.phone && !errors.email;

  function next() {
    if (activeStep === 0) {
      // mark required as touched
      ["date", "area", "species", "color"].forEach(touch);
      if (!isStep1Valid) return;
    }
    if (activeStep === 1) {
      ["firstName", "lastName", "phone", "email"].forEach(touch);
      if (!isStep2Valid) return;
    }
    setActiveStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function back() {
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function buildPayload(status) {
    let photoDataUrl = form.photoDataUrl || ""; // κράτα παλιά αν υπάρχει

    if (photoFile) {
      photoDataUrl = await fileToBase64(photoFile);
    }

    return {
      finderId: form.finderId,
      status,
      date: form.date,
      area: form.area,
      sex: form.sex,
      species: form.species.trim(),
      color: form.color.trim(),
      notes: form.notes.trim(),
      photoDataUrl,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: normalizePhone(form.phone),
      email: form.email.trim(),
      createdAt: form.createdAt || new Date().toISOString(),
    };
  }

  async function saveDraft() {
    ["date", "area", "species", "color", "firstName", "lastName", "phone", "email"].forEach(touch);
    if (!isStep1Valid || !isStep2Valid) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Πρόχειρη");
      const list = loadFromStorage();

      if (editingId) {
        const idx = list.findIndex((x) => x.id === editingId);
        if (idx !== -1) list[idx] = { ...list[idx], ...payload, id: editingId };
        else list.push({ id: editingId, ...payload });
      } else {
        list.push({ id: makeId(), ...payload });
      }

      saveToStorage(list);
      navigate("/owner/declarations/success", { state: { type: "found", status: "Πρόχειρη" } });
    } catch {
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    ["date", "area", "species", "color", "firstName", "lastName", "phone", "email"].forEach(touch);
    if (!isStep1Valid || !isStep2Valid) return;
    if (!form.acceptTerms) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Οριστική");
      const list = loadFromStorage();

      if (editingId) {
        const idx = list.findIndex((x) => x.id === editingId);
        if (idx !== -1) list[idx] = { ...list[idx], ...payload, id: editingId };
        else list.push({ id: editingId, ...payload });
      } else {
        list.push({ id: makeId(), ...payload });
      }

      saveToStorage(list);
      navigate("/owner/declarations/success", { state: { type: "found", status: "Οριστική" } });
    } catch {
      alert("Κάτι πήγε στραβά στην υποβολή.");
    } finally {
      setSaving(false);
    }
  }



  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>
            Δήλωση Εύρεσης Κατοικιδίου
          </Typography>

          <WizardStepper activeStep={activeStep} steps={WIZARD_STEPS} />

          {/* ================== STEP 1 ================== */}
          {activeStep === 0 && (
            <Panel>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
                  gap: 3,
                  alignItems: "start",
                }}
              >
                {/* left column fields */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                  <TextField
                    label="Ημερομηνία Εύρεσης *"
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

                  <FormControl fullWidth sx={fieldSx}>
                    <InputLabel>Φύλο</InputLabel>
                    <Select label="Φύλο" value={form.sex} onChange={handleChange("sex")}>
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                      <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                      <MenuItem value="Άγνωστο">Άγνωστο</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Είδος Ζώου *"
                    value={form.species}
                    onChange={handleChange("species")}
                    onBlur={() => touch("species")}
                    fullWidth
                    sx={fieldSx}
                    placeholder="π.χ. Σκύλος / Γάτα"
                    error={!!errors.species && !!touched.species}
                    helperText={touched.species ? errors.species || " " : " "}
                  />

                  <TextField
                    label="Χρώμα *"
                    value={form.color}
                    onChange={handleChange("color")}
                    onBlur={() => touch("color")}
                    fullWidth
                    sx={fieldSx}
                    error={!!errors.color && !!touched.color}
                    helperText={touched.color ? errors.color || " " : " "}
                  />
                </Box>

                {/* right column: photo + description */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Φωτογραφία Κατοικιδίου</Typography>

                    {/* hidden input */}
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
                        <Box
                          component="img"
                          src={photoPreview}
                          alt="Preview"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
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
                </Box>
              </Box>

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
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
                  }}
                >
                  Επόμενο
                </Button>
              </Stack>
            </Panel>
          )}

          {/* ================== STEP 2 ================== */}
          {activeStep === 1 && (
            <Panel>
              <Box sx={{ maxWidth: 380, mx: "auto", display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                <TextField
                  label="Όνομα *"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  onBlur={() => touch("firstName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.firstName && !!touched.firstName}
                  helperText={touched.firstName ? errors.firstName || " " : " "}
                />
                <TextField
                  label="Επώνυμο *"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  onBlur={() => touch("lastName")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.lastName && !!touched.lastName}
                  helperText={touched.lastName ? errors.lastName || " " : " "}
                />
                <TextField
                  label="Τηλέφωνο *"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  onBlur={() => touch("phone")}
                  fullWidth
                  sx={fieldSx}
                  placeholder="π.χ. 69XXXXXXXX"
                  error={!!errors.phone && !!touched.phone}
                  helperText={touched.phone ? errors.phone || " " : " "}
                />
                <TextField
                  label="Email *"
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={() => touch("email")}
                  fullWidth
                  sx={fieldSx}
                  error={!!errors.email && !!touched.email}
                  helperText={touched.email ? errors.email || " " : " "}
                />

                <Stack direction="row" justifyContent="right" spacing={3} sx={{ mt: 3 }}>
                  <Button
                    onClick={back}
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                    }}
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
                    }}
                  >
                    Επόμενο
                  </Button>
                </Stack>
              </Box>
            </Panel>
          )}

          {/* ================== STEP 3 ================== */}
          {activeStep === 2 && (
            <Panel>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr 1fr" },
                  gap: 3,
                  alignItems: "start",
                }}
              >
                {/* Left: pet fields */}
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Στοιχεία Κατοικιδίου</Typography>

                  <TextField
                    label="Ημερομηνία Εύρεσης"
                    value={form.date || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    label="Περιοχή"
                    value={form.area || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    label="Φύλο"
                    value={form.sex || "—"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    label="Είδος"
                    value={form.species || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    label="Χρώμα"
                    value={form.color || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                {/* Middle: description + photo */}
                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή</Typography>
                  <TextField
                    value={
                      form.notes ||
                      "Περιγράψτε εμφανισιακά χαρακτηριστικά, λουράκι, σημάδια, συμπεριφορά ή ό,τι άλλο βοηθάει."
                    }
                    fullWidth
                    multiline
                    minRows={4}
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />

                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Φωτογραφία Κατοικιδίου</Typography>
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
                      <Box
                        component="img"
                        src={photoPreview}
                        alt="Preview"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Right: owner/finder fields */}
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Στοιχεία Ευρετή</Typography>

                  <TextField
                    label="Όνομα"
                    value={form.firstName || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Επώνυμο"
                    value={form.lastName || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Τηλέφωνο"
                    value={normalizePhone(form.phone) || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={{ ...fieldSx, mb: 2 }}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Email"
                    value={form.email || "Καταχωρημένα στοιχεία"}
                    fullWidth
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={form.acceptTerms} onChange={handleChange("acceptTerms")} />}
                  label="Συμφωνώ με τους όρους & προϋποθέσεις"
                />
              </Box>

              <Stack direction="row" justifyContent="right" spacing={2} sx={{ mt: 2 }}>
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
                  }}
                >
                  Ακύρωση
                </Button>

                <Button
                  onClick={() => setActiveStep(0)}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: "#c9d0dd",
                    color: "#000",
                    "&:hover": { bgcolor: "#b8c0cf" },
                  }}
                >
                  Επεξεργασία
                </Button>

                <Button
                  onClick={saveDraft}
                  disabled={saving || !isStep1Valid || !isStep2Valid}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    bgcolor: "#c9d0dd",
                    color: "#000",
                    "&:hover": { bgcolor: "#b8c0cf" },
                  }}
                >
                  Προσωρινή Αποθήκευση
                </Button>

                <Button
                  onClick={submitFinal}
                  disabled={saving || !isStep1Valid || !isStep2Valid || !form.acceptTerms}
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: COLORS.primary,
                    "&:hover": { bgcolor: COLORS.primaryHover },
                  }}
                >
                  Οριστική Υποβολή
                </Button>
              </Stack>
            </Panel>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
