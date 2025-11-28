// frontend/src/components/MediaViewer.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * MediaViewer: simple Instagram-style lightbox
 * Props:
 * - items: array of { type: 'image'|'video', src: string }
 * - initialIndex: number
 * - post: original post object (for caption/user)
 * - onClose: () => void
 *
 * Behavior:
 * - Arrow keys navigate (Left/Right), Esc closes
 * - Swipe left/right on mobile
 * - Background blur & dark overlay
 * - On desktop: media on left, post info on right
 * - On mobile: stacked (media then details)
 */

export default function MediaViewer({ items = [], initialIndex = 0, post = null, onClose }) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, items.length - 1)));
  const containerRef = useRef();
  const touchStartXRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [index, items]);

  useEffect(() => {
    // lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function prev() {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }
  function next() {
    setIndex((i) => (i + 1) % items.length);
  }

  function onBackdropClick(e) {
    if (e.target === containerRef.current) onClose();
  }

  function handleTouchStart(e) {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  }

  function handleTouchEnd(e) {
    const start = touchStartXRef.current;
    if (start == null) return;
    const end = e.changedTouches?.[0]?.clientX ?? null;
    if (end == null) return;
    const dx = end - start;
    const threshold = 50;
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    touchStartXRef.current = null;
  }

  if (!items || items.length === 0) return null;

  const current = items[index];

  return (
    <div
      ref={containerRef}
      onClick={onBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      aria-modal="true"
    >
      <div className="relative w-full max-w-6xl mx-auto bg-transparent rounded-lg overflow-hidden flex flex-col md:flex-row gap-4">
        {/* Left: media */}
        <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
          {/* Prev / Next buttons (desktop) */}
          <button
            onClick={prev}
            aria-label="Previous"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center bg-black/30 text-white rounded-full w-10 h-10"
          >
            ‹
          </button>

          <div className="w-full h-[70vh] md:h-[76vh] flex items-center justify-center">
            {current.type === "image" ? (
              <img
                src={current.src}
                alt={post?.title || "media"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                src={current.src}
                controls
                className="max-h-full max-w-full object-contain bg-black"
              />
            )}
          </div>

          <button
            onClick={next}
            aria-label="Next"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center bg-black/30 text-white rounded-full w-10 h-10"
          >
            ›
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-30 bg-black/30 text-white rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Right: post info (desktop show, mobile collapsed below) */}
        <div className="md:w-96 w-full md:h-[76vh] bg-white rounded-lg p-4 overflow-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
              {(post?.user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-slate-800">{post?.user?.name || post?.user?.email || "User"}</div>
              <div className="text-xs text-gray-500">{post?.createdAt ? new Date(post.createdAt).toLocaleString() : ""}</div>
            </div>
          </div>

          <h3 className="mt-4 text-lg font-semibold">{post?.title}</h3>
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">{post?.description}</p>

          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{(post?.likes && post.likes.length) || post?.likes || 0} likes</div>
              <div className="text-sm text-gray-500">• {post?.comments?.length || 0} comments</div>
            </div>
          </div>

          {/* actions: show thumbnails and navigation control */}
          <div className="mt-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`flex-none rounded overflow-hidden ${i === index ? "ring-2 ring-amber-300" : "border border-gray-200"}`}
                >
                  {it.type === "image" ? (
                    <img src={it.src} alt={`thumb-${i}`} className="w-20 h-16 object-cover" />
                  ) : (
                    <div className="w-20 h-16 bg-black/80 flex items-center justify-center text-white text-xs">VIDEO</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* caption / ingredients preview */}
          {post?.ingredients && post.ingredients.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Ingredients</h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {post.ingredients.slice(0, 6).map((ing, i) => (
                  <li key={i}>
                    {typeof ing === "string" ? ing : `${ing.qty ? ing.qty + " " : ""}${ing.unit ? ing.unit + " " : ""}${ing.name}`}
                  </li>
                ))}
                {post.ingredients.length > 6 && <li className="text-xs text-gray-400">+ more</li>}
              </ul>
            </div>
          )}

          {/* full post link */}
          <div className="mt-6">
            <a href={`/recipes/${post?._id}`} className="text-sm text-amber-600 hover:underline">Open full post</a>
          </div>
        </div>
      </div>
    </div>
  );
}
