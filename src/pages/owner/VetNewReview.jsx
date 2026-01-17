import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  Rating,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/el";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useAuth } from "../../auth/AuthContext";
import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

const MIN_CHARS = 10;

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

function OwnerPageShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box
        sx={{
          flex: 1,
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
        {/* spacer ώστε το content να μη μπαίνει κάτω απ’ το sidebar */}
        <Box
          sx={{
            width: OWNER_SIDEBAR_W,
            flex: `0 0 ${OWNER_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
          }}
        />

        <OwnerNavbar mode="navbar" />

        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

// ίδιος κανόνας με AppointmentDetails
function isCompleted(appt) {
  const raw = (appt?.status || "Εκκρεμές").toString().trim();
  if (raw === "Ακυρωμένο") return false;
  if (raw === "Ολοκληρωμένο") return true;
  const t = appt?.when ? new Date(appt.when).getTime() : 0;
  return !!t && t < Date.now();
}

// "Μυρτώ Παπαδοπούλου" -> "Μυρτώ Π."
function formatOwnerName(fullName) {
  const s = (fullName || "").trim().replace(/\s+/g, " ");
  if (!s) return "Ανώνυμος";
  const parts = s.split(" ");
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const initial = last ? `${last[0].toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

// ✅ Ενημέρωση vet aggregates (reviewsCount + rating) ώστε να γράφει και στο db.json (json-server)
async function updateVetAggregates(vetId) {
  // 1) φέρε όλα τα reviews του vet
  let rr = [];
  try {
    rr = await fetchJSON(`/api/reviews?vetId=${encodeURIComponent(String(vetId))}`);
  } catch {
    const all = await fetchJSON(`/api/reviews`);
    rr = Array.isArray(all) ? all.filter((x) => String(x?.vetId) === String(vetId)) : [];
  }

  const list = Array.isArray(rr) ? rr : [];
  const count = list.length;

  const avg =
    count === 0
      ? 0
      : list.reduce((acc, r) => acc + (Number(r?.rating ?? r?.stars ?? r?.score) || 0), 0) / count;

  const ratingRounded = Math.round(avg * 10) / 10; // 1 δεκαδικό

  // 2) PATCH vet -> ενημερώνεται και το db.json
  await fetchJSON(`/api/vets/${encodeURIComponent(String(vetId))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewsCount: count,
      rating: ratingRounded,
    }),
  });

  return { count, rating: ratingRounded };
}

export default function VetNewReview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ στο main.jsx είναι :appId
  const { appId } = useParams();
  const appointmentId = (appId || "").trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [appt, setAppt] = useState(null);
  const [vet, setVet] = useState(null);

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const todayLabel = useMemo(() => dayjs().locale("el").format("DD/MM/YYYY"), []);

  // LIVE feedback
  const cleanText = text.trim();
  const textLen = cleanText.length;
  const textTooShort = textLen > 0 && textLen < MIN_CHARS;
  const canSubmit = !!appt?.vetId && rating >= 1 && textLen >= MIN_CHARS && !saving;

  // guard: αν λείπει appointment id
  useEffect(() => {
    if (!appointmentId) navigate("/owner/appointments", { replace: true });
  }, [appointmentId, navigate]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        // 1) appointment
        const a = await fetchJSON(`/api/appointments/${encodeURIComponent(appointmentId)}`);

        // security: πρέπει να ανήκει στον user
        if (user?.id != null && a?.ownerId != null && String(a.ownerId) !== String(user.id)) {
          throw new Error("forbidden");
        }

        // must be completed
        if (!isCompleted(a)) {
          navigate(`/owner/appointments/${encodeURIComponent(appointmentId)}`, { replace: true });
          return;
        }

        // 2) vet από το appointment
        const vetIdStr = String(a?.vetId ?? "").trim();
        if (!vetIdStr) throw new Error("missing-vetId");
        const v = await fetchJSON(`/api/vets/${encodeURIComponent(vetIdStr)}`);


        if (!alive) return;
        setAppt(a || null);
        setVet(v || null);
      } catch (e) {
        if (!alive) return;
        const msg = String(e?.message || "");
        if (msg.toLowerCase().includes("forbidden")) setError("Δεν έχεις πρόσβαση σε αυτό το ραντεβού.");
        else setError("Δεν ήταν δυνατή η φόρτωση της σελίδας αξιολόγησης.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [appointmentId, navigate, user?.id]);

  async function onSubmit() {
    try {
      setError("");

      if (!rating || rating < 1) return setError("Διάλεξε βαθμολογία (1–5).");

      const vetIdStr = String(appt?.vetId ?? "").trim(); // ✅ πάντα string
      if (!vetIdStr) return setError("Λείπουν στοιχεία κτηνιάτρου.");

      setSaving(true);

      const displayName = formatOwnerName(user?.name || "");

      const payload = {
        vetId: vetIdStr, // ✅ ΟΧΙ Number()
        appointmentId: String(appointmentId),
        rating: Number(rating),
        name: displayName,
        date: new Date().toISOString(),
        text: cleanText,
      };

      const created = await fetchJSON(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ✅ ενημέρωσε rating/reviewsCount στον vet
      try {
        await updateVetAggregates(vetIdStr); // ✅ string
      } catch (e) {
        console.warn("Failed to update vet aggregates:", e);
      }

      // ✅ πάμε στο details του review
      navigate(
        `/owner/vets/${encodeURIComponent(vetIdStr)}/reviews/${encodeURIComponent(String(created?.id))}`,
        { replace: true }
      );
    } catch (e) {
      setError(e?.message || "Αποτυχία αποθήκευσης αξιολόγησης.");
    } finally {
      setSaving(false);
    }
  }

  const vetPhoto =
    appt?.vetPhoto ||
    appt?.vetImage ||
    appt?.vetPhotoUrl ||
    appt?.vetPhotoDataUrl ||
    vet?.photo ||
    vet?.image ||
    vet?.photoUrl ||
    "/images/vet-default.png";

  const vetName = vet?.name || appt?.vetName || "Κτηνίατρος";

  return (
    <OwnerPageShell>

      <Container maxWidth="lg" sx={{ py: 2.5, flex: 1 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        {loading ? (
          <Typography sx={{ mt: 2, color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              borderRadius: 2,
              p: 2,
              bgcolor: "#fff3f3",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{error}</Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/owner/appointments/${encodeURIComponent(appointmentId)}`)}
              sx={{
                mt: 2,
                textTransform: "none",
                borderRadius: 2,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
              }}
            >
              Πίσω στο ραντεβού
            </Button>
          </Paper>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start" sx={{ mt: 2 }}>
            {/* LEFT CARD */}
            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", md: 300 },
                height: 385,
                border: `1px solid ${BORDER}`,
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack spacing={2} alignItems="center">
                <Box
                  component="img"
                  src={vetPhoto}
                  alt={vetName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/vet-default.png";
                  }}
                  sx={{
                    width: 250,
                    height: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #e6eefb",
                    bgcolor: "#f7faff",
                  }}
                />
                <Typography sx={{ fontWeight: 900, color: TITLE }}>{vetName}</Typography>
              </Stack>
            </Paper>

            {/* RIGHT FORM */}
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: TITLE, mb: 1 }}>
                Γράψτε μία αξιολόγηση
              </Typography>

              <Rating value={rating} onChange={(_, v) => setRating(v ?? 0)} size="large" sx={{ mb: 1 }} />
              <Typography sx={{ color: MUTED, mb: 2 }}>{todayLabel}</Typography>

              <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    multiline
                    minRows={7}
                    placeholder="Γράψτε εδώ"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    error={textTooShort}
                    helperText={`Γράψτε τουλάχιστον ${MIN_CHARS} χαρακτήρες.`}
                  />

                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/owner/appointments/${encodeURIComponent(appointmentId)}`)}
                      disabled={saving}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        borderColor: BORDER,
                        color: PRIMARY,
                        fontWeight: 900,
                        px: 3,
                      }}
                    >
                      Ακύρωση
                    </Button>

                    <Button
                      variant="contained"
                      onClick={onSubmit}
                      disabled={!canSubmit}
                      sx={{
                        bgcolor: PRIMARY,
                        "&:hover": { bgcolor: PRIMARY_HOVER },
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 900,
                      }}
                    >
                      {saving ? "Αποθήκευση..." : "Υποβολή"}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        )}
      </Container>
      <Footer />
    </OwnerPageShell>
  );
}
