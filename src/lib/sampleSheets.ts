/**
 * Generates realistic student score sheet images using HTML5 Canvas
 * so teachers can test the app instantly out of the box!
 */

export interface SampleSheetConfig {
  name: string;
  usn: string;
  subject: string;
  exam: string;
  rows: Array<{
    q_no: string;
    max: number;
    marks: number | string;
    crossedOut?: number | string;
  }>;
  writtenTotal: number | string;
  hasMismatch?: boolean;
}

export const SAMPLE_SHEETS_DATA: SampleSheetConfig[] = [
  {
    name: 'ARUN KUMAR R',
    usn: '1MS23CS015',
    subject: 'Data Structures & Applications (BCS301)',
    exam: 'Continuous Internal Evaluation - I',
    rows: [
      { q_no: '1a', max: 10, marks: 8.5 },
      { q_no: '1b', max: 10, marks: 9 },
      { q_no: '2a', max: 10, marks: 7.5 },
      { q_no: '2b', max: 10, marks: 8 },
      { q_no: '3a', max: 10, marks: 9 },
    ],
    writtenTotal: 42,
  },
  {
    name: 'BHAVANA S',
    usn: '1MS23CS028',
    subject: 'Data Structures & Applications (BCS301)',
    exam: 'Continuous Internal Evaluation - I',
    rows: [
      { q_no: '1a', max: 10, marks: 7 },
      { q_no: '1b', max: 10, marks: 6.5, crossedOut: 4 }, // Overwritten mark!
      { q_no: '2a', max: 10, marks: 8.5 },
      { q_no: '2b', max: 10, marks: 7 },
      { q_no: '3a', max: 10, marks: 6 },
    ],
    writtenTotal: 35,
  },
  {
    name: 'CHIRAG MUKHERJEE',
    usn: '1MS23CS034',
    subject: 'Data Structures & Applications (BCS301)',
    exam: 'Continuous Internal Evaluation - I',
    rows: [
      { q_no: '1a', max: 10, marks: 9.5 },
      { q_no: '1b', max: 10, marks: 8 },
      { q_no: '2a', max: 10, marks: 7.5 },
      { q_no: '2b', max: 10, marks: 9 },
      { q_no: '3a', max: 10, marks: 8.5 },
    ],
    // Sum is 42.5, but teacher accidentally wrote 45 (Total Mismatch!)
    writtenTotal: 45,
    hasMismatch: true,
  },
  {
    name: 'DARSHAN GOWDA',
    usn: '1MS23CS042',
    subject: 'Data Structures & Applications (BCS301)',
    exam: 'Continuous Internal Evaluation - I',
    rows: [
      { q_no: '1a', max: 10, marks: 'A' },
      { q_no: '1b', max: 10, marks: 'A' },
      { q_no: '2a', max: 10, marks: 'A' },
      { q_no: '2b', max: 10, marks: 'A' },
      { q_no: '3a', max: 10, marks: 'A' },
    ],
    writtenTotal: 'A',
  },
];

export function createSampleScoreSheetImage(config: SampleSheetConfig): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Realistic slightly warm paper tone
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer paper border
  ctx.strokeStyle = '#d4cebe';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Institutional Header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', canvas.width / 2, 80);

  ctx.font = '16px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(config.exam, canvas.width / 2, 110);
  ctx.fillText(config.subject, canvas.width / 2, 135);

  // Horizontal divider
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 155);
  ctx.lineTo(canvas.width - 60, 155);
  ctx.stroke();

  // Student Info Box
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.fillRect(60, 175, canvas.width - 120, 100);
  ctx.strokeRect(60, 175, canvas.width - 120, 100);

  // USN & Name Labels
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText('USN / REG NO:', 80, 210);
  ctx.fillText('STUDENT NAME:', 80, 250);

  // Handwritten Student Info (Blue ink)
  ctx.font = 'italic bold 22px "Courier New", Courier, monospace';
  ctx.fillStyle = '#1e3a8a'; // Blue ink
  ctx.fillText(config.usn, 240, 210);
  ctx.fillText(config.name, 240, 250);

  // Marks Evaluation Table
  const tableX = 60;
  const tableY = 310;
  const tableW = canvas.width - 120;
  const rowH = 50;

  // Header row
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(tableX, tableY, tableW, rowH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tableX, tableY, tableW, rowH);

  // Columns: Q.No (150px) | Max Marks (180px) | Marks Awarded (remaining)
  const col1W = 160;
  const col2W = 180;
  const col3W = tableW - col1W - col2W;

  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('Question No.', tableX + col1W / 2, tableY + 32);
  ctx.fillText('Max Marks', tableX + col1W + col2W / 2, tableY + 32);
  ctx.fillText('Marks Awarded', tableX + col1W + col2W + col3W / 2, tableY + 32);

  // Vertical column borders in header
  ctx.beginPath();
  ctx.moveTo(tableX + col1W, tableY);
  ctx.lineTo(tableX + col1W, tableY + rowH);
  ctx.moveTo(tableX + col1W + col2W, tableY);
  ctx.lineTo(tableX + col1W + col2W, tableY + rowH);
  ctx.stroke();

  // Draw Table Rows
  let currentY = tableY + rowH;
  config.rows.forEach((row, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(tableX, currentY, tableW, rowH);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(tableX, currentY, tableW, rowH);

    // Q.No & Max Marks
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(row.q_no, tableX + col1W / 2, currentY + 32);
    ctx.fillText(String(row.max), tableX + col1W + col2W / 2, currentY + 32);

    // Marks Awarded (Simulated Handwritten Blue/Black Ink)
    const marksX = tableX + col1W + col2W + col3W / 2;
    const marksY = currentY + 34;

    if (row.crossedOut !== undefined) {
      // Draw crossed out number with red line
      ctx.font = '22px "Comic Sans MS", cursive, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(String(row.crossedOut), marksX - 35, marksY);

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(marksX - 50, marksY - 8);
      ctx.lineTo(marksX - 20, marksY - 8);
      ctx.stroke();

      // New handwritten mark above or next to it
      ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText(String(row.marks), marksX + 25, marksY);
    } else {
      ctx.font = 'bold 25px "Comic Sans MS", cursive, sans-serif';
      ctx.fillStyle = row.marks === 'A' ? '#dc2626' : '#1e3a8a';
      ctx.fillText(String(row.marks), marksX, marksY);
    }

    // Grid vertical lines
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(tableX + col1W, currentY);
    ctx.lineTo(tableX + col1W, currentY + rowH);
    ctx.moveTo(tableX + col1W + col2W, currentY);
    ctx.lineTo(tableX + col1W + col2W, currentY + rowH);
    ctx.stroke();

    currentY += rowH;
  });

  // Total Row
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(tableX, currentY, tableW, rowH + 10);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(tableX, currentY, tableW, rowH + 10);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('GRAND TOTAL', tableX + (col1W + col2W) / 2, currentY + 38);

  // Handwritten Total
  ctx.font = 'bold 28px "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = '#097969'; // Dark greenish-blue examiner ink
  ctx.fillText(
    String(config.writtenTotal),
    tableX + col1W + col2W + col3W / 2,
    currentY + 40
  );

  // Examiner signature block
  const sigY = currentY + rowH + 60;
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'left';
  ctx.fillText('Examiner Signature:', tableX + 30, sigY);

  // Cursive signature
  ctx.font = 'italic 26px "Brush Script MT", cursive, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('K. S. Narayanan', tableX + 180, sigY + 5);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'right';
  ctx.fillText('Date: 04/11/2026', canvas.width - tableX - 30, sigY);

  return canvas.toDataURL('image/jpeg', 0.9);
}
