// src/pages/vet/PetsNew.jsx
import { useRef, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
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

function normalizePhone(raw) {
  return (raw || "").replace(/[^\d+]/g, "").trim();
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function toDDMMYYYY(iso) {
  // iso: YYYY-MM-DD
  if (!iso || !iso.includes("-")) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
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

function VetPageShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: VET_SIDEBAR_W,
            flex: `0 0 ${VET_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />
        <VetNavbar mode="navbar" />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function findUserIdByEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return null;

  // 1) try query endpoint
  try {
    const hit = await fetchJSON(`/api/users?email=${encodeURIComponent(e)}`);
    const u = Array.isArray(hit) ? hit[0] : null;
    if (u?.id != null) return String(u.id);
  } catch {
    // ignore
  }

  // 2) fallback: fetch all
  const all = await fetchJSON(`/api/users`);
  const arr = Array.isArray(all) ? all : [];
  const u = arr.find((x) => String(x?.email || "").trim().toLowerCase() === e);
  return u?.id != null ? String(u.id) : null;
}

export default function PetsNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const resolvedUser = user?.user ?? user;
  const vetId = resolvedUser?.id ? String(resolvedUser.id) : "";
  const role = String(resolvedUser?.role || "").toLowerCase();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // edit-mode
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    // Pet
    name: "",
    birthDateIso: "",
    sex: "", // required
    species: "", // required
    breed: "",
    color: "",
    microchip: "", // required
    bloodType: "",

    // Owner
    ownerName: "",
    ownerPhone: "",
    ownerAddress: "",
    ownerEmail: "", // required (identifier)

    // Photo
    photoDataUrl: "",

    // meta
    createdAt: "",
    updatedAt: "",
  });

  // ---------- Photo upload (SAME as FoundWizard) ----------
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

  // vet guard
  useEffect(() => {
    if (!vetId) setErr("Δεν υπάρχει συνδεδεμένος κτηνίατρος.");
    else if (role && role !== "vet") setErr("Η σελίδα είναι διαθέσιμη μόνο για κτηνίατρο.");
    else setErr("");
  }, [vetId, role]);

  // ✅ load draft if navigated with { state: { draftId } }
  useEffect(() => {
    const draftId = location.state?.draftId;
    if (!draftId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await fetchJSON(
          `/api/registrationDeclarations/${encodeURIComponent(String(draftId))}`
        );
        if (!alive) return;

        setEditingId(String(draftId));

        setForm((p) => ({
          ...p,
          name: draft?.petName ?? draft?.name ?? p.name,
          birthDateIso: draft?.birthDateIso ?? p.birthDateIso,
          sex: draft?.sex ?? p.sex,
          species: draft?.species ?? p.species,
          breed: draft?.breed ?? p.breed,
          color: draft?.color ?? p.color,
          microchip: draft?.microchip ?? p.microchip,
          bloodType: draft?.bloodType ?? p.bloodType,
          ownerName: draft?.ownerName ?? p.ownerName,
          ownerPhone: draft?.ownerPhone ?? p.ownerPhone,
          ownerAddress: draft?.ownerAddress ?? p.ownerAddress,
          ownerEmail: draft?.ownerEmail ?? p.ownerEmail,
          photoDataUrl: draft?.photoDataUrl ?? p.photoDataUrl,
          createdAt: draft?.createdAt ?? p.createdAt,
          updatedAt: draft?.updatedAt ?? p.updatedAt,
        }));

        if (draft?.photoDataUrl) {
          setPhotoPreview(draft.photoDataUrl);
          setPhotoFile(null);
        } else {
          setPhotoPreview("");
          setPhotoFile(null);
        }
      } catch (e) {
        console.error(e);
        alert("Δεν βρέθηκε το πρόχειρο.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [location.state]);

  const touchedInit = useMemo(
    () => ({
      sex: false,
      species: false,
      microchip: false,
      ownerEmail: false,
    }),
    []
  );
  const [touched, setTouched] = useState(touchedInit);
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.sex) e.sex = "Υποχρεωτικό πεδίο.";
    if (!String(form.species || "").trim()) e.species = "Υποχρεωτικό πεδίο.";
    if (!String(form.microchip || "").trim()) e.microchip = "Υποχρεωτικό πεδίο.";

    if (!String(form.ownerEmail || "").trim()) e.ownerEmail = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.ownerEmail)) e.ownerEmail = "Μη έγκυρο email.";

    return e;
  }, [form.sex, form.species, form.microchip, form.ownerEmail]);

  const canSubmit =
    !errors.sex &&
    !errors.species &&
    !errors.microchip &&
    !errors.ownerEmail &&
    !!vetId &&
    role === "vet";

  async function checkMicrochipUnique(microchip) {
    const mc = String(microchip || "").trim();
    if (!mc) return true;

    try {
      const existing = await fetchJSON(`/api/pets?microchip=${encodeURIComponent(mc)}`);
      const arr = Array.isArray(existing) ? existing : [];
      return arr.length === 0;
    } catch {
      const all = await fetchJSON(`/api/pets`);
      const arr = Array.isArray(all) ? all : [];
      return !arr.some((p) => String(p?.microchip || "").trim() === mc);
    }
  }

  async function buildDeclPayload(status, ownerIdResolved, petIdMaybe) {
    let photoDataUrl = form.photoDataUrl || "";
    if (photoFile) photoDataUrl = String(await fileToBase64(photoFile));

    return {
      status, // "Πρόχειρη" | "Οριστική"
      vetId: String(vetId),
      ownerId: ownerIdResolved ? String(ownerIdResolved) : "",

      petId: petIdMaybe ? String(petIdMaybe) : "",
      petName: String(form.name || "—").trim(),
      birthDateIso: String(form.birthDateIso || ""),
      sex: String(form.sex || ""),
      species: String(form.species || "").trim(),
      breed: String(form.breed || "").trim(),
      color: String(form.color || "").trim(),
      microchip: String(form.microchip || "").trim(),
      bloodType: String(form.bloodType || "").trim(),

      ownerName: String(form.ownerName || "").trim(),
      ownerPhone: normalizePhone(form.ownerPhone),
      ownerAddress: String(form.ownerAddress || "").trim(),
      ownerEmail: String(form.ownerEmail || "").trim(),

      photoDataUrl: photoDataUrl || "",
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function saveDraft() {
    ["sex", "species", "microchip", "ownerEmail"].forEach(touch);
    if (!canSubmit) return;

    setSaving(true);
    setErr("");

    try {
      const ownerId = await findUserIdByEmail(form.ownerEmail);
      if (!ownerId) {
        setErr("Δεν βρέθηκε χρήστης με αυτό το email. Βάλε email που υπάρχει στη βάση (users).");
        return;
      }

      const declPayload = await buildDeclPayload("Πρόχειρη", ownerId, "");

      if (editingId) {
        await fetchJSON(`/api/registrationDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(declPayload),
        });
      } else {
        const created = await fetchJSON(`/api/registrationDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(declPayload),
        });
        setEditingId(String(created?.id));
      }

      navigate(`/vet/declarations/success`, {
        state: { type: "registration", status: "Πρόχειρη" },
      });
    } catch (e) {
      console.error(e);
      setErr("Αποτυχία προσωρινής αποθήκευσης.");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    ["sex", "species", "microchip", "ownerEmail"].forEach(touch);
    if (!canSubmit) return;

    setSaving(true);
    setErr("");

    try {
      const ownerId = await findUserIdByEmail(form.ownerEmail);
      if (!ownerId) {
        setErr("Δεν βρέθηκε χρήστης με αυτό το email. Βάλε email που υπάρχει στη βάση (users).");
        return;
      }

      const ok = await checkMicrochipUnique(form.microchip);
      if (!ok) {
        setErr("Υπάρχει ήδη κατοικίδιο με αυτό το microchip.");
        return;
      }

      let photoDataUrl = form.photoDataUrl || "";
      if (photoFile) photoDataUrl = String(await fileToBase64(photoFile));

      // create pet
      const petPayload = {
        ownerId: String(ownerId),
        vetId: String(vetId),

        name: String(form.name || "—").trim(),
        birthDate: form.birthDateIso ? toDDMMYYYY(form.birthDateIso) : "",
        species: String(form.species || "").trim(),
        breed: String(form.breed || "").trim(),
        sex: String(form.sex || ""),
        color: String(form.color || "").trim(),
        microchip: String(form.microchip || "").trim(),
        bloodType: String(form.bloodType || "").trim(),

        photo: photoDataUrl || "/images/dog1.png",
        updatedAt: new Date().toISOString(),
      };

      const createdPet = await fetchJSON(`/api/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petPayload),
      });

      const petId = String(createdPet?.id ?? "");

      const declPayload = await buildDeclPayload("Οριστική", ownerId, petId);

      if (editingId) {
        await fetchJSON(`/api/registrationDeclarations/${encodeURIComponent(String(editingId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(declPayload),
        });
      } else {
        await fetchJSON(`/api/registrationDeclarations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(declPayload),
        });
      }

      navigate(`/vet/declarations/success`, {
        state: { type: "registration", status: "Οριστική" },
      });
    } catch (e) {
      console.error(e);
      setErr("Αποτυχία καταχώρησης κατοικιδίου.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <VetPageShell>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>
          Δήλωση Νέας Καταγραφής
        </Typography>

        <Panel>
          {err && (
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 2,
                p: 1.4,
                bgcolor: "#fff3f3",
                border: "1px solid rgba(0,0,0,0.10)",
              }}
            >
              <Typography sx={{ color: "#b00020", fontWeight: 900, fontSize: 13 }}>
                {err}
              </Typography>
            </Paper>
          )}

          <Typography sx={{ fontWeight: 900, color: COLORS.title, mb: 1.5, fontSize: 16 }}>
            Στοιχεία Κατοικιδίου
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* LEFT: PET FIELDS */}
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Όνομα"
                value={form.name}
                onChange={handle("name")}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                label="Ημ. Γέννησης"
                type="date"
                value={form.birthDateIso}
                onChange={handle("birthDateIso")}
                fullWidth
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth sx={fieldSx} error={!!errors.sex && !!touched.sex}>
                <InputLabel>Φύλο *</InputLabel>
                <Select
                  label="Φύλο *"
                  value={form.sex}
                  onChange={handle("sex")}
                  onBlur={() => touch("sex")}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                  <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                </Select>
                <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                  {touched.sex ? errors.sex || " " : " "}
                </Typography>
              </FormControl>

              <TextField
                label="Είδος *"
                value={form.species}
                onChange={handle("species")}
                onBlur={() => touch("species")}
                fullWidth
                sx={fieldSx}
                error={!!errors.species && !!touched.species}
                helperText={touched.species ? errors.species || " " : " "}
              />

              <TextField
                label="Φυλή"
                value={form.breed}
                onChange={handle("breed")}
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Χρώμα"
                value={form.color}
                onChange={handle("color")}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                label="Microchip *"
                value={form.microchip}
                onChange={handle("microchip")}
                onBlur={() => touch("microchip")}
                fullWidth
                sx={fieldSx}
                error={!!errors.microchip && !!touched.microchip}
                helperText={touched.microchip ? errors.microchip || " " : " "}
                inputProps={{ inputMode: "numeric" }}
              />

              <TextField
                label="Ομάδα Αίματος"
                value={form.bloodType}
                onChange={handle("bloodType")}
                fullWidth
                sx={fieldSx}
              />
            </Box>

            {/* RIGHT: OWNER + PHOTO */}
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 14 }}>
                Ιδιοκτήτης
              </Typography>

              <TextField
                label="Ονοματεπώνυμο"
                value={form.ownerName}
                onChange={handle("ownerName")}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                label="Email Ιδιοκτήτη *"
                value={form.ownerEmail}
                onChange={handle("ownerEmail")}
                onBlur={() => touch("ownerEmail")}
                fullWidth
                sx={fieldSx}
                error={!!errors.ownerEmail && !!touched.ownerEmail}
                helperText={touched.ownerEmail ? errors.ownerEmail || " " : " "}
              />

              <TextField
                label="Τηλέφωνο"
                value={form.ownerPhone}
                onChange={handle("ownerPhone")}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                label="Διεύθυνση"
                value={form.ownerAddress}
                onChange={handle("ownerAddress")}
                fullWidth
                sx={fieldSx}
              />

              {/* PHOTO FIELD (same behavior as FoundWizard) */}
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 13, mb: 1 }}>
                  Φωτογραφία Κατοικιδίου
                </Typography>

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
            </Box>
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }} spacing={2} flexWrap="wrap">
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

            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => saveDraft().catch(console.error)}
                disabled={!canSubmit || saving}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#c9d0dd",
                  color: "#000",
                  "&:hover": { bgcolor: "#b8c0cf" },
                  fontWeight: 900,
                  opacity: !canSubmit || saving ? 0.65 : 1,
                }}
              >
                Προσωρινή Αποθήκευση
              </Button>

              <Button
                onClick={() => submitFinal().catch(console.error)}
                disabled={!canSubmit || saving}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  fontWeight: 900,
                  opacity: !canSubmit || saving ? 0.65 : 1,
                }}
              >
                Οριστική Υποβολή
              </Button>
            </Stack>
          </Stack>
        </Panel>
      </Container>
    </VetPageShell>
  );
}
