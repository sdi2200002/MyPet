import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography, Divider } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/el";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import CalendarWithTimeSlots from "../../components/CalendarWithTimeSlots.jsx";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

// ✅ parse ISO ή dd/mm/yyyy
function parseAnyDateToMs(s) {
  if (!s) return 0;

  if (typeof s === "string" && s.includes("/")) {
    const [d, m, y] = s.split("/").map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
  }

  const dt = new Date(s);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
}

// ✅ normalize για να αντέχει διαφορετικά keys στο json
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
  };
}

export default function VetProfile() {
  const { vetId } = useParams();
  const id = Number(vetId); // ✅ json-server: numeric ids
  const navigate = useNavigate();

  const [vet, setVet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [pick, setPick] = useState({ date: dayjs(), time: null });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      const v = await fetchJSON(`/api/vets/${id}`);
      const appts = await fetchJSON(`/api/appointments?vetId=${id}`);

      let rr = [];
      try {
        rr = await fetchJSON(`/api/reviews?vetId=${id}`);
      } catch {
        const all = await fetchJSON(`/api/reviews`);
        rr = Array.isArray(all) ? all.filter((x) => String(x?.vetId) === String(id)) : [];
      }

      if (!alive) return;

      setVet(v || null);
      setAppointments(Array.isArray(appts) ? appts : []);
      setReviews((Array.isArray(rr) ? rr : []).map(normalizeReview));
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Δεν βρέθηκαν στοιχεία για τον κτηνίατρο.");
      setVet(null);
      setAppointments([]);
      setReviews([]);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [id]);

  // ✅ booked times από appointments (και προαιρετικά από vet.booked αν υπάρχει στο JSON)
  const getBookedTimes = (dateDayjs) => {
    const dayKey = dateDayjs.format("YYYY-MM-DD");

    const bookedFromAppointments = (appointments || [])
      .filter((a) => Number(a.vetId) === id)
      .filter((a) => dayjs(a.when).format("YYYY-MM-DD") === dayKey)
      .filter((a) => ["Εκκρεμές", "Επιβεβαιωμένο"].includes(a.status))
      .map((a) => dayjs(a.when).format("HH:mm"));

    const bookedFromVetDemo = vet?.booked?.[dayKey] || [];

    return Array.from(new Set([...bookedFromAppointments, ...bookedFromVetDemo]));
  };

  const canProceed = !!pick?.date && !!pick?.time;

  // ✅ 3 πιο πρόσφατες αξιολογήσεις
  const last3Reviews = useMemo(() => {
    const arr = [...(reviews || [])];
    arr.sort((a, b) => parseAnyDateToMs(b.date) - parseAnyDateToMs(a.date));
    return arr.slice(0, 3);
  }, [reviews]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {/* Left */}
            <Box>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `2px solid ${BORDER}`,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                  p: 3,
                }}
              >
                {loading ? (
                  <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
                ) : err ? (
                  <>
                    <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>

                    <Button
                      variant="contained"
                      onClick={() => navigate("/owner/vets")}
                      sx={{
                        mt: 2,
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: PRIMARY,
                        "&:hover": { bgcolor: PRIMARY_HOVER },
                        fontWeight: 900,
                        boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                      }}
                    >
                      Επιστροφή στην αναζήτηση
                    </Button>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "110px 1fr",
                      gap: 2,
                      alignItems: "start",
                    }}
                  >
                    <Box
                      component="img"
                      src={vet?.photo || "/images/demo-vet-avatar.png"}
                      alt={vet?.name || "vet"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/demo-vet-avatar.png";
                      }}
                      sx={{
                        width: 98,
                        height: 98,
                        borderRadius: 2,
                        objectFit: "cover",
                        border: "1px solid rgba(0,0,0,0.15)",
                        bgcolor: "#fff",
                      }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 16 }} noWrap>
                        {vet?.name || "—"}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }} noWrap>
                        {vet?.clinic || "—"}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
                          ⭐ {vet?.rating ?? "—"}
                        </Typography>
                        <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>
                          ({vet?.reviewsCount ?? 0})
                        </Typography>
                      </Stack>
                    </Box>

                    <Box sx={{ gridColumn: "1 / -1", mt: 1.5 }}>
                      <Stack spacing={0.8}>
                        <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                          Ιδιωτικό Ιατρείο:{" "}
                          <span style={{ fontWeight: 700, color: MUTED }}>{vet?.address || "—"}</span>
                        </Typography>
                        <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                          Τηλέφωνο:{" "}
                          <span style={{ fontWeight: 700, color: MUTED }}>{vet?.phone || "—"}</span>
                        </Typography>
                        <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                          Email:{" "}
                          <span style={{ fontWeight: 700, color: MUTED }}>{vet?.email || "—"}</span>
                        </Typography>
                        <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                          Εμπειρία:{" "}
                          <span style={{ fontWeight: 700, color: MUTED }}>{vet?.experience || "—"}</span>
                        </Typography>
                        <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                          Σπουδές:{" "}
                          <span style={{ fontWeight: 700, color: MUTED }}>{vet?.studies || "—"}</span>
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Paper>

              {/* ✅ Reviews preview από JSON: 3 τελευταίες (μαζεμένο & χωράει 3) */}
              {!loading && !err && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    border: `2px solid ${BORDER}`,
                    boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                    p: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 15 }}>
                      Αξιολογήσεις
                    </Typography>
                  </Stack>

                  {last3Reviews.length === 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        bgcolor: "#eef1f4",
                        border: "1px solid rgba(0,0,0,0.08)",
                        p: 1.2,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 800 }}>
                        Δεν υπάρχουν ακόμα αξιολογήσεις.
                      </Typography>
                    </Paper>
                  ) : (
                    <>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.8}
                        useFlexGap
                        flexWrap="nowrap"           // ✅ πάντα 3 στη σειρά σε sm+
                        sx={{ alignItems: "stretch", overflow: "hidden" }}
                      >
                        {last3Reviews.map((r) => (
                          <Paper
                            key={r.id}
                            elevation={0}
                            sx={{
                              flex: { xs: "1 1 auto", sm: "1 1 0" },
                              minWidth: 0,            // ✅ απαραίτητο για σωστές τελίτσες
                              maxWidth: 220,
                              borderRadius: 2,
                              bgcolor: "#eef1f4",
                              border: "1px solid rgba(0,0,0,0.08)",
                              p: 0.9,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.4,
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#111" }}>
                                ⭐ {Number(r.rating || 0).toFixed(1)}
                              </Typography>

                              <Typography sx={{ fontSize: 10.5, color: MUTED, fontWeight: 800 }} noWrap>
                                {r.date
                                  ? String(r.date).includes("/")
                                    ? r.date
                                    : new Date(r.date).toLocaleDateString("el-GR")
                                  : ""}
                              </Typography>
                            </Stack>

                            <Typography
                              sx={{
                                mt: 1,
                                color: "#111",
                                fontWeight: 700,
                                fontSize: 11,
                                display: "-webkit-box",
                                WebkitLineClamp: 1,        // 👈 πόσες γραμμές να φαίνονται (1/2/3)
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {r.text || "—"}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 10.5,
                                color: MUTED,
                                fontWeight: 800,
                                mt: "auto",
                              }}
                              noWrap
                              title={r.name || ""}
                            >
                              {r.name || "Ανώνυμος"}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>

                      {/* (προαιρετικό) αν θες οπτικό "χώρισμα" */}
                      <Divider sx={{ mt: 1.2, opacity: 0.35 }} />
                    </>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.7 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/owner/vets/${id}/reviews`)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        borderColor: "#c7d4e8",
                        color: "#111",
                        bgcolor: "#eef1f4",
                        "&:hover": { bgcolor: "#e6ebf3", borderColor: "#c7d4e8" },
                      }}
                    >
                      Περισσότερα
                    </Button>
                  </Box>
                </Paper>
              )}
            </Box>

            {/* Right: schedule */}
            <Box>
              {!loading && !err && (
                <CalendarWithTimeSlots
                  value={pick}
                  onChange={setPick}
                  title="Ραντεβού"
                  subtitleDay="1. Διάλεξε ημέρα"
                  subtitleTime="2. Διάλεξε ώρα"
                  primary={PRIMARY}
                  primaryHover={PRIMARY_HOVER}
                  panelBg="#e7f1ff"
                  disabledBg="#e0e0e0"
                  disabledText="#9aa0a6"
                  timeRange={{
                    start: vet?.availability?.start || "09:00",
                    end: vet?.availability?.end || "20:30",
                    stepMinutes: vet?.availability?.stepMin || 30,
                  }}
                  getBookedTimes={getBookedTimes}
                  onAction={() => {
                    if (!canProceed) return;

                    const dateStr = pick.date.format("YYYY-MM-DD");
                    const timeStr = pick.time;

                    navigate(
                      `/owner/vets/${id}/new?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeStr)}`
                    );
                  }}
                  actionText="Επόμενο βήμα"
                  actionDisabled={!canProceed}
                />
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
