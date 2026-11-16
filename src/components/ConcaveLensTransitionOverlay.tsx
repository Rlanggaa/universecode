import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface ThumbnailRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ConcaveLensTransitionOverlayProps {
  active: boolean;
  targetType: 'location' | 'event';
  thumbnailSrc: string;
  fallbackContent?: React.ReactNode;
  startRect: ThumbnailRect | null;
  totalDurationMs?: number;
  concavePeakMs?: number;
  onComplete: () => void;
}

let cachedConcaveMapUrl: string | null = null;
let cachedDepthDirMapUrl: string | null = null;

/**
 * Generates a 256x256 radial pincushion / concave displacement map data URL for <feDisplacementMap>.
 * When scale > 0, pixels in the interior sample further outward radially,
 * pulling the center of the image inward (concave / cekung optical lens distortion).
 */
export function getConcaveDisplacementMapDataUrl(): string {
  if (cachedConcaveMapUrl) return cachedConcaveMapUrl;
  if (typeof document === 'undefined') return '';

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    const ny = (y / (size - 1)) * 2 - 1; // -1 .. 1
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1; // -1 .. 1
      const r = Math.hypot(nx, ny);

      const clampedR = Math.min(1.25, r);
      const radialCurve = Math.sin((clampedR / 1.25) * Math.PI);
      const centerWeight = 1.22 - 0.35 * Math.min(1, r);

      const dx = Math.max(-1, Math.min(1, nx * radialCurve * centerWeight));
      const dy = Math.max(-1, Math.min(1, ny * radialCurve * centerWeight));

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(128 + dx * 127); // Red = X displacement
      data[idx + 1] = Math.round(128 + dy * 127); // Green = Y displacement
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  cachedConcaveMapUrl = canvas.toDataURL('image/png');
  return cachedConcaveMapUrl;
}

/**
 * Generates a 256x256 radial Z-depth directional vector map for true Depth Directional Blur (Zoom-In Depth Blur).
 * Center (0,0) has zero displacement (focal vanishing point), while outer pixels streak strictly
 * along radial depth rays (nx, ny) as if plunging forward into a world along the Z-axis.
 */
export function getDepthDirectionMapDataUrl(): string {
  if (cachedDepthDirMapUrl) return cachedDepthDirMapUrl;
  if (typeof document === 'undefined') return '';

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    const ny = (y / (size - 1)) * 2 - 1; // -1 .. 1
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1; // -1 .. 1
      const r = Math.hypot(nx, ny);

      // Progressive radial depth falloff: focal center stays clear while periphery streaks strongly in Z-depth
      const depthProfile = Math.pow(Math.min(1.3, r), 0.35);
      const dx = Math.max(-1, Math.min(1, nx * depthProfile * 0.85));
      const dy = Math.max(-1, Math.min(1, ny * depthProfile * 0.85));

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(128 + dx * 127); // Red = Radial X ray
      data[idx + 1] = Math.round(128 + dy * 127); // Green = Radial Y ray
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  cachedDepthDirMapUrl = canvas.toDataURL('image/png');
  return cachedDepthDirMapUrl;
}

/**
 * Reusable SVG Filter Definition for Depth Directional Blur (Radial Z-Zoom Blur).
 * Can be applied to Map/Timeline canvases and destination page arrival transitions.
 */
