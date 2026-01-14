import { Box, IconButton, Stack, Typography } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

export default function PetsVerticalCarousel({ pets }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const visiblePets = useMemo(
    () => pets.slice(index, index + 2),
    [pets, index]
  );

  const canUp = index > 0;
  const canDown = index < pets.length - 2;

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 900,
          color: TITLE,
          mb: 1.2,
          fontSize: 20,
          textAlign: "center",
        }}
      >
        Τα Κατοικίδια μου
      </Typography>

      <Stack alignItems="center" spacing={0.5}>
        <IconButton
          disabled={!canUp}
          onClick={() => setIndex((i) => i - 1)}
        >
          <KeyboardArrowUpIcon />
        </IconButton>

        <Stack spacing={2}>
          {visiblePets.map((pet) => (
            <PetTile
              key={pet.id}
              pet={pet}
              onOpenBook={(id) => navigate(`/owner/pets/${id}`)}
            />
          ))}
        </Stack>

        <IconButton
          disabled={!canDown}
          onClick={() => setIndex((i) => i + 1)}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
