import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function makeNotifId() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function createNotification(payload) {
  // ✅ Δεν αφήνουμε να σπάσει το flow αν αποτύχει το notification
  const body = {
    id: payload.id || makeNotifId(),
    userId: String(payload.userId),
    createdAt: payload.createdAt || new Date().toISOString(),
    readAt: null,
    type: payload.type || "info",
    title: payload.title || "",
    message: payload.message || "",
    refType: payload.refType || "",
    refId: payload.refId || "",
  };

  return fetchJSON(`/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function formatDate(iso) {
  if (!iso || !iso.includes("-")) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} / ${m} / ${y}`;
}

function PetPick({ pet, active, onClick }) {
  const photo = pet.photo;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        border: `3px solid ${active ? PRIMARY : "rgba(199,212,232,1)"}`,
        bgcolor: active ? "rgba(11,61,145,0.06)" : "#fff",
        p: 1.2,
        width: 120,
        height: 140,
        boxSizing: "border-box",
        textAlign: "center",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        display: "grid",
        justifyItems: "center",
        alignContent: "start",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
        },
      }}
    >
      <Box
        component="img"
        src={photo}
        alt={pet.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/dog1.png";
        }}
        sx={{
          width: 84,
          height: 94,
          borderRadius: 2,
          objectFit: "cover",
          border: "1px solid rgba(0,0,0,0.15)",
          bgcolor: "#fff",
          display: "block",
          mt: 0.2,
        }}
      />
      <Typography sx={{ mt: 0.8, fontWeight: 900, fontSize: 12, color: "#111" }}>
        {pet.name || "—"}
      </Typography>
    </Paper>
  );
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

