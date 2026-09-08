'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns `true` while a fixed/sticky bar should be hidden: the user is
 * scrolling down and is past `revealAt` pixels from the top. Scrolling up — or
 * returning near the top — reveals it again. `frozen` keeps it visible (e.g.
 * while a menu is open).
 */
export function useHideOnScroll(revealAt = 80, frozen = false): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (frozen || y < revealAt) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }

      lastY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [revealAt, frozen]);

  return hidden;
}
