import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography, Divider } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";
import { useAuth } from "../../auth/AuthContext";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const BORDER = "#8fb4e8";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

/** ✅ Tabs όπως screenshot (ίδιο στυλ/μορφή) */
function TabPill({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 3.4,
          py: 1.8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          bgcolor: active ? PRIMARY : "#cfd6e6",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
          userSelect: "none",
          "&:hover": { bgcolor: active ? PRIMARY : "#bcc6da" },
          transition: "all .15s",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function VetShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        {/* spacer ώστε το content να μην πάει κάτω από fixed sidebar */}
        <Box
          sx={{
            width: VET_SIDEBAR_W,
            flex: `0 0 ${VET_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
          }}
        />

        <VetNavbar mode="navbar" />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}

/* ------------------ helpers που ζήτησες να χρησιμοποιήσουμε ------------------ */
function fmtShort(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function routeForNotification(n) {
  // ✅ αν υπάρχει foundDeclarationId -> πάντα στο vet found details
  if (n?.foundDeclarationId) return `/vet/found/${n.foundDeclarationId}`;

  if (n?.refType === "appointment" && n?.refId) return `/vet/appointments/${n.refId}`;

  if (n?.link) return n.link;
  return "";
}

// ✅ συμβατό με isRead + readAt
function isUnread(n) {
  if (n?.readAt) return false;
  if (typeof n?.isRead === "boolean") return n.isRead === false;
  return true;
}

/* ------------------ FALLBACK API (αν δεν έχεις services) ------------------ */
/* Αν έχεις ήδη listNotifications/markAllRead/markNotificationRead, σβήσε αυτό το block. */
async function listNotifications({ userId, limit = 200 }) {
  // json-server: /notifications?userId=...&_sort=createdAt&_order=desc&_limit=...
  try {
    const q = new URLSearchParams();
    if (userId) q.set("userId", String(userId));
    q.set("_sort", "createdAt");
    q.set("_order", "desc");
    q.set("_limit", String(limit));
    return await fetchJSON(`/api/notifications?${q.toString()}`);
  } catch {
    return [];
  }
}

async function markNotificationRead(id) {
  return fetchJSON(`/api/notifications/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true, readAt: new Date().toISOString() }),
  });
}

async function markAllRead(userId) {
  // json-server δεν έχει bulk endpoint -> κάνουμε patch 1-1
  const items = await listNotifications({ userId, limit: 500 });
  const unread = (Array.isArray(items) ? items : []).filter(isUnread);
  await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => null)));
}

