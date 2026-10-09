// frontend/src/utils/csvExport.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell, generateCsvContent } from './csvExport.js';

test('CSV Export Utility', async (t) => {
  await t.test('1. escapeCsvCell escapes quotes, commas, and multiline text', () => {
    assert.equal(escapeCsvCell('Hello, World'), '"Hello, World"');
    assert.equal(escapeCsvCell('He said "Hi"'), '"He said ""Hi"""');
    assert.equal(escapeCsvCell('Line 1\nLine 2'), '"Line 1\nLine 2"');
    assert.equal(escapeCsvCell(null), '""');
    assert.equal(escapeCsvCell(undefined), '""');
    assert.equal(escapeCsvCell(123.45), '"123.45"');
  });

  await t.test('2. escapeCsvCell defuses spreadsheet formula injection (=, +, -, @)', () => {
    assert.equal(escapeCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
    assert.equal(escapeCsvCell('+12345'), '"\'+12345"');
    assert.equal(escapeCsvCell('-cmd|"/C calc"!A0'), '"\'-cmd|""/C calc""!A0"');
    assert.equal(escapeCsvCell('@HYPERLINK("http://evil.com")'), '"\'@HYPERLINK(""http://evil.com"")"');
  });

  await t.test('3. generateCsvContent prepends UTF-8 BOM for Arabic and international text', () => {
    const headers = ['التاريخ', 'الطالب', 'المادة', 'المبلغ'];
    const rows = [
      ['2026-10-10', 'أحمد محمود', 'رياضيات', 250],
      ['2026-10-11', 'سارة علي', 'فيزياء', 300]
    ];

    const result = generateCsvContent(headers, rows);
    // Check UTF-8 BOM is present at the very beginning
    assert.ok(result.startsWith('\uFEFF'));

    // Check Arabic text is preserved intact in lines
    assert.ok(result.includes('"التاريخ","الطالب","المادة","المبلغ"'));
    assert.ok(result.includes('"أحمد محمود"'));
    assert.ok(result.includes('"رياضيات"'));
    assert.ok(result.includes('"250"'));
  });

  await t.test('4. generateCsvContent formats multiple rows with CRLF separators', () => {
    const headers = ['ID', 'Score'];
    const rows = [
      ['1', 95],
      ['2', 88]
    ];
    const csv = generateCsvContent(headers, rows);
    const lines = csv.slice(1).split('\r\n'); // strip BOM
    assert.equal(lines.length, 3);
    assert.equal(lines[0], '"ID","Score"');
    assert.equal(lines[1], '"1","95"');
    assert.equal(lines[2], '"2","88"');
  });
});
