import { NextRequest, NextResponse } from 'next/server';
import { extractMarksWithVision } from '@/lib/gemini';

export const runtime = 'nodejs';
// Allow larger payloads (e.g. high-resolution page scans up to 15MB)
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, templateContext } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 string is required' },
        { status: 400 }
      );
    }

    const result = await extractMarksWithVision(
      imageBase64,
      mimeType || 'image/jpeg',
      templateContext
    );

    return NextResponse.json({
      success: true,
      data: result,
      source: process.env.GEMINI_API_KEY ? 'gemini-vision' : 'demo-mock-engine',
    });
  } catch (error: any) {
    console.error('Error in /api/extract:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract marks from image',
      },
      { status: 500 }
    );
  }
}
