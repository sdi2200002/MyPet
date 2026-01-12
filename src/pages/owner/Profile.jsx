import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useAuth } from "../../auth/AuthContext";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function InfoRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "110px 1fr",
        rowGap: 0.3,
        columnGap: 1.2,
        mb: 2,
      }}
    >
      <Typography sx={{ fontWeight: 800, color: COLORS.title }}>{label}</Typography>
      <Typography sx={{ color: "#1c2b39" }}>{value ?? "-"}</Typography>
    </Box>
  );
}

export default function OwnerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Φέρνουμε τον χρήστη από τη "βάση" (json-server) με βάση το id του logged-in χρήστη
  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");

      // αν δεν υπάρχει logged in user, πήγαινε login/home
      if (!user?.id) {
        setDbUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // IMPORTANT: το proxy σου κάνει /api -> http://localhost:3001
      const data = await fetchJSON(`/api/users/${encodeURIComponent(String(user.id))}`);

      if (!alive) return;
      setDbUser(data);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης προφίλ από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  // ✅ Προστασία: αυτή η σελίδα είναι για owner
  useEffect(() => {
    if (user && user.role && user.role !== "owner") {
      navigate("/");
    }
  }, [user, navigate]);

  const profile = useMemo(() => {
    const u = dbUser || user; // fallback μόνο στο local "user" αν αργεί/σπάσει το fetch
    return {
      fullName: u?.name ?? "-",
      phone: u?.phone ?? "-",
      address: u?.address ?? "-",
      email: u?.email ?? "-",
      photoUrl: u?.photoUrl ?? "",
    };
  }, [dbUser, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Αν δεν είναι logged in
  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
        <PublicNavbar />
        <Box sx={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <AppBreadcrumbs />
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: `2px solid ${COLORS.panelBorder}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: COLORS.title }}>
                Πρέπει να συνδεθείς για να δεις το προφίλ.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  mt: 2,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                }}
              >
                Σύνδεση
              </Button>
            </Paper>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <AppBreadcrumbs />

          <Box sx={{ mt: 2, display: "grid", placeItems: "center" }}>
            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", sm: 650, md: 720 },
                bgcolor: COLORS.panelBg,
                border: `2px solid ${COLORS.panelBorder}`,
                borderRadius: 2,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                p: { xs: 2.2, sm: 3 },
              }}
            >
              {loading ? (
                <Typography sx={{ fontWeight: 800, color: "#1c2b39" }}>Φόρτωση προφίλ...</Typography>
              ) : (
                <>
                  {err && (
                    <Typography sx={{ fontWeight: 900, color: "#b00020", mb: 2 }}>
                      {err}
                    </Typography>
                  )}

                  {/* top row: photo + name */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 3, alignItems: "start" }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: 1,
                        bgcolor: "rgba(255,255,255,0.45)",
                        border: "1.5px solid rgba(13,44,84,0.35)",
                        position: "relative",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        color: COLORS.title,
                        fontWeight: 800,
                      }}
                    >
                      {profile.photoUrl ? (
                        <Box
                          component="img"
                          src={profile.photoUrl}
                          alt="Φωτογραφία"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Typography sx={{ fontWeight: 800 }}>Φωτογραφία</Typography>
                      )}

                      {!profile.photoUrl && (
                        <>
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              borderTop: "1px solid rgba(13,44,84,0.35)",
                              transform: "rotate(45deg)",
                              transformOrigin: "center",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              borderTop: "1px solid rgba(13,44,84,0.35)",
                              transform: "rotate(-45deg)",
                              transformOrigin: "center",
                            }}
                          />
                        </>
                      )}
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 900, color: "#000", fontSize: 18, mt: 1 }}>
                        {profile.fullName}
                      </Typography>
                      <Typography sx={{ color: "#1c2b39", fontWeight: 700, mt: 0.4 }}>
                        Ρόλος: {dbUser?.role || user?.role || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* info rows */}
                  <Box sx={{ mt: 4 }}>
                    <InfoRow label="Τηλέφωνο:" value={profile.phone} />
                    <InfoRow label="Διεύθυνση:" value={profile.address} />
                    <InfoRow label="Email:" value={profile.email} />
                  </Box>
                </>
              )}
            </Paper>

            {/* Logout button */}
            <Box
              sx={{
                width: { xs: "100%", sm: 650, md: 720 },
                display: "flex",
                justifyContent: "flex-end",
                mt: 2.2,
              }}
            >
              <Button
                variant="contained"
                onClick={handleLogout}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3.2,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                }}
              >
                Αποσύνδεση
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
