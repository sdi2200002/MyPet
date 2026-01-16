import { useMemo, useState, useEffect } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link, useParams, useNavigate } from "react-router-dom";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";

import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";
const PANEL_BG = "#dfeeff";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function formatDateGR(iso) {
  const s = String(iso || "").trim();
  // ISO: YYYY-MM-DD
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s || "\u00A0";
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
}

function Tab({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          bgcolor: active ? PRIMARY : "#cfd7e8",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 16,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function Cell({ children }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: PANEL_BG,
          borderRadius: 999,
          px: 2,
          py: 0.9,
          border: "1px solid rgba(0,0,0,0.10)",
          height: 18,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: MUTED,
            fontWeight: 800,
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Typography>
      </Paper>
    </Box>
  );
}

function fmtDates(row) {
  // υποστηρίζει είτε "dates" έτοιμο string, είτε date+expiresAt
  if (row?.dates) return row.dates;

  const d1 = formatDateGR(row?.vaccinatedAt || "");
  const d2 = formatDateGR(row?.expiresAt || "");

  if (!d1 && !d2) return "\u00A0";
  if (d1 && d2) return `${d1} → ${d2}`;
  return d1 || d2;
}

/**
 * ✅ Shared page
 * role: "owner" | "vet"
 */
export default function PetBookletVaccinations({ role = "owner" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const petId = useMemo(() => String(id || ""), [id]);

  const base = role === "vet" ? "/vet" : "/owner";
  const sidebarW = role === "vet" ? VET_SIDEBAR_W : OWNER_SIDEBAR_W;

  const bookletBasePath =
    role === "vet" ? `${base}/mypets/${petId}/booklet` : `${base}/pets/${petId}/booklet`;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [vaccinations, setVaccinations] = useState([]);

  // ✅ pagination
  const rowsPerPage = 6;
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const pet = await fetchJSON(`/api/pets/${encodeURIComponent(petId)}`);

        const v = Array.isArray(pet?.vaccinations) ? pet.vaccinations : [];

        // (προαιρετικό) sort πιο πρόσφατα πρώτα, αν έχει date
        v.sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));

        if (!alive) return;
        setVaccinations(v);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Αποτυχία φόρτωσης εμβολίων.");
        setVaccinations([]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [petId]);

  const totalPages = Math.max(1, Math.ceil(vaccinations.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return vaccinations.slice(start, start + rowsPerPage);
  }, [vaccinations, page]);

  const paddedRows = useMemo(() => {
    const missing = rowsPerPage - pageRows.length;
    if (missing <= 0) return pageRows;

    const empty = { vaccine: "\u00A0", batch: "\u00A0", dates: "\u00A0", vetName: "\u00A0" };
    return [...pageRows, ...Array.from({ length: missing }, () => empty)];
  }, [pageRows]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        {/* LEFT spacer */}
        <Box
          sx={{
            width: sidebarW,
            flex: `0 0 ${sidebarW}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        />

        {/* Sidebar */}
        {role === "vet" ? <VetNavbar mode="navbar" /> : <OwnerNavbar mode="navbar" />}

        {/* RIGHT content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            <AppBreadcrumbs />

            <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
              <Tab label="Στοιχεία Κατοικιδίου" to={bookletBasePath} />
              <Tab active label="Εμβολιασμοί" to={`${bookletBasePath}/vaccinations`} />
              <Tab label="Ιατρικές Πράξεις" to={`${bookletBasePath}/acts`} />
            </Stack>

            <Paper
              elevation={0}
              sx={{
                position: "relative",
                zIndex: 2,
                borderRadius: 2,
                border: `2px solid ${BORDER}`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                p: 3,
              }}
            >
              {loading ? (
                <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
              ) : err ? (
                <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
              ) : (
                <>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2.2fr 1fr 1.2fr 1fr",
                      gap: 1.2,
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                      Κατασκευαστής &amp; ονομασία εμβολίου
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                      Αριθμός παρτίδας
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                      Ημερομηνία εμβολιασμού &amp; λήξη ισχύος
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#111", textAlign: "center" }}>
                      Εγκεκριμένος κτηνίατρος
                    </Typography>
                  </Box>

                  {/* Rows */}
                  {paddedRows.map((row, i) => (
                    <Box
                      key={`${page}-${i}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2.2fr 1fr 1.2fr 1fr",
                        gap: 1.2,
                        mb: 1,
                      }}
                    >
                      <Cell>{row?.vaccine ?? "\u00A0"}</Cell>
                      <Cell>{row?.batch ?? "\u00A0"}</Cell>
                      <Cell>{fmtDates(row)}</Cell>
                      <Cell>{row?.vetName ?? row?.vet ?? "\u00A0"}</Cell>
                    </Box>
                  ))}

                  {/* Footer actions */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, alignItems: "center", gap: 2 }}>
                    {/* ✅ ΜΟΝΟ ΓΙΑ VET */}
                    {role === "vet" && (
                      <Button
                        onClick={() => navigate(`${bookletBasePath}/vaccinations/new`)}
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
                        Νέο Εμβόλιο
                      </Button>
                    )}

                    <Pager page={page} pageCount={totalPages} onChange={setPage} color={PRIMARY} maxButtons={4} />
                  </Box>

                  {vaccinations.length === 0 && (
                    <Typography sx={{ mt: 2, color: MUTED, fontWeight: 700 }}>
                      Δεν υπάρχουν καταχωρημένα εμβόλια.
                    </Typography>
                  )}
                </>
              )}
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: PRIMARY_HOVER },
                  fontWeight: 900,
                  px: 3,
                }}
                onClick={() => window.print()}
              >
                Εκτύπωση
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
