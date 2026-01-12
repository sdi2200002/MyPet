import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const RESETS_KEY = "mypet_password_resets";

function safeLoad() {
  try {
    return JSON.parse(localStorage.getItem(RESETS_KEY) || "[]");
  } catch {
    return [];
  }
}
function safeSave(items) {
  localStorage.setItem(RESETS_KEY, JSON.stringify(items));
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // κρατάμε role αν ήρθες από "Σύνδεση ως ..."
  const as = new URLSearchParams(location.search).get("as"); // "owner" | "vet" | null

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const error = useMemo(() => {
    if (!email.trim()) return "Υποχρεωτικό πεδίο.";
    if (!isValidEmail(email)) return "Μη έγκυρο email.";
    return "";
  }, [email]);

  const loginTo = as ? `/login?as=${as}` : "/login";

  function persistResetRequest() {
    const list = safeLoad();
    list.push({
      id: `reset_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
    safeSave(list);
  }

  function handleSend(e) {
    e?.preventDefault?.();
    setTouched(true);
    if (error) return;

    persistResetRequest();
    setSent(true);
  }

  function handleResend() {
    setSent(false);
    setTouched(true);
  }

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
                width: 420,
                maxWidth: "95vw",
                p: 4,
                borderRadius: 3,
                bgcolor: "#cfe3ff",
                border: "2px solid #8fb4e8",
                boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 26, mb: 2 }}>
                Ανάκτηση Κωδικού
              </Typography>

              {!sent ? (
                <>
                  <Typography sx={{ fontWeight: 700, color: "#000", opacity: 0.75, mb: 2 }}>
                    Παρακαλώ εισάγετε το email σας, για να σας αποσταλεί μήνυμα ανάκτησης κωδικού.
                  </Typography>

                  <Stack component="form" spacing={2} onSubmit={handleSend}>
                    <TextField
                      fullWidth
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      error={!!error && touched}
                      helperText={touched ? error || " " : " "}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 } }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: "#0b3d91",
                        "&:hover": { bgcolor: "#08316f" },
                        height: 44,
                        px: 5,
                        fontWeight: 900,
                        boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                      }}
                    >
                      Αποστολή
                    </Button>
                  </Stack>

                  <Typography
                    component={Link}
                    to={loginTo}
                    sx={{
                      display: "block",
                      mt: 3,
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0b3d91",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Επιστροφή στη Σύνδεση
                  </Typography>
                </>
                
              ) : (
                <>
                  <Typography sx={{ fontWeight: 800, color: "#000", mb: 2 }}>
                    Το μήνυμα ανάκτησης κωδικού στάλθηκε με επιτυχία!
                    <br />
                    Παρακαλώ ελέγξτε το email σας.
                  </Typography>

                  <CheckCircleOutlineIcon sx={{ fontSize: 70, color: "#0b3d91", my: 1 }} />

                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleResend}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        borderColor: "#0b3d91",
                        color: "#0b3d91",
                        "&:hover": { borderColor: "#08316f" },
                      }}
                    >
                      Επαναποστολή
                    </Button>

                    <Button
                      type="button"
                      variant="contained"
                      onClick={() => navigate(loginTo)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: "#0b3d91",
                        "&:hover": { bgcolor: "#08316f" },
                        fontWeight: 900,
                      }}
                    >
                      Σύνδεση
                    </Button>
                  </Stack>
                </>
              )}

              
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
