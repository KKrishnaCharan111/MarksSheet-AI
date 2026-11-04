export interface QuestionMark {
  q_no: string;
  marks: number | string;
  max_marks: number;
  confidence?: number;
}

export interface StudentScore {
  id: string;
  pageNumber: number;
  fileName: string;
  imageUrl: string;
  name: string;
  usn: string;
  questions: QuestionMark[];
  total: number | string;
  computedTotal: number;
  confidence: number;
  uncertain_fields: string[];
  totalMismatch: boolean;
  totalMismatchReason?: string;
  usnValid: boolean;
  isAbsent: boolean;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export interface ExamTemplate {
  id: string;
  name: string;
  institutionName: string;
  subjectCode: string;
  subjectName: string;
  examName: string;
  questions: Array<{ q_no: string; max_marks: number }>;
  maxTotalMarks: number;
  passMarks: number;
  usnPattern: string;
  usnHint: string;
}

export interface ExtractionResponse {
  name: string;
  usn: string;
  questions: Array<{
    q_no: string;
    marks: number | string;
    max_marks: number;
  }>;
  total: number | string;
  confidence: number;
  uncertain_fields: string[];
}

export interface QueueItem {
  id: string;
  file: File;
  pageNumber: number;
  totalPages: number;
  status: 'queued' | 'rendering' | 'extracting' | 'completed' | 'error';
  progress: number;
  imageUrl?: string;
  score?: StudentScore;
  error?: string;
}
