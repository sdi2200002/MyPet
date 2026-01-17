import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import { useAuth } from "../../auth/AuthContext";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import VetNavbar , { VET_SIDEBAR_W }from "../../components/VetNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import {
  listNotifications,
  markAllRead,
  markNotificationRead,
} from "../../api/notifications";

import Pager from "../../components/Pager";


const PETS_KEY = "mypet_vet_pets";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";


function QuickAction({ icon, title, text, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%",
        height: 410,
        borderRadius: 2,
        bgcolor: "#fff",
        border: "2px solid #3b3b3b",
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: PANEL_BG,
          borderBottom: "2px solid #3b3b3b",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ p: 1.4 }}>
        <Typography sx={{ mt: 2, fontWeight: 900, color: PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "#4b5b6b", textAlign: "center" }}>
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}


function fmtShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit" });
}

function routeForNotification(n, role = "vet") {
  // 0) αν υπάρχει έτοιμο link από backend, σεβάσου το
  if (typeof n?.link === "string" && n.link.trim()) {
    return { to: n.link.trim() };
  }

  // 1) “Κάποιος βρήκε…”: ΠΗΓΑΙΝΕ ΣΤΟ PUBLIC /found/:id (όχι /vet/found)
  if (n?.foundDeclarationId) {
    return { to: `/found/${encodeURIComponent(String(n.foundDeclarationId))}` };
  }

  // 2) Appointments / Pets (μόνο αν έχεις αυτά τα routes)
  if (n?.refType === "appointment" && n?.refId) {
    return { to: `/${role}/appointments/${encodeURIComponent(String(n.refId))}` };
  }
  if (n?.refType === "pet" && n?.refId) {
    return { to: `/${role}/pets/${encodeURIComponent(String(n.refId))}` };
  }

  // 3) Lost / Found δηλώσεις: PUBLIC routes
  if ((n?.refType === "lostDeclaration" || n?.refType === "lost") && n?.refId) {
    return { to: `/lost/${encodeURIComponent(String(n.refId))}` };
  }
  if ((n?.refType === "foundDeclaration" || n?.refType === "found") && n?.refId) {
    return { to: `/found/${encodeURIComponent(String(n.refId))}` };
  }

  // 4) ΝΕΟ: adoption / foster / transfer (wizard routes)
  // θα χρησιμοποιήσουμε declarationId αν υπάρχει, αλλιώς refId
  const kind = n?.meta?.kind;
  const declId = n?.meta?.declarationId ?? n?.refId;

  if (declId && (kind === "adoption" || n?.refType === "adoptionDeclaration" || n?.type === "adoption_submitted")) {
    return {
      to: `/${role}/declarations/adoption/new`,
      state: { draftId: String(declId), step: 3 },
    };
  }

  if (declId && (kind === "foster" || n?.refType === "fosterDeclaration" || n?.type === "foster_submitted")) {
    return {
      to: `/${role}/declarations/foster/new`,
      state: { draftId: String(declId), step: 3 },
    };
  }

  if (declId && (kind === "transfer" || n?.refType === "transferDeclaration" || n?.type === "transfer_submitted")) {
    return {
      to: `/${role}/declarations/transfer/new`,
      state: { draftId: String(declId), step: 3 },
    };
  }

  return { to: "" };
}

<<<<<<< HEAD
=======
function routeForNotification(n) {
  // ✅ αν υπάρχει foundDeclarationId -> πάντα στο vet found details
  if (n?.foundDeclarationId) return `/vet/found/${n.foundDeclarationId}`;

  if (n?.refType === "appointment" && n?.refId) return `/vet/appointments/${n.refId}`;
  if (n?.refType === "pet" && n?.refId) return `/vet/pets/${n.refId}/booklet`;

  // ✅ LOST: πήγαινε στο PUBLIC route που υπάρχει
  if ((n?.refType === "lostDeclaration" || n?.refType === "lost") && n?.refId)
    return `/lost/${n.refId}`;

  // ✅ FOUND: vet route (υπάρχει)
  if (n?.refType === "found" && n?.refId) return `/vet/found/${n.refId}`;

  if (n?.link) return n.link;

  return "";
}
>>>>>>> a8b504fdfde4c07bbb67575c69679b81ce644d45


// ✅ συμβατό με isRead + readAt
function isUnread(n) {
  if (n?.readAt) return false;
  if (typeof n?.isRead === "boolean") return n.isRead === false;
  return true;
}

