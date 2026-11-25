import { useInView } from 'framer-motion';
import { useRef } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const revealVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  return { ref, isInView, revealVariants };
}
