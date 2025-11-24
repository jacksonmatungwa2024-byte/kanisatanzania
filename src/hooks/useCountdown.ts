import { useEffect, useState } from "react";

/**
 * Custom hook for countdown timer (default 120s).
 * Returns remaining seconds and a reset function.
 */
export function useCountdown(initialSeconds: number = 120) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const reset = () => setRemaining(initialSeconds);

  return { remaining, reset };
}
