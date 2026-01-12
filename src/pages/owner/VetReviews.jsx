import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import { useParams } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager"; // ✅ πρόσθεσε το

const BORDER = "#8fb4e8";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PRIMARY = "#0b3d91";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

// Δέχεται "12/11/2025" ή ISO και επιστρέφει timestamp
function parseAnyDateToMs(s) {
  if (!s) return 0;

  // dd/mm/yyyy
  if (typeof s === "string" && s.includes("/")) {
    const [d, m, y] = s.split("/").map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
  }

  // ISO
  const dt = new Date(s);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
}

// Normalizer για review ώστε να δουλεύει με διάφορα schema keys
function normalizeReview(r) {
  const ratingRaw = r?.rating ?? r?.stars ?? r?.score ?? 0;
  const rating = Math.max(1, Math.min(5, Number(ratingRaw) || 0)) || 0;

  return {
    id: r?.id ?? r?._id ?? `${Date.now()}_${Math.random()}`,
    vetId: r?.vetId ?? r?.vet_id ?? r?.vet?.id ?? null,
    rating,
    name: r?.name ?? r?.userName ?? r?.author ?? "Ανώνυμος",
    date: r?.date ?? r?.createdAt ?? r?.when ?? "",
    text: r?.text ?? r?.comment ?? r?.body ?? "",
    createdAt: r?.createdAt ?? "",
  };
}

