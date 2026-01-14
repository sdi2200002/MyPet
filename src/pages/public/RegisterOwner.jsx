import { useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const API_BASE = "http://localhost:3001"; // <-- json-server
// αν έχεις proxy "/api" μπορείς να το κάνεις: const API_BASE = "/api";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}
function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

export default function RegisterOwner() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    email: "",
    address: "",
    afm: "",
    phone: "",
  });

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));
  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Υποχρεωτικό.";
    if (!form.lastName.trim()) e.lastName = "Υποχρεωτικό.";

    if (!form.password) e.password = "Υποχρεωτικό.";
    else if (form.password.length < 4) e.password = "Τουλάχιστον 4 χαρακτήρες.";

    if (!form.confirmPassword) e.confirmPassword = "Υποχρεωτικό.";
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Οι κωδικοί δεν ταιριάζουν.";

    if (!form.email.trim()) e.email = "Υποχρεωτικό.";
    else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";

    if (!form.address.trim()) e.address = "Υποχρεωτικό.";

    const afm = onlyDigits(form.afm);
    if (!afm) e.afm = "Υποχρεωτικό.";
    else if (afm.length !== 9) e.afm = "Το ΑΦΜ πρέπει να είναι 9 ψηφία.";

    const phone = onlyDigits(form.phone);
    if (!phone) e.phone = "Υποχρεωτικό.";
    else if (phone.length < 10) e.phone = "Μη έγκυρο τηλέφωνο.";

    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    Object.keys(form).forEach(touch);
    if (!canSubmit || submitting) return;

    const email = form.email.trim().toLowerCase();

    try {
      setSubmitting(true);

      // 1) check duplicate email in db.json
      const checkRes = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
      if (!checkRes.ok) throw new Error("Failed to check users");
      const existing = await checkRes.json();

      if (Array.isArray(existing) && existing.length > 0) {
        alert("Υπάρχει ήδη λογαριασμός με αυτό το email.");
        return;
      }

      // 2) create user in db.json
      const payload = {
        role: "owner",
        email,
        password: form.password,

        // για να ταιριάξει με το schema που έχεις ήδη στο db.json:
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        address: form.address.trim(),
        phone: onlyDigits(form.phone),

        // extra πεδία (json-server τα κρατάει κανονικά)
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        afm: onlyDigits(form.afm),

        createdAt: new Date().toISOString(),
      };

      const createRes = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) throw new Error("Failed to create user");
      await createRes.json();

      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Κάτι πήγε στραβά στην εγγραφή. Έλεγξε ότι τρέχει ο server (json-server).");
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
                Εγγραφή
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
                  label="Επιβεβαίωση Κωδικού Πρόσβασης"
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  onBlur={() => touch("confirmPassword")}
                  error={!!errors.confirmPassword && !!touched.confirmPassword}
                  helperText={touched.confirmPassword ? errors.confirmPassword || " " : " "}
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
                  label="Διεύθυνση"
                  value={form.address}
                  onChange={setField("address")}
                  onBlur={() => touch("address")}
                  error={!!errors.address && !!touched.address}
                  helperText={touched.address ? errors.address || " " : " "}
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
                  label="Τηλέφωνο"
                  value={form.phone}
                  onChange={setField("phone")}
                  onBlur={() => touch("phone")}
                  error={!!errors.phone && !!touched.phone}
                  helperText={touched.phone ? errors.phone || " " : " "}
                  sx={fieldSx}
                />

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
                      px: 8,
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
