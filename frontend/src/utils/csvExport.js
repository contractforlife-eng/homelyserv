// frontend/src/utils/csvExport.js
// ============================================================
// CSV EXPORT UTILITY
//
// Formats tabular data into RFC 4180-compliant CSV format with:
// 1. Safe cell escaping (quotes, commas, newlines).
// 2. Spreadsheet Formula Injection Defense:
//    Prefixes cells starting with '=', '+', '-', '@', '\t', '\r'
//    with a single quote `'` so spreadsheet apps (Excel, Calc)
//    render them as plain text rather than executing code/formulas.
// 3. UTF-8 Byte Order Mark (\uFEFF):
//    Ensures proper rendering of Arabic and non-Latin UTF-8 text
//    in Microsoft Excel across platforms.
// 4. Safe filename formatting and browser trigger download.
// ============================================================

/**
 * Escapes a single CSV cell value according to RFC 4180 and protects
 * against CSV formula injection (DDE / formula execution).
 *
 * @param {any} val - Cell value
 * @returns {string} - Escaped cell
 */
export const escapeCsvCell = (val) => {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Formula injection mitigation:
  // If the cell starts with an active formula character, prefix with single quote.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If cell contains quotes, commas, newlines, or leading single quote, wrap in double quotes
  // Double up any internal double quotes (" -> "")
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Generates an RFC 4180-compliant CSV string from headers and data rows.
 * Prepends the UTF-8 Byte Order Mark (\uFEFF) for Arabic / Excel compatibility.
 *
 * @param {Array<string>} headers - Array of column header names
 * @param {Array<Array<any>>} rows - Array of rows, each row being an array of values
 * @returns {string} - Full CSV file content with BOM
 */
export const generateCsvContent = (headers, rows) => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const content = [headerLine, ...rowLines].join('\r\n');
  return `\uFEFF${content}`;
};

/**
 * Initiates a browser download of a CSV file.
 *
 * @param {string} filename - Target filename (e.g. "teacher-income.csv")
 * @param {Array<string>} headers - Column headers
 * @param {Array<Array<any>>} rows - Row values
 */
export const downloadCsv = (filename, headers, rows) => {
  const csvContent = generateCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  escapeCsvCell,
  generateCsvContent,
  downloadCsv
};
