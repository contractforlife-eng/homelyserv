/**
 * Temporary script to add Tailwind dark: variants to page files.
 * Run with: node apply-dark-mode.cjs
 * Safe to delete after use.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'pages');

const allPages = [
  'EmployerDashboard.jsx',
  'EmployerProfile.jsx',
  'EmployerSearch.jsx',
  'WorkerProfileView.jsx',
  'MyHires.jsx',
  'EmployerMessages.jsx',
  'EmployerComplaints.jsx',
  'EmployerPostJob.jsx',
  'EmployerPayments.jsx',
  'EmployerPending.jsx',
  'EmployerPast.jsx',
  'EmployerSettings.jsx',
  'Subscription.jsx',
  'Help.jsx',
  'WorkerDashboard.jsx',
  'WorkerProfile.jsx',
  'WorkerMessages.jsx',
  'WorkerComplaints.jsx',
  'WorkerOffers.jsx',
  'WorkerPayment.jsx',
  'WorkerSettings.jsx',
];

const settingsPages = new Set(['WorkerSettings.jsx', 'EmployerSettings.jsx']);

// [lightClass, darkClass] — order matters: hover/focus variants first
const variants = [
  // Hover states (process before base classes to avoid conflicts)
  ['hover:bg-gray-100', 'dark:hover:bg-gray-700'],
  ['hover:bg-gray-50', 'dark:hover:bg-gray-700'],
  // Backgrounds (negative lookbehind to skip hover:/focus:/dark: prefixed)
  ['(?<![:\\w])bg-white(?!/)', 'dark:bg-gray-800'],
  ['(?<![:\\w])bg-gray-50(?!/)', 'dark:bg-gray-900'],
  ['(?<![:\\w])bg-gray-100(?!/)', 'dark:bg-gray-800'],
  // Text colors
  ['(?<![:\\w])text-gray-900', 'dark:text-white'],
  ['(?<![:\\w])text-gray-800', 'dark:text-white'],
  ['(?<![:\\w])text-gray-700', 'dark:text-gray-300'],
  ['(?<![:\\w])text-gray-600', 'dark:text-gray-400'],
  ['(?<![:\\w])text-gray-500', 'dark:text-gray-400'],
  // Borders
  ['(?<![:\\w])border-gray-200', 'dark:border-gray-700'],
  ['(?<![:\\w])border-gray-300', 'dark:border-gray-600'],
  ['(?<![:\\w])border-gray-100', 'dark:border-gray-700'],
  // Divide
  ['(?<![:\\w])divide-gray-200', 'dark:divide-gray-700'],
  // Placeholder
  ['(?<![:\\w])placeholder-gray-400', 'dark:placeholder-gray-500'],
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${fileName}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // For settings pages, replace settings.darkMode → isDark in JSX conditionals
  if (settingsPages.has(fileName)) {
    content = content.replace(/\bsettings\.darkMode\b/g, 'isDark');
  }

  // Process line by line to add dark: variants
  const lines = content.split('\n');
  const processedLines = lines.map((line) => {
    // Skip comment lines
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return line;
    }

    let result = line;

    for (const [lightPattern, darkClass] of variants) {
      const lightRegex = new RegExp(lightPattern, 'g');
      const darkCheck = new RegExp(`\\b${escapeRegex(darkClass)}\\b`);

      // Only add if the dark variant is not already on this line
      if (lightRegex.test(result) && !darkCheck.test(result)) {
        // Reset lastIndex after test()
        lightRegex.lastIndex = 0;
        result = result.replace(lightRegex, (match) => `${match} ${darkClass}`);
      }
    }

    return result;
  });

  const newContent = processedLines.join('\n');

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`UPDATED: ${fileName}`);
    return true;
  }

  console.log(`NO CHANGES: ${fileName}`);
  return false;
}

// Process all files
const results = allPages.map((page) => {
  const filePath = path.join(baseDir, page);
  return processFile(filePath);
});

const updatedCount = results.filter(Boolean).length;
const noChangeCount = results.filter((r) => r === false).length;
console.log(`\nDone. Updated ${updatedCount} files, ${noChangeCount} unchanged.`);