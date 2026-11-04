import fs from 'fs';
import path from 'path';

// Let's check pdf files in Downloads
const downloadsDir = 'C:\\Users\\K KRISHNA CHARAN\\Downloads';
const files = [
  'bio marks.pdf',
  'DocScanner 4 Nov .pdf',
  'DocScanner 4 Nov 2026 12-55.pdf'
];

for (const f of files) {
  const p = path.join(downloadsDir, f);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    console.log(`File: ${f}, Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log(`File not found: ${f}`);
  }
}
