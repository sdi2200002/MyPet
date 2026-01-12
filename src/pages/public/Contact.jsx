import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const STORAGE_KEY = "mypet_contact_messages";

function safeLoad() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function safeSave(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function isValidEmail(email) {
  const v = (email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    subject: "",
    message: "",
  });

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));
  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Υποχρεωτικό πεδίο.";
    if (!form.email.trim()) e.email = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(form.email)) e.email = "Μη έγκυρο email.";
    if (!form.role) e.role = "Υποχρεωτικό πεδίο.";
    if (!form.subject.trim()) e.subject = "Υποχρεωτικό πεδίο.";
    if (!form.message.trim()) e.message = "Υποχρεωτικό πεδίο.";
    else if (form.message.trim().length < 10) e.message = "Γράψε λίγο πιο αναλυτικά (τουλάχιστον 10 χαρακτήρες).";
    return e;
  }, [form]);

  const canSend =
    !errors.name && !errors.email && !errors.role && !errors.subject && !errors.message;

  const [snackOpen, setSnackOpen] = useState(false);

  function handleSend() {
    // mark all touched
    ["name", "email", "role", "subject", "message"].forEach(touch);
    if (!canSend) return;

    const payload = {
      id: makeId(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    const list = safeLoad();
    list.push(payload);
    safeSave(list);

    setSnackOpen(true);

    // reset
    setForm({ name: "", email: "", role: "", subject: "", message: "" });
    setTouched({});
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4,
              alignItems: "start",
              mt: 2,
            }}
          >
            {/* LEFT */}
            <Box>
              <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 34, mb: 1 }}>
                Επικοινωνία
              </Typography>

              <Typography sx={{ color: "#000", opacity: 0.75, maxWidth: 420, mb: 4 }}>
                Για οποιαδήποτε απορία μη διστάσετε να επικοινωνήσετε μαζί μας!
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  width: { xs: "100%", sm: 420 },
                  p: 4,
                  borderRadius: 3,
                  bgcolor: COLORS.panelBg,
                  border: `2px solid ${COLORS.panelBorder}`,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <Typography sx={{ fontWeight: 900, color: COLORS.title, minWidth: 80 }}>
                      Email:
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: "#000" }}>support@gmail.com</Typography>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Typography sx={{ fontWeight: 900, color: COLORS.title, minWidth: 80 }}>
                      Τηλέφωνο:
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: "#000" }}>210-000-0000</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>

            {/* RIGHT */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: COLORS.panelBg,
                border: `2px solid ${COLORS.panelBorder}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
                maxWidth: 520,
                ml: { md: "auto" },
              }}
            >
              <Typography sx={{ fontWeight: 900, color: "#000", fontSize: 26, mb: 3, textAlign: "center" }}>
                Αποστολή Μηνύματος
              </Typography>

              <Stack spacing={2.2}>
                <TextField
                  label="Όνομα *"
                  value={form.name}
                  onChange={setField("name")}
                  onBlur={() => touch("name")}
                  sx={fieldSx}
                  error={!!errors.name && !!touched.name}
                  helperText={touched.name ? errors.name || " " : " "}
                />

                <TextField
                  label="Email *"
                  value={form.email}
                  onChange={setField("email")}
                  onBlur={() => touch("email")}
                  sx={fieldSx}
                  error={!!errors.email && !!touched.email}
                  helperText={touched.email ? errors.email || " " : " "}
                />

                <FormControl sx={fieldSx} error={!!errors.role && !!touched.role}>
                  <InputLabel>Ιδιότητα *</InputLabel>
                  <Select
                    label="Ιδιότητα *"
                    value={form.role}
                    onChange={setField("role")}
                    onBlur={() => touch("role")}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="Ιδιοκτήτης">Ιδιοκτήτης</MenuItem>
                    <MenuItem value="Κτηνίατρος">Κτηνίατρος</MenuItem>
                    <MenuItem value="Επισκέπτης">Επισκέπτης</MenuItem>
                  </Select>
                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "#d32f2f" }}>
                    {touched.role ? errors.role || " " : " "}
                  </Typography>
                </FormControl>

                <TextField
                  label="Θέμα *"
                  value={form.subject}
                  onChange={setField("subject")}
                  onBlur={() => touch("subject")}
                  sx={fieldSx}
                  error={!!errors.subject && !!touched.subject}
                  helperText={touched.subject ? errors.subject || " " : " "}
                />

                <TextField
                  label="Μήνυμα *"
                  value={form.message}
                  onChange={setField("message")}
                  onBlur={() => touch("message")}
                  sx={fieldSx}
                  multiline
                  minRows={6}
                  error={!!errors.message && !!touched.message}
                  helperText={touched.message ? errors.message || " " : " "}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!canSend}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      px: 4,
                      bgcolor: COLORS.primary,
                      "&:hover": { bgcolor: COLORS.primaryHover },
                      boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                    }}
                  >
                    Αποστολή
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Footer />

      <Snackbar open={snackOpen} autoHideDuration={2500} onClose={() => setSnackOpen(false)}>
        <Alert severity="success" variant="filled" onClose={() => setSnackOpen(false)}>
          Το μήνυμά σας καταχωρήθηκε επιτυχώς!
        </Alert>
      </Snackbar>
    </Box>
  );
}
