import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Refleja el ajuste de "reducir movimiento" del sistema.
 * Las animaciones deben saltar a su estado final cuando está activo.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduced(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduced;
}
