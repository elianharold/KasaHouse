'use client';

import { use, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCw, ImagePlus } from 'lucide-react';
import { MediaType } from '@kasahouse/shared-types';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorState } from '@/components/ui/States';
import { useListing } from '@/hooks/use-listings';
import { useChangeListingStatus } from '@/hooks/use-listing-mutations';
import { useListingMediaUpload } from '@/hooks/use-media';
import { toApiError } from '@/lib/api-error';

const MAX = 20;

export default function ListingMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const { items, isUploading, upload, retry, remove } = useListingMediaUpload(id);
  const changeStatus = useChangeListingStatus(id);
  const [banner, setBanner] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Loading…" />;
  if (isError || !listing) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const total = listing.media.length;
  const pending = items.filter((i) => i.status !== 'done');

  const onPick = (files: FileList | null) => {
    if (!files) return;
    const room = MAX - total;
    void upload(Array.from(files).slice(0, Math.max(0, room)));
  };

  const publish = async () => {
    setBanner(null);
    try {
      await changeStatus.mutateAsync({ status: 'PUBLISHED' });
      router.push(`/listings/${id}`);
    } catch (e) {
      setBanner(toApiError(e).message);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Photos &amp; video</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Add clear photos and a short video. Images are compressed in your browser before upload to
        save data. {total}/{MAX} added.
      </p>

      {banner ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{banner}</p>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = '';
        }}
      />

      <Button
        variant="secondary"
        onClick={() => fileInput.current?.click()}
        disabled={isUploading || total >= MAX}
      >
        <ImagePlus className="size-4" /> Add photos or video
      </Button>

      <div className="mt-6 flex flex-wrap gap-3">
        {listing.media.map((m) => (
          <div key={m.id} className="relative">
            <Image
              src={m.thumbnailUrl}
              alt=""
              width={112}
              height={112}
              className="size-28 rounded-xl object-cover"
            />
            {m.type === MediaType.VIDEO ? (
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                video
              </span>
            ) : null}
            <button
              onClick={() => void remove(m)}
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-danger text-white"
              aria-label="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {pending.length > 0 ? (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-ink">Uploading</h2>
          {pending.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-line p-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="size-10 rounded-lg object-cover" />
              <span
                className={`flex-1 text-xs ${
                  item.status === 'error' ? 'text-danger' : 'text-ink-muted'
                }`}
              >
                {item.status === 'uploading'
                  ? 'Compressing & uploading…'
                  : item.error ?? 'Upload failed'}
              </span>
              {item.status === 'error' ? (
                <button
                  onClick={() => void retry(item.key)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark"
                >
                  <RotateCw className="size-3.5" /> Retry
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 border-t border-line pt-6">
        {listing.status === 'PUBLISHED' ? (
          <Button onClick={() => router.push(`/listings/${id}`)}>Done</Button>
        ) : (
          <>
            <Button
              onClick={publish}
              loading={changeStatus.isPending}
              disabled={total === 0 || isUploading}
            >
              Publish listing
            </Button>
            <p className="mt-2 text-xs text-ink-muted">
              {total === 0
                ? 'Add at least one photo to publish.'
                : 'Your listing goes live immediately.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
