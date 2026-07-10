/**
 * csvParser — pure-JS CSV parser, no dependencies.
 *
 * Handles: quoted fields, commas inside quotes, double-quote escaping,
 * Windows (\r\n) and Unix (\n) line endings, and trailing empty rows.
 *
 * Returns { headers: string[], rows: Object[] } where each row maps
 * the trimmed header name to the trimmed field value.
 */

function parseRow(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(csvString) {
  const normalized = (csvString || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized.split("\n").filter(l => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]).map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}
