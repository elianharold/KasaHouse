'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, PlayCircle, X, Expand } from 'lucide-react';
import { MediaType, type Media } from '@kasahouse/shared-types';
import { cloudinaryBlurUrl } from '@/lib/cloudinary-loader';
import { cn } from '@/lib/utils';

export function Gallery({ media, title }: { media: Media[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = media.length;
  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  if (count === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-surface-sunken text-sm text-ink-faint">
        No photos or video yet
      </div>
    );
  }

  const current = media[index]!;
  const isVideo = current.type === MediaType.VIDEO;

  return (
    <div>
      {/* main viewer */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-sunken">
        {isVideo ? (
          <video
            key={current.id}
            src={current.url}
            poster={current.thumbnailUrl}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="h-full w-full cursor-zoom-in"
            aria-label="Open full-screen"
          >
            <Image
              src={current.url}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
              {...(cloudinaryBlurUrl(current.url)
                ? { placeholder: 'blur' as const, blurDataURL: cloudinaryBlurUrl(current.url) }
                : {})}
            />
            <span className="pointer-events-none absolute right-3 top-3 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="size-4" />
            </span>
          </button>
        )}

        {count > 1 ? (
          <>
            <ArrowButton side="left" onClick={() => go(-1)} />
            <ArrowButton side="right" onClick={() => go(1)} />
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {count}
            </div>
          </>
        ) : null}
      </div>

      {/* thumbnails */}
      {count > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setIndex(i)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2',
                i === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={m.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />
              {m.type === MediaType.VIDEO ? (
                <PlayCircle className="absolute inset-0 m-auto size-5 text-white drop-shadow" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <Lightbox
          media={media}
          index={index}
          title={title}
          onIndex={setIndex}
          onClose={() => setLightbox(false)}
        />
      ) : null}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/85 text-ink shadow-md transition hover:bg-white',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

function Lightbox({
  media,
  index,
  title,
  onIndex,
  onClose,
}: {
  media: Media[];
  index: number;
  title: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = media.length;
  const step = useCallback(
    (dir: 1 | -1) => onIndex((index + dir + count) % count),
    [index, count, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [step, onClose]);

  const current = media[index]!;
  const isVideo = current.type === MediaType.VIDEO;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — photo ${index + 1} of ${count}`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div
        className="relative flex max-h-full max-w-5xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={current.url}
            poster={current.thumbnailUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={title}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        )}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous"
            className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
            className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="size-7" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {index + 1} / {count}
          </div>
        </>
      ) : null}
    </div>
  );
}
