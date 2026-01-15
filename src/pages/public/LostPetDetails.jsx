import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

const COLORS = {
  title: "#0d2c54",
  panelBorder: "#8fb4e8",
  primary: "#0b3d91",
  primaryHover: "#08316f",
  muted: "#6b7a90",
};

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status} on ${path}`);
  }
  return res.json();
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 2, py: 0.5 }}>
      <Typography sx={{ fontWeight: 900, color: COLORS.title, opacity: 0.9 }}>
        {label}:
      </Typography>
      <Typography sx={{ color: COLORS.title }}>{value || "—"}</Typography>
    </Box>
  );
}

function fmtDate(isoOrYmd) {
  if (!isoOrYmd) return "—";
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return String(isoOrYmd);
  return d.toLocaleDateString("el-GR");
}

function ymd(value) {
  if (!value) return "";
  // κρατάμε YYYY-MM-DD
  return String(value).slice(0, 10);
}

// ✅ mailto helper (χωρίς backend)
function openMailTo({ to, subject, body }) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  const link = `mailto:${encodeURIComponent(to || "")}?subject=${s}&body=${b}`;
  window.location.href = link;
}

export default function LostPetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---------------------------
  // ✅ "Βρήκα το κατοικίδιο" dialog state
  // ---------------------------
  const [openFound, setOpenFound] = useState(false);
  const [foundForm, setFoundForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    foundArea: "",
    foundDate: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState(false);

  function updateFoundForm(key, value) {
    setFoundForm((p) => ({ ...p, [key]: value }));
  }

  function resetFoundDialog() {
    setSubmitError("");
    setSubmitOk(false);
    setSubmitting(false);
  }

  function openDialog() {
    resetFoundDialog();
    setFoundForm((p) => ({
      ...p,
      foundArea: p.foundArea || item?.area || "",
      // default σήμερα
      foundDate: p.foundDate || new Date().toISOString().slice(0, 10),
    }));
    setOpenFound(true);
  }

  function closeDialog() {
    if (!submitting) setOpenFound(false);
  }

  async function submitFoundReport() {
    setSubmitError("");
    setSubmitOk(false);

    if (!item?.id) return setSubmitError("Λείπει το id της δήλωσης.");
    if (!foundForm.firstName.trim()) return setSubmitError("Βάλε όνομα.");
    if (!foundForm.phone.trim() && !foundForm.email.trim()) {
      return setSubmitError("Βάλε τηλέφωνο ή email για να μπορεί να σε βρει ο ιδιοκτήτης.");
    }

    try {
      setSubmitting(true);

      const now = new Date().toISOString();

      // 1) ✅ Δημιουργία fast Found Declaration (στο json-server)
      const createdFound = await fetchJSON("/api/foundDeclarations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ✅ σύνδεση με το lost
          lostDeclarationId: String(item.id),

          // προαιρετικά: αν έχεις logged in user, μπορείς να βάλεις finderId
          finderId: "",

          // στο δικό σου σχήμα υπάρχουν αυτά:
          status: "Οριστική",
          date: ymd(foundForm.foundDate) || new Date().toISOString().slice(0, 10),
          area: foundForm.foundArea || item.area || "",
          sex: "",
          species: item.breedOrSpecies || item.species || "",
          color: item.color || "",
          notes: foundForm.message || "",

          firstName: foundForm.firstName.trim(),
          lastName: foundForm.lastName.trim(),
          phone: foundForm.phone.trim(),
          email: foundForm.email.trim(),
          photoDataUrl: "",

          createdAt: now,
          updatedAt: now,
        }),
      });

      // 2) ✅ Notification στον ιδιοκτήτη της απώλειας (finderId)
      // στο lostDeclarations έχεις finderId (αυτός έκανε τη δήλωση)
      const ownerUserId = item.finderId || item.ownerId || "";
      if (ownerUserId) {
        await fetchJSON("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: String(ownerUserId),
            message: "Κάποιος βρήκε το κατοικίδιό σας",
            createdAt: now,
            isRead: false,

            // ✅ ΜΟΝΟ αυτά για routing:
            refType: "found",
            refId: String(createdFound.id),

            // ✅ κράτα το lost id σε ΑΛΛΟ πεδίο (ΟΧΙ refId):
            lostDeclarationId: String(item.id),
            foundDeclarationId: String(createdFound.id),
          }),
        });    
      }

      // 3) ✅ “Email” χωρίς backend: ανοίγουμε mail client με mailto:
      // (ο χρήστης πατάει Send)
      if (item.email) {
        const subject = `Βρέθηκε το κατοικίδιό σας: ${item.petName || "Κατοικίδιο"}`;
        const body = [
          `Γεια σας,`,
          ``,
          `Βρήκα το κατοικίδιό σας (${item.petName || ""}).`,
          ``,
          `Στοιχεία επικοινωνίας μου:`,
          `- Όνομα: ${foundForm.firstName.trim()} ${foundForm.lastName.trim()}`.trim(),
          `- Τηλέφωνο: ${foundForm.phone.trim() || "-"}`,
          `- Email: ${foundForm.email.trim() || "-"}`,
          ``,
          `Στοιχεία εύρεσης:`,
          `- Περιοχή: ${foundForm.foundArea || "-"}`,
          `- Ημ/νία: ${ymd(foundForm.foundDate) || "-"}`,
          ``,
          `Μήνυμα:`,
          `${foundForm.message || "-"}`,
          ``,
          `MyPet`,
        ].join("\n");

        openMailTo({ to: item.email, subject, body });
      }

      setSubmitOk(true);
    } catch (e) {
      setSubmitError(e?.message || "Κάτι πήγε στραβά στην αποστολή.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Φέρνουμε τη δήλωση από json-server: /api/lostDeclarations/:id
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!id) {
        if (!alive) return;
        setItem(null);
        setErr("Λείπει το id της δήλωσης.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(id))}`);
        if (!alive) return;

        setItem(data || null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;

        setItem(null);
        setErr("Δεν βρέθηκε η δήλωση.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26, mb: 2 }}>
            Καρτέλα Απώλειας Κατοικιδίου
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `2px solid ${COLORS.panelBorder}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
              minHeight: 320,
            }}
          >
            {loading ? (
              <Typography sx={{ fontWeight: 900, color: COLORS.title }}>Φόρτωση...</Typography>
            ) : err ? (
              <Box>
                <Typography sx={{ fontWeight: 900, color: COLORS.title }}>{err}</Typography>
                <Typography
                  sx={{ mt: 1, color: COLORS.title, opacity: 0.7, cursor: "pointer" }}
                  onClick={() => navigate("/owner/declarations")}
                >
                  Επιστροφή στη λίστα
                </Typography>
              </Box>
            ) : !item ? (
              <Box>
                <Typography sx={{ fontWeight: 900, color: COLORS.title }}>
                  Δεν βρέθηκε η δήλωση.
                </Typography>
                <Typography
                  sx={{ mt: 1, color: COLORS.title, opacity: 0.7, cursor: "pointer" }}
                  onClick={() => navigate("/owner/declarations")}
                >
                  Επιστροφή στη λίστα
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
                    gap: 3,
                    alignItems: "start",
                  }}
                >
                  {/* Image */}
                  <Box
                    sx={{
                      width: 240,
                      height: 170,
                      borderRadius: 3,
                      overflow: "hidden",
                      bgcolor: "#eef1f4",
                      border: "1px solid #d5deeb",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {item.photoDataUrl ? (
                      <Box
                        component="img"
                        src={item.photoDataUrl}
                        alt={item.petName || "pet"}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Typography sx={{ fontWeight: 800, color: COLORS.muted }}>
                        Φωτογραφία
                      </Typography>
                    )}
                  </Box>

                  {/* Details */}
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 28 }}>
                      {item.petName ||
                        item.breedOrSpecies ||
                        item.breed ||
                        item.species ||
                        "Κατοικίδιο"}
                    </Typography>

                    <Box sx={{ height: 2, bgcolor: COLORS.primary, opacity: 0.25, my: 1.5 }} />

                    <Row label="Ημ. Απώλειας" value={fmtDate(item.date)} />
                    <Row label="Περιοχή" value={item.area} />

                    <Row label="Φύλο" value={item.sex} />
                    <Row
                      label="Φυλή/Είδος"
                      value={item.breedOrSpecies || item.breed || item.species}
                    />
                    <Row label="Χρώμα" value={item.color} />
                    <Row label="Microchip" value={item.microchip} />

                    <Row
                      label="Ιδιοκτήτης"
                      value={`${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"}
                    />
                    <Row label="Τηλ." value={item.phone} />
                    <Row label="Email" value={item.email} />
                    <Row label="Περιγραφή" value={item.notes} />

                    {/* ✅ CTA */}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={openDialog}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 3,
                          bgcolor: COLORS.primary,
                          "&:hover": { bgcolor: COLORS.primaryHover },
                          boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                        }}
                      >
                        Βρήκα το κατοικίδιο
                      </Button>
                    </Box>

                    <Typography sx={{ mt: 1, fontSize: 12, color: COLORS.muted }}>
                      * Χωρίς backend, το “email” ανοίγει στο πρόγραμμα email σας (mailto).
                    </Typography>
                  </Box>
                </Box>

                {/* ✅ Dialog Φόρμα */}
                <Dialog open={openFound} onClose={closeDialog} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ fontWeight: 900, color: COLORS.title }}>
                    Δήλωση εύρεσης για: {item?.petName || "κατοικίδιο"}
                  </DialogTitle>

                  <DialogContent sx={{ pt: 1 }}>
                    {submitOk && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Στάλθηκε! Καταχωρήθηκε δήλωση εύρεσης και δημιουργήθηκε ειδοποίηση.
                        Αν υπάρχει email, άνοιξε και έτοιμο μήνυμα αποστολής.
                      </Alert>
                    )}

                    {!!submitError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {submitError}
                      </Alert>
                    )}

                    <Stack spacing={1.2} sx={{ mt: 1 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <TextField
                          fullWidth
                          label="Όνομα"
                          value={foundForm.firstName}
                          onChange={(e) => updateFoundForm("firstName", e.target.value)}
                        />
                        <TextField
                          fullWidth
                          label="Επώνυμο"
                          value={foundForm.lastName}
                          onChange={(e) => updateFoundForm("lastName", e.target.value)}
                        />
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <TextField
                          fullWidth
                          label="Τηλέφωνο"
                          value={foundForm.phone}
                          onChange={(e) => updateFoundForm("phone", e.target.value)}
                        />
                        <TextField
                          fullWidth
                          label="Email"
                          value={foundForm.email}
                          onChange={(e) => updateFoundForm("email", e.target.value)}
                        />
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <TextField
                          fullWidth
                          label="Πού βρέθηκε (περιοχή)"
                          value={foundForm.foundArea}
                          onChange={(e) => updateFoundForm("foundArea", e.target.value)}
                        />
                        <TextField
                          fullWidth
                          type="date"
                          label="Ημ/νία εύρεσης"
                          value={foundForm.foundDate}
                          onChange={(e) => updateFoundForm("foundDate", e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>

                      <TextField
                        fullWidth
                        label="Μήνυμα προς τον ιδιοκτήτη"
                        multiline
                        minRows={3}
                        value={foundForm.message}
                        onChange={(e) => updateFoundForm("message", e.target.value)}
                        placeholder="Π.χ. Το βρήκα κοντά στο πάρκο, είναι ασφαλές και μπορώ να το κρατήσω μέχρι να έρθετε."
                      />
                    </Stack>
                  </DialogContent>

                  <DialogActions sx={{ p: 2 }}>
                    <Button
                      onClick={closeDialog}
                      sx={{ textTransform: "none" }}
                      disabled={submitting}
                    >
                      Άκυρο
                    </Button>

                    <Button
                      variant="contained"
                      onClick={submitFoundReport}
                      disabled={submitting || submitOk}
                      startIcon={submitting ? <CircularProgress size={18} /> : null}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: COLORS.primary,
                        "&:hover": { bgcolor: COLORS.primaryHover },
                      }}
                    >
                      Αποστολή
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
