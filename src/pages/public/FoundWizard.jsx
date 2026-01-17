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

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

function looksLikeMatch(found, lost) {
  const sameSpecies = norm(found?.species) && norm(found?.species) === norm(lost?.species);
  const sameArea = norm(found?.area) && norm(found?.area) === norm(lost?.area);

  const fColor = norm(found?.color);
  const lColor = norm(lost?.color);
  const colorOk = fColor && lColor && (fColor.includes(lColor) || lColor.includes(fColor));

  return sameSpecies && sameArea && colorOk;
}

// notification στον owner της lost δήλωσης
async function notifyOwnerForFoundMatch({ foundDecl, lostDecl }) {
  const ownerId = lostDecl?.ownerId ?? lostDecl?.userId ?? lostDecl?.finderId;
  if (!ownerId) return;

  const payload = {
    id: `n_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    userId: String(ownerId),
    role: "owner",

    type: "pet_found_match",
    title: "Βρέθηκε πιθανό ταίριασμα!",
    message: `Υπάρχει νέα δήλωση εύρεσης που μοιάζει με τη δήλωση απώλειάς σας (${lostDecl?.area || "—"}).`,

    refType: "foundDeclaration",
    refId: String(foundDecl?.id ?? ""),
    createdAt: new Date().toISOString(),
    readAt: null,

    meta: {
      lostDeclarationId: String(lostDecl?.id ?? ""),
      foundDeclarationId: String(foundDecl?.id ?? ""),
      area: foundDecl?.area,
      species: foundDecl?.species,
      color: foundDecl?.color,
    },
  };

  await fetchJSON(`/api/notifications`, {
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
  const v = (email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

/** ✅ split ονοματεπώνυμο (αφαιρεί "Δρ."/"Dr.") */
function splitFullName(full) {
  const raw = String(full || "").trim();
  const cleaned = raw.replace(/^(Δρ\.?|Dr\.?)\s+/i, "").trim();
  if (!cleaned) return { firstName: "", lastName: "" };

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function AuthedShell({ role, sidebarW, children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
          }}
        />

        {role === "vet" ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}

        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

function PublicShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />
      <Box sx={{ flex: 1 }}>{children}</Box>
      <Footer />
    </Box>
  );
}

const WIZARD_STEPS = ["Στοιχεία Εύρεσης", "Στοιχεία Ευρετή", "Προεπισκόπηση Αναφοράς"];

/**
 * role: "public" | "owner" | "vet"
 */
export default function FoundWizard({ role = "public" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAuthedRoute = role === "owner" || role === "vet";
  const base = role === "vet" ? "/vet" : role === "owner" ? "/owner" : "";
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const Shell = isAuthedRoute ? AuthedShell : PublicShell;

  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

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

    // server fields
    photoDataUrl: "",
    createdAt: "",
    updatedAt: "",
    status: "",
  });

  // ✅ Prefill only for owner/vet routes (διορθωμένο split)
  useEffect(() => {
    if (!isAuthedRoute) return;
    if (!user?.id) return;

    // αν ΔΕΝ έχει ξεχωριστά first/last, κάνε split από name
    const fromName = splitFullName(user?.name);

    const nextFirst =
      form.firstName ||
      user?.firstName ||
      fromName.firstName ||
      ""; // <-- μόνο όνομα

    const nextLast =
      form.lastName ||
      user?.lastName ||
      fromName.lastName ||
      ""; // <-- μόνο επώνυμο

    setForm((p) => ({
      ...p,
      finderId: p.finderId || user.id,
      firstName: nextFirst,
      lastName: nextLast,
      phone: p.phone || user.phone || "",
      email: p.email || user.email || "",
    }));
    // ⚠️ ΠΡΟΣΟΧΗ: βάζουμε dependency και τα form.first/last για να μη στο “πατάει” όταν γράφεις
    // (αν θες ακόμα πιο αυστηρό, μπορώ να το κάνω only-once με ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthedRoute, user?.id, user?.firstName, user?.lastName, user?.name, user?.phone, user?.email]);

  // ✅ edit mode
  useEffect(() => {
    const draftId = location.state?.draftId;
    const targetStep = location.state?.step;

    if (!draftId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await fetchJSON(`/api/foundDeclarations/${encodeURIComponent(String(draftId))}`);
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

  // touched/errors
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
    if (form.date && form.date > todayYMD()) e.date = "Δεν επιτρέπεται μελλοντική ημερομηνία.";
    if (form.date && form.date < oneYearAgoYMD()) e.date = "Μπορείς να επιλέξεις έως 1 χρόνο πίσω.";
    if (!form.area) e.area = "Υποχρεωτικό πεδίο.";
    if (!String(form.species || "").trim()) e.species = "Υποχρεωτικό πεδίο.";
    if (!String(form.color || "").trim()) e.color = "Υποχρεωτικό πεδίο.";

    // required step 2
    if (!String(form.firstName || "").trim()) e.firstName = "Υποχρεωτικό πεδίο.";
    if (!String(form.lastName || "").trim()) e.lastName = "Υποχρεωτικό πεδίο.";

    const phone = normalizePhone(form.phone);
    if (!phone) e.phone = "Υποχρεωτικό πεδίο.";
    else if (phone.replace("+", "").length < 10) e.phone = "Βάλε έγκυρο τηλέφωνο (τουλάχιστον 10 ψηφία).";

    if (!String(form.email || "").trim()) e.email = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";

    return e;
  }, [form]);

  const isStep1Valid = !errors.date && !errors.area && !errors.species && !errors.color;
  const isStep2Valid = !errors.firstName && !errors.lastName && !errors.phone && !errors.email;

  function next() {
    if (activeStep === 0) {
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
    let photoDataUrl = form.photoDataUrl || "";
    if (photoFile) photoDataUrl = await fileToBase64(photoFile);

    return {
      finderId: isAuthedRoute ? user?.id ?? form.finderId ?? "" : form.finderId ?? "",
      status,

      date: form.date,
      area: form.area,
      sex: form.sex,
      species: String(form.species || "").trim(),
      color: String(form.color || "").trim(),
      notes: String(form.notes || "").trim(),

      firstName: String(form.firstName || "").trim(),
      lastName: String(form.lastName || "").trim(),
      phone: normalizePhone(form.phone),
      email: String(form.email || "").trim(),

      photoDataUrl,

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function goSuccess(type, status) {
    if (isAuthedRoute) {
      navigate(`${base}/declarations/success`, { state: { type, status } });
      return;
    }
    navigate(`/declarations/success`, { state: { type, status } });
  }

  async function saveDraft() {
    ["date", "area", "species", "color", "firstName", "lastName", "phone", "email"].forEach(touch);
    if (!isStep1Valid || !isStep2Valid) return;

    setSaving(true);
    try {
      const payload = await buildPayload("Πρόχειρη");

      if (editingId) {
        await fetchJSON(`/api/foundDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await fetchJSON(`/api/foundDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(String(created?.id));
      }

      goSuccess("found", "Πρόχειρη");
    } catch (e) {
      console.error(e);
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

      let createdOrUpdated = null;

      if (editingId) {
        createdOrUpdated = await fetchJSON(`/api/foundDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        createdOrUpdated = await fetchJSON(`/api/foundDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(String(createdOrUpdated?.id));
      }

      try {
        const lostList = await fetchJSON(`/api/lostDeclarations?status=Οριστική`);
        const lostArr = Array.isArray(lostList) ? lostList : [];
        const matches = lostArr.filter((lost) => looksLikeMatch(createdOrUpdated, lost));

        for (const lostDecl of matches) {
          await notifyOwnerForFoundMatch({ foundDecl: createdOrUpdated, lostDecl });
        }
      } catch (e) {
        console.warn("Matching/notifications failed (ignored):", e);
      }

      goSuccess("found", "Οριστική");
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά στην υποβολή.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell {...(isAuthedRoute ? { role, sidebarW } : {})}>
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
                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Στοιχεία Εύρεσης</Typography>

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
                  label="Ημερομηνία Εύρεσης *"
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

                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Φύλο</InputLabel>
                  <Select label="Φύλο" value={form.sex} onChange={handleChange("sex")}>
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                    <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* right column: photo + description */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
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
                      <Box
                        component="img"
                        src={photoPreview}
                        alt="Preview"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ textTransform: "none", borderRadius: 2 }}>
                      Επιλογή
                    </Button>

                    <Button variant="outlined" disabled={!photoPreview} onClick={removePhoto} sx={{ textTransform: "none", borderRadius: 2 }}>
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
              <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Στοιχεία Ευρετή</Typography>

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
            {/* (το υπόλοιπο σου είναι ίδιο όπως το έστειλες) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr 1fr" },
                gap: 3,
                alignItems: "start",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Στοιχεία Κατοικιδίου</Typography>

                <TextField label="Ημερομηνία Εύρεσης" value={form.date || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Περιοχή" value={form.area || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Φύλο" value={form.sex || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Είδος" value={form.species || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Χρώμα" value={form.color || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή</Typography>
                <TextField value={form.notes || "—"} fullWidth multiline minRows={4} sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Φωτογραφία Κατοικιδίου</Typography>
                <Box sx={{ height: 140, borderRadius: 3, border: "2px solid #000", bgcolor: "#bfc8d3", display: "grid", placeItems: "center", p: 2, textAlign: "center", overflow: "hidden" }}>
                  {!photoPreview ? (
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
                      Ανεβάστε μια καθαρή <br />
                      φωτογραφία του κατοικιδίου.
                    </Typography>
                  ) : (
                    <Box component="img" src={photoPreview} alt="Preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Στοιχεία Ευρετή</Typography>
                <TextField label="Όνομα" value={form.firstName || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Επώνυμο" value={form.lastName || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Τηλέφωνο" value={normalizePhone(form.phone) || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                <TextField label="Email" value={form.email || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <FormControlLabel control={<Checkbox checked={form.acceptTerms} onChange={handleChange("acceptTerms")} />} label="Συμφωνώ με τους όρους & προϋποθέσεις" />
            </Box>

            <Stack direction="row" justifyContent="right" spacing={2} sx={{ mt: 2 }}>
              <Button
                onClick={() => (isAuthedRoute ? navigate(`${base}/declarations`) : navigate("/"))}
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
    </Shell>
  );
}
