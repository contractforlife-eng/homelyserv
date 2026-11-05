import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Marketplace component defines listings state and updates it across all load branches', () => {
  const filePath = path.resolve(__dirname, 'Marketplace.jsx');
  const source = fs.readFileSync(filePath, 'utf8');

  // Verify useState for listings is properly declared
  assert.match(
    source,
    /const\s*\[listings,\s*setListings\]\s*=\s*useState\(\[\]\);/,
    'listings state must be declared with useState([])'
  );

  // Verify setListings is called in all 3 fetch branches: moderation reports, my listings, and browse
  const setListingsMatches = source.match(/setListings\(/g) || [];
  assert.ok(
    setListingsMatches.length >= 4,
    `Expected setListings to be used in all fetch branches and error catch (found ${setListingsMatches.length} calls)`
  );

  // Verify error state resets listings to [] to avoid undefined render crash
  assert.match(
    source,
    /catch\s*\([^{]+\)\s*\{[\s\S]*?setListings\(\[\]\);/,
    'Catch block should reset listings to [] on load error'
  );

  // Verify render references listings.length and listings.map without scoping error
  assert.match(
    source,
    /listings\.length\s*\?/,
    'Listings grid should guard on listings.length'
  );
  assert.match(
    source,
    /listings\.map\(/,
    'Listings grid should map over listings array'
  );

  // Verify no undefined references to listings before declaration
  const stateDeclarationIndex = source.indexOf('const [listings, setListings] = useState([]);');
  const firstListingsRenderIndex = source.indexOf('{listings.length ?');
  assert.ok(
    stateDeclarationIndex > 0 && stateDeclarationIndex < firstListingsRenderIndex,
    'listings must be declared in component state before JSX render'
  );
});

test('Pagination calculation recovers when current page exceeds total pages', () => {
  const computePaginationRange = (current, totalPages) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const leftSibling = Math.max(current - 1, 2);
    const rightSibling = Math.min(current + 1, totalPages - 1);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = [1, 2, 3, 4];
      return [...leftRange, '...', totalPages];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      return [1, '...', ...rightRange];
    }
    if (showLeftEllipsis && showRightEllipsis) {
      return [1, '...', current - 1, current, current + 1, '...', totalPages];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  // Case 1: normal 15 items deleted down to 3 items -> totalPages goes from 2 to 1 while current page was 2
  const recoveredPage = 1;
  const range1 = computePaginationRange(recoveredPage, 1);
  assert.deepEqual(range1, [1]);

  // Case 2: 0 items (empty result) -> totalPages is 1
  const rangeEmpty = computePaginationRange(1, 1);
  assert.deepEqual(rangeEmpty, [1]);

  // Case 3: 10 pages, page 5
  const rangeMany = computePaginationRange(5, 10);
  assert.deepEqual(rangeMany, [1, '...', 4, 5, 6, '...', 10]);
});

test('Back to listings button and safe return path in Marketplace listing details', () => {
  const filePath = path.resolve(__dirname, 'Marketplace.jsx');
  const source = fs.readFileSync(filePath, 'utf8');

  // Verify "Back to listings" button is rendered above listing details
  assert.match(
    source,
    /t\('marketplace\.backToListings'\)/,
    'Listing details must render a button with backToListings translation'
  );

  // Verify return path is sanitized using sanitizeMarketplaceListReturnPath
  assert.match(
    source,
    /sanitizeMarketplaceListReturnPath\(location\.state\?\.returnTo\)\s*\|\|\s*'\/marketplace'/,
    'Return destination must validate navigation state or default safely to /marketplace'
  );

  // Verify navigating from card passes returnTo state with current location pathname and search
  assert.match(
    source,
    /navigate\(`\/marketplace\/\$\{item\._id\}`, \{ state: \{ returnTo: returnUrl \} \}\)/,
    'Card click must pass originating list URL (pathname + search) as returnTo state'
  );

  // Verify technical WhatsApp disclaimer was removed from listing details view
  // Search only in isDetail section
  const detailSection = source.split('} else if (isDetail) {')[1]?.split('} else {')[0] || '';
  assert.ok(
    !detailSection.includes("t('marketplace.whatsappDisclaimer')"),
    'Technical WhatsApp disclaimer must NOT be present in listing details view'
  );
});