export default function VetReviews() {
  const { vetId } = useParams();

  const [vet, setVet] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [sort, setSort] = useState("recent");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5; // άλλαξέ το σε 5/6 αν θες

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!vetId) throw new Error("missing vetId");

      // 1) Vet από server
      const v = await fetchJSON(`/api/vets/${encodeURIComponent(String(vetId))}`);

      // 2) Reviews από server (προσπαθούμε πρώτα με query param)
      // Αν δεν υποστηρίζεται query param, κάνουμε fallback σε /api/reviews και filter client-side
      let rr = [];
      try {
        rr = await fetchJSON(`/api/reviews?vetId=${encodeURIComponent(String(vetId))}`);
      } catch {
        const all = await fetchJSON(`/api/reviews`);
        rr = Array.isArray(all) ? all.filter((x) => String(x?.vetId) === String(vetId)) : [];
      }

      const normalized = (Array.isArray(rr) ? rr : []).map(normalizeReview);

      if (!alive) return;
      setVet(v || null);
      setReviews(normalized);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setVet(null);
      setReviews([]);
      setErr("Αποτυχία φόρτωσης αξιολογήσεων από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [vetId]);

  // ✅ όταν αλλάζει sort ή reviews, γύρνα σελίδα 1
  useEffect(() => {
    setPage(1);
  }, [sort, reviews.length]);

  const ordered = useMemo(() => {
    const arr = [...reviews];

    if (sort === "rating") {
      // rating desc, και σε ισοβαθμία πιο πρόσφατο
      return arr.sort((a, b) => {
        const dr = (b.rating || 0) - (a.rating || 0);
        if (dr !== 0) return dr;
        return parseAnyDateToMs(b.date) - parseAnyDateToMs(a.date);
      });
    }

    // recent
    return arr.sort((a, b) => parseAnyDateToMs(b.date) - parseAnyDateToMs(a.date));
  }, [reviews, sort]);

  // ✅ pagination derived
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  }, [ordered.length]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return ordered.slice(start, start + PAGE_SIZE);
  }, [ordered, page]);

  // Distribution από πραγματικά reviews
  const distribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const k = Math.round(Number(r.rating) || 0);
      if (k >= 1 && k <= 5) counts[k] += 1;
    }
    return [5, 4, 3, 2, 1].map((stars) => ({ stars, n: counts[stars] }));
  }, [reviews]);

  const maxN = useMemo(() => Math.max(...distribution.map((x) => x.n), 1), [distribution]);

  // Αν στο vet δεν έχεις rating/reviewsCount, τα υπολογίζουμε εδώ
  const computedRating = useMemo(() => {
    if (!reviews.length) return vet?.rating ?? 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10; // 1 δεκαδικό
  }, [reviews, vet?.rating]);

  const computedCount = useMemo(() => {
    return vet?.reviewsCount ?? reviews.length ?? 0;
  }, [vet?.reviewsCount, reviews.length]);

  if (!vetId) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography sx={{ fontWeight: 900, color: "#b00020" }}>
            Λείπει το vetId από το URL.
          </Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 2,
            }}
          >
            <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
          </Paper>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 2,
              bgcolor: "#fff3f3",
            }}
          >
            <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
          </Paper>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!vet) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Typography sx={{ fontWeight: 900 }}>Δεν βρέθηκε κτηνίατρος.</Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 22, mb: 2 }}>
            Αξιολογήσεις
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
              gap: 3,
              alignItems: "start",
              mb: 2.5,
            }}
          >
            {/* Vet card */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `2px solid ${BORDER}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                p: 2,
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                gap: 2,
                py: 5.4,
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={vet.photo }
                alt={vet.name}
                sx={{
                  width: 98,
                  height: 98,
                  borderRadius: 2,
                  objectFit: "cover",
                  border: "1px solid rgba(0,0,0,0.15)",
                  bgcolor: "#fff",
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 900, color: "#111" }}>{vet.name}</Typography>
                <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
                  {vet.clinic || vet.clinicName || "—"}
                </Typography>
              </Box>
            </Paper>

            {/* Rating summary */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `2px solid ${BORDER}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                  ⭐ {computedRating || 0}
                </Typography>
                <Typography sx={{ color: MUTED, fontWeight: 800 }}>({computedCount})</Typography>
              </Stack>

              <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                {distribution.map((r) => (
                  <Stack key={r.stars} direction="row" spacing={1.2} alignItems="center">
                    <Typography sx={{ width: 90, fontWeight: 900, fontSize: 12 }}>
                      {"⭐".repeat(r.stars)}
                    </Typography>

                    <Box sx={{ flex: 1, height: 10, borderRadius: 99, bgcolor: "#e6ebf3", overflow: "hidden" }}>
                      <Box
                        sx={{
                          width: `${Math.round((r.n / maxN) * 100)}%`,
                          height: "100%",
                          bgcolor: PRIMARY,
                          opacity: 0.35,
                        }}
                      />
                    </Box>

                    <Typography sx={{ width: 26, textAlign: "right", fontWeight: 900, fontSize: 12, color: "#111" }}>
                      {r.n}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>

          {/* Sort */}
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ color: MUTED, fontWeight: 900, fontSize: 12 }}>Ταξινόμηση:</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: "#fff", fontWeight: 800 }}
              >
                <MenuItem value="recent">Πρόσφατα</MenuItem>
                <MenuItem value="rating">Βαθμολογία</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Reviews list */}
          <Stack spacing={2}>
            {ordered.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `2px solid ${BORDER}`,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                  p: 2,
                  bgcolor: "#f6f8fb",
                }}
              >
                <Typography sx={{ color: MUTED, fontWeight: 800 }}>
                  Δεν υπάρχουν ακόμα αξιολογήσεις.
                </Typography>
              </Paper>
            ) : (
              paged.map((r) => (
                <Paper
                  key={r.id}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: `2px solid ${BORDER}`,
                    boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                    p: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111" }}>
                    ⭐ {r.rating}.0 — {r.name} —{" "}
                    {r.date
                      ? r.date.includes("/")
                        ? r.date
                        : new Date(r.date).toLocaleDateString("el-GR")
                      : "—"}
                  </Typography>
                  <Typography sx={{ mt: 1, color: "#111", fontWeight: 700, fontSize: 12 }}>
                    {r.text || "—"}
                  </Typography>
                </Paper>
              ))
            )}
          </Stack>

          {/* ✅ Pager */}
          {ordered.length > 0 && (
            <Pager
              page={page}
              pageCount={pageCount}
              onChange={(p) => setPage(p)}
              maxButtons={Math.min(4, pageCount)}
              color={PRIMARY}
            />
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
