import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { Link, useNavigate, useLocation } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../auth/AuthContext";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const SESSION_KEY = "mypet_session";

function saveSession(session, remember) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(session));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("owner@test.gr");
  const [password, setPassword] = useState("1234");
  const [remember, setRemember] = useState(false);

  const [showPassword, setShowPassword] = useState(false); // ✅ ματάκι

  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fromRaw = params.get("from");
  const roleWanted = (params.get("role") || "").toLowerCase();

  const errors = useMemo(() => {
    const e = {};
    if (!email.trim()) e.email = "Υποχρεωτικό πεδίο.";
    else if (!isValidEmail(email)) e.email = "Μη έγκυρο email.";
    if (!password.trim()) e.password = "Υποχρεωτικό πεδίο.";
    return e;
  }, [email, password]);

  const canSubmit = !errors.email && !errors.password && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    ["email", "password"].forEach(touch);
    if (!canSubmit) return;

    try {
      setLoading(true);

      const query =
        `/api/users?email=${encodeURIComponent(email.trim())}` +
        `&password=${encodeURIComponent(password)}`;

      const arr = await fetchJSON(query);
      const user = Array.isArray(arr) ? arr[0] : null;

      if (!user) {
        setError("Λάθος Email ή Κωδικός");
        setLoading(false);
        return;
      }

      const loggedRole = (user?.role || "").toString().toLowerCase();
      if (roleWanted && loggedRole !== roleWanted) {
        setError(
          roleWanted === "vet"
            ? "Χρειάζεται σύνδεση Κτηνιάτρου για αυτό το βήμα."
            : "Χρειάζεται σύνδεση Ιδιοκτήτη για αυτό το βήμα."
        );
        setLoading(false);
        return;
      }

      saveSession({ userId: user.id, role: user.role, email: user.email }, remember);
      login(user);

      if (fromRaw) {
        navigate(fromRaw, { replace: true });
        return;
      }

      navigate(loggedRole === "vet" ? "/vet" : "/owner", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Αποτυχία σύνδεσης (server). Έλεγξε ότι τρέχει το json-server στη 3001.");
    } finally {
      setLoading(false);
    }
  };

  const registerTo = "/register/owner";
  const forgotTo = "/forgot-password";

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
              }}
            >
              <Typography sx={{ textAlign: "center", fontWeight: 900, fontSize: 28, mb: 2 }}>
                Σύνδεση
              </Typography>

              <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                <TextField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch("email")}
                  error={!!errors.email && !!touched.email}
                  helperText={touched.email ? errors.email || " " : " "}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 } }}
                />

                <TextField
                  label="Κωδικός Πρόσβασης"
                  type={showPassword ? "text" : "password"} // ✅ toggle
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  error={!!errors.password && !!touched.password}
                  helperText={touched.password ? errors.password || " " : " "}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((p) => !p)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
                        >
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Typography sx={{ color: "#d32f2f", fontWeight: 700, mt: -1 }}>
                    {error}
                  </Typography>
                )}

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        size="small"
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        Μείνε συνδεδεμένος
                      </Typography>
                    }
                  />

                  <Typography
                    component="button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(forgotTo);
                    }}
                    sx={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0b3d91",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Ξέχασες τον κωδικό σου;
                  </Typography>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    bgcolor: "#0b3d91",
                    "&:hover": { bgcolor: "#08316f" },
                    height: 44,
                    fontWeight: 900,
                    boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                  }}
                >
                  {loading ? "Σύνδεση..." : "Σύνδεση"}
                </Button>

                <Box sx={{ height: 1, bgcolor: "rgba(0,0,0,0.15)", my: 0.5 }} />

                <Typography sx={{ fontSize: 13, textAlign: "center" }}>
                  Δεν έχεις λογαριασμό;{" "}
                  <Typography
                    component={Link}
                    to={registerTo}
                    sx={{
                      display: "inline",
                      fontWeight: 900,
                      color: "#0b3d91",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Κάνε εγγραφή
                  </Typography>
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
