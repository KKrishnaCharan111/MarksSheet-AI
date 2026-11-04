'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';

interface ImageViewerProps {
  imageUrl?: string;
  studentName?: string;
  usn?: string;
  uncertainFields?: string[];
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  studentName,
  usn,
  uncertainFields = [],
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset transform when imageUrl changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [imageUrl]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!imageUrl) {
    return (
      <div className="h-full min-h-[380px] flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40 text-slate-400 p-6 text-center">
        <Eye className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm font-semibold">Select a student row to inspect the original score sheet</p>
        <p className="text-xs text-slate-400 mt-1">
          High-resolution image viewer with pan, zoom & rotation controls
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
      {/* Header Toolbar */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-2 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="font-bold text-white truncate">{studentName || 'Student'}</span>
          {usn && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">
              {usn}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
            title="Reset Fit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden flex items-center justify-center p-4 bg-slate-950/90 select-none ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-w-full max-h-full flex items-center justify-center origin-center"
        >
          <img
            src={imageUrl}
            alt="Original Score Sheet"
            className="max-h-[500px] w-auto object-contain rounded shadow-2xl pointer-events-none"
          />
        </div>

        {/* Tip overlay */}
        <div className="absolute bottom-2 left-2 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-400 px-2 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
          <Info className="w-3 h-3 text-indigo-400" />
          <span>Scroll to zoom, drag to pan across marks table</span>
        </div>
      </div>

      {/* Uncertain fields alert footer */}
      {uncertainFields.length > 0 && (
        <div className="px-3 py-1.5 bg-amber-950/50 border-t border-amber-800/60 text-[11px] text-amber-300 flex items-center gap-2">
          <span className="font-semibold shrink-0">Flagged by OCR:</span>
          <span className="truncate">{uncertainFields.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
