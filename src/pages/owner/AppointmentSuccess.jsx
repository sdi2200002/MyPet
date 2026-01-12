import { useMemo } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/el";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

const APPTS_KEY = "mypet_appointments";

function safeLoad(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

// για date τύπου "YYYY-MM-DD"
function formatDateYMD(ymd) {
  if (!ymd || !ymd.includes("-")) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d} / ${m} / ${y}`;
}

function Row({ label, value }) {
  return (
    <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 16, mb: 1.1 }}>
      {label}: <span style={{ fontWeight: 700, color: MUTED }}>{value || "—"}</span>
    </Typography>
  );
}

export default function AppointmentSuccess() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const apptId = sp.get("apptId") || "";

  const appt = useMemo(() => {
    const all = safeLoad(APPTS_KEY, []);
    return all.find((a) => a.id === apptId) || null;
  }, [apptId]);

  // ✅ Υποστηρίζουμε και τα 2 σχήματα:
  // 1) appt.when (π.χ. "2025-11-18T12:00:00")
  // 2) appt.date + appt.time (π.χ. "2025-11-18" + "12:00")
  const { displayDate, displayTime } = useMemo(() => {
    if (!appt) return { displayDate: "—", displayTime: "—" };

    // Prefer: when
    if (appt.when) {
      const d = dayjs(appt.when);
      return {
        displayDate: d.isValid() ? d.format("DD / MM / YYYY") : "—",
        displayTime: d.isValid() ? d.format("HH:mm") : "—",
      };
    }

    // Fallback: date + time
    const dStr = appt.date || "";
    const tStr = appt.time || "";

    const dateOk = !!dStr && dStr.includes("-");
    const timeOk = !!tStr && tStr.includes(":");

    // Αν υπάρχουν και τα 2, τα συνθέτουμε για ασφάλεια
    if (dateOk && timeOk) {
      const composed = dayjs(`${dStr}T${tStr}`);
      return {
        displayDate: composed.isValid() ? composed.format("DD / MM / YYYY") : formatDateYMD(dStr),
        displayTime: composed.isValid() ? composed.format("HH:mm") : tStr,
      };
    }

    return {
      displayDate: dateOk ? formatDateYMD(dStr) : "—",
      displayTime: timeOk ? tStr : "—",
    };
  }, [appt]);

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
            <Stack direction="row" spacing={1.6} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.2,
                  bgcolor: "#32c26a",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 20,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.16)",
                }}
              >
                ✓
              </Box>

              <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: { xs: 22, md: 30 } }}>
                Το ραντεβού έκλεισε με επιτυχία!
              </Typography>
            </Stack>

            <Typography sx={{ mt: 1, color: MUTED, fontWeight: 700 }}>
              Παρακάτω είναι τα στοιχεία του ραντεβού σας.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 2,
                bgcolor: "#eef1f4",
                border: "1px solid rgba(0,0,0,0.10)",
                p: { xs: 2, md: 3 },
              }}
            >
              <Row label="Κτηνίατρος" value={appt?.vetName} />
              <Row label="Ημερομηνία" value={displayDate} />
              <Row label="Ώρα" value={displayTime} />
              <Row label="Υπηρεσία" value={appt?.service} />
              <Row label="Κατοικίδιο" value={appt?.petName} />
              <Row label="Ιατρείο" value={appt?.clinicAddress} />
            </Paper>

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

            {!appt && (
              <Typography sx={{ mt: 2, color: MUTED, fontWeight: 700, fontSize: 12 }}>
                * Δεν βρέθηκαν στοιχεία ραντεβού (ίσως άνοιξες τη σελίδα χωρίς apptId ή καθάρισες το localStorage).
              </Typography>
            )}
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
