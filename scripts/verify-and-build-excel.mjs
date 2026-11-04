import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { OFFICIAL_ROSTER } from './roster.mjs';

const results = JSON.parse(fs.readFileSync('extracted_results.json', 'utf8'));

// Student mapping table
const studentMap = {
  1: { key: 'DocScanner_4_Nov_/page_017.jpg' }, // 25BTREC001 A PREETHAM
  2: { key: 'DocScanner_4_Nov_/page_021.jpg' }, // 25BTREC002 AARTHI D
  3: { key: 'DocScanner_4_Nov_2026_12-55/page_004.jpg' }, // 25BTREC003 AKSHATHA K
  4: { key: 'DocScanner_4_Nov_2026_12-55/page_003.jpg' }, // 25BTREC004 ANUSRI N
  5: { key: 'bio_marks/page_008.jpg' }, // 25BTREC005 ASHISH CHOUDHARY
  6: { key: 'DocScanner_4_Nov_2026_12-55/page_007.jpg' }, // 25BTREC006 ASHWANTH V (Yashwanth V)
  7: { key: 'bio_marks/page_018.jpg' }, // 25BTREC007 CHENNUBOYANA GOVARDHAN (C. Govardhan Yadav)
  8: { key: 'DocScanner_4_Nov_/page_011.jpg' }, // 25BTREC008 CHINMAYA ROUL
  9: { key: 'DocScanner_4_Nov_/page_018.jpg' }, // 25BTREC009 CHINMAYI V
  10: { key: 'DocScanner_4_Nov_/page_020.jpg' }, // 25BTREC010 DAKSHITA S
  11: { key: 'bio_marks/page_017.jpg' }, // 25BTREC011 DANDU VENKATA GOVARDHAN REDDY
  12: { key: 'DocScanner_4_Nov_/page_013.jpg' }, // 25BTREC012 DHIRAJ D V
  13: { key: 'bio_marks/page_004.jpg' }, // 25BTREC013 GANESH GANAPATI HEGDE
  14: { key: 'bio_marks/page_020.jpg' }, // 25BTREC014 GANIGA PUSHKAL
  15: { key: 'DocScanner_4_Nov_2026_12-55/page_008.jpg' }, // 25BTREC015 HARSHAN V
  16: { key: 'bio_marks/page_014.jpg' }, // 25BTREC016 J SANTHOSH
  17: { key: 'DocScanner_4_Nov_/page_002.jpg' }, // 25BTREC017 JAGANNATH E K
  18: { absent: true }, // 25BTREC018 JEEVITHESH V R (Absent)
  19: { key: 'bio_marks/page_007.jpg' }, // 25BTREC019 KARTHIK Y
  20: { key: 'bio_marks/page_003.jpg' }, // 25BTREC020 KUMMUSANI KRISHNA CHARAN
  21: { key: 'DocScanner_4_Nov_2026_12-55/page_013.jpg' }, // 25BTREC021 LINGESH B
  22: { key: 'bio_marks/page_019.jpg' }, // 25BTREC022 MALAPATI VARSHITH REDDY
  23: { key: 'DocScanner_4_Nov_/page_007.jpg' }, // 25BTREC023 MAYANK M C
  24: { key: 'bio_marks/page_016.jpg' }, // 25BTREC024 MUKKARA PRIYATHAM RAMI REDDY
  25: { key: 'bio_marks/page_021.jpg' }, // 25BTREC025 MURAMREDDY VENKATA GANGA HRUSHIKESH REDDY
  26: { key: 'DocScanner_4_Nov_/page_004.jpg' }, // 25BTREC026 N MADHAN
  27: { key: 'bio_marks/page_013.jpg' }, // 25BTREC027 NANDIPALLI VAMSI KRISHNA
  28: { key: 'DocScanner_4_Nov_/page_001.jpg' }, // 25BTREC028 NARESH KUMAR M
  29: { key: 'DocScanner_4_Nov_/page_003.jpg' }, // 25BTREC029 NITHIN M B
  30: { key: 'DocScanner_4_Nov_2026_12-55/page_018.jpg' }, // 25BTREC030 NITHIN R
  31: { key: 'DocScanner_4_Nov_2026_12-55/page_016.jpg' }, // 25BTREC031 POOLA SAI LAHARI
  32: { key: 'bio_marks/page_009.jpg' }, // 25BTREC032 PRAFULL P INDI
  33: { absent: true }, // 25BTREC033 PRAJWAL H M (Absent)
  34: { key: 'DocScanner_4_Nov_2026_12-55/page_012.jpg' }, // 25BTREC034 PRITHVI RAJ
  35: { key: 'DocScanner_4_Nov_2026_12-55/page_002.jpg' }, // 25BTREC035 REEVE STEPHEN
  36: { key: 'DocScanner_4_Nov_2026_12-55/page_009.jpg' }, // 25BTREC036 S ABDUL HAMEED
  37: { key: 'bio_marks/page_012.jpg' }, // 25BTREC037 S DHANUSH BABU
  38: { key: 'DocScanner_4_Nov_2026_12-55/page_010.jpg' }, // 25BTREC038 S GOUTHAM
  39: { key: 'DocScanner_4_Nov_/page_019.jpg' }, // 25BTREC039 S ILAVENIL
  40: { key: 'DocScanner_4_Nov_2026_12-55/page_014.jpg' }, // 25BTREC040 SATHYAJIT DINESH
  41: { key: 'DocScanner_4_Nov_2026_12-55/page_011.jpg' }, // 25BTREC041 SHIVA DHARSAN R V
  42: { key: 'DocScanner_4_Nov_/page_023.jpg' }, // 25BTREC042 SHUBHRA MOHANTY
  43: { key: 'DocScanner_4_Nov_/page_022.jpg' }, // 25BTREC043 SOUMYA DESHMUKH
  44: { key: 'bio_marks/page_006.jpg' }, // 25BTREC044 SOUMYADEEP DAS
  45: { key: 'DocScanner_4_Nov_/page_015.jpg' }, // 25BTREC045 SPOORTHI
  46: { absent: true }, // 25BTREC046 SRI RAM K G (Highlighted red in user roster - Absent)
  47: { key: 'DocScanner_4_Nov_/page_014.jpg' }, // 25BTREC047 THANESHGHA M
  48: { key: 'DocScanner_4_Nov_/page_010.jpg' }, // 25BTREC048 THARUN T
  49: { key: 'bio_marks/page_015.jpg' }, // 25BTREC049 THIMMIREDDY PUNEETH REDDY
  50: { key: 'DocScanner_4_Nov_2026_12-55/page_005.jpg' }, // 25BTREC050 VAISHAK S
  51: { key: 'bio_marks/page_001.jpg' }, // 25BTREC051 VEERABOMMALA KHYATHI SAI
  52: { key: 'bio_marks/page_022.jpg' }, // 25BTREC052 VISHAAL MANI M
  53: { key: 'DocScanner_4_Nov_2026_12-55/page_017.jpg' }, // 25BTREC053 YEDDULA NEHA REDDY
  54: { key: 'DocScanner_4_Nov_/page_006.jpg' }, // 25BTREC054 GOKUL DEEPU K
  55: { key: 'bio_marks/page_005.jpg' }, // 25BTREC055 SHOMYA SNEHA CHOWDHURY
  56: { key: 'bio_marks/page_023.jpg' }, // JUUG26LBTECH20805 LIKHITH KUMAR K P
  57: { key: 'bio_marks/page_011.jpg' }, // JUUG26LBTECH11233 VAGGA GOWTHAM
  58: { key: 'DocScanner_4_Nov_2026_12-55/page_006.jpg' }, // JUUG26LBTECH24837 K J HOMESH
  59: { key: 'DocScanner_4_Nov_2026_12-55/page_015.jpg' }, // JUUG26LBTECH29648 G RAHITHYA
  60: { key: 'DocScanner_4_Nov_/page_008.jpg' }, // JUUG26LBTECH13963 SHIVA RAJ
  61: { key: 'DocScanner_4_Nov_/page_012.jpg' }, // JUUG26LBTECH20805 T VARSHIK
  62: { key: 'bio_marks/page_010.jpg' }, // JUUG26LBTECH17744 PIYUSH BHUSHAN
  63: { key: 'bio_marks/page_002.jpg' }, // JUUG26LBTECH12609 AASTHA SINGH
  64: { key: 'DocScanner_4_Nov_/page_009.jpg' }, // JUUG26LBTECH30627 CHINMAYA HAJERI
  65: { key: 'DocScanner_4_Nov_/page_016.jpg' }, // JUUG26LBTECH14343 NAVEEN KUMAR M
};

