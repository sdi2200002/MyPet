import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Tabs,
  Tab,
  Typography,
  Divider,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function fmtDate(isoOrYmd) {
  if (!isoOrYmd) return "—";
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("el-GR");
}

function StatusChip({ status }) {
  const label = status || "Πρόχειρη";
  const color =
    label === "Οριστική"
      ? "success"
      : label === "Βρέθηκε"
      ? "success"
      : label === "Ακυρωμένη"
      ? "default"
      : "warning";
  return <Chip size="small" label={label} color={color} variant="filled" />;
}

function typeLabel(type) {
  if (type === "lost") return "Δήλωση Απώλειας";
  if (type === "found") return "Δήλωση Εύρεσης";
  if (type === "registration") return "Εγγραφή Κατοικιδίου";
  if (type === "adoption") return "Υιοθεσία Κατοικιδίου";
  if (type === "foster") return "Αναδοχή Κατοικιδίου";
  if (type === "transfer") return "Μεταβίβαση Κατοικιδίου";
  return "Δήλωση";
}

function Row({ item, onPreview, onEdit, onDelete, onMarkFound, roleUserId })  {
  const status = item?.status || "Πρόχειρη";
  const canEdit = status === "Πρόχειρη";

  // ✅ "Βρέθηκε" μόνο για owner, μόνο για lost, μόνο όταν είναι Οριστική
  const canMarkFound =
    item?.type === "lost" &&
    status === "Οριστική" &&
    String(item?.finderId || "") === String(roleUserId || "");

  


  const mainTitle = item?.petName || item?.species || "Κατοικίδιο";
  const isLostOrFound = item?.type === "lost" || item?.type === "found";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        bgcolor: "white",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        {/* left */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #d5deeb",
              flex: "0 0 auto",
              bgcolor: "#eef1f4",
              display: "grid",
              placeItems: "center",
            }}
          >
            {item?.photoDataUrl ? (
              <Box
                component="img"
                src={item.photoDataUrl}
                alt="pet"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Typography sx={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>
                Χωρίς φωτο
              </Typography>
            )}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 900, color: TITLE }} noWrap>
                {mainTitle}
              </Typography>

              <Typography sx={{ fontSize: 12, color: MUTED }}>
                {typeLabel(item?.type)}
              </Typography>

              <StatusChip status={status} />
            </Stack>

            <Typography sx={{ fontSize: 12, color: TITLE, mt: 0.4 }}>
              {isLostOrFound ? (
                <>
                  Περιοχή: <b>{item?.area || "—"}</b>
                  <br />
                  Ημ. {item?.type === "lost" ? "Απώλειας" : "Εύρεσης"}:{" "}
                  <b>{fmtDate(item?.date)}</b>
                </>
              ) : (
                <>
                  Microchip: <b>{item?.microchip || "—"}</b>
                  <br />
                  
                </>
              )}
            </Typography>
          </Box>
        </Stack>

        {/* right */}
        <Stack direction="column" spacing={1} alignItems="flex-end">
          <Typography
            sx={{
              fontSize: 12,
              color: TITLE,
              mr: 1,
              display: { xs: "none", md: "block" },
            }}
          >
            Υποβλήθηκε: {item?.createdAt ? fmtDate(item.createdAt) : "—"}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {canMarkFound && (
              <Button
                onClick={() => onMarkFound(item)}
                variant="outlined"
                startIcon={<CheckCircleOutlineRoundedIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "#2e7d32",
                  color: "#2e7d32",
                  fontWeight: 900,
                  "&:hover": {
                    borderColor: "#1b5e20",
                    color: "#1b5e20",
                    bgcolor: "rgba(46,125,50,0.06)",
                  },
                }}
              >
                Βρέθηκε
              </Button>
            )}

              <Button
              onClick={() => onPreview(item)}
              variant="contained"
              startIcon={<VisibilityOutlinedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
              }}
            >
              Προβολή
            </Button>

            {canEdit && (
              <Button
                onClick={() => onDelete(item)}
                variant="contained"
                startIcon={<DeleteOutlineOutlinedIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#d32f2f",
                  fontWeight: 900,
                  "&:hover": { bgcolor: "#b71c1c" },
                }}
              >
                Διαγραφή
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * ✅ Shared page
 * role: "owner" | "vet"
 */
export default function MyDeclarations({ role = "owner" }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const base = role === "vet" ? "/vet" : "/owner";
  const roleUserId = useMemo(() => String(user?.id ?? user?.user?.id ?? ""), [user]);
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const [tab, setTab] = useState(0); // 0 submitted, 1 drafts
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);
  const [registration, setRegistration] = useState([]);
  const [adoption, setAdoption] = useState([]);
  const [foster, setFoster] = useState([]);
  const [transfer, setTransfer] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Pagination
  const rowsPerPage = 5;          // άλλαξε το αν θες (π.χ. 3/5/6)
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!user?.id) {
        if (!alive) return;
        setLost([]);
        setFound([]);
        setAdoption([]);
        setFoster([]);
        setTransfer([]);
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setLoading(false);
        return;
      }

      try {
        const uid = encodeURIComponent(String(user.id));

        const baseReqs = [
          fetchJSON(`/api/lostDeclarations?finderId=${uid}`),
          fetchJSON(`/api/foundDeclarations?finderId=${uid}`),
        ];

        const vetReqs =
          role === "vet"
            ? [
                fetchJSON(`/api/registrationDeclarations?vetId=${uid}`),
                fetchJSON(`/api/adoptionDeclarations?vetId=${uid}`),
                fetchJSON(`/api/fosterDeclarations?vetId=${uid}`),
                fetchJSON(`/api/transferDeclarations?vetId=${uid}`),
              ]
            : [];

        const [lostData, foundData, registrationData, adoptionData, fosterData, transferData] =
          await Promise.all([...baseReqs, ...vetReqs]);

        if (!alive) return;

        setLost((Array.isArray(lostData) ? lostData : []).map((x) => ({ ...x, type: "lost" })));
        setFound((Array.isArray(foundData) ? foundData : []).map((x) => ({ ...x, type: "found" })));

        if (role === "vet") {
          setRegistration((Array.isArray(registrationData) ? registrationData : []).map((x) => ({ ...x, type: "registration" })));
          setAdoption((Array.isArray(adoptionData) ? adoptionData : []).map((x) => ({ ...x, type: "adoption" })));
          setFoster((Array.isArray(fosterData) ? fosterData : []).map((x) => ({ ...x, type: "foster" })));
          setTransfer((Array.isArray(transferData) ? transferData : []).map((x) => ({ ...x, type: "transfer" })));
        } else {
          setRegistration([]);
          setAdoption([]);
          setFoster([]);
          setTransfer([]);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Αποτυχία φόρτωσης δηλώσεων από τον server.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id, role]); // ✅ βάλαμε role

  const all = useMemo(() => {
    const merged =
      role === "vet"
        ? [...lost, ...found, ...registration, ...adoption, ...foster, ...transfer]
        : [...lost, ...found];

    merged.sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return tb - ta;
    });
    return merged;
  }, [lost, found, registration, adoption, foster, transfer, role]);

  const filtered = useMemo(() => {
    const s = (x) => x?.status || "Πρόχειρη";
    if (tab === 0) return all.filter((x) => s(x) === "Οριστική" || s(x) === "Βρέθηκε");
    return all.filter((x) => s(x) !== "Οριστική" && s(x) !== "Βρέθηκε");
  }, [all, tab]);

  // ✅ Page count + rows της τρέχουσας σελίδας
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / rowsPerPage)),
    [filtered.length, rowsPerPage]
  );

  // όταν αλλάζει tab, γύρνα στη σελίδα 1
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // αν μειωθεί ο αριθμός σελίδων (π.χ. ακύρωση), διόρθωσε page
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleCreate = () => {
    navigate(`${base}/declarations/new`);
  };

  const handlePreview = (item) => {
    const status = item?.status || "Πρόχειρη";

    // public pages για οριστικές/βρέθηκε (μόνο lost/found)
    if ((status === "Οριστική" || status === "Βρέθηκε") && item.type === "lost") {
      navigate(`/lost/${encodeURIComponent(String(item.id))}`);
      return;
    }
    if ((status === "Οριστική" || status === "Βρέθηκε") && item.type === "found") {
      navigate(`/found/${encodeURIComponent(String(item.id))}`);
      return;
    }

    // drafts -> στο wizard
    if (status === "Πρόχειρη" && item.type === "lost") {
      navigate(`${base}/declarations/lost/new`, { state: { draftId: item.id, step: 2 } });
      return;
    }
    if (status === "Πρόχειρη" && item.type === "found") {
      navigate(`${base}/declarations/found/new`, { state: { draftId: item.id, step: 2 } });
      return;
    }

    if (status === "Πρόχειρη" && item.type === "registration") {
      navigate(`${base}/declarations/newPet/new`, { state: { draftId: item.id } });
      return;
    }

    if (item.type === "registration") {
      navigate(`${base}/declarations/registration/${encodeURIComponent(String(item.id))}`);
      return;
    }
    // ✅ adoption/foster/transfer -> wizard preview
    if (item.type === "adoption") {
      navigate(`${base}/declarations/adoption/${encodeURIComponent(String(item.id))}`);
      return;
    }
    if (item.type === "foster") {
      navigate(`${base}/declarations/foster/${encodeURIComponent(String(item.id))}`);
      return;
    }
    if (item.type === "transfer") {
      navigate(`${base}/declarations/transfer/${encodeURIComponent(String(item.id))}`);
      return;
    }

    alert("Η δήλωση δεν είναι διαθέσιμη για προβολή.");
  };

  // ✅ ΝΕΟ: "Βρέθηκε" = ΔΙΑΓΡΑΦΗ της lost δήλωσης (από DB + από λίστα)
  const handleMarkFound = async (item) => {
    const ok = confirm(
      "Με το «Βρέθηκε» θα διαγραφεί η δήλωση απώλειας και δεν θα εμφανίζεται πλέον πουθενά. Συνέχεια;"
    );
    if (!ok) return;

    try {
      // Σβήνουμε από τον json-server
      await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(item.id))}`, {
        method: "DELETE",
      });

      // Σβήνουμε από τη λίστα (state)
      setLost((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ολοκλήρωσης. Δοκίμασε ξανά.");
    }
  };



  const handleDelete = async (item) => {
    const ok = confirm("Θες σίγουρα να διαγράψεις τη δήλωση;");
    if (!ok) return;

    try {
      if (item.type === "found") {
        await fetchJSON(`/api/foundDeclarations/${encodeURIComponent(String(item.id))}`, {
          method: "DELETE",
        });
        setFound((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
        return;
      }

      if (item.type === "lost") {
        await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(item.id))}`, {
          method: "DELETE",
        });
        setLost((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
        return;
      }

      // ✅ adoption/foster/transfer delete
      if (item.type === "adoption") {
        await fetchJSON(`/api/adoptionDeclarations/${encodeURIComponent(String(item.id))}`, {
          method: "DELETE",
        });
        setAdoption((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
        return;
      }

      if (item.type === "foster") {
        await fetchJSON(`/api/fosterDeclarations/${encodeURIComponent(String(item.id))}`, {
          method: "DELETE",
        });
        setFoster((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
        return;
      }

      if (item.type === "transfer") {
        await fetchJSON(`/api/transferDeclarations/${encodeURIComponent(String(item.id))}`, {
          method: "DELETE",
        });
        setTransfer((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
        return;
      }

      alert("Άγνωστος τύπος δήλωσης.");
    } catch (e) {
      console.error(e);
      alert("Αποτυχία διαγραφής. Δοκίμασε ξανά.");
    }
  };

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

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <AppBreadcrumbs />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 28 }}>
                  Δηλώσεις
                </Typography>
                <Typography sx={{ mt: 0.6, color: MUTED, maxWidth: 820 }}>
                  Εδώ θα βρείτε όλες τις δηλώσεις που έχετε καταχωρίσει.
                  <br />
                  Παρακολουθήστε την πορεία τους ή ξεκινήστε μια νέα δήλωση εύκολα και γρήγορα.
                </Typography>
              </Box>

              <Button
                onClick={handleCreate}
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: PRIMARY_HOVER },
                  boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                  fontWeight: 900,
                }}
              >
                Νέα Δήλωση
              </Button>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid #d6e2f5",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              }}
            >
              <Box sx={{ bgcolor: "#ffffff" }}>
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    px: 1,
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 900,
                      color: TITLE,
                    },
                    "& .MuiTabs-indicator": {
                      height: 4,
                      borderRadius: 99,
                    },
                  }}
                >
                  <Tab label="Υποβεβλημένες" />
                  <Tab label="Πρόχειρες" />
                </Tabs>
              </Box>

              <Divider />

              <Box sx={{ p: 2 }}>
                {loading ? (
                  <Paper
                    elevation={0}
                    sx={{ p: 2, borderRadius: 2, border: "1px solid #e6edf7", bgcolor: "#ffffff" }}
                  >
                    <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
                  </Paper>
                ) : err ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid rgba(0,0,0,0.12)",
                      bgcolor: "#fff3f3",
                    }}
                  >
                    <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
                  </Paper>
                ) : filtered.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 2,
                      border: "1px solid #e6edf7",
                      bgcolor: "#ffffff",
                      textAlign: "center",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, color: TITLE }}>
                      Δεν υπάρχουν δηλώσεις εδώ
                    </Typography>
                    <Typography sx={{ mt: 0.6, color: MUTED }}>
                      Πάτησε “Νέα Δήλωση” για να δημιουργήσεις μία νέα.
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    <Stack spacing={1.3}>
                      {pageRows.map((item) => (
                        <Row
                          key={`${item.type}-${item.id}`}
                          item={item}
                          role={role}
                          onPreview={handlePreview}
                          onDelete={handleDelete}
                          onMarkFound={handleMarkFound}
                        />
                      ))}
                    </Stack>
                    {/* ✅ PAGER κάτω δεξιά */}
                    <Pager page={page} pageCount={pageCount} onChange={setPage} color={PRIMARY} maxButtons={4} />
                  </>
                )}
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
