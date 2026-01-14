import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Rating,
  Divider,
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

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
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

// Normalizer για review (να δουλεύει με διάφορα schema keys)
function normalizeReview(r) {
  const ratingRaw = r?.rating ?? r?.stars ?? r?.score ?? 0;
  const rating = Math.max(1, Math.min(5, Number(ratingRaw) || 0)) || 0;

  return {
    id: r?.id ?? r?._id ?? "",
    vetId: r?.vetId ?? r?.vet_id ?? r?.vet?.id ?? null,
    appointmentId: r?.appointmentId ?? r?.apptId ?? null,
    rating,
    name: r?.name ?? r?.userName ?? r?.author ?? "Ανώνυμος",
    date: r?.date ?? r?.createdAt ?? r?.when ?? "",
    text: r?.text ?? r?.comment ?? r?.body ?? "",
    createdAt: r?.createdAt ?? "",
  };
}

export default function VetReviewDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Προτείνεται route: /owner/vets/:vetId/reviews/:reviewId
  // (αν έχεις άλλο, πες μου να το προσαρμόσω)
  const { vetId, reviewId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [vet, setVet] = useState(null);
  const [review, setReview] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        if (!vetId || !reviewId) throw new Error("missing params");

        // 1) Vet
        const v = await fetchJSON(`/api/vets/${encodeURIComponent(String(vetId))}`);

        // 2) Review (robust: πρώτα /api/reviews/:id, αλλιώς φέρε όλα και βρες το)
        let r = null;
        try {
          r = await fetchJSON(`/api/reviews/${encodeURIComponent(String(reviewId))}`);
        } catch {
          const all = await fetchJSON(`/api/reviews`);
          const arr = Array.isArray(all) ? all : [];
          r = arr.find((x) => String(x?.id) === String(reviewId)) || null;
        }

        const nr = r ? normalizeReview(r) : null;
        if (!nr) throw new Error("review not found");

        // (προαιρετικό) basic security: αν το review έχει appointmentId, μπορούμε να ελέγξουμε ότι
        // αυτό το appointment ανήκει στον χρήστη. Αν δεν υπάρχει appointmentId, το αφήνουμε.
        if (nr?.appointmentId && user?.id != null) {
          try {
            const a = await fetchJSON(`/api/appointments/${encodeURIComponent(String(nr.appointmentId))}`);
            if (a?.ownerId != null && String(a.ownerId) !== String(user.id)) {
              throw new Error("forbidden");
            }
          } catch (e) {
            const msg = String(e?.message || "");
            if (msg.toLowerCase().includes("forbidden")) throw e;
            // αν δεν βρεθεί appointment, απλά μην μπλοκάρεις το display
          }
        }

        if (!alive) return;
        setVet(v || null);
        setReview(nr);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        const msg = String(e?.message || "").toLowerCase();
        if (msg.includes("forbidden")) setError("Δεν έχεις πρόσβαση σε αυτή την αξιολόγηση.");
        else setError("Δεν βρέθηκαν στοιχεία για την αξιολόγηση.");
        setVet(null);
        setReview(null);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [vetId, reviewId, user?.id]);

  const displayDate = useMemo(() => {
    const d = review?.date || review?.createdAt || "";
    if (!d) return "—";
    const dd = dayjs(d);
    return dd.isValid() ? dd.format("DD / MM / YYYY") : "—";
  }, [review?.date, review?.createdAt]);

  const displayName = useMemo(() => formatOwnerName(review?.name || ""), [review?.name]);

  const vetPhoto =
    vet?.photo ||
    vet?.image ||
    vet?.photoUrl ||
    "/images/vet-default.png";

  const vetName = vet?.name || "Κτηνίατρος";

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
          {/* spacer */}
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


  return (
    <OwnerPageShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
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
              onClick={() => navigate(-1)}
              sx={{
                mt: 2,
                textTransform: "none",
                borderRadius: 2,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
              }}
            >
              Πίσω
            </Button>
          </Paper>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start" sx={{ mt: 2 }}>
            {/* LEFT CARD */}
            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", md: 300 },
                height: 380,
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

            {/* RIGHT DISPLAY */}
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: TITLE, mb: 1 }}>
                Αξιολόγηση
              </Typography>

              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ color: MUTED, fontWeight: 900, fontSize: 13 }}>{displayName}</Typography>
                <Typography sx={{ color: MUTED, fontWeight: 900, fontSize: 13 }}>•</Typography>
                <Typography sx={{ color: MUTED, fontWeight: 900, fontSize: 13 }}>{displayDate}</Typography>
              </Stack>

              <Rating value={Number(review?.rating || 0)} readOnly size="large" sx={{ mb: 2 }} />

              <Paper
                elevation={0}
                sx={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 2,
                      p: 1.5,
                      bgcolor: "#fff",
                      height: 240,
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontWeight: 700,
                      color: "#111",
                      fontSize: 16,
                      lineHeight: 1.6,
                    }}
                  >
                    {review?.text || "—"}
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        )}
      </Container>
    </OwnerPageShell>
  );

}