/* ------------------ LatestUpdates component (όπως το έδωσες) ------------------ */
function LatestUpdates({ limit = 8 }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const uid = useMemo(() => String(user?.id ?? user?.user?.id ?? ""), [user]);

  const [allItems, setAllItems] = useState([]); // ⬅️ ΟΛΑ τα notifications (τελευταία)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const unreadCount = useMemo(
    () => (Array.isArray(allItems) ? allItems.filter(isUnread).length : 0),
    [allItems]
  );

  const pageCount = useMemo(() => {
    const total = Array.isArray(allItems) ? allItems.length : 0;
    return Math.max(1, Math.ceil(total / limit));
  }, [allItems, limit]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return (Array.isArray(allItems) ? allItems : []).slice(start, start + limit);
  }, [allItems, page, limit]);

  async function load() {
    if (!uid) {
      setLoading(true);
      return;
    }

    setLoading(true);
    try {
      const data = await listNotifications({ userId: uid, limit: 200 });
      const normalizeId = (v) => String(v ?? "").replace(/^u_/, "");

      const all = Array.isArray(data) ? data : [];

      // μόνο του χρήστη
      const mine = all.filter((n) => normalizeId(n?.userId) === normalizeId(uid));

      const onlyAppointments = mine.filter(
        (n) =>
            n?.refType === "appointment" || n?.type === "appointment_pending" || n?.type === "error"
            
        );

      // newest first
      const sorted = [...onlyAppointments].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      );

      setAllItems(sorted);
    } catch (e) {
      console.error(e);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [uid]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, limit]);

  async function onClickItem(n) {
    if (isUnread(n)) {
      if (n?.readAt !== undefined) {
        const updated = await markNotificationRead(n.id);
        setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updated } : x)));
      } else {
        await fetchJSON(`/api/notifications/${encodeURIComponent(String(n.id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      }
    }

    const to = routeForNotification(n);
    if (to) navigate(to);
  }

  async function onMarkAll() {
    if (!uid) return;
    await markAllRead(uid);
    await load();
    setPage(1);
  }

  return (
    <Box sx={{ mt: 0.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
        <Typography sx={{ fontWeight: 900, color: TITLE }}>
          Τελευταίες Ενημερώσεις
          {unreadCount > 0 ? (
            <Typography component="span" sx={{ ml: 1, color: PRIMARY, fontWeight: 900 }}>
              ({unreadCount})
            </Typography>
          ) : null}
        </Typography>

        {allItems.length > 0 && unreadCount > 0 && (
          <Button
            onClick={onMarkAll}
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              bgcolor: PRIMARY,
              "&:hover": { bgcolor: PRIMARY_HOVER },
              fontWeight: 900,
            }}
          >
            Όλα ως διαβασμένα
          </Button>
        )}
      </Stack>

      {/* ✅ Εδώ το κάνουμε να μοιάζει με τη φωτο: λευκά κουτιά, bullets */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
        {loading ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "2px solid #c7d4e8",
              bgcolor: "#fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
          </Paper>
        ) : allItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "2px solid #c7d4e8",
              bgcolor: "#fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Typography sx={{ color: MUTED, fontWeight: 700 }}>
              Δεν έχετε καινούριες ενημερώσεις.
            </Typography>
          </Paper>
        ) : (
          <>
            {pageItems.map((n) => {
              const unread = isUnread(n);
              return (
                <Paper
                  key={n.id}
                  elevation={0}
                  onClick={() => onClickItem(n)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "2px solid #c7d4e8",
                    bgcolor: "#fff",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    "&:hover": { transform: "translateY(-1px)" },
                    transition: "all .12s",
                  }}
                >
                  <Typography
                    sx={{
                      color: unread ? "#1c2b39" : MUTED,
                      fontWeight: unread ? 900 : 700,
                      fontSize: 14,
                      lineHeight: 1.25,
                    }}
                  >
                    • {fmtShort(n.createdAt)} – {n.message || n.title || "Ενημέρωση"}
                  </Typography>
                </Paper>
              );
            })}

            <Pager page={page} pageCount={pageCount} onChange={setPage} color={PRIMARY} maxButtons={4} />
          </>
        )}
      </Box>
    </Box>
  );
}

/* ------------------ Page ------------------ */
export default function VetAppointmentsUpdates() {
  const { pathname } = useLocation();

  const TABS = useMemo(
    () => [
      { label: "Ραντεβού", to: "/vet/appointments/VetAppointments" },
      { label: "Αιτήματα", to: "/vet/appointments/VetAppointmentsRequests" },
      { label: "Ενημερώσεις", to: "/vet/appointments/VetAppointmentsUpdates" },
      { label: "Διαθεσιμότητα", to: "/vet/appointments/VetAppointmentsAvailability" },
    ],
    []
  );

  return (
    <VetShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <AppBreadcrumbs />

        {/* ✅ Tabs */}
        <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
          {TABS.map((t) => (
            <TabPill key={t.to} label={t.label} to={t.to} active={pathname === t.to} />
          ))}
        </Stack>

        {/* ✅ ίδια κεντρική κάρτα, άλλο περιεχόμενο */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 2,
            borderRadius: 2,
            border: `2px solid ${BORDER}`,
            boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
            p: 2,
            minHeight: 520,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 18, mb: 1 }}>
            Ενημερώσεις
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* ✅ Εδώ μπαίνει το νέο περιεχόμενο */}
          <LatestUpdates limit={5} />
        </Paper>
      </Container>
    </VetShell>
  );
}
