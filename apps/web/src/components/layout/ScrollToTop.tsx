'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Floating "back to top" button — appears once the page is scrolled well past
 * one screenful, jumps back to the top on click.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > window.innerHeight * 1.5);
      ticking.current = false;
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-5 right-5 z-30 grid size-11 place-items-center rounded-full',
        'bg-brand text-white shadow-lg ring-1 ring-black/5',
        'transition-all duration-200 ease-out hover:bg-brand-dark',
        'motion-reduce:transition-none',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
