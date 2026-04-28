export const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
};

export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return iso; }
};

export const flagEmoji = (code) => {
  if (!code) return "";
  const A = 0x1F1E6;
  return code.toUpperCase().split("").map(c => String.fromCodePoint(A + c.charCodeAt(0) - 65)).join("");
};
