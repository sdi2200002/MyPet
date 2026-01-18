// src/pages/Profile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import { useAuth } from "../../auth/AuthContext";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
  panelBg: "#dbeaff",
  panelBorder: "#8fb4e8",
  muted: "#6b7a90",
  error: "#d32f2f",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    borderRadius: 2,
    "& fieldset": { borderColor: "#a7b8cf" },
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

// πιο “έντονη” εμφάνιση για preview/read-only
const readOnlyFieldSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-root": {
    ...fieldSx["& .MuiOutlinedInput-root"],
    bgcolor: "rgba(255,255,255,0.75)",
    "& fieldset": { borderColor: COLORS.panelBorder },
    "& input": {
      fontWeight: 900,
      color: COLORS.title,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 800,
    color: COLORS.title,
  },
  "& .MuiFormHelperText-root": { display: "none" },
};

// primary buttons όπως στις άλλες σελίδες
const primaryBtnSx = {
  bgcolor: COLORS.primary,
  fontWeight: 900,
  borderRadius: 2,
  px: 2.2,
  "&:hover": { bgcolor: COLORS.primaryHover },
};

const outlineBtnSx = {
  borderRadius: 2,
  fontWeight: 900,
  borderColor: COLORS.primary,
  color: COLORS.primary,
  "&:hover": { borderColor: COLORS.primaryHover, color: COLORS.primaryHover },
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "owner").toLowerCase();
  const isVet = role === "vet";
  const sidebarW = isVet ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // photo
  const [photoFile, setPhotoFile] = useState(null); // (κρατιέται αν στο μέλλον κάνεις multipart upload)
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef(null);

  const emptyForm = {
    // Owner
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    address: "",

    // Vet
    vetName: "",
    clinic: "",
    specialty: "",
    area: "",
    experience: "",
    studies: "",
    sex: "",

    photo: "",
  };

  const [dbUser, setDbUser] = useState(null); // original from DB
  const [form, setForm] = useState(emptyForm);

  // ---------- helpers ----------
  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const normalizePhone = (raw) => (raw || "").replace(/[^\d+]/g, "").trim();
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const errors = useMemo(() => {
    const e = {};
    if (!isVet) {
      if (!form.firstName.trim()) e.firstName = "Υποχρεωτικό πεδίο.";
      if (!form.lastName.trim()) e.lastName = "Υποχρεωτικό πεδίο.";
      if (!form.email.trim()) e.email = "Υποχρεωτικό πεδίο.";
      else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";
    } else {
      if (!form.vetName.trim()) e.vetName = "Υποχρεωτικό πεδίο.";
      if (!form.email.trim()) e.email = "Υποχρεωτικό πεδίο.";
      else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";
    }
    return e;
  }, [form, isVet]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);

  function applyLoadedDataToForm(data) {
    if (!isVet) {
      const firstName = data?.firstName || "";
      const lastName = data?.lastName || "";
      const name = data?.name || `${firstName} ${lastName}`.trim();

      setForm({
        ...emptyForm,
        firstName,
        lastName,
        name,
        email: data?.email || "",
        phone: data?.phone || "",
        address: data?.address || "",
        photo: data?.photoUrl || data?.photo || "",
      });

      const p = data?.photoUrl || data?.photo || "";
      setPhotoPreview(p || "");
      setPhotoFile(null);
    } else {
      setForm({
        ...emptyForm,
        vetName: data?.name || data?.vetName || "",
        clinic: data?.clinic || "",
        specialty: data?.specialty || "",
        area: data?.area || "",
        address: data?.address || "",
        phone: data?.phone || "",
        email: data?.email || "",
        experience: data?.experience || "",
        studies: data?.studies || "",
        sex: data?.sex || "",
        photo: data?.photoUrl || data?.photo || "",
      });

      const p = data?.photoUrl || data?.photo || "";
      setPhotoPreview(p || "");
      setPhotoFile(null);
    }
  }

  // ---------- Load profile ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user?.id) throw new Error("No user id");
        setLoading(true);
        setErr("");

        const endpoint = isVet
          ? `/api/vets/${encodeURIComponent(user.id)}`
          : `/api/users/${encodeURIComponent(user.id)}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!alive) return;
        setDbUser(json);
        applyLoadedDataToForm(json);
        setEditMode(false);
        setTouched({});
      } catch (e) {
        console.error(e);
        if (alive) setErr("Αποτυχία φόρτωσης προφίλ.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isVet]);

  // ---------- Photo handlers ----------
  function setSelectedPhoto(file) {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) return alert("Επέλεξε εικόνα JPG/PNG/WebP.");
    if (file.size > 5 * 1024 * 1024) return alert("Μέγιστο μέγεθος 5MB.");

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(url);
  }

  function onPickFile(e) {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (file) setSelectedPhoto(file);
  }

  function onDrop(e) {
    e.preventDefault();
    if (!editMode) return;
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedPhoto(file);
  }

  function onDragOver(e) {
    if (!editMode) return;
    e.preventDefault();
  }

  function removePhoto() {
    if (!editMode) return;
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoFile(null);
    setForm((p) => ({ ...p, photo: "" }));
  }

  function startEdit() {
    setEditMode(true);
    setTouched({});
    setErr("");
  }

  function cancelEdit() {
    if (dbUser) applyLoadedDataToForm(dbUser);
    setEditMode(false);
    setTouched({});
    setErr("");
  }

  async function handleSubmit() {
    // mark required fields as touched
    setTouched((p) => ({
      ...p,
      ...(isVet ? { vetName: true, email: true } : { firstName: true, lastName: true, email: true }),
    }));

    if (!canSubmit) return;

    setSaving(true);
    setErr("");

    try {
      let payload;
      let endpoint;

      if (!isVet) {
        const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

        payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          name,
          email: form.email.trim(),
          phone: normalizePhone(form.phone),
          address: form.address.trim(),
          photo: photoPreview || "",
        };

        endpoint = `/api/users/${encodeURIComponent(user.id)}`;
      } else {
        payload = {
          name: form.vetName.trim(),
          clinic: form.clinic.trim(),
          specialty: form.specialty.trim(),
          area: form.area.trim(),
          address: form.address.trim(),
          phone: normalizePhone(form.phone),
          email: form.email.trim(),
          experience: form.experience.trim(),
          studies: form.studies.trim(),
          sex: form.sex.trim(),
          photo: photoPreview || "",
        };

        endpoint = `/api/vets/${encodeURIComponent(user.id)}`;
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let updated = null;
      try {
        updated = await res.json();
      } catch {
        updated = null;
      }

      if (updated) {
        setDbUser(updated);
        applyLoadedDataToForm(updated);
      } else {
        // Αν δεν επιστρέφει object, ξαναφόρτωσε σωστά
        const r2 = await fetch(endpoint);
        if (r2.ok) {
          const j2 = await r2.json();
          setDbUser(j2);
          applyLoadedDataToForm(j2);
        }
      }

      setEditMode(false);
      alert("Το προφίλ ενημερώθηκε επιτυχώς!");
    } catch (e) {
      console.error(e);
      setErr("Αποτυχία αποθήκευσης.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <PublicNavbar />
        <Container sx={{ mt: 3 }}>
          <AppBreadcrumbs />
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 900 }}>Πρέπει να συνδεθείς για να δεις το προφίλ.</Typography>
            <Button
              onClick={() => navigate("/login")}
              variant="contained"
              sx={{ ...primaryBtnSx, mt: 2 }}
            >
              Σύνδεση
            </Button>
          </Paper>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box sx={{ width: sidebarW, flex: `0 0 ${sidebarW}px`, display: { xs: "none", lg: "block" } }} />
        {isVet ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <AppBreadcrumbs />

            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: COLORS.panelBg,
                border: `2px solid ${COLORS.panelBorder}`,
              }}
            >
              <Stack spacing={2}>
                {err && <Typography sx={{ color: COLORS.error, fontWeight: 800 }}>{err}</Typography>}

                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                  <Stack spacing={0.4}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, color: COLORS.title }}>
                      Προφίλ {isVet ? "Κτηνιάτρου" : "Χρήστη"}
                    </Typography>
                    {!editMode && !loading && (
                      <Typography sx={{ color: COLORS.muted, fontWeight: 800, fontSize: 13 }}>
                        Προβολή στοιχείων (πάτησε «Επεξεργασία» για αλλαγές)
                      </Typography>
                    )}
                  </Stack>

                  {!loading && (
                    <Stack direction="row" spacing={1}>
                      {!editMode ? (
                        <Button variant="contained" sx={primaryBtnSx} onClick={startEdit}>
                          Επεξεργασία
                        </Button>
                      ) : (
                        <>
                          <Button variant="outlined" sx={outlineBtnSx} onClick={cancelEdit} disabled={saving}>
                            Ακύρωση
                          </Button>
                          <Button variant="contained" sx={primaryBtnSx} onClick={handleSubmit} disabled={!canSubmit || saving}>
                            Υποβολή
                          </Button>
                        </>
                      )}
                    </Stack>
                  )}
                </Stack>

                {loading ? (
                  <Typography sx={{ color: COLORS.muted, fontWeight: 700 }}>Φόρτωση...</Typography>
                ) : (
                  <Stack spacing={2}>
                    {/* Photo */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 140,
                          height: 140,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: `1px solid ${COLORS.panelBorder}`,
                          cursor: editMode ? "pointer" : "default",
                          opacity: editMode ? 1 : 0.98,
                          userSelect: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fff",
                          boxShadow: editMode ? "0 6px 16px rgba(0,0,0,0.10)" : "none",
                        }}
                        onClick={() => (editMode ? fileInputRef.current?.click() : null)}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        title={editMode ? "Κλικ για αλλαγή φωτογραφίας" : ""}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={onPickFile}
                          disabled={!editMode}
                        />
                        {!photoPreview ? (
                          <Typography sx={{ textAlign: "center", px: 1, color: COLORS.muted, fontWeight: 800 }}>
                            {editMode ? "Κλικ ή σύρε εικόνα εδώ" : "Χωρίς φωτογραφία"}
                          </Typography>
                        ) : (
                          <Box
                            component="img"
                            src={photoPreview}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </Box>

                      <Stack spacing={1}>
                        <Typography sx={{ color: COLORS.muted, fontSize: 13, fontWeight: 800 }}>
                          {editMode ? "Επιτρέπονται JPG/PNG/WebP έως 5MB." : "Προεπισκόπηση φωτογραφίας."}
                        </Typography>
                        <Button onClick={removePhoto} disabled={!editMode || !photoPreview} sx={{ ...outlineBtnSx, width: "fit-content" }}>
                          Αφαίρεση φωτογραφίας
                        </Button>
                      </Stack>
                    </Stack>

                    {/* Form */}
                    <Stack spacing={2}>
                      {isVet ? (
                        <>
                          <TextField
                            label="Ονοματεπώνυμο"
                            value={form.vetName}
                            onChange={handle("vetName")}
                            onBlur={() => touch("vetName")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                            error={editMode && !!errors.vetName && touched.vetName}
                            helperText={editMode ? (touched.vetName ? errors.vetName || " " : " ") : " "}
                          />
                          <TextField
                            label="Κλινική"
                            value={form.clinic}
                            onChange={handle("clinic")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Ειδικότητα"
                            value={form.specialty}
                            onChange={handle("specialty")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Περιοχή"
                            value={form.area}
                            onChange={handle("area")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Διεύθυνση"
                            value={form.address}
                            onChange={handle("address")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Τηλέφωνο"
                            value={form.phone}
                            onChange={handle("phone")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Email"
                            value={form.email}
                            onChange={handle("email")}
                            onBlur={() => touch("email")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                            error={editMode && !!errors.email && touched.email}
                            helperText={editMode ? (touched.email ? errors.email || " " : " ") : " "}
                          />
                          <TextField
                            label="Εμπειρία"
                            value={form.experience}
                            onChange={handle("experience")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Σπουδές"
                            value={form.studies}
                            onChange={handle("studies")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Φύλο"
                            value={form.sex}
                            onChange={handle("sex")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                        </>
                      ) : (
                        <>
                          <TextField
                            label="Όνομα"
                            value={form.firstName}
                            onChange={handle("firstName")}
                            onBlur={() => touch("firstName")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                            error={editMode && !!errors.firstName && touched.firstName}
                            helperText={editMode ? (touched.firstName ? errors.firstName || " " : " ") : " "}
                          />
                          <TextField
                            label="Επώνυμο"
                            value={form.lastName}
                            onChange={handle("lastName")}
                            onBlur={() => touch("lastName")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                            error={editMode && !!errors.lastName && touched.lastName}
                            helperText={editMode ? (touched.lastName ? errors.lastName || " " : " ") : " "}
                          />
                          <TextField
                            label="Email"
                            value={form.email}
                            onChange={handle("email")}
                            onBlur={() => touch("email")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                            error={editMode && !!errors.email && touched.email}
                            helperText={editMode ? (touched.email ? errors.email || " " : " ") : " "}
                          />
                          <TextField
                            label="Τηλέφωνο"
                            value={form.phone}
                            onChange={handle("phone")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                          <TextField
                            label="Διεύθυνση"
                            value={form.address}
                            onChange={handle("address")}
                            sx={editMode ? fieldSx : readOnlyFieldSx}
                            disabled={!editMode}
                          />
                        </>
                      )}
                    </Stack>

                    {/* ✅ Αφαιρέθηκε το κουμπί "Πίσω" */}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
