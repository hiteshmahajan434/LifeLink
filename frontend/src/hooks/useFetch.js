import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/format";

/**
 * Load data from an API function that returns { success, data, message }.
 *
 *   const { data, loading, error, reload } = useFetch(getHospitalDashboard);
 *   const { data } = useFetch(getHospitalRequests, { interval: 15000 });
 *
 * `fetcher` must be a stable reference (the functions in src/api are).
 * With `interval`, data refreshes silently in the background.
 * reload()               → shows the loading state again
 * reload({ silent: true }) → refreshes without flashing a spinner
 */
export default function useFetch(fetcher, { interval } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // true for the very first load
  const [error, setError] = useState("");
  const mounted = useRef(true);

  // One request. State is only set after the await, never synchronously.
  const fetchData = useCallback(async () => {
    try {
      const response = await fetcher();
      if (response?.success === false) throw new Error(response.message || "Request failed");
      if (!mounted.current) return;
      setData(response?.data ?? null);
      setError("");
    } catch (err) {
      if (mounted.current) setError(getErrorMessage(err, "Unable to load data."));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fetcher]);

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      await fetchData();
    },
    [fetchData]
  );

  useEffect(() => {
    mounted.current = true;
    // Fetch-on-mount: fetchData only sets state after the await, so this cannot cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const timer = interval ? setInterval(fetchData, interval) : null;
    return () => {
      mounted.current = false;
      if (timer) clearInterval(timer);
    };
  }, [fetchData, interval]);

  return { data, loading, error, reload };
}