async function buildWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MarksSheet AI';
  workbook.created = new Date();

  // ---------------------------------------------------------
  // SHEET 1: MARKS SHEET
  // ---------------------------------------------------------
  const sheet = workbook.addWorksheet('Marks Sheet', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 5 }],
  });

  // Institution Banner
  sheet.mergeCells('A1:L1');
  const tCell = sheet.getCell('A1');
  tCell.value = 'JAIN (DEEMED-TO-BE-UNIVERSITY) - FACULTY OF ENGINEERING & TECHNOLOGY';
  tCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  tCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 28;

  // Subtitle Banner
  sheet.mergeCells('A2:L2');
  const sCell = sheet.getCell('A2');
  sCell.value = 'Term Exam I | Course: [25BSAB01] Applied Biology | Program: B.Tech ECE / Robotics (3rd Sem) | Max Marks: 50';
  sCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  sCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // Spacer
  sheet.getRow(3).height = 8;

  // Header Row 4
  const headers = ['Sl No', 'Student Name', 'USN / Reg No', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Total (Formula)', 'Total (Written)', 'Remarks / Status'];
  const hRow = sheet.getRow(4);
  hRow.values = headers;
  hRow.height = 26;
  hRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Max Marks Row 5
  const maxRow = ['-', 'MAX MARKS', '-', 10, 10, 10, 10, 10, 10, 50, 50, '-'];
  const mRow = sheet.getRow(5);
  mRow.values = maxRow;
  mRow.height = 20;
  mRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FF475569' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Fill in all 65 students
  let totalEvaluated = 0;
  let totalAbsent = 0;
  let sumAllScores = 0;
  let highestScore = 0;
  let topper = '';
  let lowestScore = 50;

  OFFICIAL_ROSTER.forEach((st, idx) => {
    const rowNum = 6 + idx;
    const r = sheet.getRow(rowNum);
    const mapInfo = studentMap[st.sl];

    let q1 = '-', q2 = '-', q3 = '-', q4 = '-', q5 = '-', q6 = '-';
    let writtenTotal = '-';
    let remarks = 'OK';
    let isAbsent = false;

    if (mapInfo.absent) {
      isAbsent = true;
      totalAbsent++;
      q1 = q2 = q3 = q4 = q5 = q6 = 'A';
      writtenTotal = 'A';
      remarks = st.sl === 46 ? 'ABSENT (Marked in Red on Roster)' : 'ABSENT';
    } else {
      totalEvaluated++;
      const data = results[mapInfo.key];
      const qm = data.q_marks || {};
      q1 = qm['1'] !== undefined ? qm['1'] : 0;
      q2 = qm['2'] !== undefined ? qm['2'] : 0;
      q3 = qm['3'] !== undefined ? qm['3'] : 0;
      q4 = qm['4'] !== undefined ? qm['4'] : 0;
      q5 = qm['5'] !== undefined ? qm['5'] : 0;
      q6 = qm['6'] !== undefined ? qm['6'] : 0;

      // Handle raw written total string if contains 24+1
      let parsedWritten = data.written_total;
      if (typeof parsedWritten === 'string' && parsedWritten.includes('+')) {
        parsedWritten = 25;
      }
      writtenTotal = Number(parsedWritten) || 0;

      const calcSum = Number(q1) + Number(q2) + Number(q3) + Number(q4) + Number(q5) + Number(q6);
      sumAllScores += calcSum;
      if (calcSum > highestScore) {
        highestScore = calcSum;
        topper = st.name;
      }
      if (calcSum < lowestScore) {
        lowestScore = calcSum;
      }

      if (Math.abs(calcSum - writtenTotal) > 0.5) {
        remarks = `MISMATCH (Written: ${writtenTotal}, Computed: ${calcSum})`;
      } else if (data.notes && data.notes.length > 0) {
        remarks = data.notes;
      }
    }

    r.values = [
      st.sl,
      st.name,
      st.usn,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      isAbsent ? 'A' : { formula: `SUM(D${rowNum}:I${rowNum})`, result: writtenTotal },
      writtenTotal,
      remarks
    ];
    r.height = 22;

    const bg = isAbsent
      ? (st.sl === 46 ? 'FFFEE2E2' : 'FFF3F4F6')
      : remarks.includes('MISMATCH')
      ? 'FFFEF3C7'
      : idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

    const textColor = isAbsent
      ? (st.sl === 46 ? 'FF991B1B' : 'FF6B7280')
      : 'FF1E293B';

    r.eachCell((cell, colNum) => {
      cell.font = {
        name: 'Calibri',
        size: 10,
        color: { argb: textColor },
        bold: colNum === 1 || colNum === 3 || colNum >= 10 || st.sl === 46,
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  // Auto-width
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 34;
  sheet.getColumn(3).width = 22;
  sheet.getColumn(4).width = 8;
  sheet.getColumn(5).width = 8;
  sheet.getColumn(6).width = 8;
  sheet.getColumn(7).width = 8;
  sheet.getColumn(8).width = 8;
  sheet.getColumn(9).width = 8;
  sheet.getColumn(10).width = 16;
  sheet.getColumn(11).width = 16;
  sheet.getColumn(12).width = 30;

  // ---------------------------------------------------------
  // SHEET 2: SUMMARY & STATS
  // ---------------------------------------------------------
  const s2 = workbook.addWorksheet('Summary & Analytics');

  s2.mergeCells('A1:E1');
  s2.getCell('A1').value = 'APPLIED BIOLOGY - BATCH EVALUATION SUMMARY';
  s2.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  s2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  s2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  s2.getRow(1).height = 28;

  const classAvg = totalEvaluated > 0 ? (sumAllScores / totalEvaluated).toFixed(1) : 0;
  const metrics = [
    ['Total Registered Candidates', 65],
    ['Present Candidates Evaluated', totalEvaluated],
    ['Absent Candidates', totalAbsent],
    ['Class Average Mark', `${classAvg} / 50`],
    ['Highest Score in Class', `${highestScore} / 50 (${topper})`],
    ['Lowest Score in Class', `${lowestScore} / 50`],
    ['Passing Criteria (Threshold)', '>= 20 Marks (40%)'],
    ['Pass Percentage', `${((OFFICIAL_ROSTER.filter(st => {
      const m = studentMap[st.sl];
      if (m.absent) return false;
      const d = results[m.key];
      return (Number(d.written_total) || 0) >= 20;
    }).length / totalEvaluated) * 100).toFixed(1)}% of present students`],
  ];

  metrics.forEach((m, idx) => {
    const r = s2.getRow(3 + idx);
    r.getCell(1).value = m[0];
    r.getCell(2).value = m[1];
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
    r.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
    r.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    r.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  s2.getColumn(1).width = 32;
  s2.getColumn(2).width = 36;

  // Save in scratch directory and Downloads folder
  const scratchFile = 'C:\\Users\\K KRISHNA CHARAN\\.gemini\\antigravity\\scratch\\markssheet-ai\\Applied_Biology_Term_Exam_1_Marks.xlsx';
  const downloadsFile = 'C:\\Users\\K KRISHNA CHARAN\\Downloads\\Applied_Biology_Term_Exam_1_Marks.xlsx';

  await workbook.xlsx.writeFile(scratchFile);
  await workbook.xlsx.writeFile(downloadsFile);

  console.log(`Successfully generated Excel workbooks:\n1. ${scratchFile}\n2. ${downloadsFile}`);
}

buildWorkbook().catch(console.error);
