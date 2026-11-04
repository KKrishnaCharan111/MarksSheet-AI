import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MarksSheet AI';
  workbook.lastModifiedBy = 'MarksSheet AI';
  workbook.created = new Date();

  // SHEET 1: Marks Sheet
  const sheet = workbook.addWorksheet('Marks Sheet', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 5 }],
  });

  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'VISVESVARAYA TECHNOLOGICAL UNIVERSITY';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells('A2:J2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = 'Continuous Internal Evaluation - I | Subject: [BCS301] Data Structures & Applications | Max Marks: 50';
  subtitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  sheet.getRow(3).height = 8;

  const headers = ['Sl No', 'Student Name', 'USN / Reg No', '1a', '1b', '2a', '2b', '3a', 'Total (Formula)', 'Total (Written)', 'Status / Remarks'];
  const hRow = sheet.getRow(4);
  hRow.values = headers;
  hRow.height = 26;
  hRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const maxRow = ['-', 'MAX MARKS', '-', 10, 10, 10, 10, 10, 50, 50, '-'];
  const mRow = sheet.getRow(5);
  mRow.values = maxRow;
  mRow.height = 20;
  mRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FF475569' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const sampleStudents = [
    { name: 'ARUN KUMAR R', usn: '1MS23CS015', q: [8.5, 9, 7.5, 8, 9], total: 42, written: 42, remarks: 'OK' },
    { name: 'BHAVANA S', usn: '1MS23CS028', q: [7, 6.5, 8.5, 7, 6], total: 35, written: 35, remarks: 'OK (Overwritten 1b)' },
    { name: 'CHIRAG MUKHERJEE', usn: '1MS23CS034', q: [9.5, 8, 7.5, 9, 8.5], total: 42.5, written: 45, remarks: 'MISMATCH (Written: 45)' },
    { name: 'DARSHAN GOWDA', usn: '1MS23CS042', q: ['A', 'A', 'A', 'A', 'A'], total: 0, written: 'A', remarks: 'ABSENT' },
  ];

  sampleStudents.forEach((st, idx) => {
    const rowNum = 6 + idx;
    const r = sheet.getRow(rowNum);
    r.values = [
      idx + 1,
      st.name,
      st.usn,
      ...st.q,
      { formula: `SUM(D${rowNum}:H${rowNum})`, result: st.total },
      st.written,
      st.remarks,
    ];
    r.height = 22;

    const isMismatch = st.remarks.includes('MISMATCH');
    const isAbsent = st.remarks === 'ABSENT';
    const bg = isMismatch ? 'FFFEE2E2' : isAbsent ? 'FFF3F4F6' : idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    const color = isMismatch ? 'FF991B1B' : isAbsent ? 'FF6B7280' : 'FF1E293B';

    r.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: color }, bold: colNum === 1 || colNum === 3 || colNum >= 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 26;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 10;
  sheet.getColumn(7).width = 10;
  sheet.getColumn(8).width = 10;
  sheet.getColumn(9).width = 16;
  sheet.getColumn(10).width = 16;
  sheet.getColumn(11).width = 24;

  // SHEET 2: Summary & Analytics
  const s2 = workbook.addWorksheet('Summary & Analytics');
  s2.mergeCells('A1:E1');
  s2.getCell('A1').value = 'BATCH PERFORMANCE SUMMARY & QUESTION ANALYTICS';
  s2.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  s2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  s2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  s2.getRow(1).height = 28;

  const metrics = [
    ['Total Registered Candidates', 4],
    ['Present Candidates', 3],
    ['Absent Candidates', 1],
    ['Class Average Mark', '39.8 / 50'],
    ['Highest Mark in Batch', '42.5 / 50 (Chirag Mukherjee)'],
    ['Lowest Mark in Batch', '35.0 / 50 (Bhavana S)'],
    ['Pass Percentage (>= 20 Marks)', '100% of present candidates'],
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

  s2.getColumn(1).width = 30;
  s2.getColumn(2).width = 28;

  const destPath = path.resolve('sample-marks.xlsx');
  await workbook.xlsx.writeFile(destPath);
  console.log(`Successfully generated sample Excel spreadsheet at: ${destPath}`);
}

main().catch(console.error);
