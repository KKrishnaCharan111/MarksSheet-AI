import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('Please set GEMINI_API_KEY in environment or .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const visionModels = [
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash'
];

const baseDir = path.resolve('extracted_pages');
const folders = [
  'DocScanner_4_Nov_2026_12-55',
  'DocScanner_4_Nov_',
  'bio_marks'
];

const allImages = [];
for (const f of folders) {
  const dir = path.join(baseDir, f);
  if (fs.existsSync(dir)) {
    const list = fs.readdirSync(dir).filter(x => x.endsWith('.jpg')).sort();
    for (const img of list) {
      allImages.push({
        folder: f,
        file: img,
        fullPath: path.join(dir, img)
      });
    }
  }
}

const resultsFile = path.resolve('extracted_results.json');
let results = {};
if (fs.existsSync(resultsFile)) {
  try {
    results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  } catch (e) {}
}

const prompt = `Analyze this student test answer sheet front page / marks table.
Extract:
1. "name": Student Name (in UPPERCASE)
2. "usn": University Seat No / USN / Roll No
3. "is_outer_cover": boolean
4. "q_marks": {"1": marks, "2": marks, "3": marks, "4": marks, "5": marks, "6": marks, "7": marks, "8": marks}
5. "written_total": Total mark
6. "notes": string

Return STRICT JSON:
{
  "name": "",
  "usn": "",
  "is_outer_cover": false,
  "q_marks": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0},
  "written_total": 0,
  "notes": ""
}`;

async function run() {
  for (let i = 0; i < allImages.length; i++) {
    const item = allImages[i];
    const key = `${item.folder}/${item.file}`;
    if (results[key] && results[key].name && results[key].usn) {
      continue;
    }
    const imgData = fs.readFileSync(item.fullPath).toString('base64');
    for (const m of visionModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: m,
          generationConfig: { responseMimeType: 'application/json' }
        });
        const res = await model.generateContent([{ inlineData: { data: imgData, mimeType: 'image/jpeg' } }, prompt]);
        results[key] = { ...JSON.parse(res.response.text()), source_folder: item.folder, source_file: item.file };
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }
}

run();
