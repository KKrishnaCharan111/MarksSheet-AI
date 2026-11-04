import { ExamTemplate, StudentScore } from '@/types';
import ExcelJS from 'exceljs';

export async function generateMarksSheetWorkbook(
  students: StudentScore[],
  template: ExamTemplate,
  sortBy: 'usn' | 'name' | 'slno' = 'usn'
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MarksSheet AI';
  workbook.lastModifiedBy = 'MarksSheet AI';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sort students
  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === 'usn') {
      return (a.usn || '').localeCompare(b.usn || '');
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  // ----------------------------------------------------
  // SHEET 1: MARKS SHEET
  // ----------------------------------------------------
  const sheet = workbook.addWorksheet('Marks Sheet', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 5 }],
  });

  // Title Block
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = template.institutionName || 'INSTITUTION EXAMINATION SCORE SHEET';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate 800
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells('A2:J2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = `${template.examName || 'Assessment'} | Subject: ${
    template.subjectCode ? `[${template.subjectCode}] ` : ''
  }${template.subjectName || ''} | Max Marks: ${template.maxTotalMarks}`;
  subtitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' }, // Slate 200
  };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // Blank spacer row 3
  sheet.getRow(3).height = 8;

  // Header Row 4: Column titles
  const headers = ['Sl No', 'Student Name', 'USN / Reg No'];
  template.questions.forEach((q) => headers.push(q.q_no));
  headers.push('Total (Formula)', 'Total (Written)', 'Status / Remarks');

  const headerRow = sheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' }, // Indigo 900
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Subheader Row 5: Max Marks per question
  const maxMarksRowValues = ['-', 'MAX MARKS', '-'];
  template.questions.forEach((q) => maxMarksRowValues.push(String(q.max_marks)));
  maxMarksRowValues.push(String(template.maxTotalMarks), String(template.maxTotalMarks), '-');

  const subHeaderRow = sheet.getRow(5);
  subHeaderRow.values = maxMarksRowValues;
  subHeaderRow.height = 20;
  subHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FF475569' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEF2FF' }, // Indigo 50
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF6366F1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Calculate question column letter indices
  // Col A=1, B=2, C=3, Question 1 begins at Col D (4)
  const firstQuestionColLetter = 'D';
  const lastQuestionColIndex = 3 + template.questions.length;
  const lastQuestionColLetter = getExcelColLetter(lastQuestionColIndex);
  const totalFormulaColLetter = getExcelColLetter(lastQuestionColIndex + 1);

  // Populate Student Rows
  sortedStudents.forEach((student, index) => {
    const rowIndex = 6 + index;
    const row = sheet.getRow(rowIndex);

    // Map questions to match template order
    const questionMarksValues = template.questions.map((tq) => {
      const match = student.questions.find(
        (sq) => sq.q_no.toLowerCase().trim() === tq.q_no.toLowerCase().trim()
      );
      if (!match) return '-';
      if (typeof match.marks === 'number') return match.marks;
      return match.marks || '-';
    });

    const isMismatch = student.totalMismatch;
    const isAbsent = student.isAbsent;
    let remarks = 'OK';
    if (isAbsent) remarks = 'ABSENT';
    else if (isMismatch) remarks = `MISMATCH (Written: ${student.total})`;
    else if (student.confidence < 0.8) remarks = 'LOW CONFIDENCE';

    const rowValues = [
      index + 1,
      student.name || 'UNKNOWN',
      student.usn || '-',
      ...questionMarksValues,
      { formula: `SUM(${firstQuestionColLetter}${rowIndex}:${lastQuestionColLetter}${rowIndex})`, result: student.computedTotal },
      student.total,
      remarks,
    ];

    row.values = rowValues;
    row.height = 22;

    // Apply styles per row
    const isEven = index % 2 === 0;
    const baseBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';
    let fillBg = baseBg;
    let textColor = 'FF1E293B';

    if (isMismatch) {
      fillBg = 'FFFEE2E2'; // Soft red
      textColor = 'FF991B1B';
    } else if (isAbsent) {
      fillBg = 'FFF3F4F6'; // Gray
      textColor = 'FF6B7280';
    } else if (student.confidence < 0.8) {
      fillBg = 'FFFEF3C7'; // Soft yellow
      textColor = 'FF92400E';
    }

    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 10,
        color: { argb: textColor },
        bold: colNumber === 1 || colNumber === 3 || colNumber > lastQuestionColIndex,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      // Alignment
      if (colNumber === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // Auto-fit column widths
  sheet.getColumn(1).width = 8; // Sl No
  sheet.getColumn(2).width = 28; // Name
  sheet.getColumn(3).width = 18; // USN
  for (let c = 4; c <= lastQuestionColIndex; c++) {
    sheet.getColumn(c).width = 10;
  }
  sheet.getColumn(lastQuestionColIndex + 1).width = 16; // Formula Total
  sheet.getColumn(lastQuestionColIndex + 2).width = 16; // Written Total
  sheet.getColumn(lastQuestionColIndex + 3).width = 24; // Remarks

  // ----------------------------------------------------
  // SHEET 2: SUMMARY & ANALYTICS
  // ----------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary & Analytics');

  summarySheet.mergeCells('A1:F1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'BATCH PERFORMANCE SUMMARY & QUESTION-WISE ANALYTICS';
  sumTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  sumTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 28;

  // Compute stats
  const totalStudents = sortedStudents.length;
  const presentStudents = sortedStudents.filter((s) => !s.isAbsent);
  const absentCount = totalStudents - presentStudents.length;

  const validScores = presentStudents.map((s) => s.computedTotal);
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const averageScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : 0;

  const passedCount = validScores.filter((score) => score >= template.passMarks).length;
  const passPercentage =
    validScores.length > 0 ? Math.round((passedCount / validScores.length) * 1000) / 10 : 0;

  // Key KPI Cards Table
  summarySheet.mergeCells('A3:D3');
  summarySheet.getCell('A3').value = '1. OVERALL CLASS METRICS';
  summarySheet.getCell('A3').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E293B' } };

  const metrics = [
    ['Total Registered Candidates', totalStudents],
    ['Present Candidates', presentStudents.length],
    ['Absent Candidates', absentCount],
    ['Class Average Mark', `${averageScore} / ${template.maxTotalMarks}`],
    ['Highest Mark in Batch', `${highestScore} / ${template.maxTotalMarks}`],
    ['Lowest Mark in Batch', `${lowestScore} / ${template.maxTotalMarks}`],
    ['Passing Criteria (Threshold)', `>= ${template.passMarks} Marks`],
    ['Passing Students Count', `${passedCount} of ${presentStudents.length}`],
    ['Pass Percentage', `${passPercentage}%`],
  ];

  metrics.forEach((m, idx) => {
    const rowNum = 4 + idx;
    const r = summarySheet.getRow(rowNum);
    r.getCell(1).value = m[0];
    r.getCell(2).value = m[1];

    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
    r.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };

    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

    r.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    r.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    r.getCell(2).alignment = { horizontal: 'center' };
  });

  // Question-wise Analytics Table
  const qTableStart = 15;
  summarySheet.mergeCells(`A${qTableStart}:F${qTableStart}`);
  summarySheet.getCell(`A${qTableStart}`).value = '2. QUESTION-WISE PERFORMANCE ANALYSIS';
  summarySheet.getCell(`A${qTableStart}`).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E293B' } };

  const qHeaders = ['Question No', 'Max Marks', 'Attempt Count', 'Average Score', 'Scoring Rate %', 'Difficulty Level'];
  const qHeadRow = summarySheet.getRow(qTableStart + 1);
  qHeadRow.values = qHeaders;
  qHeadRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  template.questions.forEach((tq, qIdx) => {
    const qRowIndex = qTableStart + 2 + qIdx;
    const r = summarySheet.getRow(qRowIndex);

    // Calculate question stats
    let attempted = 0;
    let sumScore = 0;
    sortedStudents.forEach((student) => {
      const q = student.questions.find((sq) => sq.q_no.toLowerCase().trim() === tq.q_no.toLowerCase().trim());
      if (q && typeof q.marks === 'number') {
        attempted++;
        sumScore += q.marks;
      }
    });

    const qAvg = attempted > 0 ? Math.round((sumScore / attempted) * 10) / 10 : 0;
    const scoringRate = tq.max_marks > 0 ? Math.round((qAvg / tq.max_marks) * 1000) / 10 : 0;
    let difficulty = 'Moderate';
    if (scoringRate >= 75) difficulty = 'Easy';
    else if (scoringRate < 45) difficulty = 'Challenging';

    r.values = [tq.q_no, tq.max_marks, attempted, qAvg, `${scoringRate}%`, difficulty];
    r.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: qIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' },
      };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center' };
    });
  });

  summarySheet.getColumn(1).width = 28;
  summarySheet.getColumn(2).width = 16;
  summarySheet.getColumn(3).width = 16;
  summarySheet.getColumn(4).width = 16;
  summarySheet.getColumn(5).width = 18;
  summarySheet.getColumn(6).width = 18;

  // Generate buffer and blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function getExcelColLetter(colIndex: number): string {
  let letter = '';
  while (colIndex > 0) {
    const remainder = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return letter;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}
