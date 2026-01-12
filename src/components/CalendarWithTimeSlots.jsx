// src/components/CalendarWithTimeSlots.jsx
import * as React from "react";
import dayjs from "dayjs";
import "dayjs/locale/el";
import { Box, Button, Paper, Typography } from "@mui/material";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// ========== Defaults (μπορείς να τα κάνεις props) ==========
const DEFAULT_PRIMARY = "#0b3d91";
const DEFAULT_PRIMARY_HOVER = "#08316f";
const DEFAULT_PANEL_BG = "#cfe3ff";
const DEFAULT_DISABLED_BG = "#eceff3";
const DEFAULT_DISABLED_TEXT = "#999";

// utility: round up to next hour (00 minutes)
function nextHour(d) {
  const base = dayjs(d);
  return base.add(1, "hour").minute(0).second(0);
}

// utility: generate time slots between start/end with step (minutes) in 24h format "HH:mm"
function buildTimeSlots({ start = "09:00", end = "20:30", stepMinutes = 30 }) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let cur = dayjs().hour(sh).minute(sm).second(0);
  const last = dayjs().hour(eh).minute(em).second(0);

  const out = [];
  while (cur.isBefore(last) || cur.isSame(last)) {
    out.push(cur.format("HH:mm"));
    cur = cur.add(stepMinutes, "minute");
  }
  return out;
}

/**
 * CalendarWithTimeSlots
 *
 * Props:
 * - value: { date: dayjs|null, time: string|null }
 * - onChange: ({ date, time }) => void
 *
 * - getDayDisabled?: (dateDayjs) => boolean
 * - getAvailableTimes?: (dateDayjs) => string[]   // enabled times for that day (πρόγραμμα κτηνιάτρου)
 * - getBookedTimes?: (dateDayjs) => string[]      // booked times for that day (ραντεβού)
 *
 * - timeRange?: { start: "09:00", end: "19:00", stepMinutes: 30 }
 * - minDate?: dayjs() default today
 * - maxMonthsAhead?: number default 12
 *
 * Styling:
 * - primary, primaryHover, panelBg, disabledBg, disabledText
 */
