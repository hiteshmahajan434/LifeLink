import { useEffect, useState } from "react";

// Current time (ms), re-rendering every `ms` — used for live countdowns
export default function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}
