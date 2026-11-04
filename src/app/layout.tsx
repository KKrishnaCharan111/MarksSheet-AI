import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarksSheet AI - Automated Answer Sheet Marks Extraction to Excel',
  description:
    'Extract student marks from scanned answer-sheet front pages and score tables with Vision AI and export directly into formatted Excel (.xlsx) workbooks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
