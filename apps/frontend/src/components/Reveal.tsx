import { useEffect, useRef, useState, createElement, type ReactNode } from 'react';

// Reveals its children with a fade-up the first time they scroll into view.
export function Reveal({
  children,
  as = 'div',
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  as?: 'div' | 'li' | 'section' | 'article';
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      className: `reveal ${shown ? 'reveal-in' : ''} ${className}`,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children
  );
}
