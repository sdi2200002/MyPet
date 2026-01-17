import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Divider,
  Rating,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import { useAuth } from "../../auth/AuthContext";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  title: "#0d2c54",
  panelBg: "#dbeaff",
  panelBorder: "#8fb4e8",
  muted: "#6b7a90",
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function InfoLine({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 1.1, alignItems: "baseline" }}>
      <Typography sx={{ fontWeight: 900, color: COLORS.title, minWidth: 132 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#1c2b39" }}>{value ?? "-"}</Typography>
    </Box>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("el-GR");
}

function ReviewCard({ item }) {
  const ratingNum = Number(item?.rating ?? 0);

  return (
    <Paper
      elevation={0}
      sx={{
        width: 180,
        minWidth: 180,
        height: 140,
        borderRadius: 2,
        bgcolor: "#eef2f6",
        border: "1px solid rgba(13,44,84,0.12)",
        p: 1.2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#1c2b39" }}>
          {ratingNum.toFixed(1)}
        </Typography>
        <Rating value={ratingNum} precision={0.1} size="small" readOnly />
      </Box>

      <Typography
        sx={{
          fontSize: 12,
          color: "#1c2b39",
          mt: 1,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item?.text || "—"}
      </Typography>

      <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 1 }}>
        {item?.name ? `${item.name}` : "—"}
        {item?.date ? ` — ${formatDate(item.date)}` : ""}
      </Typography>
    </Paper>
  );
}

/**
 * ✅ Shared Profile Page
 * role: "owner" | "vet"
 */
export default function Profile({ role = "owner" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ reviews state (για vet)
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  

  // ✅ Load PROFILE (owner από /api/users/:id, vet από /db.json -> vets[])
 useEffect(() => {
  let alive = true;

  (async () => {
    setErr("");

    if (!user?.id) {
      if (!alive) return;
      setDbUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (role === "vet") {
        // 🔁 αν έχεις api, καλύτερα: /api/vets/:id
        // const vet = await fetchJSON(`/api/vets/${encodeURIComponent(String(user.id))}`);

        const res = await fetch("/db.json");
        if (!res.ok) throw new Error(`HTTP ${res.status} on /db.json`);
        const json = await res.json();

        const vet = (json?.vets || []).find((v) => String(v.id) === String(user.id));
        if (!vet) throw new Error("Δεν βρέθηκε κτηνίατρος");

        if (!alive) return;
        setDbUser(vet);
      } else {
        const data = await fetchJSON(`/api/users/${encodeURIComponent(String(user.id))}`);
        if (!alive) return;
        setDbUser(data);
      }
    } catch (e) {
      console.error(e);
      if (!alive) return;

      setErr(
        role === "vet"
          ? "Αποτυχία φόρτωσης στοιχείων κτηνιάτρου."
          : "Αποτυχία φόρτωσης προφίλ από τον server."
      );
      setDbUser(null);
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [user?.id, role]);



  // ✅ Load REVIEWS (μόνο για vet) από /db.json -> reviews[]
 useEffect(() => {
  let alive = true;

  (async () => {
    if (role !== "vet") return;
    if (!dbUser?.id) return;

    try {
      setReviewsLoading(true);

      const res = await fetch("/db.json");
      if (!res.ok) throw new Error("Failed to load db.json");
      const json = await res.json();

      const vetReviews = (json?.reviews || [])
        .filter((r) => String(r?.vetId) === String(dbUser.id))
        .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));

      // ✅ DEBUG (βοηθάει πολύ)
      console.log("Vet ID:", dbUser.id, "Total reviews:", (json?.reviews || []).length, "Matched:", vetReviews.length);

      if (!alive) return;
      setReviews(vetReviews);
    } catch (e) {
      console.error(e);
      if (!alive) return;
      setReviews([]);
    } finally {
      if (alive) setReviewsLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [role, dbUser?.id]);


  const profile = useMemo(() => {
    if (role === "vet") {
      const v = dbUser || {};
      const list = Array.isArray(reviews) ? reviews : [];

      const ratingValue = list.length
        ? list.reduce((s, r) => s + Number(r?.rating || 0), 0) / list.length
        : Number(v?.rating ?? 0);

      const ratingCount = list.length
        ? list.length
        : Number(v?.reviewsCount ?? v?.ratingCount ?? 0);

      return {
        // base
        fullName: v?.name ?? "-",
        phone: v?.phone ?? "-",
        address: v?.address ?? "-",
        email: v?.email ?? "-",
        photoUrl: v?.photo ?? v?.photoUrl ?? "",
        role: "vet",

        // vet extras
        clinic: v?.clinic ?? v?.clinicName ?? "Κλινική μικρών ζώων",
        gender: v?.gender ?? v?.sex ?? "-",
        experience: v?.experience ?? "-",
        studies: v?.studies ?? "-",
        ratingValue: Number.isFinite(ratingValue) ? ratingValue : 0,
        ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
        reviews: list,
      };
    }

    // ✅ owner
    const u = dbUser || user;
    return {
      fullName: u?.name ?? "-",
      phone: u?.phone ?? "-",
      address: u?.address ?? "-",
      email: u?.email ?? "-",
      photoUrl: u?.photoUrl ?? "",
      role: u?.role ?? user?.role ?? "owner",
    };
  }, [dbUser, user, role, reviews]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Αν δεν είναι logged in
  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
        }}
      >
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

  const isVet = role === "vet";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      <PublicNavbar />

      <Box
        sx={{
          flex: 1,
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
        {/* spacer για fixed sidebar */}
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />

        {/* σωστό sidebar */}
        {isVet ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}

        {/* content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <AppBreadcrumbs />

            {/* ✅ VET UI */}
            {isVet ? (
              <Box sx={{ mt: 2 }}>
                {/* MAIN PROFILE CARD */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    bgcolor: COLORS.panelBg,
                    border: `2px solid ${COLORS.panelBorder}`,
                    boxShadow: "0 10px 22px rgba(0,0,0,0.16)",
                    p: { xs: 2, sm: 2.4 },
                  }}
                >
                  {loading ? (
                    <Typography sx={{ fontWeight: 800, color: "#1c2b39" }}>
                      Φόρτωση προφίλ...
                    </Typography>
                  ) : (
                    <>
                      {err && (
                        <Typography
                          sx={{ fontWeight: 900, color: "#b00020", mb: 2 }}
                        >
                          {err}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" },
                          gap: 2.2,
                          alignItems: "start",
                        }}
                      >
                        {/* photo */}
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1.5px solid rgba(13,44,84,0.35)",
                            bgcolor: "rgba(255,255,255,0.65)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {profile.photoUrl ? (
                            <Box
                              component="img"
                              src={profile.photoUrl}
                              alt="Φωτογραφία"
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Typography
                              sx={{ fontWeight: 900, color: COLORS.title }}
                            >
                              Φωτο
                            </Typography>
                          )}
                        </Box>

                        {/* name + clinic + rating */}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: "#0b1220",
                              fontSize: 18,
                            }}
                          >
                            {profile.fullName}
                          </Typography>

                          <Typography
                            sx={{
                              color: "#1c2b39",
                              fontWeight: 700,
                              mt: 0.4,
                            }}
                          >
                            {profile.clinic}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Rating
                              value={profile.ratingValue}
                              precision={0.1}
                              readOnly
                              size="small"
                            />
                            <Typography
                              sx={{ fontWeight: 900, color: "#1c2b39" }}
                            >
                              {Number(profile.ratingValue ?? 0).toFixed(1)}
                            </Typography>
                            <Typography sx={{ color: COLORS.muted }}>
                              ({profile.ratingCount})
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* details 2 columns */}
                      <Box
                        sx={{
                          mt: 2.4,
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                          columnGap: 6,
                          rowGap: 0.5,
                        }}
                      >
                        <Box>
                          <InfoLine label="Τηλέφωνο:" value={profile.phone} />
                          <InfoLine
                            label="Ιδιωτικό Ιατρείο:"
                            value={profile.address}
                          />
                          <InfoLine label="Email:" value={profile.email} />
                        </Box>

                        <Box>
                          <InfoLine label="Φύλο:" value={profile.gender} />
                          <InfoLine
                            label="Εμπειρία:"
                            value={profile.experience}
                          />
                          <InfoLine label="Σπουδές:" value={profile.studies} />
                        </Box>
                      </Box>
                    </>
                  )}
                </Paper>

                {/* REVIEWS CARD */}
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "2px solid rgba(143,180,232,0.70)",
                    boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                    p: { xs: 2, sm: 2.2 },
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 900, color: COLORS.title, mb: 1.4 }}
                  >
                    Αξιολογήσεις
                  </Typography>

                  {reviewsLoading ? (
                    <Typography sx={{ color: COLORS.muted, fontWeight: 800 }}>
                      Φόρτωση αξιολογήσεων...
                    </Typography>
                  ) : (profile.reviews || []).length === 0 ? (
                    <Typography sx={{ color: COLORS.muted, fontWeight: 800 }}>
                      Δεν υπάρχουν ακόμα αξιολογήσεις.
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                        pb: 0.6,
                        "&::-webkit-scrollbar": { height: 8 },
                      }}
                    >
                      {(profile.reviews || []).slice(0, 5).map((r) => (
                        <ReviewCard key={r.id ?? `${r.name}-${r.date}`} item={r} />
                      ))}
                    </Box>
                  )}


                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.6 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/vet/profile/${dbUser?.id}/reviews`)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        borderColor: "rgba(13,44,84,0.25)",
                        color: "#0d2c54",
                        bgcolor: "#f6f9ff",
                        "&:hover": {
                          bgcolor: "#eef5ff",
                          borderColor: "rgba(13,44,84,0.35)",
                        },
                      }}
                    >
                      Περισσότερα
                    </Button>
                  </Box>
                </Paper>

                {/* logout */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.2 }}>
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
                      fontWeight: 900,
                    }}
                  >
                    Αποσύνδεση
                  </Button>
                </Box>
              </Box>
            ) : (
              /* OWNER UI */
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
                    <Typography sx={{ fontWeight: 800, color: "#1c2b39" }}>
                      Φόρτωση προφίλ...
                    </Typography>
                  ) : (
                    <>
                      {err && (
                        <Typography
                          sx={{ fontWeight: 900, color: "#b00020", mb: 2 }}
                        >
                          {err}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "140px 1fr",
                          gap: 3,
                          alignItems: "start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: 1,
                            bgcolor: "rgba(255,255,255,0.45)",
                            border: "1.5px solid rgba(13,44,84,0.35)",
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
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 800 }}>
                              Φωτογραφία
                            </Typography>
                          )}
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: "#000",
                              fontSize: 18,
                              mt: 1,
                            }}
                          >
                            {profile.fullName}
                          </Typography>
                          <Typography
                            sx={{ color: "#1c2b39", fontWeight: 700, mt: 0.4 }}
                          >
                            Ρόλος: {profile.role}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 4 }}>
                        <Divider sx={{ mb: 2, opacity: 0.5 }} />
                        <InfoLine label="Τηλέφωνο:" value={profile.phone} />
                        <InfoLine label="Διεύθυνση:" value={profile.address} />
                        <InfoLine label="Email:" value={profile.email} />
                      </Box>
                    </>
                  )}
                </Paper>

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
                      fontWeight: 900,
                    }}
                  >
                    Αποσύνδεση
                  </Button>
                </Box>
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
