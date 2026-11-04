# MarksSheet AI 📝⚡📊

> **Automated Student Answer-Sheet Marks Extraction & Formatted Excel Export**  
> Built for university & college educators to eliminate tedious manual score entry from handwritten answer scripts.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KKrishnaCharan111/MarksSheet-AI&env=GEMINI_API_KEY,GEMINI_MODEL&envDescription=Google%20Gemini%20API%20Key%20from%20Google%20AI%20Studio&envLink=https://aistudio.google.com/)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/KKrishnaCharan111/MarksSheet-AI)

---

## 🌟 Key Features

1. **Multi-Format Upload & Page Extraction**
   - Drag-and-drop or file picker for **PDF, JPG, PNG, HEIC, and WebP**.
   - Handles multi-student single PDF files (automatic page-by-page slicing using client-side `pdf.js`) as well as individual files.
   - Mobile-first camera capture button for snapping physical papers directly in class or evaluation centers.
   - One-click **"Load Sample Score Sheets"** button with pre-rendered synthetic answer scripts to test the complete workflow out of the box.

2. **AI-Powered Handwritten Vision OCR**
   - High-resolution (2.0x scale / ~150-200 DPI) rendering of answer sheets.
   - Powered by **Google Gemini Vision API** (`gemini-1.5-flash` or `gemini-2.5-flash`) via `@google/generative-ai`.
   - Built-in intelligent mock fallback for testing without an API key.
   - Extracts student Name, USN/Roll No, individual question marks, and written grand total.
   - Accurately interprets **handwritten digits, half marks (e.g. 7.5, 8.5), crossed-out/overwritten marks, and absent markers ('A', '-')**.
   - Parallel queue worker with configurable concurrency (2 to 5 parallel pages) and exponential backoff retry.

3. **Smart Audit & Total Mismatch Detection**
   - Dynamically calculates the sum of all individual question marks.
   - Flags **Total Mismatch** in red if the teacher's handwritten sum differs from the individual marks sum.
   - Validates student USN format against configurable RegEx patterns (e.g. standard VTU `1XX23CS001`).
   - One-click **"Auto-Fix All Mismatches"** button to replace erroneous handwritten totals with the mathematically verified sum.

4. **Interactive Review & Verification Workspace**
   - Side-by-side verification: original score sheet image on the left with **interactive Pan, Zoom (50% - 400%), and 90° Rotation**, and the editable data table on the right.
   - Low-confidence fields highlighted in yellow; mismatches highlighted in red; invalid USNs marked in amber.
   - Full in-table cell editing with live recalculation.
   - Add new student rows, delete rows, and re-run AI extraction on individual pages.
   - Filter pills for quick auditing: *All*, *Mismatches*, *Uncertain*, and *Absent*.

5. **Reusable Template Layouts**
   - Define exam question schemes (e.g., Q1a, Q1b, Q2a... with max marks per question) once and reuse across entire batches.
   - Built-in presets for **VTU CIE (50 Marks)**, **College CIE (30 Marks)**, **Semester End Exam (100 Marks)**, and **Class Quiz (20 Marks)**.
   - Templates persist automatically in browser `localStorage`.

6. **Professional Excel (.xlsx) Export (ExcelJS)**
   - **Sheet 1 ("Marks Sheet")**: Formatted header, student names, USNs, question columns, live dynamic `=SUM()` formulas, zebra stripes, absent styling, and audit flags.
   - **Sheet 2 ("Summary & Analytics")**: Class metrics (enrolled, present, absent, class average, highest score & topper name, lowest score, pass percentage) and question-wise difficulty/attempt breakdown.
   - Instant **Copy to Clipboard (TSV)** to paste directly into Google Sheets or college ERPs.

7. **Zero-Retention Privacy**
   - Answer sheets and marks are processed purely in-memory and through direct secure API calls. No student papers or records are stored on disk or server databases.

---

## 📁 Project Structure

