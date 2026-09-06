'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { MediaType, type Media } from '@kasahouse/shared-types';
import { cn } from '@/lib/utils';

export function Gallery({ media, title }: { media: Media[]; title: string }) {
  const [active, setActive] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-surface-sunken text-sm text-ink-faint">
        No photos or video yet
      </div>
    );
  }

  const current = media[active]!;
  const isVideo = current.type === MediaType.VIDEO;

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-sunken">
        {isVideo ? (
          <video
            src={current.url}
            poster={current.thumbnailUrl}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={current.url}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {media.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2',
                i === active ? 'border-brand' : 'border-transparent',
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
    </div>
  );
}
