import fs from 'fs';
import path from 'path';

function extractJpegsFromPdf(pdfPath, outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const buf = fs.readFileSync(pdfPath);
  const SOI = Buffer.from([0xff, 0xd8, 0xff]);
  const EOI = Buffer.from([0xff, 0xd9]);

  let count = 0;
  let pos = 0;

  while (pos < buf.length) {
    const start = buf.indexOf(SOI, pos);
    if (start === -1) break;

    const end = buf.indexOf(EOI, start + 3);
    if (end === -1) break;

    const jpegBuf = buf.subarray(start, end + 2);
    if (jpegBuf.length > 20 * 1024) {
      count++;
      const outPath = path.join(outDir, `page_${String(count).padStart(3, '0')}.jpg`);
      fs.writeFileSync(outPath, jpegBuf);
    }

    pos = end + 2;
  }

  console.log(`Extracted ${count} images from ${path.basename(pdfPath)} -> ${outDir}`);
  return count;
}

const downloadsDir = 'C:\\Users\\K KRISHNA CHARAN\\Downloads';
const targetDir = 'C:\\Users\\K KRISHNA CHARAN\\.gemini\\antigravity\\scratch\\markssheet-ai\\extracted_pages';

const files = [
  'DocScanner 4 Nov 2026 12-55.pdf',
  'DocScanner 4 Nov .pdf',
  'bio marks.pdf'
];

for (const f of files) {
  const p = path.join(downloadsDir, f);
  const sub = f.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const out = path.join(targetDir, sub);
  extractJpegsFromPdf(p, out);
}