export default function CalendarWithTimeSlots({
  value,
  onChange,

  getDayDisabled,
  getAvailableTimes,
  getBookedTimes,

  timeRange = { start: "09:00", end: "20:30", stepMinutes: 30 },
  minDate = dayjs(),
  maxMonthsAhead = 12,

  primary = DEFAULT_PRIMARY,
  primaryHover = DEFAULT_PRIMARY_HOVER,
  panelBg = DEFAULT_PANEL_BG,
  disabledBg = DEFAULT_DISABLED_BG,
  disabledText = DEFAULT_DISABLED_TEXT,

  title = "Ραντεβού",
  subtitleDay = "1. Διάλεξε ημέρα",
  subtitleTime = "2. Διάλεξε ώρα",

  onAction,
  actionDisabled,
}) {
  // locale
  dayjs.locale("el");

  const today = dayjs();

  // selected date default = today
  const selectedDate = value?.date ?? today;
  const selectedTime = value?.time ?? null;

  // only current + future months
  const maxDate = minDate.add(maxMonthsAhead, "month").endOf("month");

  const allTimes = React.useMemo(
    () =>
      buildTimeSlots({
        start: timeRange.start,
        end: timeRange.end,
        stepMinutes: timeRange.stepMinutes,
      }),
    [timeRange.start, timeRange.end, timeRange.stepMinutes]
  );

  // times enabled by schedule (vet-defined). If not provided => allTimes enabled
  const enabledTimes = React.useMemo(() => {
    if (getAvailableTimes) return getAvailableTimes(selectedDate) || [];
    return allTimes;
  }, [getAvailableTimes, selectedDate, allTimes]);

  // booked times for selected day
  const bookedTimes = React.useMemo(() => {
    if (!getBookedTimes) return [];
    return getBookedTimes(selectedDate) || [];
  }, [getBookedTimes, selectedDate]);

  // For "today": do not allow times earlier than next hour (HH:mm)
  const minTimeToday = React.useMemo(() => {
    if (!selectedDate.isSame(today, "day")) return null;
    return nextHour(today).format("HH:mm");
  }, [selectedDate, today]);

  function isTimeDisabled(t) {
    // disabled if not in enabledTimes
    if (!enabledTimes.includes(t)) return true;
    // disabled if booked
    if (bookedTimes.includes(t)) return true;
    // disabled if today and time < nextHour
    if (minTimeToday && t < minTimeToday) return true;
    return false;
  }

  // αν αλλάξει μέρα και η επιλεγμένη ώρα δεν είναι πια valid -> καθάρισέ την
  React.useEffect(() => {
    if (selectedTime && isTimeDisabled(selectedTime)) {
      onChange?.({ date: selectedDate, time: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "2px solid rgba(143,180,232,1)",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        p: 3,
      }}
    >
      <Typography sx={{ fontWeight: 900, mb: 2 }}>{title}</Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* LEFT: CALENDAR */}
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 2, color: "#6b7a90" }}>
            {subtitleDay}
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="el">
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => {
                if (!newDate) return;
                onChange?.({ date: newDate, time: null });
              }}
              minDate={minDate.startOf("day")}
              maxDate={maxDate}
              disablePast
              slots={{ day: PickersDay }}
              slotProps={{
                day: (ownerState) => {
                  const day = ownerState.day;

                  const isDisabledByRules =
                    day.isBefore(minDate, "day") || (getDayDisabled ? getDayDisabled(day) : false);

                  const isSelected = selectedDate?.isSame(day, "day");

                  return {
                    disabled: isDisabledByRules,
                    selected: false, // κάνουμε το styling εμείς
                    sx: {
                      borderRadius: 2,
                      fontWeight: 900,

                      ...(isDisabledByRules && {
                        bgcolor: disabledBg,
                        color: disabledText,
                        opacity: 1,
                      }),

                      ...(!isDisabledByRules &&
                        !isSelected && {
                          bgcolor: "#ffffff",
                          border: "1px solid rgba(0,0,0,0.08)",
                          "&:hover": { bgcolor: panelBg },
                        }),

                      ...(isSelected && {
                        bgcolor: primary,
                        color: "#fff",
                        "&:hover": { bgcolor: primaryHover },
                      }),
                    },
                  };
                },
              }}
              sx={{
                maxHeight: 305,
                width: 320,
                bgcolor: panelBg,          // ✅ φόντο πίσω από το calendar
                borderRadius: 2,
                p: 1.2,                    // λίγο padding για να φαίνεται ωραία
                border: "1px solid rgba(0,0,0,0.08)",

                "& .MuiPickersCalendarHeader-root": { px: 2 },
                "& .MuiPickersCalendarHeader-label": { fontWeight: 900 },

                // ✅ το “χαρτί”/περιοχή του grid των ημερών
                "& .MuiDayCalendar-monthContainer": {
                  bgcolor: "#fff",
                  borderRadius: 2,
                  p: 0.6,
                },

                // ✅ αν θες και οι μέρες της εβδομάδας (Δ Τ Τ κλπ) να κάθονται πάνω σε φόντο
                "& .MuiDayCalendar-weekDayLabel": {
                  color: "#6b7a90",
                  fontWeight: 800,
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        {/* RIGHT: TIMES */}
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 2, color: "#6b7a90" }}>
            {subtitleTime}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(2, 1fr)" },
              gap: 1,
              maxHeight: 305,
              overflowY: "auto",
              pr: 2,
              bgcolor: panelBg,          // ✅ φόντο πίσω από το calendar
              borderRadius: 2,
              p: 1.2,                    // λίγο padding για να φαίνεται ωραία
            }}
          >
            {allTimes.map((t) => {
              const disabled = isTimeDisabled(t);
              const active = !disabled && selectedTime === t;

              return (
                <Paper
                  key={t}
                  elevation={0}
                  onClick={disabled ? undefined : () => onChange?.({ date: selectedDate, time: t })}
                  sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    borderRadius: 2,
                    px: 1.3,
                    py: 1,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 12,
                    userSelect: "none",

                    bgcolor: disabled ? disabledBg : active ? primary : "#fff",
                    color: disabled ? disabledText : active ? "#fff" : "#111",

                    border: active ? `2px solid ${primaryHover}` : "1px solid rgba(0,0,0,0.10)",
                    ...(disabled
                      ? {}
                      : {
                          "&:hover": {
                            filter: active ? "none" : "brightness(0.98)",
                          },
                        }),
                  }}
                >
                  {t}
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Box>
      {onAction && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3.1 }}>
            <Button
              variant="contained"
              onClick={onAction}
              disabled={actionDisabled}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: primary,
                "&:hover": { bgcolor: primaryHover },
                fontWeight: 900,
                px: 3,
                boxShadow: "0px 6px 16px rgba(0,0,0,0.15)",
              }}
            >
            Επόμενο Βήμα
            </Button>
          </Box>
        )}
    </Paper>
  );
}
