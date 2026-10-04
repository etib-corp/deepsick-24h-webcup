/**
 * Minimal CSV writer (F88).
 *
 * Uses a semicolon delimiter (French spreadsheet friendly) and escapes cells
 * that contain the delimiter, quotes or newlines. Cells starting with a
 * formula trigger (`=`, `+`, `-`, `@`) are prefixed with an apostrophe so
 * exported data cannot be executed when opened in a spreadsheet.
 */

function escapeCell(value: string): string {
  let cell = value;
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[";\n\r]/.test(cell)) {
    cell = `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function buildCsv(
  header: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell == null ? "" : String(cell))).join(";"))
    .join("\r\n");
}
