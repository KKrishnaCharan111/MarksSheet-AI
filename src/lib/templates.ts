import { ExamTemplate, QuestionMark } from '@/types';

export const DEFAULT_TEMPLATES: ExamTemplate[] = [
  {
    id: 'vtu-cie-50',
    name: 'VTU CIE Test (50 Marks - 5 Questions)',
    institutionName: 'Visvesvaraya Technological University',
    subjectCode: 'BCS301',
    subjectName: 'Data Structures & Applications',
    examName: 'Continuous Internal Evaluation - I',
    questions: [
      { q_no: '1a', max_marks: 10 },
      { q_no: '1b', max_marks: 10 },
      { q_no: '2a', max_marks: 10 },
      { q_no: '2b', max_marks: 10 },
      { q_no: '3a', max_marks: 10 },
    ],
    maxTotalMarks: 50,
    passMarks: 20,
    usnPattern: '^1[A-Za-z]{2}\\d{2}[A-Za-z]{2}\\d{3}$',
    usnHint: 'e.g. 1MS23CS001 (VTU 10-char format)',
  },
  {
    id: 'college-cie-30',
    name: 'College Internal Test (30 Marks - 6 Sub-questions)',
    institutionName: 'Engineering College',
    subjectCode: 'EC402',
    subjectName: 'Microcontrollers & Embedded Systems',
    examName: 'Internal Assessment - II',
    questions: [
      { q_no: '1a', max_marks: 5 },
      { q_no: '1b', max_marks: 5 },
      { q_no: '2a', max_marks: 5 },
      { q_no: '2b', max_marks: 5 },
      { q_no: '3a', max_marks: 5 },
      { q_no: '3b', max_marks: 5 },
    ],
    maxTotalMarks: 30,
    passMarks: 12,
    usnPattern: '^[A-Za-z0-9\\-]+$',
    usnHint: 'Alphanumeric Roll No / USN',
  },
  {
    id: 'see-100',
    name: 'Semester End Examination (100 Marks - 5 Modules)',
    institutionName: 'Autonomous Institute of Technology',
    subjectCode: '21CS51',
    subjectName: 'Artificial Intelligence & Machine Learning',
    examName: 'Semester End Exam (SEE)',
    questions: [
      { q_no: 'Q1', max_marks: 20 },
      { q_no: 'Q2', max_marks: 20 },
      { q_no: 'Q3', max_marks: 20 },
      { q_no: 'Q4', max_marks: 20 },
      { q_no: 'Q5', max_marks: 20 },
    ],
    maxTotalMarks: 100,
    passMarks: 40,
    usnPattern: '^1[A-Za-z]{2}\\d{2}[A-Za-z]{2}\\d{3}$',
    usnHint: 'e.g. 1RV22AI042',
  },
  {
    id: 'quiz-20',
    name: 'Class Quiz / Assignment (20 Marks)',
    institutionName: 'Department of Computer Science',
    subjectCode: 'CS204',
    subjectName: 'Operating Systems',
    examName: 'Quiz / Lab Evaluation',
    questions: [
      { q_no: 'Q1', max_marks: 5 },
      { q_no: 'Q2', max_marks: 5 },
      { q_no: 'Q3', max_marks: 5 },
      { q_no: 'Q4', max_marks: 5 },
    ],
    maxTotalMarks: 20,
    passMarks: 8,
    usnPattern: '^[A-Za-z0-9\\-]+$',
    usnHint: 'Any Student ID',
  },
];

const STORAGE_KEY = 'markssheet_ai_templates';
const ACTIVE_TEMPLATE_KEY = 'markssheet_ai_active_template_id';

export function getSavedTemplates(): ExamTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: ExamTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates to localStorage', err);
  }
}

export function getActiveTemplateId(): string {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES[0].id;
  try {
    return localStorage.getItem(ACTIVE_TEMPLATE_KEY) || DEFAULT_TEMPLATES[0].id;
  } catch {
    return DEFAULT_TEMPLATES[0].id;
  }
}

export function setActiveTemplateId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
  } catch (err) {
    console.error('Failed to save active template id', err);
  }
}

/**
 * Calculates sum of marks array, gracefully handling 'A', '-', string numbers, half marks
 */
export function calculateSum(questions: QuestionMark[]): number {
  if (!questions || !Array.isArray(questions)) return 0;
  let sum = 0;
  for (const q of questions) {
    const val = q.marks;
    if (typeof val === 'number' && !isNaN(val)) {
      sum += val;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === 'A' || trimmed === 'AB' || trimmed === '-' || trimmed === '' || trimmed.toLowerCase() === 'absent') {
        continue;
      }
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        sum += parsed;
      }
    }
  }
  // round to 1 decimal place to prevent floating point inaccuracies
  return Math.round(sum * 10) / 10;
}

/**
 * Checks if a student is absent based on marks
 */
export function checkIfAbsent(questions: QuestionMark[], total: number | string): boolean {
  if (typeof total === 'string' && (total.toUpperCase() === 'A' || total.toUpperCase() === 'AB' || total.toLowerCase() === 'absent')) {
    return true;
  }
  if (!questions || questions.length === 0) return false;
  return questions.every((q) => {
    const val = String(q.marks).trim().toUpperCase();
    return val === 'A' || val === 'AB' || val === 'ABSENT' || val === '-';
  });
}

/**
 * Validates a USN string against a regex pattern
 */
export function validateUsn(usn: string, pattern: string): boolean {
  if (!usn) return false;
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(usn.trim());
  } catch {
    return true; // if regex is invalid, don't block
  }
}
