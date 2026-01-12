import { useMemo } from "react";
import { Box, Stack, IconButton } from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function Pager({
  page,
  pageCount,
  onChange,
  maxButtons = 4,
  color = "#0b3d91",
}) {
  const btnSx = (active) => ({
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 12,
    bgcolor: active ? color : "#fff",
    color: active ? "#fff" : "#222",
    border: active ? "none" : "1px solid rgba(0,0,0,0.18)",
    cursor: active ? "default" : "pointer",
  });

  const iconSx = (disabled) => ({
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.18)",
    bgcolor: "#fff",
    color: disabled ? "rgba(0,0,0,0.30)" : "#444",
  });

  const canPrev = page > 1;
  const canNext = page < pageCount;

  const numbers = useMemo(() => {
    const max = Math.min(maxButtons, pageCount);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [pageCount, maxButtons]);

  if (pageCount <= 1) return null;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="flex-end"
      sx={{ mt: 1.2 }}
    >
      <IconButton
        size="small"
        disabled={!canPrev}
        onClick={() => onChange(1)}
        sx={iconSx(!canPrev)}
      >
        <FirstPageIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
        sx={iconSx(!canPrev)}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      {numbers.map((n) => (
        <Box
          key={n}
          sx={btnSx(n === page)}
          onClick={() => n !== page && onChange(n)}
        >
          {n}
        </Box>
      ))}

      <IconButton
        size="small"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
        sx={iconSx(!canNext)}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        disabled={!canNext}
        onClick={() => onChange(pageCount)}
        sx={iconSx(!canNext)}
      >
        <LastPageIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
