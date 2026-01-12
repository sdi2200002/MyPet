import { Box, Container, Paper, Stack, Typography, FormControl, MenuItem, Select } from "@mui/material";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import OwnerNavbar from "../../components/OwnerNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const BORDER = "#8fb4e8";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PRIMARY = "#0b3d91";

/** ✅ ΙΔΙΟ KEY ΜΕ VetSearch/VetProfile/VetNewAppointment */
const VETS_KEY = "mypet_owner_vets";

function safeLoad(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function parseGreekDate(ddmmyyyy) {
  // "12/11/2025" -> Date
  if (!ddmmyyyy || !ddmmyyyy.includes("/")) return new Date(0);
  const [d, m, y] = ddmmyyyy.split("/").map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

export default function VetReviews() {
  const { vetId } = useParams();

  const vet = useMemo(() => safeLoad(VETS_KEY, []).find((v) => v.id === vetId) || null, [vetId]);

  const [sort, setSort] = useState("recent");

  const reviews = useMemo(
    () => [
      {
        id: "r1",
        rating: 5,
        name: "Μαρία Κ.",
        date: "12/11/2025",
        text: "Εξαιρετική κτηνίατρος, πολύ γλυκιά με τη γάτα μου.",
      },
      {
        id: "r2",
        rating: 4,
        name: "Γιάννης Π.",
        date: "03/11/2025",
        text: "Άμεση διάγνωση και καθαρή εξήγηση, με βοήθησε πολύ.",
      },
      {
        id: "r3",
        rating: 5,
        name: "Ελένη Μ.",
        date: "28/10/2025",
        text: "Καταπληκτική! Το σκυλάκι μου την λάτρεψε.",
      },
      { id: "r4", rating: 3, name: "Γιώργος Α.", date: "03/11/2024", text: "Πολύ καλή." },
    ],
    []
  );

  const ordered = useMemo(() => {
    const arr = [...reviews];
    if (sort === "rating") return arr.sort((a, b) => b.rating - a.rating);
    // recent
    return arr.sort((a, b) => parseGreekDate(b.date) - parseGreekDate(a.date));
  }, [reviews, sort]);

  // mock distribution (αν θες αργότερα, το βγάζουμε από τα reviews)
  const distribution = useMemo(
    () => [
      { stars: 5, n: 89 },
      { stars: 4, n: 19 },
      { stars: 3, n: 7 },
      { stars: 2, n: 3 },
      { stars: 1, n: 1 },
    ],
    []
  );
  const maxN = useMemo(() => Math.max(...distribution.map((x) => x.n), 1), [distribution]);

  if (!vet) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
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

          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 22, mb: 2 }}>Αξιολογήσεις</Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
              gap: 3,
              alignItems: "start",
              mb: 2.5,
            }}
          >
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
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={vet.photo || "/images/demo-vet-avatar.png"}
                alt={vet.name}
                onError={(e) => (e.currentTarget.src = "/images/demo-vet-avatar.png")}
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
                <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>{vet.clinic}</Typography>
              </Box>
            </Paper>

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
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>⭐ {vet.rating}</Typography>
                <Typography sx={{ color: MUTED, fontWeight: 800 }}>({vet.reviewsCount})</Typography>
              </Stack>

              <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                {distribution.map((r) => (
                  <Stack key={r.stars} direction="row" spacing={1.2} alignItems="center">
                    <Typography sx={{ width: 70, fontWeight: 900, fontSize: 12 }}>
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

          <Stack spacing={2}>
            {ordered.map((r) => (
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
                  ⭐ {r.rating}.0 — {r.name} — {r.date}
                </Typography>
                <Typography sx={{ mt: 1, color: "#111", fontWeight: 700, fontSize: 12 }}>
                  {r.text}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
