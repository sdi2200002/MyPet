// src/pages/shared/DeclarationDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Box, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  primary: "#0b3d91",
  title: "#0d2c54",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
  fieldBorder: "#a7b8cf",
  muted: "#6b7a90",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    borderRadius: 2,
    "& fieldset": { borderColor: COLORS.fieldBorder },
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function Panel({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 6,
        bgcolor: COLORS.panelBg,
        border: `2px solid ${COLORS.panelBorder}`,
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
      }}
    >
      {children}
    </Paper>
  );
}

function normalizePhone(raw) {
  return (raw || "").replace(/[^\d+]/g, "").trim();
}
function normalizeAfm(raw) {
  return (raw || "").replace(/[^\d]/g, "").trim();
}

function AuthedShell({ role, children }) {
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />
        {role === "vet" ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

function PublicShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />
      <Box sx={{ flex: 1 }}>{children}</Box>
      <Footer />
    </Box>
  );
}

/**
 * route params:
 * - role: "owner" | "vet" | "public"
 * - type: "lost" | "found" | "registration" | "adoption" | "foster" | "transfer"
 * - id: declaration id
 *
 * Suggested routes:
 * /owner/declarations/:type/:id
 * /vet/declarations/:type/:id
 * /declarations/:type/:id   (public)
 */
