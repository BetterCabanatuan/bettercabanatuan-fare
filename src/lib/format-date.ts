// en-GB gives the day-first order riders expect ("16 Oct 2026"). Source dates are plain
// ISO calendar days, so formatting in UTC keeps them from shifting by a day.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (isoDate: string): string => dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
