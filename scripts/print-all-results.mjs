import fs from 'fs';
import { OFFICIAL_ROSTER } from './roster.mjs';

const results = JSON.parse(fs.readFileSync('extracted_results.json', 'utf8'));

// Print all 65 keys with details
let idx = 1;
for (const [key, val] of Object.entries(results)) {
  console.log(`${String(idx++).padStart(2, '0')}. [${key}] -> USN: "${val.usn}", Name: "${val.name}", Total: ${val.written_total}, Marks: ${JSON.stringify(val.q_marks)}`);
}
