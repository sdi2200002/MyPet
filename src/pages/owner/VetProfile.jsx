import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/el";
import PublicNavbar from "../../components/PublicNavbar";
import OwnerNavbar from "../../components/OwnerNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import CalendarWithTimeSlots from "../../components/CalendarWithTimeSlots.jsx";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const PANEL_BG = "#dfeeff";
const TITLE = "#0d2c54";

/** ✅ ΙΔΙΟ KEY ΜΕ ΤΟ VetSearch */
const VETS_KEY = "mypet_vets";
const APPOINTMENTS_KEY = "mypet_appointments";

function safeLoad(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** ✅ Seed demo vet (μόνο αν δεν υπάρχουν ήδη vets) */
function seedVetsIfMissing() {
  const existing = safeLoad(VETS_KEY, []);
  if (existing.length) return;

  const demo = [
    {
      id: "v1", // ✅ ταιριάζει με /owner/vets/v1
      name: "Κυριακή Νικολάου",
      clinic: "Κλινική μικρών ζώων",
      rating: 4.8,
      reviewsCount: 120,
      priceRange: "40€ - 50€",
      specialty: "Γενικός",
      area: "Αθήνα",
      address: "Λεωφόρος Κηφισίας 124, Αμπελόκηποι, Αθήνα 11526",
      phone: "6900000000",
      email: "doc@gmail.com",
      experience: "10+ χρόνια",
      studies:
        "Πτυχίο Κτηνιατρικής, Τμήμα Κτηνιατρικής, Σχολή Επιστημών Υγείας, Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης",
      photo: "/images/vet1.png", // βάλε την εικόνα στο public/images/vet1.png
      // “ωράριο” για να φαίνεται πραγματικό
      availability: {
        start: "09:00",
        end: "19:00",
        stepMin: 30,
      },
      // demo “κλεισμένες” ώρες ανά ημέρα (προαιρετικό)
      booked: {
        "2025-11-18": ["10:30", "11:00", "13:30"],
        "2025-11-19": ["09:30", "12:30"],
      },
    },
  ];

  safeSave(VETS_KEY, demo);
}


export default function VetProfile() {
  const { vetId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    seedVetsIfMissing();
  }, []);

  const vet = useMemo(() => {
    const all = safeLoad(VETS_KEY, []);
    return all.find((x) => x.id === vetId) || null;
  }, [vetId]);


    const [pick, setPick] = useState({ date: dayjs(), time: null });

    // ✅ booked times από localStorage appointments (και προαιρετικά από vet.booked demo)
    const getBookedTimes = (dateDayjs) => {
      const dayKey = dateDayjs.format("YYYY-MM-DD");

      const appointments = safeLoad(APPOINTMENTS_KEY, []);
      const bookedFromAppointments = appointments
        .filter((a) => a.vetId === vetId)
        .filter((a) => dayjs(a.when).format("YYYY-MM-DD") === dayKey)
        // στα επερχόμενα: "Εκκρεμές" + "Επιβεβαιωμένο" μπλοκάρουν slot
        .filter((a) => ["Εκκρεμές", "Επιβεβαιωμένο"].includes(a.status))
        .map((a) => dayjs(a.when).format("HH:mm"));

      const bookedFromVetDemo = (vet?.booked?.[dayKey] || []); // αν το κρατάς σαν demo

      // merge unique
      return Array.from(new Set([...bookedFromAppointments, ...bookedFromVetDemo]));
    };

    const canProceed = !!pick?.date && !!pick?.time;



  if (!vet) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography sx={{ fontWeight: 900 }}>Δεν βρέθηκε κτηνίατρος.</Typography>

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
                  display: "grid",
                  gridTemplateColumns: "110px 1fr",
                  gap: 2,
                  alignItems: "start",
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
                  <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 16 }}>{vet.name}</Typography>
                  <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>{vet.clinic}</Typography>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 12 }}>⭐ {vet.rating}</Typography>
                    <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>({vet.reviewsCount})</Typography>
                  </Stack>
                </Box>

                <Box sx={{ gridColumn: "1 / -1", mt: 1.5 }}>
                  <Stack spacing={0.8}>
                    <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                      Ιδιωτικό Ιατρείο:{" "}
                      <span style={{ fontWeight: 700, color: MUTED }}>{vet.address || "—"}</span>
                    </Typography>
                    <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                      Τηλέφωνο: <span style={{ fontWeight: 700, color: MUTED }}>{vet.phone || "—"}</span>
                    </Typography>
                    <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                      Email: <span style={{ fontWeight: 700, color: MUTED }}>{vet.email || "—"}</span>
                    </Typography>
                    <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                      Εμπειρία: <span style={{ fontWeight: 700, color: MUTED }}>{vet.experience || "—"}</span>
                    </Typography>
                    <Typography sx={{ color: "#111", fontWeight: 800, fontSize: 12 }}>
                      Σπουδές: <span style={{ fontWeight: 700, color: MUTED }}>{vet.studies || "—"}</span>
                    </Typography>
                  </Stack>
                </Box>
              </Paper>

              {/* Reviews preview */}
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  border: `2px solid ${BORDER}`,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                  p: 3,
                }}
              >
                <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1 }}>Αξιολογήσεις</Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.6}>
                  {["Εξαιρετική κτηνίατρος!", "Άμεση διάγνωση...", "Καταπληκτική!"].map((t, i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        bgcolor: "#eef1f4",
                        border: "1px solid rgba(0,0,0,0.08)",
                        p: 1.2,
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#111" }}>⭐ 5.0</Typography>
                      <Typography sx={{ fontSize: 11, color: MUTED, fontWeight: 700, mt: 1 }}>{t}</Typography>
                    </Paper>
                  ))}
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.4 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/owner/vets/${vetId}/reviews`)}
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
            </Box>

            {/* Right: schedule */}
            <CalendarWithTimeSlots
              value={pick}
              onChange={setPick}
              title="Ραντεβού"
              subtitleDay="1. Διάλεξε ημέρα"
              subtitleTime="2. Διάλεξε ώρα"
              primary={PRIMARY}
              primaryHover={PRIMARY_HOVER}
              panelBg="#e7f1ff"        // ανοιχτό γαλάζιο για διαθέσιμα
              disabledBg="#e0e0e0"     // γκρι για μη διαθέσιμα
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
                const timeStr = pick.time; // "HH:mm"

                navigate(`/owner/vets/${vetId}/new?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeStr)}`);
              }}
              actionText="Επόμενο βήμα"
              actionDisabled={!canProceed}
            />

          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