function LatestUpdates({ limit = 5 }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const uid = useMemo(() => String(user?.id ?? user?.user?.id ?? ""), [user]);

  const [allItems, setAllItems] = useState([]);   // ⬅️ ΟΛΑ τα notifications (τελευταία)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);            // ⬅️ σελίδα

  const unreadCount = useMemo(
    () => (Array.isArray(allItems) ? allItems.filter(isUnread).length : 0),
    [allItems]
  );

  const pageCount = useMemo(() => {
    const total = Array.isArray(allItems) ? allItems.length : 0;
    return Math.max(1, Math.ceil(total / limit));
  }, [allItems, limit]);

  // ⬅️ items που θα εμφανιστούν στην τρέχουσα σελίδα
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
      const data = await listNotifications({ userId: uid, limit: 200 }); // φέρνουμε πολλά
      const normalizeId = (v) => String(v ?? "").replace(/^u_/, "");

      const all = Array.isArray(data) ? data : [];

      // μόνο του χρήστη
      const mine = all.filter((n) => normalizeId(n?.userId) === normalizeId(uid));

      // newest first
      const sorted = [...mine].sort(
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

  // όταν αλλάζει user -> σελίδα 1
  useEffect(() => {
    setPage(1);
  }, [uid]);

  // αν μειωθούν items και η σελίδα βγει εκτός -> φέρ' την μέσα
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
  // 1) mark as read (όπως το έχεις)
  if (isUnread(n)) {
    if (n?.readAt !== undefined) {
      const updated = await markNotificationRead(n.id);
      setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updated } : x)));
    } else {
      await fetch(`/api/notifications/${encodeURIComponent(String(n.id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setAllItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  }

  // 2) navigate (ΑΥΤΟ είναι που έλειπε / δεν “έβρισκε” route)
  const { to, state } = routeForNotification(n, "vet"); // <- role εδώ "vet"
  if (to) {
    navigate(to, state ? { state } : undefined);
  }
}


  async function onMarkAll() {
    if (!uid) return;
    await markAllRead(uid);
    await load();
    setPage(1);
  }

  return (
    <Box sx={{ mt: 3 }}>
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

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#eef5ff",
          borderRadius: 3,
          p: 2.2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
        ) : allItems.length === 0 ? (
          <Typography sx={{ color: MUTED, fontWeight: 700 }}>Δεν έχετε καινούριες ενημερώσεις.</Typography>
        ) : (
          <>
            <Stack spacing={1.2}>
              {pageItems.map((n) => {
                const unread = isUnread(n);
                return (
                  <Box
                    key={n.id}
                    onClick={() => onClickItem(n)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <Typography
                      sx={{
                        color: unread ? "#1c2b39" : MUTED,
                        fontWeight: unread ? 900 : 700,
                        fontSize: 13.5,
                        lineHeight: 1.25,
                      }}
                    >
                      • {fmtShort(n.createdAt)} — {n.message || n.title || "Ενημέρωση"}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            {/* ✅ Pager */}
            <Pager
              page={page}
              pageCount={pageCount}
              onChange={(p) => setPage(p)}
              maxButtons={4}
              color={PRIMARY}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <PublicNavbar />

      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#eaf2fb",
          height: { xs: 230, md: 240 },
          position: "relative",
          overflow: "visible",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container maxWidth="lg" sx={{ height: "100%", position: "relative" }}>
          <Box>
            <AppBreadcrumbs />
          </Box>
          <Box sx={{ pt: { xs: 7, md: 3 } }}>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  fontWeight: 900,
                  color: "#1c2b39",
                  lineHeight: 1.1,
                }}
              >
                Ό,τι χρειάζεστε για τα κατοικίδια 
                <br />
                που παρακολουθείτε.
              </Typography>

              <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                Καταγραφή ζώων, ιατρικές πράξεις και ραντεβού με ένα κλικ.
              </Typography>
            </Box>
          </Box>
        </Container>

        <Box
          component="img"
          src="/images/vet.png"
          alt="Vet"
          sx={{
            position: "absolute",
            right: 200,
            bottom: 0,
            width: { xs: 300, md: 220},
            height: "auto",
            display: { xs: "none", md: "block" },
          }}
        />
      </Box>
      <Box sx={{ display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        <Box sx={{ width: VET_SIDEBAR_W, flex: `0 0 ${VET_SIDEBAR_W}px`, display: { xs: "none", lg: "block" }, alignSelf: "flex-start" }}>
          <Box sx={{ position: "sticky", top: 16, maxHeight: "calc(100vh - 16px)" }}>
            <VetNavbar mode="hero" />
          </Box>
        </Box>
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>

          {/* TOP SECTION */}
          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: { xs: "1fr"},
              gap: 3,
              alignItems: "center",
            }}
          >
            
            {/* Center: quick actions */}
            <Box sx={{ pt: 0.2 }}>
              <Typography sx={{ fontWeight: 900, color: TITLE, mb: 6.5, fontSize: 20, textAlign: "center" }}>
                Γρήγορες Ενέργειες
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                <QuickAction
                  icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Απώλειας"
                  text="Καταχωρήστε την απώλεια του κατοικιδίου που παρακολουθείτε για άμεση ενημέρωση."
                  onClick={() => navigate("/vet/declarations/lost/new")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Εύρεσης"
                  text="Καταχωρήστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                  onClick={() => navigate("/vet/declarations/found/new")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Νέα Καταγραφή Κατοικιδίου"
                  text="Καταγράψτε τα στοιχεία νέου κατοικιδίου που παρακολουθείτε"
                  onClick={() => navigate("/vet/declarations")}
                />
                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Ιατρικές Πράξεις"
                  text="Καταχωρήστε τα στοιχεία των ιατρικών πράξεων που πραγματοποιούνται στο κατοικίδιο που επιθυμείτε."
                  onClick={() => navigate("/vet/declarations")}
                />
              </Stack>
            </Box>
          </Box>

          {/* SCROLL PART */}
          <Box sx={{ mt: 4 }}>
            <LatestUpdates />
          </Box>
        </Container>
      </Box>
      </Box>

      <Footer />
    </Box>
  );

}
