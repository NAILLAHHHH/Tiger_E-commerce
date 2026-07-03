"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveProductImage } from "@/lib/images";
import type { GalleryItem } from "@/types/database";

type Props = {
  items: GalleryItem[];
  alt: string;
  /** Reset active slide when color changes */
  resetKey?: string;
};

export default function ProductGallery({ items, alt, resetKey }: Props) {
  const HOVER_ZOOM_PERCENT = 280;
  const HOVER_LENS_SIZE_PX = 120;
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [hoverZoomActive, setHoverZoomActive] = useState(false);
  const [hoverX, setHoverX] = useState(50);
  const [hoverY, setHoverY] = useState(50);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setActive(0);
    setZoomOpen(false);
    setZoomScale(1);
    setIsVideoPlaying(false);
    setIsVideoMuted(true);
    setHoverZoomActive(false);
    setHoverX(50);
    setHoverY(50);
  }, [resetKey]);

  const goTo = useCallback(
    (index: number) => {
      if (!items.length) return;
      setActive(((index % items.length) + items.length) % items.length);
    },
    [items.length],
  );

  const handleVideoEnded = useCallback(() => {
    if (zoomOpen || items.length <= 1) return;
    goTo(active + 1);
  }, [active, goTo, items.length, zoomOpen]);

  // Images: advance every 2 seconds
  useEffect(() => {
    if (zoomOpen || items.length <= 1) return;
    const currentItem = items[active];
    if (!currentItem || currentItem.type === "video") return;

    const timer = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [active, items, zoomOpen, resetKey]);

  // Videos: autoplay, then advance when playback ends
  useEffect(() => {
    const currentItem = items[active];
    if (zoomOpen || !currentItem || currentItem.type !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = isVideoMuted;
    void video.play().catch(() => {
      // Browser may block autoplay — tap-to-play remains available
      setIsVideoPlaying(false);
    });

    return () => {
      video.pause();
    };
  }, [active, isVideoMuted, items, zoomOpen, resetKey]);

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {
        setIsVideoPlaying(false);
      });
      return;
    }
    video.pause();
  };

  const toggleVideoMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsVideoMuted(nextMuted);
  };

  const updateHoverZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setHoverX(Math.min(100, Math.max(0, x)));
    setHoverY(Math.min(100, Math.max(0, y)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || zoomOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goTo(active + 1);
    else goTo(active - 1);
  };

  if (!items.length) return null;

  const current = items[active] ?? items[0];
  const currentImageUrl =
    current.type === "image" ? resolveProductImage(current.url) : "";
  const containerWidth = containerRef.current?.clientWidth ?? 1;
  const containerHeight = containerRef.current?.clientHeight ?? 1;
  const lensHalfX = (HOVER_LENS_SIZE_PX / 2 / containerWidth) * 100;
  const lensHalfY = (HOVER_LENS_SIZE_PX / 2 / containerHeight) * 100;
  const lensX = Math.min(100 - lensHalfX, Math.max(lensHalfX, hoverX));
  const lensY = Math.min(100 - lensHalfY, Math.max(lensHalfY, hoverY));

  return (
    <>
      <div>
        <div className="relative">
          <div
            ref={containerRef}
            className="group/gallery relative aspect-square overflow-hidden rounded-2xl bg-gray-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {current.type === "video" ? (
              <>
                <button
                  type="button"
                  onClick={toggleVideoPlayback}
                  className="relative block h-full w-full"
                  aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                >
                  <video
                    ref={videoRef}
                    key={current.url}
                    src={current.url}
                    className="h-full w-full object-contain object-center"
                    playsInline
                    muted={isVideoMuted}
                    preload="auto"
                    onEnded={handleVideoEnded}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onVolumeChange={(e) => setIsVideoMuted(e.currentTarget.muted)}
                  />
                  {!isVideoPlaying && (
                    <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <span className="rounded-full bg-dark/55 p-3 text-white">
                        <PlayIcon className="h-6 w-6" />
                      </span>
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleVideoMuted}
                  className="absolute bottom-3 right-3 z-20 rounded-full bg-dark/65 p-2 text-white hover:bg-dark/80"
                  aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
                >
                  {isVideoMuted ? (
                    <VolumeOffIcon className="h-5 w-5" />
                  ) : (
                    <VolumeOnIcon className="h-5 w-5" />
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                onMouseEnter={() => setHoverZoomActive(true)}
                onMouseMove={updateHoverZoom}
                onMouseLeave={() => setHoverZoomActive(false)}
                className="relative block h-full w-full cursor-zoom-in lg:cursor-crosshair"
                aria-label="Zoom image"
              >
                <Image
                  src={currentImageUrl}
                  alt={alt}
                  fill
                  className="object-contain object-center transition-transform duration-75"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={{
                    transform:
                      hoverZoomActive && typeof window !== "undefined" && window.innerWidth >= 1024
                        ? `scale(${HOVER_ZOOM_PERCENT / 100})`
                        : "scale(1)",
                    transformOrigin: `${hoverX}% ${hoverY}%`,
                  }}
                />
                {hoverZoomActive && (
                  <span
                    className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/80 bg-white/25 shadow-sm backdrop-blur-[1px] lg:block"
                    style={{
                      left: `${lensX}%`,
                      top: `${lensY}%`,
                      width: `${HOVER_LENS_SIZE_PX}px`,
                      height: `${HOVER_LENS_SIZE_PX}px`,
                    }}
                  />
                )}
                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-dark/50 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover/gallery:opacity-100">
                  Tap to zoom
                </span>
              </button>
            )}

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(active - 1)}
                  className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-dark shadow-sm opacity-0 transition-opacity hover:bg-surface group-hover/gallery:opacity-100 md:opacity-100"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => goTo(active + 1)}
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-dark shadow-sm opacity-0 transition-opacity hover:bg-surface group-hover/gallery:opacity-100 md:opacity-100"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            {items.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {items.map((item, i) => (
                  <button
                    key={`${item.type}-${item.url}-${i}`}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-brand" : "w-1.5 bg-white/70 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {items.map((item, i) => (
              <button
                key={`thumb-${item.type}-${item.url}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === active ? "border-brand" : "border-gray-3"
                }`}
              >
                {item.type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-dark text-white">
                    <span className="text-lg">▶</span>
                  </div>
                ) : (
                  <Image
                    src={resolveProductImage(item.url)}
                    alt=""
                    fill
                    className="object-contain object-center bg-gray-1"
                    sizes="64px"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && current.type === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          onClick={() => {
            setZoomOpen(false);
            setZoomScale(1);
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            aria-label="Close zoom"
            onClick={() => {
              setZoomOpen(false);
              setZoomScale(1);
            }}
          >
            ×
          </button>

          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              setZoomScale((s) =>
                Math.min(4, Math.max(1, s + (e.deltaY < 0 ? 0.2 : -0.2))),
              );
            }}
          >
            <Image
              src={resolveProductImage(current.url)}
              alt={alt}
              width={1200}
              height={1200}
              className="h-auto max-h-[85vh] w-auto max-w-[85vw] object-contain transition-transform duration-150"
              style={{ transform: `scale(${zoomScale})` }}
              sizes="90vw"
            />
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(active - 1);
                  setZoomScale(1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(active + 1);
                  setZoomScale(1);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.5-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function VolumeOnIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 5" />
      <path d="m21 9-5 5" />
    </svg>
  );
}
