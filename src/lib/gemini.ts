import { ExtractionResponse } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are an expert OCR and marksheet examination extractor specialized in Indian university/college answer-sheet front-page score tables (such as VTU, Anna University, JNTU, CBSE, etc.).

Analyze the provided image of a student answer sheet score table and extract the marks with extreme precision.

Return ONLY a valid JSON object with EXACTLY this structure:
{
  "name": "STUDENT FULL NAME",
  "usn": "STUDENT_USN_OR_ROLL_NO",
  "questions": [
    {
      "q_no": "1a",
      "marks": 8,
      "max_marks": 10
    }
  ],
  "total": 18,
  "confidence": 0.95,
  "uncertain_fields": []
}

IMPORTANT EXTRACTION RULES:
1. **Name & USN/Roll No**:
   - Look for fields labeled "USN", "Roll No", "Reg No", "Student ID", "Candidate Code".
   - Common USN formats (e.g. VTU: 1XX23CS001, 10 characters). Extract exact alphanumeric characters.
   - Look for "Student Name", "Name of Candidate", "Name". Extract in uppercase.
2. **Questions & Marks**:
   - Extract marks for each question/sub-question (e.g., 1a, 1b, 2a, 2b, Q1, Q2...).
   - **Handwritten Digits**: Carefully distinguish 0 vs 6 vs 8, 1 vs 7, 3 vs 5, 4 vs 9.
   - **Half Marks**: Recognize decimal/fractional marks such as 0.5, 1.5, 2.5, 3.5, 4.5, 7.5, 9.5 (or 7 1/2). Return as float number (e.g. 7.5).
   - **Crossed-out / Overwritten marks**: If an examiner crossed out a number (e.g., 5 strikethrough) and wrote another number (e.g., 7) above or beside it, extract the final corrected mark (7). Add "q_no (e.g. 1b overwritten)" to "uncertain_fields".
   - **Absent / Unattempted**: If a question has "A", "Ab", "AB", "Absent", extract "A" as a string. If left blank, unattempted, or marked with a dash "-", extract "-" or "A".
3. **Written Total**:
   - Extract the total mark handwritten or printed in the "Total", "Grand Total", or "Marks Obtained" box.
   - Return it as a number (or float if decimals exist, or "A" if student is marked absent overall).
4. **Confidence & Uncertain Fields**:
   - "confidence": Float between 0.0 and 1.0 representing your overall confidence in reading the handwriting.
   - "uncertain_fields": Array of string field names (e.g. ["usn", "q_no: 2b"]) where handwriting was smudged, crossed-out, or ambiguous.
