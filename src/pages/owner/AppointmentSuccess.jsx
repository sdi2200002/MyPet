import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography, Divider } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/el";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useAuth } from "../../auth/AuthContext";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function LabelValue({ label, value }) {
  return (
    <Stack direction="row" spacing={1.2} sx={{ mb: 1.2 }}>
      <Typography sx={{ minWidth: 130, fontWeight: 900, color: "#111", fontSize: 15 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, color: MUTED, fontSize: 15 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

export default function AppointmentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sp] = useSearchParams();

  // /owner/appointments/success?apptId=...
  const apptId = (sp.get("apptId") || "").trim();

  const [appt, setAppt] = useState(null);
  const [vet, setVet] = useState(null);
  const [pet, setPet] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!apptId) throw new Error("missing id");

      // 1) appointment
      const a = await fetchJSON(`/api/appointments/${encodeURIComponent(apptId)}`);

      // ✅ security: πρέπει να ανήκει στον χρήστη
      if (user?.id != null && a?.ownerId != null && String(a.ownerId) !== String(user.id)) {
        throw new Error("forbidden");
      }

      // 2) vet
      let v = null;
      if (a?.vetId != null) {
        v = await fetchJSON(`/api/vets/${encodeURIComponent(String(a.vetId))}`);
      }

      // 3) pet
      let p = null;
      if (a?.petId != null) {
        // Αν στο db.json τα pets έχουν numeric ids, άλλαξε εδώ σε:
        // p = await fetchJSON(`/api/pets/${encodeURIComponent(String(Number(a.petId)))}`);
        p = await fetchJSON(`/api/pets/${encodeURIComponent(String(a.petId))}`);
      }

      if (!alive) return;
      setAppt(a || null);
      setVet(v || null);
      setPet(p || null);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;

      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("forbidden")) setErr("Δεν έχεις πρόσβαση σε αυτό το ραντεβού.");
      else if (msg.includes("missing id")) setErr("Λείπει το apptId από το URL.");
      else setErr("Δεν βρέθηκαν στοιχεία για το ραντεβού.");

      setAppt(null);
      setVet(null);
      setPet(null);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [apptId, user?.id]);

  const display = useMemo(() => {
    if (!appt?.when) return { date: "—", time: "—" };
    const d = dayjs(appt.when);
    return {
      date: d.isValid() ? d.format("DD / MM / YYYY") : "—",
      time: d.isValid() ? d.format("HH:mm") : "—",
    };
  }, [appt]);

  // ✅ Χωρίς fallback (όπως ζήτησες) -> αν δεν υπάρχει, δείχνει "Χωρίς φωτο"
  const petPhoto = useMemo(() => {
    const candidate = pet?.photo || pet?.photoUrl || pet?.image || pet?.avatar || "";
    return typeof candidate === "string" ? candidate : "";
  }, [pet]);

  const vetPhoto = useMemo(() => {
    const candidate = vet?.photo || vet?.photoUrl || vet?.image || "";
    return typeof candidate === "string" ? candidate : "";
  }, [vet]);

  const microchip = pet?.microchip || appt?.petMicrochip || "—";
  const rating = vet?.rating ?? 4.8;
  const reviewsCount = vet?.reviewsCount ?? 120;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: { xs: 2, md: 3 },
              maxWidth: 980,
              mx: "auto",
            }}
          >
            {loading ? (
              <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
            ) : err ? (
              <>
                <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>

                <Button
                  variant="contained"
                  onClick={() => navigate("/owner/appointments")}
                  sx={{
                    mt: 2,
                    textTransform: "none",
                    borderRadius: 2,
                    bgcolor: PRIMARY,
                    "&:hover": { bgcolor: PRIMARY_HOVER },
                    fontWeight: 900,
                    px: 3,
                    boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                  }}
                >
                  Τα Ραντεβού μου
                </Button>
              </>
            ) : (
              <>
                {/* ✅ Success header */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                    <CheckCircleOutlineIcon sx={{ color: "#2e7d32" }} />
                    <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: { xs: 22, md: 28 } }}>
                      Το ραντεβού έκλεισε με επιτυχία
                    </Typography>
                  </Stack>
                </Stack>

                {/* ✅ Details card (ΝΕΑ ΔΟΜΗ: Vet αριστερά / Pet+ραντεβού δεξιά) */}
                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    borderRadius: 2,
                    border: `1px solid rgba(0,0,0,0.10)`,
                    bgcolor: "#fff",
                    p: { xs: 2, md: 3 },
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2.2} alignItems="stretch">
                    {/* LEFT: Vet column */}
                    <Box sx={{ flex: 1, minWidth: 280 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 92,
                            height: 92,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.12)",
                            bgcolor: "#eef1f4",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {vetPhoto ? (
                            <Box
                              component="img"
                              src={vetPhoto}
                              alt="vet"
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                // χωρίς fallback -> απλά κρύβουμε το broken img
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 800 }}>
                              Χωρίς φωτο
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 18 }} noWrap>
                            {vet?.name || appt?.vetName || "—"}
                          </Typography>

                          <Typography sx={{ color: MUTED, fontWeight: 800, mt: 0.3 }}>
                            {vet?.clinic || vet?.clinicName || appt?.clinicName || appt?.clinicType || "Κλινική μικρών ζώων"}
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                            <Box sx={{ color: "#f5b301", fontWeight: 900, lineHeight: 1 }}>★</Box>
                            <Typography sx={{ fontWeight: 900, color: "#111" }}>
                              {rating}
                            </Typography>
                            <Typography sx={{ color: MUTED, fontWeight: 800 }}>
                              ({reviewsCount})
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 2 }} />
                      <LabelValue label="Ιατρείο:" value={vet?.address || appt?.clinicAddress} />
                    </Box>

                    {/* Divider middle (desktop) */}
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ display: { xs: "none", md: "block" }, mx: 0.5 }}
                    />

                    {/* RIGHT: Pet + Appointment column */}
                    <Box sx={{ flex: 1, minWidth: 280 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 92,
                            height: 92,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.12)",
                            bgcolor: "#eef1f4",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {petPhoto ? (
                            <Box
                              component="img"
                              src={petPhoto}
                              alt="pet"
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                // χωρίς fallback -> απλά κρύβουμε το broken img
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 800 }}>
                              Χωρίς φωτο
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 18 }} noWrap>
                            {pet?.name || appt?.petName || "Κατοικίδιο"}
                          </Typography>
                          <Typography sx={{ color: MUTED, fontWeight: 800, mt: 0.3 }}>
                            {microchip}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 2 }} />
                      <LabelValue label="Ημερομηνία:" value={display.date} />
                      <LabelValue label="Ώρα:" value={display.time} />
                      <LabelValue label="Υπηρεσία:" value={appt?.service} />
                    </Box>
                  </Stack>
                </Paper>

                {/* ✅ Footer actions */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.4}
                  justifyContent="flex-end"
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => navigate("/owner/appointments")}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: PRIMARY,
                      "&:hover": { bgcolor: PRIMARY_HOVER },
                      fontWeight: 900,
                      px: 3,
                      boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                    }}
                  >
                    Τα Ραντεβού μου
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