export default function DeclarationDetails({ role = "public" }) {
  const navigate = useNavigate();
  const { type, id } = useParams();

  const isAuthed = role === "owner" || role === "vet";
  const Shell = isAuthed ? AuthedShell : PublicShell;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const endpoint = useMemo(() => {
    const t = String(type || "").toLowerCase();
    if (t === "lost") return `/api/lostDeclarations/${encodeURIComponent(String(id))}`;
    if (t === "found") return `/api/foundDeclarations/${encodeURIComponent(String(id))}`;
    if (t === "registration") return `/api/registrationDeclarations/${encodeURIComponent(String(id))}`;
    if (t === "adoption") return `/api/adoptionDeclarations/${encodeURIComponent(String(id))}`;
    if (t === "foster") return `/api/fosterDeclarations/${encodeURIComponent(String(id))}`;
    if (t === "transfer") return `/api/transferDeclarations/${encodeURIComponent(String(id))}`;
    return "";
  }, [type, id]);

  const pageTitle = useMemo(() => {
    const t = String(type || "").toLowerCase();
    if (t === "lost") return "Προεπισκόπηση Δήλωσης Απώλειας";
    if (t === "found") return "Προεπισκόπηση Δήλωσης Εύρεσης";
    if (t === "registration") return "Προεπισκόπηση Δήλωσης Εγγραφής";
    if (t === "adoption") return "Προεπισκόπηση Δήλωσης Υιοθεσίας";
    if (t === "foster") return "Προεπισκόπηση Δήλωσης Αναδοχής";
    if (t === "transfer") return "Προεπισκόπηση Δήλωσης Μεταβίβασης";
    return "Προεπισκόπηση Δήλωσης";
  }, [type]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        if (!endpoint) throw new Error("Unknown type");
        const d = await fetchJSON(endpoint);
        if (!alive) return;
        setData(d || null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Δεν βρέθηκαν στοιχεία για τη δήλωση.");
        setData(null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  const t = String(type || "").toLowerCase();

  return (
    <Shell {...(isAuthed ? { role } : {})}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <AppBreadcrumbs />

        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26 }}>
          {pageTitle}
        </Typography>

        <Panel>
          {loading ? (
            <Typography sx={{ color: COLORS.muted, fontWeight: 800 }}>Φόρτωση...</Typography>
          ) : err ? (
            <Typography sx={{ color: "#b00020", fontWeight: 900 }}>{err}</Typography>
          ) : !data ? (
            <Typography sx={{ fontWeight: 900 }}>Δεν βρέθηκε δήλωση.</Typography>
          ) : (
            <>
              {/* LOST / FOUND: 3 στήλες όπως το τελευταίο βήμα */}
              {(t === "lost" || t === "found") && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr 1fr" },
                    gap: 3,
                    alignItems: "start",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>
                      Στοιχεία Κατοικιδίου
                    </Typography>

                    <TextField label={t === "lost" ? "Ημερομηνία Απώλειας" : "Ημερομηνία Εύρεσης"} value={data.date || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Περιοχή" value={data.area || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Φύλο" value={data.sex || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Είδος" value={data.species || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Χρώμα" value={data.color || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Περιγραφή</Typography>
                    <TextField value={data.notes || "—"} fullWidth multiline minRows={4} sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />

                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Φωτογραφία Κατοικιδίου</Typography>
                    <Box
                      sx={{
                        height: 140,
                        borderRadius: 3,
                        border: "2px solid #000",
                        bgcolor: "#bfc8d3",
                        display: "grid",
                        placeItems: "center",
                        p: 2,
                        textAlign: "center",
                        overflow: "hidden",
                      }}
                    >
                      {!data.photoDataUrl ? (
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
                          Δεν υπάρχει φωτογραφία
                        </Typography>
                      ) : (
                        <Box component="img" src={data.photoDataUrl} alt="pet" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>
                      Στοιχεία {t === "lost" ? "Δηλούντος" : "Ευρετή"}
                    </Typography>

                    <TextField label="Όνομα" value={data.firstName || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Επώνυμο" value={data.lastName || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Τηλέφωνο" value={normalizePhone(data.phone) || "—"} fullWidth sx={{ ...fieldSx, mb: 2 }} InputProps={{ readOnly: true }} />
                    <TextField label="Email" value={data.email || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                  </Box>
                </Box>
              )}

              {/* REGISTRATION: Pet + Owner + Photo */}
              {t === "registration" && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    alignItems: "start",
                  }}
                >
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Στοιχεία Κατοικιδίου</Typography>

                    {[
                      ["Όνομα", data.petName ?? data.name],
                      ["Ημ. Γέννησης", data.birthDate],
                      ["Φύλο", data.sex],
                      ["Είδος", data.species],
                      ["Φυλή", data.breed],
                      ["Χρώμα", data.color],
                      ["Microchip", data.microchip],
                      ["Ομάδα Αίματος", data.bloodType],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Στοιχεία Ιδιοκτήτη</Typography>

                    {[
                      ["Ονοματεπώνυμο", data.ownerName],
                      ["Email", data.ownerEmail],
                      ["Τηλέφωνο", normalizePhone(data.ownerPhone)],
                      ["Διεύθυνση", data.ownerAddress],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Φωτογραφία</Typography>
                      <Box
                        sx={{
                          height: 160,
                          borderRadius: 3,
                          border: "2px solid #000",
                          bgcolor: "#bfc8d3",
                          display: "grid",
                          placeItems: "center",
                          p: 2,
                          overflow: "hidden",
                        }}
                      >
                        {data.photoDataUrl ? (
                          <Box component="img" src={data.photoDataUrl} alt="pet" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>Δεν υπάρχει φωτογραφία</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ADOPTION */}
              {t === "adoption" && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 4,
                    alignItems: "start",
                  }}
                >
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Κατοικιδίου</Typography>

                    {[
                      ["Όνομα", data.petName],
                      ["Είδος", data.species],
                      ["Φυλή", data.breed],
                      ["Φύλο", data.sex],
                      ["Χρώμα", data.color],
                      ["Microchip", data.microchip],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Υιοθετούντος</Typography>

                    {[
                      ["Όνομα", data.firstName],
                      ["Επώνυμο", data.lastName],
                      ["Τηλέφωνο", normalizePhone(data.phone)],
                      ["Email", data.email],
                      ["Διεύθυνση", data.address],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Επιπλέον</Typography>

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Σημειώσεις</Typography>
                      <TextField value={data.notes || "—"} fullWidth multiline minRows={6} sx={fieldSx} InputProps={{ readOnly: true }} />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Φωτογραφία</Typography>
                      <Box
                        sx={{
                          height: 160,
                          borderRadius: 3,
                          border: "2px solid #000",
                          bgcolor: "#bfc8d3",
                          display: "grid",
                          placeItems: "center",
                          p: 2,
                          overflow: "hidden",
                        }}
                      >
                        {data.photoDataUrl ? (
                          <Box component="img" src={data.photoDataUrl} alt="pet" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>Δεν υπάρχει φωτογραφία</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* FOSTER */}
              {t === "foster" && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 4,
                    alignItems: "start",
                  }}
                >
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Κατοικιδίου</Typography>

                    {[
                      ["Όνομα", data.petName],
                      ["Είδος", data.species],
                      ["Φυλή", data.breed],
                      ["Φύλο", data.sex],
                      ["Χρώμα", data.color],
                      ["Microchip", data.microchip],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Αναδόχου</Typography>

                    {[
                      ["Όνομα", data.firstName],
                      ["Επώνυμο", data.lastName],
                      ["Τηλέφωνο", normalizePhone(data.phone)],
                      ["Email", data.email],
                      ["Διεύθυνση", data.address],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Συνθήκες Αναδοχής</Typography>

                    {[
                      ["Διάρκεια", data.duration],
                      ["Ζώο στο σπίτι", data.hasOtherPet ? (data.hasOtherPet === "yes" ? "Ναι" : "Όχι") : ""],
                      ["Εμπειρία", data.experience],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Σημειώσεις</Typography>
                      <TextField value={data.notes || "—"} fullWidth multiline minRows={6} sx={fieldSx} InputProps={{ readOnly: true }} />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* TRANSFER */}
              {t === "transfer" && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 4,
                    alignItems: "start",
                  }}
                >
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Κατοικιδίου</Typography>

                    {[
                      ["Όνομα", data.petName],
                      ["Φυλή / Είδος", data.breedOrSpecies],
                      ["Φύλο", data.sex],
                      ["Χρώμα", data.color],
                      ["Microchip", data.microchip],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Στοιχεία Νέου Ιδιοκτήτη</Typography>

                    {[
                      ["Όνομα", data.newOwnerFirstName],
                      ["Επώνυμο", data.newOwnerLastName],
                      ["ΑΦΜ", normalizeAfm(data.newOwnerAfm)],
                      ["Τηλέφωνο", normalizePhone(data.newOwnerPhone)],
                      ["Email", data.newOwnerEmail],
                    ].map(([label, val]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 900, mb: 0.7 }}>{label}</Typography>
                        <TextField value={val || "—"} fullWidth sx={fieldSx} InputProps={{ readOnly: true }} />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Συνθήκες Μεταβίβασης</Typography>

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Ζώο στο σπίτι</Typography>
                      <TextField
                        value={data.hasOtherPet ? (data.hasOtherPet === "yes" ? "Ναι" : "Όχι") : "—"}
                        fullWidth
                        sx={fieldSx}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Εμπειρία με κατοικίδια</Typography>
                      <TextField
                        value={
                          data.experience === "0-1"
                            ? "0 - 1 χρόνος"
                            : data.experience === "2-5"
                            ? "2 - 5 χρόνια"
                            : data.experience === "5+"
                            ? "5+ χρόνια"
                            : data.experience || "—"
                        }
                        fullWidth
                        sx={fieldSx}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Περιγραφή συνθηκών</Typography>
                      <TextField value={data.notes || "—"} fullWidth multiline minRows={6} sx={fieldSx} InputProps={{ readOnly: true }} />
                    </Box>
                  </Box>
                </Box>
              )}

            </>
          )}
        </Panel>
      </Container>
    </Shell>
  );
}