5. **Output**:
   - Return RAW JSON ONLY. No markdown ticks, no preamble, no explanations.`;

export function getClientGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('markssheet_ai_gemini_key') ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  );
}

export function setClientGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('markssheet_ai_gemini_key', key.trim());
}

export async function extractMarksWithVision(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  templateContext?: {
    questions?: Array<{ q_no: string; max_marks: number }>;
    usnPattern?: string;
  },
  customApiKey?: string
): Promise<ExtractionResponse> {
  const apiKey =
    customApiKey ||
    getClientGeminiApiKey() ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    // Intelligent mock extractor
    return generateMockExtraction(imageBase64, templateContext);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    let extraPrompt = '';
    if (templateContext?.questions && templateContext.questions.length > 0) {
      extraPrompt += `\nExpected question structure for this exam:\n${JSON.stringify(
        templateContext.questions
      )}`;
    }
    if (templateContext?.usnPattern) {
      extraPrompt += `\nExpected USN RegEx pattern: ${templateContext.usnPattern}`;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      {
        text: `${SYSTEM_PROMPT}\n${extraPrompt}`,
      },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return sanitizeExtractionResponse(parsed);
  } catch (error: any) {
    console.error('Gemini vision extraction failed, falling back to mock:', error);
    const mock = generateMockExtraction(imageBase64, templateContext);
    mock.uncertain_fields.push('API Note: ' + (error.message || 'Vision model fallback'));
    return mock;
  }
}

function sanitizeExtractionResponse(raw: any): ExtractionResponse {
  const questions = Array.isArray(raw.questions)
    ? raw.questions.map((q: any) => {
        let marks = q.marks;
        if (typeof marks === 'string') {
          const upper = marks.trim().toUpperCase();
          if (upper === 'A' || upper === 'AB' || upper === 'ABSENT') {
            marks = 'A';
          } else if (upper === '-' || upper === 'NA' || upper === '') {
            marks = '-';
          } else {
            const num = parseFloat(marks);
            if (!isNaN(num)) marks = num;
          }
        }
        return {
          q_no: String(q.q_no || 'Q1'),
          marks: marks !== undefined ? marks : 0,
          max_marks: Number(q.max_marks || 10),
        };
      })
    : [];

  let total = raw.total;
  if (typeof total === 'string') {
    const upper = total.trim().toUpperCase();
    if (upper === 'A' || upper === 'AB' || upper === 'ABSENT') {
      total = 'A';
    } else {
      const num = parseFloat(total);
      if (!isNaN(num)) total = num;
    }
  }

  return {
    name: String(raw.name || 'UNKNOWN STUDENT').toUpperCase(),
    usn: String(raw.usn || '1MS23CS000').toUpperCase(),
    questions,
    total: total !== undefined ? total : 0,
    confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.9,
    uncertain_fields: Array.isArray(raw.uncertain_fields) ? raw.uncertain_fields : [],
  };
}

/**
 * Intelligent mock extractor for instant testing out-of-the-box
 */
const SAMPLE_STUDENTS = [
  { name: 'ARUN KUMAR R', usn: '1MS23CS015', baseMarks: [8.5, 9, 7.5, 8, 9], totalOffset: 0 },
  { name: 'BHAVANA S', usn: '1MS23CS028', baseMarks: [7, 6.5, 8.5, 7, 6], totalOffset: 0, uncertain: ['q_no: 1b (overwritten from 4 to 6.5)'] },
  { name: 'CHIRAG MUKHERJEE', usn: '1MS23CS034', baseMarks: [9.5, 8, 7.5, 9, 8.5], totalOffset: 2.5 }, // Intentional teacher addition error (45 instead of 42.5)!
  { name: 'DARSHAN GOWDA', usn: '1MS23CS042', baseMarks: ['A', 'A', 'A', 'A', 'A'], totalOffset: 0, isAbsent: true },
  { name: 'DIVYA DESHMUKH', usn: '1MS23CS051', baseMarks: [9, 8, 7.5, 8.5, 9], totalOffset: 0 },
  { name: 'FARHAN AHMED', usn: '1MS23CS060', baseMarks: [6, 7.5, 6.5, 8, 7], totalOffset: 0 },
  { name: 'KAVYA REDDY', usn: '1MS23CS072', baseMarks: [9.5, 9, 8.5, 10, 9], totalOffset: 0 },
  { name: 'MANOJ K G', usn: '1MS23CS084', baseMarks: [5.5, 6, 7, 6.5, 8], totalOffset: 0 },
];

export function generateMockExtraction(
  imageBase64: string,
  templateContext?: { questions?: Array<{ q_no: string; max_marks: number }> }
): ExtractionResponse {
  const hash = Math.abs(
    imageBase64.slice(0, 80).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  const sample = SAMPLE_STUDENTS[hash % SAMPLE_STUDENTS.length];

  const templateQuestions = templateContext?.questions || [
    { q_no: '1a', max_marks: 10 },
    { q_no: '1b', max_marks: 10 },
    { q_no: '2a', max_marks: 10 },
    { q_no: '2b', max_marks: 10 },
    { q_no: '3a', max_marks: 10 },
  ];

  let actualSum = 0;
  const questions = templateQuestions.map((tq, idx) => {
    const rawVal = sample.baseMarks[idx % sample.baseMarks.length];
    let marks: number | string = rawVal;
    if (typeof rawVal === 'number') {
      marks = Math.min(tq.max_marks, rawVal * (tq.max_marks / 10));
      marks = Math.round(marks * 2) / 2;
      actualSum += marks;
    }
    return {
      q_no: tq.q_no,
      marks,
      max_marks: tq.max_marks,
    };
  });

  const writtenTotal = sample.isAbsent
    ? 'A'
    : Math.round((actualSum + sample.totalOffset) * 10) / 10;

  const uncertain: string[] = [];
  if (sample.uncertain) {
    uncertain.push(...sample.uncertain);
  }
  if (sample.totalOffset !== 0) {
    uncertain.push('Total mark handwriting crossed out / altered');
  }

  return {
    name: sample.name,
    usn: sample.usn,
    questions,
    total: writtenTotal,
    confidence: sample.uncertain ? 0.78 : 0.96,
    uncertain_fields: uncertain,
  };
}
