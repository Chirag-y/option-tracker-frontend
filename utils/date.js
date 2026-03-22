export const formatDisplayDate = (value) => {
  if (!value) return "";
  const input = String(value);
  const date = input.includes("T") ? new Date(input) : new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
};

export const formatMonthYear = (value) => {
  if (!value) return "";
  const input = String(value);
  const date = input.includes("T") ? new Date(input) : new Date(`${input}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
};
