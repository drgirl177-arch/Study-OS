import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTrackAnalyticsEvent } from "@workspace/api-client-react";

const ANON_ID_KEY = "grofo_anon_id";

function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

/**
 * Fires a lightweight product-analytics event. Works for guests (no auth
 * required) — the server attaches clerkUserId when a session is present.
 * Never throws or surfaces errors to the UI; analytics must not break flows.
 */
export function useTrackEvent() {
  const track = useTrackAnalyticsEvent();
  return (name: string, properties?: Record<string, unknown>) => {
    track.mutate({
      data: { name, path: window.location.pathname, anonId: getAnonId(), properties },
    });
  };
}

/** Fires a "page_view" event whenever the route changes. */
export function usePageViewTracking() {
  const [location] = useLocation();
  const track = useTrackEvent();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === location) return;
    lastPath.current = location;
    track("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
}