```text
markssheet-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── extract/
│   │   │       └── route.ts          # Server-side Gemini Vision OCR API handler
│   │   ├── globals.css               # Tailwind CSS & custom scrollbar styles
│   │   ├── layout.tsx                # App root layout & metadata
│   │   └── page.tsx                  # Main 3-step application workflow orchestrator
│   ├── components/
│   │   ├── Navbar.tsx                # Header with Dark/Light toggle & template pill
│   │   ├── StepIndicator.tsx         # 3-Step wizard (Upload → Review → Export)
│   │   ├── UploadStep.tsx            # Drag & drop, camera input, and thumbnail queue
│   │   ├── ReviewStep.tsx            # Side-by-side verification table & audit tools
│   │   ├── ImageViewer.tsx           # Pan, zoom & rotation viewer for answer sheets
│   │   ├── ExportStep.tsx            # Analytics KPIs & Excel (.xlsx) / TSV exporter
│   │   └── TemplateModal.tsx         # Question layout editor & template manager
│   ├── lib/
│   │   ├── excel.ts                  # ExcelJS workbook generation (Formulas & Sheet 2)
│   │   ├── gemini.ts                 # Gemini Vision API integration & mock engine
│   │   ├── pdf.ts                    # Client-side PDF page rendering (pdf.js)
│   │   ├── queue.ts                  # Concurrency limiter & retry pool
│   │   ├── sampleSheets.ts           # Synthetic answer sheet canvas generator
│   │   └── templates.ts              # Presets, sum calculation, and USN validators
│   └── types/
│       └── index.ts                  # TypeScript models & schemas
├── scripts/
│   └── generate-sample-excel.mjs     # Standalone sample Excel generator script
├── .env.example                      # Environment variables template
├── package.json                      # Dependencies and build scripts
├── sample-marks.xlsx                 # Pre-generated sample Excel output
├── sample-response.json              # Sample JSON extraction response
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v24)
- **npm** v9+

### 2. Installation
```bash
# Clone or navigate to the project directory
cd markssheet-ai

# Install dependencies
npm install
```

### 3. Configure API Key
Create a `.env.local` file from the example:
```bash
cp .env.example .env.local
```
Add your free Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```
*(Note: If you leave `GEMINI_API_KEY` blank, the app will automatically run in intelligent demo mode with realistic sample extractions, mismatch detection, and crossed-out marks recognition!)*

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚢 Deployment Guide

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project** → **Import Git Repository**.
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `GEMINI_MODEL`: `gemini-1.5-flash` (or `gemini-2.5-flash`).
4. Click **Deploy**. Vercel will automatically build the Next.js app with serverless API routes.

### Deploying to Netlify
1. Connect your repository on [Netlify](https://www.netlify.com/).
2. Set Build Command to `npm run build` and Publish Directory to `.next`.
3. Add the `@netlify/plugin-nextjs` plugin (or use the automatic Next.js runtime).
4. In **Site Configuration > Environment Variables**, add `GEMINI_API_KEY`.
5. Trigger deploy!

---

## 📊 Sample Extraction JSON
Below is an excerpt of the structured JSON returned by the `/api/extract` vision engine:

```json
{
  "name": "ARUN KUMAR R",
  "usn": "1MS23CS015",
  "questions": [
    { "q_no": "1a", "marks": 8.5, "max_marks": 10 },
    { "q_no": "1b", "marks": 9, "max_marks": 10 },
    { "q_no": "2a", "marks": 7.5, "max_marks": 10 },
    { "q_no": "2b", "marks": 8, "max_marks": 10 },
    { "q_no": "3a", "marks": 9, "max_marks": 10 }
  ],
  "total": 42,
  "confidence": 0.96,
  "uncertain_fields": []
}
```
*See [`sample-response.json`](./sample-response.json) for edge-case examples (overwritten marks, total mismatch, absent students).*

---

## 📈 Sample Excel Output
The exported Excel file contains two fully styled sheets:
- **Sheet 1: `Marks Sheet`**
  - Institutional banner with Subject Code, Name, and Max Marks
  - Dynamic Excel formulas: `=SUM(D6:H6)` in the Total column
  - Soft red highlight on rows where teacher written total != computed sum
  - Soft gray highlight on absent candidates
  - Freeze panes on headers and student identifiers
- **Sheet 2: `Summary & Analytics`**
  - Batch pass percentage, class average, highest/lowest scores
  - Question-wise attempt count, average score, and difficulty rating

A pre-built sample file is available at [`sample-marks.xlsx`](./sample-marks.xlsx).
