import { Box, Typography } from "@mui/material";

const COLORS = { primary: "#0b3d91" };

const DOT = 40;          // διάμετρος κύκλου
const LINE_H = 4;        // ύψος γραμμής
const INSET = 40;        // πόσο "μπαίνει" η γραμμή μέσα στον κύκλο (σε px)
const MAX_WIDTH = 820;   // πόσο "μαζεμένο" θες το stepper στο desktop

function StepDot({ index, activeStep }) {
  const done = index < activeStep;
  const active = index === activeStep;

  return (
    <Box
      sx={{
        width: DOT,
        height: DOT,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        fontWeight: 900,
        color: done || active ? "#fff" : COLORS.primary,
        bgcolor: done || active ? COLORS.primary : "#fff",
        border: `2px solid ${COLORS.primary}`,
        userSelect: "none",
        position: "relative",
        zIndex: 2, // ✅ πάνω από γραμμή
      }}
    >
      {done ? "✓" : index + 1}
    </Box>
  );
}

function StepCell({ index, activeStep, label, isLast }) {
  const segmentFilled = index < activeStep;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Γραμμή προς το επόμενο step (μόνο αν δεν είναι τελευταίο) */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            top: DOT / 2 - LINE_H / 2, // στο κέντρο του dot
            left: `calc(50% + ${DOT / 2 - INSET}px)`, // ✅ ξεκινά από το dot προς τα δεξιά
            width: `calc(100% - ${(DOT - 2 * INSET)}px)`,
            height: LINE_H,
            zIndex: 0,                 // ✅ πίσω από dot
          }}
        >
          {/* track */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "#fff",
              border: `1px solid ${COLORS.primary}`,
              borderRadius: 999,
            }}
          />
          {/* fill */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: segmentFilled ? "100%" : "0%",
              bgcolor: COLORS.primary,
              borderRadius: 999,
              transition: "width 220ms ease",
              overflow: "hidden",
            }}
          />
        </Box>
      )}

      {/* Dot */}
      <StepDot index={index} activeStep={activeStep} />

      {/* Label */}
      <Typography
        sx={{
          mt: 1,
          textAlign: "center",
          fontSize: { xs: 11, md: 12 },
          fontWeight: 800,
          color: "#000",
          lineHeight: 1.15,
          px: 1,
          maxWidth: 160,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function WizardStepper({ activeStep, steps }) {
  const cols = steps.length;

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          maxWidth: MAX_WIDTH,
          mx: "auto",
          px: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`, // ✅ χωρίζει την οριζόντιο ανάλογα με τα steps
            alignItems: "start",
            columnGap: { xs: 2, md: 4 },                 // λίγο breathing space
          }}
        >
          {steps.map((label, i) => (
            <StepCell
              key={label}
              index={i}
              activeStep={activeStep}
              label={label}
              isLast={i === steps.length - 1}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
