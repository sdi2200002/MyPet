import { useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const API_BASE = "http://localhost:3001"; // json-server

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}
function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function RegisterVet() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    phone: "",
    afm: "",
    specialty: "",
    education: "",
    experience: "",
    sex: "",
    photoDataUrl: "",
  });

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));
  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Υποχρεωτικό.";
    if (!form.lastName.trim()) e.lastName = "Υποχρεωτικό.";

    if (!form.email.trim()) e.email = "Υποχρεωτικό.";
    else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";

    if (!form.password) e.password = "Υποχρεωτικό.";
    else if (form.password.length < 4) e.password = "Τουλάχιστον 4 χαρακτήρες.";

    if (!form.address.trim()) e.address = "Υποχρεωτικό.";

    const phone = onlyDigits(form.phone);
    if (!phone) e.phone = "Υποχρεωτικό.";
    else if (phone.length < 10) e.phone = "Μη έγκυρο τηλέφωνο.";

    const afm = onlyDigits(form.afm);
    if (!afm) e.afm = "Υποχρεωτικό.";
    else if (afm.length !== 9) e.afm = "Το ΑΦΜ πρέπει να είναι 9 ψηφία.";

    if (!form.specialty.trim()) e.specialty = "Υποχρεωτικό.";
    if (!form.education.trim()) e.education = "Υποχρεωτικό.";
    if (!form.experience.trim()) e.experience = "Υποχρεωτικό.";
    if (!form.sex.trim()) e.sex = "Υποχρεωτικό.";
    if (!form.photoDataUrl) e.photoDataUrl = "Ανέβασε φωτογραφία.";
    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setForm((p) => ({ ...p, photoDataUrl: url }));
    touch("photoDataUrl");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    Object.keys(form).forEach(touch);
    if (!canSubmit || submitting) return;

    const email = form.email.trim().toLowerCase();

    try {
      setSubmitting(true);

      // 1️⃣ check duplicate email στους users
      const checkRes = await fetch(`http://localhost:3001/users?email=${email}`);
      const existing = await checkRes.json();

      if (existing.length > 0) {
        alert("Υπάρχει ήδη λογαριασμός με αυτό το email.");
        return;
      }

      // 2️⃣ δημιουργία USER (για login)
      const userPayload = {
        role: "vet",
        email,
        password: form.password,
        name: `Δρ. ${form.firstName} ${form.lastName}`,
        phone: onlyDigits(form.phone),
        createdAt: new Date().toISOString(),
      };

      const userRes = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });

      if (!userRes.ok) throw new Error("Failed to create user");
      const createdUser = await userRes.json();

      // 3️⃣ δημιουργία VET (για λίστες / ραντεβού)
      const vetPayload = {
        id: createdUser.id, // 👈 ίδιο id με user (πολύ σημαντικό)
        name: `Δρ. ${form.firstName} ${form.lastName}`,
        clinic: "Ιδιωτικό Ιατρείο",
        specialty: form.specialty,
        area: form.address,
        rating: 0,
        reviewsCount: 0,
        priceRange: "—",
        address: form.address,
        phone: onlyDigits(form.phone),
        email,
        experience: form.experience,
        studies: form.education,
        photo: form.photoDataUrl,
        createdAt: new Date().toISOString(),
      };

      const vetRes = await fetch("http://localhost:3001/vets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vetPayload),
      });

      if (!vetRes.ok) throw new Error("Failed to create vet");

      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Σφάλμα εγγραφής κτηνιάτρου. Έλεγξε τον server.");
    } finally {
      setSubmitting(false);
    }
  }


  const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 } };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Stack alignItems="center">
            <Paper
              elevation={0}
              sx={{
                width: 720,
                maxWidth: "95vw",
                p: 4,
                borderRadius: 3,
                bgcolor: "#cfe3ff",
                border: "2px solid #8fb4e8",
                boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
              }}
            >
              <Typography sx={{ textAlign: "center", fontWeight: 900, fontSize: 28, mb: 3 }}>
                Εγγραφή Κτηνιάτρου
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}
              >
                <TextField
                  label="Όνομα"
                  value={form.firstName}
                  onChange={setField("firstName")}
                  onBlur={() => touch("firstName")}
                  error={!!errors.firstName && !!touched.firstName}
                  helperText={touched.firstName ? errors.firstName || " " : " "}
                  sx={fieldSx}
                />
                <TextField
                  label="Επώνυμο"
                  value={form.lastName}
                  onChange={setField("lastName")}
                  onBlur={() => touch("lastName")}
                  error={!!errors.lastName && !!touched.lastName}
                  helperText={touched.lastName ? errors.lastName || " " : " "}
                  sx={fieldSx}
                />

                <TextField
                  label="Email"
                  value={form.email}
                  onChange={setField("email")}
                  onBlur={() => touch("email")}
                  error={!!errors.email && !!touched.email}
                  helperText={touched.email ? errors.email || " " : " "}
                  sx={fieldSx}
                />
                <TextField
                  label="Κωδικός Πρόσβασης"
                  type="password"
                  value={form.password}
                  onChange={setField("password")}
                  onBlur={() => touch("password")}
                  error={!!errors.password && !!touched.password}
                  helperText={touched.password ? errors.password || " " : " "}
                  sx={fieldSx}
                />

                <TextField
                  label="Διεύθυνση Ιατρείου"
                  value={form.address}
                  onChange={setField("address")}
                  onBlur={() => touch("address")}
                  error={!!errors.address && !!touched.address}
                  helperText={touched.address ? errors.address || " " : " "}
                  sx={fieldSx}
                />
                <TextField
                  label="Τηλέφωνο"
                  value={form.phone}
                  onChange={setField("phone")}
                  onBlur={() => touch("phone")}
                  error={!!errors.phone && !!touched.phone}
                  helperText={touched.phone ? errors.phone || " " : " "}
                  sx={fieldSx}
                />

                <TextField
                  label="ΑΦΜ"
                  value={form.afm}
                  onChange={setField("afm")}
                  onBlur={() => touch("afm")}
                  error={!!errors.afm && !!touched.afm}
                  helperText={touched.afm ? errors.afm || " " : " "}
                  sx={fieldSx}
                />
                <TextField
                  label="Ειδικότητα"
                  value={form.specialty}
                  onChange={setField("specialty")}
                  onBlur={() => touch("specialty")}
                  error={!!errors.specialty && !!touched.specialty}
                  helperText={touched.specialty ? errors.specialty || " " : " "}
                  sx={fieldSx}
                />

                <TextField
                  label="Επίπεδο Σπουδών"
                  value={form.education}
                  onChange={setField("education")}
                  onBlur={() => touch("education")}
                  error={!!errors.education && !!touched.education}
                  helperText={touched.education ? errors.education || " " : " "}
                  sx={fieldSx}
                />
                <TextField
                  label="Εμπειρία"
                  value={form.experience}
                  onChange={setField("experience")}
                  onBlur={() => touch("experience")}
                  error={!!errors.experience && !!touched.experience}
                  helperText={touched.experience ? errors.experience || " " : " "}
                  sx={fieldSx}
                />

                <TextField
                  label="Φύλο"
                  value={form.sex}
                  onChange={setField("sex")}
                  onBlur={() => touch("sex")}
                  error={!!errors.sex && !!touched.sex}
                  helperText={touched.sex ? errors.sex || " " : " "}
                  sx={fieldSx}
                />

                {/* Photo uploader */}
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / 2" } }}>
                  <Typography sx={{ fontWeight: 900, color: "#0d2c54", mb: 0.8 }}>Φωτογραφία</Typography>

                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "2px solid #3b3b3b",
                      bgcolor: "#bfc7d1",
                      height: 140,
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    onClick={() => document.getElementById("vetPhotoInput")?.click()}
                  >
                    {form.photoDataUrl ? (
                      <Box
                        component="img"
                        src={form.photoDataUrl}
                        alt="vet"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Typography sx={{ textAlign: "center", fontWeight: 800 }}>
                        Ανέβασε μια καθαρή
                        <br />
                        φωτογραφία του προσώπου
                        <br />
                        σας.
                      </Typography>
                    )}

                    <input
                      id="vetPhotoInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhoto}
                    />
                  </Box>

                  <Typography sx={{ fontSize: 12, color: "#d32f2f", mt: 0.5 }}>
                    {touched.photoDataUrl ? errors.photoDataUrl || " " : " "}
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit || submitting}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: "#0b3d91",
                      "&:hover": { bgcolor: "#08316f" },
                      height: 44,
                      px: 10,
                      fontWeight: 900,
                      boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                    }}
                  >
                    {submitting ? "Γίνεται εγγραφή..." : "Εγγραφή"}
                  </Button>
                </Box>

                <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                  <Typography sx={{ fontSize: 13, textAlign: "center", mt: 1 }}>
                    Έχεις ήδη λογαριασμό;{" "}
                    <Typography
                      component={Link}
                      to="/login"
                      sx={{
                        display: "inline",
                        fontWeight: 900,
                        color: "#0b3d91",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Σύνδεση
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
