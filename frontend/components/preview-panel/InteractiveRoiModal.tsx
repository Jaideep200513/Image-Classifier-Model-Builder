"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Crop, X, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

interface InteractiveRoiModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string, croppedFile: File) => void;
}

type HandleType = "drag" | "nw" | "ne" | "sw" | "se" | null;

interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function InteractiveRoiModal({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
}: InteractiveRoiModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [box, setBox] = useState<BoxRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const activeHandleRef = useRef<HandleType>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; box: BoxRect }>({
    mouseX: 0,
    mouseY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Calculate default ROI box (centered 65% of display area)
  const initDefaultBox = useCallback((dispW: number, dispH: number) => {
    const w = Math.round(dispW * 0.65);
    const h = Math.round(dispH * 0.65);
    const x = Math.round((dispW - w) / 2);
    const y = Math.round((dispH - h) / 2);
    setBox({ x, y, width: w, height: h });
  }, []);

  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const dispW = img.clientWidth;
    const dispH = img.clientHeight;

    setNaturalSize({ width: natW, height: natH });
    setDisplaySize({ width: dispW, height: dispH });
    setIsImageLoaded(true);
    initDefaultBox(dispW, dispH);
  };

  // Re-calculate sizes on window resize
  useEffect(() => {
    if (!isOpen || !isImageLoaded) return;
    const handleResize = () => {
      if (!imgRef.current) return;
      const dispW = imgRef.current.clientWidth;
      const dispH = imgRef.current.clientHeight;
      setDisplaySize({ width: dispW, height: dispH });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, isImageLoaded]);

  const handleResetBox = () => {
    if (displaySize.width > 0 && displaySize.height > 0) {
      initDefaultBox(displaySize.width, displaySize.height);
    }
  };

  // Mouse & Touch interaction handlers for drag and corner resize
  const onPointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    activeHandleRef.current = handle;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...box },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!activeHandleRef.current || displaySize.width === 0 || displaySize.height === 0) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;
    const startBox = dragStartRef.current.box;
    const { width: dispW, height: dispH } = displaySize;

    // Minimum dimensions in display pixels corresponding to >= 20px in natural size
    const minW = Math.max(20, (20 * dispW) / (naturalSize.width || 1));
    const minH = Math.max(20, (20 * dispH) / (naturalSize.height || 1));

    let newX = startBox.x;
    let newY = startBox.y;
    let newW = startBox.width;
    let newH = startBox.height;

    switch (activeHandleRef.current) {
      case "drag":
        newX = Math.max(0, Math.min(dispW - startBox.width, startBox.x + deltaX));
        newY = Math.max(0, Math.min(dispH - startBox.height, startBox.y + deltaY));
        break;

      case "se":
        newW = Math.max(minW, Math.min(dispW - startBox.x, startBox.width + deltaX));
        newH = Math.max(minH, Math.min(dispH - startBox.y, startBox.height + deltaY));
        break;

      case "sw":
        newX = Math.max(0, Math.min(startBox.x + startBox.width - minW, startBox.x + deltaX));
        newW = startBox.x + startBox.width - newX;
        newH = Math.max(minH, Math.min(dispH - startBox.y, startBox.height + deltaY));
        break;

      case "ne":
        newW = Math.max(minW, Math.min(dispW - startBox.x, startBox.width + deltaX));
        newY = Math.max(0, Math.min(startBox.y + startBox.height - minH, startBox.y + deltaY));
        newH = startBox.y + startBox.height - newY;
        break;

      case "nw":
        newX = Math.max(0, Math.min(startBox.x + startBox.width - minW, startBox.x + deltaX));
        newW = startBox.x + startBox.width - newX;
        newY = Math.max(0, Math.min(startBox.y + startBox.height - minH, startBox.y + deltaY));
        newH = startBox.y + startBox.height - newY;
        break;
    }

    setBox({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (activeHandleRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch if capture released
      }
      activeHandleRef.current = null;
    }
  };

  // Convert current ROI display coordinates to high-resolution canvas extraction
  const handleApply = () => {
    if (!imgRef.current || displaySize.width === 0 || displaySize.height === 0) return;

    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    let cropX = Math.max(0, Math.round(box.x * scaleX));
    let cropY = Math.max(0, Math.round(box.y * scaleY));
    let cropW = Math.round(box.width * scaleX);
    let cropH = Math.round(box.height * scaleY);

    // Enforce minimum 20x20 natural pixels & clamp within bounds
    cropW = Math.max(20, Math.min(naturalSize.width - cropX, cropW));
    cropH = Math.max(20, Math.min(naturalSize.height - cropY, cropH));
    if (cropX + cropW > naturalSize.width) cropX = naturalSize.width - cropW;
    if (cropY + cropH > naturalSize.height) cropY = naturalSize.height - cropH;

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.95);

    // Convert dataURL to File object for predictImage compatibility
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `roi-crop-${Date.now()}.jpg`, { type: "image/jpeg" });
        onApplyCrop(croppedDataUrl, file);
        onClose();
      }
    }, "image/jpeg", 0.95);
  };

  // Current natural crop dimensions for display badge
  const calcNaturalCropW = naturalSize.width && displaySize.width ? Math.round((box.width * naturalSize.width) / displaySize.width) : 0;
  const calcNaturalCropH = naturalSize.height && displaySize.height ? Math.round((box.height * naturalSize.height) / displaySize.height) : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Crop className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Region of Interest (ROI)</h3>
                <p className="text-[11px] text-slate-500">Drag or scale handles to isolate target object</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive ROI Canvas / Image Container */}
          <div className="relative flex-1 bg-slate-900 flex items-center justify-center p-4 overflow-hidden select-none">
            <div
              className="relative inline-block max-w-full max-h-[60vh] overflow-hidden rounded-lg shadow-xl"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="ROI Source"
                onLoad={handleImageLoad}
                className="max-w-full max-h-[60vh] object-contain block pointer-events-none"
              />

              {isImageLoaded && (
                <>
                  {/* Outer Mask (Darkened area outside selection box) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top Mask */}
                    <div className="absolute bg-black/60" style={{ top: 0, left: 0, right: 0, height: box.y }} />
                    {/* Bottom Mask */}
                    <div className="absolute bg-black/60" style={{ top: box.y + box.height, left: 0, right: 0, bottom: 0 }} />
                    {/* Left Mask */}
                    <div className="absolute bg-black/60" style={{ top: box.y, left: 0, width: box.x, height: box.height }} />
                    {/* Right Mask */}
                    <div className="absolute bg-black/60" style={{ top: box.y, left: box.x + box.width, right: 0, height: box.height }} />
                  </div>

                  {/* Interactive Glassmorphic Selection Box */}
                  <div
                    style={{
                      transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
                      width: box.width,
                      height: box.height,
                    }}
                    className="absolute top-0 left-0 border-2 border-purple-400 bg-purple-500/10 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-move touch-none"
                    onPointerDown={(e) => onPointerDown(e, "drag")}
                  >
                    {/* Grid lines inside box */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                    </div>

                    {/* Dimension Badge */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-mono font-bold tracking-wider pointer-events-none border border-slate-700 shadow-md">
                      {calcNaturalCropW} × {calcNaturalCropH} px
                    </div>

                    {/* Corner Handles */}
                    {/* Top-Left */}
                    <div
                      onPointerDown={(e) => onPointerDown(e, "nw")}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-md hover:scale-125 transition-transform cursor-nwse-resize touch-none"
                    />
                    {/* Top-Right */}
                    <div
                      onPointerDown={(e) => onPointerDown(e, "ne")}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-md hover:scale-125 transition-transform cursor-nesw-resize touch-none"
                    />
                    {/* Bottom-Left */}
                    <div
                      onPointerDown={(e) => onPointerDown(e, "sw")}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-md hover:scale-125 transition-transform cursor-nesw-resize touch-none"
                    />
                    {/* Bottom-Right */}
                    <div
                      onPointerDown={(e) => onPointerDown(e, "se")}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-md hover:scale-125 transition-transform cursor-nwse-resize touch-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t bg-slate-50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetBox}
              className="gap-1.5 text-xs text-slate-700 hover:bg-slate-200/60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Selection
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-slate-600"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleApply}
                className="btn-purple text-xs gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="h-3.5 w-3.5" />
                Apply ROI Crop
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