export const DepthDirectionalBlurSvgFilter: React.FC<{
  filterId: string;
  depthScale: number;
}> = ({ filterId, depthScale }) => {
  const depthMapUrl = useMemo(() => getDepthDirectionMapDataUrl(), []);
  if (!depthMapUrl) return null;

  const s1 = Number((depthScale * 0.22).toFixed(2));
  const s2 = Number((depthScale * 0.48).toFixed(2));
  const s3 = Number((depthScale * 0.78).toFixed(2));
  const s4 = Number((depthScale * 1.12).toFixed(2));

  return (
    <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={depthMapUrl}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="depthDirMap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="depthDirMap"
            scale={s1}
            xChannelSelector="R"
            yChannelSelector="G"
            result="ray1"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="depthDirMap"
            scale={s2}
            xChannelSelector="R"
            yChannelSelector="G"
            result="ray2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="depthDirMap"
            scale={s3}
            xChannelSelector="R"
            yChannelSelector="G"
            result="ray3"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="depthDirMap"
            scale={s4}
            xChannelSelector="R"
            yChannelSelector="G"
            result="ray4"
          />
          <feComponentTransfer in="SourceGraphic" result="w0">
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feComponentTransfer in="ray1" result="w1">
            <feFuncA type="linear" slope="0.24" />
          </feComponentTransfer>
          <feComponentTransfer in="ray2" result="w2">
            <feFuncA type="linear" slope="0.20" />
          </feComponentTransfer>
          <feComponentTransfer in="ray3" result="w3">
            <feFuncA type="linear" slope="0.14" />
          </feComponentTransfer>
          <feComponentTransfer in="ray4" result="w4">
            <feFuncA type="linear" slope="0.10" />
          </feComponentTransfer>
          <feMerge result="mergedRays">
            <feMergeNode in="w4" />
            <feMergeNode in="w3" />
            <feMergeNode in="w2" />
            <feMergeNode in="w1" />
            <feMergeNode in="w0" />
          </feMerge>
          <feComponentTransfer in="mergedRays">
            <feFuncA type="linear" slope="2.2" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
};

/**
 * Dedicated Maps / Timeline Transition Thumbnail (Thumbnail #1 — separate from the destination page's own Thumbnail #2).
 * During the 1.5s pre-navigation transition on Maps or Timeline:
 * - Adopts the size & position of the target page's thumbnail
 * - Receives the Concave Lens Distortion (0.0s–0.5s: datar ke cekung, 0.5s–1.5s: cekung balik ke semula/normal)
 *   with overscale wider than the frame so the concave outer edges are hidden while the image looks concave
 * - Receives the Depth Directional Blur (Radial Z-Zoom Blur) effect ("seolah masuk ke dalam suatu dunia")
 */
export const ConcaveLensTransitionOverlay: React.FC<ConcaveLensTransitionOverlayProps> = ({
  active,
  targetType,
  thumbnailSrc,
  fallbackContent,
  startRect,
  totalDurationMs = 1500,
  concavePeakMs = 500,
  onComplete
}) => {
  const rawId = useId().replace(/:/g, '');
  const filterId = `concave-depth-lens-filter-${rawId}`;

  const targetSlotRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const displacementMapUrl = useMemo(() => getConcaveDisplacementMapDataUrl(), []);
  const depthDirMapUrl = useMemo(() => getDepthDirectionMapDataUrl(), []);

  const [animState, setAnimState] = useState<{
    rect: ThumbnailRect;
    concaveIntensity: number; // 0 (flat) -> 1 (concave peak at 0.5s) -> 0 (normal at 1.5s)
    progress: number; // 0 -> 1 over 1.5s
  } | null>(null);

  useEffect(() => {
    if (!active || !startRect) {
      setAnimState(null);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();
    let completed = false;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const tNorm = Math.min(1, elapsed / totalDurationMs);

      // Measure exact destination thumbnail bounding box from the hidden Fullscreen layout skeleton
      const slotEl = targetSlotRef.current;
      const measuredTarget = slotEl?.getBoundingClientRect();
      const targetRect: ThumbnailRect =
        measuredTarget && measuredTarget.width > 0 && measuredTarget.height > 0
          ? {
              left: measuredTarget.left,
              top: measuredTarget.top,
              width: measuredTarget.width,
              height: measuredTarget.height
            }
          : targetType === 'location'
          ? {
              left: Math.max(88, (window.innerWidth - 960) / 2),
              top: 72,
              width: 270,
              height: 480
            }
          : {
              left: Math.max(
                92,
                (window.innerWidth + 68 - Math.min(1280, window.innerWidth - 132)) / 2
              ),
              top: 78,
              width: Math.min(1280, window.innerWidth - 132),
              height: Math.min(480, Math.min(1280, window.innerWidth - 132) * (9 / 16))
            };

      // Smoothly brings the Maps/Timeline thumbnail to the exact size & position of the target page's thumbnail
      const morphEase = 1 - Math.pow(1 - tNorm, 3);

      const currentRect: ThumbnailRect = {
        left: startRect.left + (targetRect.left - startRect.left) * morphEase,
        top: startRect.top + (targetRect.top - startRect.top) * morphEase,
        width: startRect.width + (targetRect.width - startRect.width) * morphEase,
        height: startRect.height + (targetRect.height - startRect.height) * morphEase
      };

      // Lens Distortion Schedule:
      // 1) 0.0s -> 0.5s (0 .. concavePeakMs): Flat (0) -> Concave / Cekung (1)
      // 2) 0.5s -> 1.5s (concavePeakMs .. totalDurationMs): Concave / Cekung (1) -> Normal / Flat (0)
      let concaveIntensity = 0;
      if (elapsed <= concavePeakMs) {
        const p1 = Math.min(1, elapsed / Math.max(1, concavePeakMs));
        concaveIntensity = Math.sin((p1 * Math.PI) / 2);
      } else {
        const remainingDuration = Math.max(1, totalDurationMs - concavePeakMs);
        const p2 = Math.min(1, (elapsed - concavePeakMs) / remainingDuration);
        concaveIntensity = 0.5 * (1 + Math.cos(p2 * Math.PI));
      }

      setAnimState({
        rect: currentRect,
        concaveIntensity,
        progress: tNorm
      });

      if (elapsed < totalDurationMs) {
        rafId = window.requestAnimationFrame(tick);
      } else if (!completed) {
        completed = true;
        onCompleteRef.current();
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [active, startRect, targetType, totalDurationMs, concavePeakMs]);

  if (!active || !startRect) return null;

  const currentRect = animState?.rect || startRect;
  const concave = animState?.concaveIntensity ?? 0;
  const progress = animState?.progress ?? 0;

  // 1) Concave Lens Distortion Scale: 0 (flat) -> 124 (concave peak at 0.5s) -> 0 (normal at 1.5s)
  const displacementScale = Number((concave * 124).toFixed(2));

  // 2) Overscale wider than the frame while lens distortion is active so concave edges are hidden
  const overscaleFactor = Number((1 + concave * 0.42).toFixed(4));

  // 3) Depth Directional Blur (Radial Z-Zoom Blur) intensity ("seolah masuk ke dalam suatu dunia"):
  //    Ramps up along the Z-axis as we plunge into the target world over the 1.5s transition
  const depthBlurCurve = Math.pow(progress, 1.45);
  const depthRayScale1 = Number((depthBlurCurve * 22).toFixed(2));
  const depthRayScale2 = Number((depthBlurCurve * 46).toFixed(2));
  const depthRayScale3 = Number((depthBlurCurve * 76).toFixed(2));
  const depthRayScale4 = Number((depthBlurCurve * 112).toFixed(2));

  // Z-axis forward plunge scale (camera moving forward into the thumbnail world)
  const zPlungeScale = Number((1 + Math.pow(progress, 1.5) * 0.24).toFixed(4));
  const zBrightness = Number((1 + progress * 0.08).toFixed(3));

  const renderInnerArtwork = () =>
    thumbnailSrc ? (
      <img
        src={thumbnailSrc}
        alt=""
        className={`w-full h-full ${
          targetType === 'location' ? 'object-contain' : 'object-cover'
        }`}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">{fallbackContent}</div>
    );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* ================================================================== */}
      {/* 1. HIDDEN FULLSCREEN TARGET LAYOUT SKELETON                        */}
      {/* ================================================================== */}
      <div
        aria-hidden="true"
        className="fixed top-0 bottom-0 right-0 left-[68px] opacity-0 pointer-events-none overflow-hidden flex flex-col"
      >
        {targetType === 'location' ? (
          <div className="relative flex-1 h-screen max-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden">
            <div className="relative flex-1 h-full min-h-0 px-6 sm:px-8 py-4 sm:py-5 flex flex-col overflow-hidden">
              <div className="shrink-0 w-full max-w-6xl mx-auto h-[34px] mb-2" />
              <div className="flex-1 min-h-0 flex flex-col xl:flex-row items-center xl:items-stretch justify-center gap-8 max-w-6xl mx-auto w-full pt-1 overflow-hidden">
                <div className="w-full max-w-[300px] shrink-0 h-full min-h-0 flex flex-col justify-start gap-3 mt-0.5">
                  <div
                    ref={targetSlotRef}
                    className="h-[calc(100%-3.25rem)] max-h-[520px] min-h-[240px] aspect-[9/16] mx-auto"
                  />
                </div>
                <div className="w-full max-w-xl flex-1 h-full min-h-0" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden">
            <div className="relative flex-1 p-6 sm:p-8 flex flex-col overflow-y-auto">
              <div className="w-full max-w-7xl mx-auto h-[34px] mb-3 shrink-0" />
              <div className="flex-1 space-y-8 mx-auto w-full max-w-7xl">
                <div
                  ref={targetSlotRef}
                  className="w-full aspect-[16/9] mx-auto max-h-[420px] sm:max-h-[480px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 2. COMBINED SVG CONCAVE LENS + MULTI-SAMPLE DEPTH DIRECTIONAL BLUR */}
      {/* ================================================================== */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            id={filterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            {displacementMapUrl && depthDirMapUrl && (
              <>
                {/* Pass A: Concave (Cekung) Lens Displacement (0s->0.5s->1.5s) */}
                <feImage
                  href={displacementMapUrl}
                  x="0%"
                  y="0%"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  result="concaveDispMap"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="concaveDispMap"
                  scale={displacementScale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="concaveWarped"
                />

                {/* Pass B: Multi-Tap Radial Z-Depth Directional Blur (Plunging into a world) */}
                <feImage
                  href={depthDirMapUrl}
                  x="0%"
                  y="0%"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  result="depthDirMap"
                />
                <feDisplacementMap
                  in="concaveWarped"
                  in2="depthDirMap"
                  scale={depthRayScale1}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="depthRay1"
                />
                <feDisplacementMap
                  in="concaveWarped"
                  in2="depthDirMap"
                  scale={depthRayScale2}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="depthRay2"
                />
                <feDisplacementMap
                  in="concaveWarped"
                  in2="depthDirMap"
                  scale={depthRayScale3}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="depthRay3"
                />
                <feDisplacementMap
                  in="concaveWarped"
                  in2="depthDirMap"
                  scale={depthRayScale4}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="depthRay4"
                />

                {/* Blend the 5 radial Z-depth slices along the focal tunnel */}
                <feComponentTransfer in="concaveWarped" result="dw0">
                  <feFuncA type="linear" slope="0.34" />
                </feComponentTransfer>
                <feComponentTransfer in="depthRay1" result="dw1">
                  <feFuncA type="linear" slope="0.24" />
                </feComponentTransfer>
                <feComponentTransfer in="depthRay2" result="dw2">
                  <feFuncA type="linear" slope="0.18" />
                </feComponentTransfer>
                <feComponentTransfer in="depthRay3" result="dw3">
                  <feFuncA type="linear" slope="0.14" />
                </feComponentTransfer>
                <feComponentTransfer in="depthRay4" result="dw4">
                  <feFuncA type="linear" slope="0.10" />
                </feComponentTransfer>

                <feMerge result="depthBlurred">
                  <feMergeNode in="dw4" />
                  <feMergeNode in="dw3" />
                  <feMergeNode in="dw2" />
                  <feMergeNode in="dw1" />
                  <feMergeNode in="dw0" />
                </feMerge>
                <feComponentTransfer in="depthBlurred">
                  <feFuncA type="linear" slope="2.2" />
                </feComponentTransfer>
              </>
            )}
          </filter>
        </defs>
      </svg>

      {/* ================================================================== */}
      {/* 3. Z-DEPTH WORLD ENTRY TUNNEL VIGNETTE                             */}
      {/* ================================================================== */}
      <div
        style={{
          opacity: Math.min(0.9, progress * 0.95),
          background:
            'radial-gradient(circle at 50% 50%, rgba(20, 19, 24, 0.25) 0%, rgba(20, 19, 24, 0.72) 58%, rgba(12, 11, 16, 0.94) 100%)'
        }}
        className="fixed inset-0"
      />

      {/* ================================================================== */}
      {/* 4. MAPS / TIMELINE TRANSITION THUMBNAIL (Thumbnail #1)             */}
      {/*    - Sized & positioned to match the target page's thumbnail       */}
      {/*    - Hit by Concave Lens Distortion (overscaled > frame)           */}
      {/*    - Hit by Depth Directional Blur (radial Z-tunnel streaks +      */}
      {/*      multi-plane Z-depth echoes as if entering into a world)       */}
      {/* ================================================================== */}
      <div
        style={{
          position: 'fixed',
          left: `${currentRect.left}px`,
          top: `${currentRect.top}px`,
          width: `${currentRect.width}px`,
          height: `${currentRect.height}px`,
          transform: `perspective(850px) translate3d(0, 0, ${Math.round(
            depthBlurCurve * 135
          )}px) scale(${zPlungeScale})`,
          transformOrigin: '50% 50%',
          filter: `brightness(${zBrightness})`,
          borderRadius: `${Math.max(0, (1 - progress) * 10)}px`
        }}
        className="z-50 pointer-events-none overflow-hidden bg-[#141318]/90 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex items-center justify-center"
      >
        {/* Base Layer with SVG Concave Lens + 5-Tap Radial Depth Directional Blur */}
        <div
          style={{
            width: '100%',
            height: '100%',
            filter:
              displacementMapUrl && (concave > 0.005 || depthBlurCurve > 0.005)
                ? `url(#${filterId})`
                : 'none',
            transform: `scale(${overscaleFactor})`,
            transformOrigin: '50% 50%'
          }}
          className="w-full h-full flex items-center justify-center"
        >
          {renderInnerArtwork()}
        </div>

        {/* Multi-Plane Z-Depth Tunnel Echo Slices (Periphery streaks forward while center tunnel stays clear) */}
        {depthBlurCurve > 0.02 && (
          <>
            <div
              style={{
                opacity: Number((depthBlurCurve * 0.42).toFixed(3)),
                transform: `scale(${Number(
                  (overscaleFactor * (1 + depthBlurCurve * 0.14)).toFixed(4)
                )})`,
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, transparent 22%, rgba(0,0,0,0.85) 75%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, transparent 22%, rgba(0,0,0,0.85) 75%)'
              }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              {renderInnerArtwork()}
            </div>
            <div
              style={{
                opacity: Number((depthBlurCurve * 0.28).toFixed(3)),
                transform: `scale(${Number(
                  (overscaleFactor * (1 + depthBlurCurve * 0.28)).toFixed(4)
                )})`,
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, transparent 32%, rgba(0,0,0,0.95) 85%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, transparent 32%, rgba(0,0,0,0.95) 85%)'
              }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              {renderInnerArtwork()}
            </div>
          </>
        )}

        {/* Radial Concave & Depth Portal Shading */}
        <div
          style={{
            opacity: Number((Math.max(concave * 0.72, depthBlurCurve * 0.55)).toFixed(3)),
            background:
              'radial-gradient(circle at 50% 50%, rgba(8, 7, 12, 0.45) 0%, rgba(18, 16, 26, 0.18) 46%, rgba(235, 213, 179, 0.22) 90%, rgba(235, 213, 179, 0.38) 100%)',
            boxShadow: `inset 0 0 ${Math.round(
              Math.max(concave * 56, depthBlurCurve * 44)
            )}px rgba(0, 0, 0, 0.78)`
          }}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </div>
  );
};
