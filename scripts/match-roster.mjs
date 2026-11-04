import fs from 'fs';
import { OFFICIAL_ROSTER } from './roster.mjs';

const results = JSON.parse(fs.readFileSync('extracted_results.json', 'utf8'));

console.log(`Total extracted entries: ${Object.keys(results).length}`);

// Inspect all results
const extractedList = [];
for (const [key, val] of Object.entries(results)) {
  if (val.is_outer_cover && key !== 'DocScanner_4_Nov_2026_12-55/page_001.jpg') {
    // If it's an outer cover without marks grid, note it
    console.log(`Outer cover detected: ${key} -> ${val.usn} ${val.name}`);
  }
  extractedList.push({ key, ...val });
}

// Matching logic:
// Match by USN (last 3 digits or full) or Name match
const matched = new Map();
const unmatchedExtracted = [];

for (const ext of extractedList) {
  let matchedRoster = null;
  const rawUsn = (ext.usn || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const rawName = (ext.name || '').toUpperCase().trim();

  // Try matching full USN
  if (rawUsn.length >= 6) {
    matchedRoster = OFFICIAL_ROSTER.find(r => r.usn.includes(rawUsn) || rawUsn.includes(r.usn));
  }

  // Try matching last digits of USN (e.g. 028, 046)
  if (!matchedRoster && rawUsn.match(/\d{2,3}$/)) {
    const num = rawUsn.match(/\d{2,3}$/)[0].padStart(3, '0');
    matchedRoster = OFFICIAL_ROSTER.find(r => r.usn.endsWith(num) && r.usn.startsWith('25BTREC'));
  }

  // Try matching by name
  if (!matchedRoster && rawName.length > 2) {
    matchedRoster = OFFICIAL_ROSTER.find(r => {
      const rn = r.name.toUpperCase();
      return rn === rawName || rn.includes(rawName) || rawName.includes(rn);
    });
  }

  // Special name approximations
  if (!matchedRoster && rawName.length > 2) {
    const tokens = rawName.split(/[\s.]+/).filter(t => t.length > 2);
    matchedRoster = OFFICIAL_ROSTER.find(r => {
      const rTokens = r.name.split(/[\s.]+/).filter(t => t.length > 2);
      return tokens.some(t => rTokens.includes(t));
    });
  }

  if (matchedRoster) {
    if (!matched.has(matchedRoster.sl) || !ext.is_outer_cover) {
      matched.set(matchedRoster.sl, { ext, roster: matchedRoster });
    }
  } else {
    unmatchedExtracted.push(ext);
  }
}

console.log(`\nMatched ${matched.size} of 65 students.`);
console.log(`Unmatched extracted: ${unmatchedExtracted.length}`);
for (const u of unmatchedExtracted) {
  console.log(`  Unmatched: [${u.key}] USN: "${u.usn}", Name: "${u.name}", Total: ${u.written_total}`);
}

const missingRoster = OFFICIAL_ROSTER.filter(r => !matched.has(r.sl));
console.log(`\nMissing from roster: ${missingRoster.length}`);
for (const m of missingRoster) {
  console.log(`  Missing: #${m.sl} ${m.usn} - ${m.name}`);
}