export default function VetNewAppointment() {
  const { vetId } = useParams();
  const id = String(vetId);
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const dateIso = sp.get("date") || "2025-11-18";
  const time = sp.get("time") || "12:00";

  const services = [
    "Βασική Κλινική Εξέταση",
    "Εμβολιασμοί",
    "Αποπαρασίτωση",
    "Διαγνωστικές Εξετάσεις",
    "Μικροεπεμβάσεις",
    "Μικροτσίπ & Έγγραφα",
    "Στείρωση",
    "Γέννηση",
  ];

  const [service, setService] = useState("Βασική Κλινική Εξέταση");
  const [petId, setPetId] = useState("");

  const [vet, setVet] = useState(null);
  const [pets, setPets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!user?.id) {
        if (!alive) return;
        setVet(null);
        setPets([]);
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setLoading(false);
        return;
      }

      const v = await fetchJSON(`/api/vets/${id}`);
      const p = await fetchJSON(`/api/pets?ownerId=${encodeURIComponent(String(user.id))}`);

      if (!alive) return;

      const petsArr = Array.isArray(p) ? p : [];
      setVet(v || null);
      setPets(petsArr);
      setPetId((prev) => prev || (petsArr[0]?.id ?? ""));
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης δεδομένων (κτηνίατρος/κατοικίδια).");
      setVet(null);
      setPets([]);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  const chosenPet = useMemo(
    () => pets.find((p) => String(p.id) === String(petId)) || null,
    [pets, petId]
  );

  const confirm = async () => {
    if (!vet || !chosenPet || !user?.id) return;

    const when = new Date(`${dateIso}T${time}:00`).toISOString();

    const existing = await fetchJSON(
      `/api/appointments?vetId=${encodeURIComponent(String(id))}&when=${encodeURIComponent(when)}`
    );

    const clash = (Array.isArray(existing) ? existing : []).some((a) =>
      ["Εκκρεμές", "Επιβεβαιωμένο"].includes(a.status)
    );

    if (clash) {
      alert("Η ώρα δεν είναι πλέον διαθέσιμη.");
      return;
    }

    const newAppt = {
      vetId: id,
      vetName: vet.name,

      ownerId: user.id,

      petId: chosenPet.id,
      petName: chosenPet.name,
      petPhoto: chosenPet.photo,
      petMicrochip: chosenPet.microchip,

      service,
      when,
      status: "Εκκρεμές",

      clinicAddress: vet.address,
      createdAt: new Date().toISOString(),
    };

    const created = await fetchJSON(`/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAppt),
    });

    // ✅ Notifications (Owner + Vet)
    try {
      const whenGR = new Date(created.when).toLocaleString("el-GR", { dateStyle: "short", timeStyle: "short" });

      // 1) Owner notification
      await createNotification({
        userId: created.ownerId,
        type: "appointment_pending",
        title: "Νέο ραντεβού (Εκκρεμές)",
        message: `Υποβλήθηκε αίτημα ραντεβού για ${created.petName} (${created.service}) στις ${whenGR}.`,
        refType: "appointment",
        refId: created.id,
      });

      // 2) Vet notification (αν ο vet έχει userId, το χρησιμοποιούμε)
      // Αν στο /api/vets έχεις πεδίο vet.userId => ✅ σωστό
      if (vet?.userId != null) {
        await createNotification({
          userId: vet.userId,
          type: "new_request",
          title: "Νέο αίτημα ραντεβού",
          message: `Νέο αίτημα από ${created.petName} (${created.service}) στις ${whenGR}.`,
          refType: "appointment",
          refId: created.id,
        });
      }
    } catch (e) {
      console.warn("Notification failed (ignored):", e);
    }

    navigate(
      `/owner/appointments/success?apptId=${encodeURIComponent(String(created?.id))}&vetId=${encodeURIComponent(
        String(id)
      )}`
    );
  };

  if (loading) {
    return (
      <OwnerPageShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, p: 2, bgcolor: "#f6f8fb", border: "1px solid rgba(0,0,0,0.12)" }}
          >
            <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
          </Paper>
        </Container>
      </OwnerPageShell>
    );
  }

  if (!loading && err) {
    return (
      <OwnerPageShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, p: 2, bgcolor: "#fff3f3", border: "1px solid rgba(0,0,0,0.12)" }}
          >
            <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
          </Paper>
        </Container>
      </OwnerPageShell>
    );
  }

  if (!vet) {
    return (
      <OwnerPageShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography sx={{ fontWeight: 900 }}>Δεν βρέθηκε κτηνίατρος.</Typography>
        </Container>
      </OwnerPageShell>
    );
  }

  return (
    <OwnerPageShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Box>
          <AppBreadcrumbs />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Left */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                component="img"
                src={vet.photo || "/images/demo-vet-avatar.png"}
                alt={vet.name}
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
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 16 }}>{vet.name}</Typography>
                <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>{vet.clinic}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 12 }}>⭐ {vet.rating}</Typography>
                  <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>({vet.reviewsCount})</Typography>
                </Stack>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                mt: 2.5,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.2 }}>Επιλογή Υπηρεσίας</Typography>
                <Stack spacing={1}>
                  {services.map((s) => (
                    <Paper
                      key={s}
                      elevation={0}
                      onClick={() => setService(s)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        px: 1.4,
                        py: 1.1,
                        border: s === service ? `2px solid ${PRIMARY}` : "1px solid rgba(0,0,0,0.10)",
                        bgcolor: s === service ? "rgba(11,61,145,0.06)" : "#fff",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 12, color: s === service ? PRIMARY : "#111" }}>
                        {s}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 900, color: TITLE, mb: 0.6 }}>Επιλογή Κατοικιδίου</Typography>
                <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 700, mb: 1.4 }}>
                  Διάλεξε το κατοικίδιο για το οποίο θα κλείσεις ραντεβού.
                </Typography>

                {pets.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      p: 1.6,
                      bgcolor: "#eef1f4",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, color: "#111", fontSize: 12 }}>
                      Δεν έχεις καταχωρήσει κατοικίδια.
                    </Typography>
                    <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mt: 0.6 }}>
                      Πήγαινε στα «Τα Κατοικίδια μου» για να προσθέσεις.
                    </Typography>
                  </Paper>
                ) : (

                  <Box
                    sx={{
                      maxHeight: 310, // ✅ scroll
                      overflowY: "auto",
                      pr: 0.5,
                    }}
                  >

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 120px)",
                        gap: 1.6,
                        justifyContent: "start",
                        alignItems: "start",
                      }}
                    >
                      {pets.map((p) => (
                        <PetPick
                          key={p.id}
                          pet={p}
                          active={String(p.id) === String(petId)}
                          onClick={() => setPetId(p.id)}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 2,
              minHeight: 509,
            }}
          >
            <Typography sx={{ fontWeight: 900, color: TITLE, mb: 5 }}>Λεπτομέρειες Ραντεβού</Typography>

            <Stack spacing={1.4}>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Κτηνίατρος: <span style={{ fontWeight: 700, color: MUTED }}>{vet.name}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Ημερομηνία: <span style={{ fontWeight: 700, color: MUTED }}>{formatDate(dateIso)}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Ώρα: <span style={{ fontWeight: 700, color: MUTED }}>{time}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Υπηρεσία: <span style={{ fontWeight: 700, color: MUTED }}>{service}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Κατοικίδιο: <span style={{ fontWeight: 700, color: MUTED }}>{chosenPet?.name || "—"}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Μικροτσίπ: <span style={{ fontWeight: 700, color: MUTED }}>{chosenPet?.microchip || "—"}</span>
              </Typography>
              <Typography sx={{ color: "#111", fontWeight: 900 }}>
                Ιατρείο: <span style={{ fontWeight: 700, color: MUTED }}>{vet.address}</span>
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="right" spacing={2} sx={{ mt: 20 }}>
              <Button
                onClick={() => navigate(-1)}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  bgcolor: "#b7bcc3",
                  color: "#000",
                  "&:hover": { bgcolor: "#a9aeb6" },
                }}
              >
                Ακύρωση
              </Button>

              <Button
                variant="contained"
                disabled={!chosenPet}
                onClick={() =>
                  confirm().catch((e) => {
                    console.error(e);
                    alert("Αποτυχία δημιουργίας ραντεβού.");
                  })
                }
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: PRIMARY_HOVER },
                  fontWeight: 900,
                  px: 3,
                  boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                  opacity: chosenPet ? 1 : 0.6,
                }}
              >
                Επιβεβαίωση Ραντεβού
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </OwnerPageShell>
  );
}
