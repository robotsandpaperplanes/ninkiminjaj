import { useEffect, useRef, useState } from 'react';
import { initialRoute, parseRoute, routePath, type AdminRoute } from './routes';

// A small History API adapter keeps URLs authoritative without adding a router dependency.
export function useAdminRoute(allow: (next: AdminRoute) => boolean) {
  const [route, setRoute] = useState(initialRoute);
  const routeRef = useRef(route);
  const allowRef = useRef(allow);
  allowRef.current = allow;
  const index = useRef(0);
  const restoring = useRef(false);
  const remember = (next: AdminRoute) => {
    try { localStorage.setItem('mts-link-admin-last-' + next.mode, routePath(next)); } catch { /* In-memory navigation remains available. */ }
  };
  useEffect(() => {
    index.current = Number(history.state?.adminIndex) || 0;
    history.replaceState({ ...history.state, adminIndex: index.current }, '', routePath(routeRef.current));
    remember(routeRef.current);
    const pop = () => {
      if (restoring.current) { restoring.current = false; return; }
      const next = parseRoute(location.pathname, location.search, location.hash);
      const nextIndex = Number(history.state?.adminIndex);
      if (!next || !allowRef.current(next)) {
        if (Number.isFinite(nextIndex) && nextIndex !== index.current) {
          restoring.current = true;
          history.go(index.current - nextIndex);
        } else history.replaceState({ ...history.state, adminIndex: index.current }, '', routePath(routeRef.current));
        return;
      }
      index.current = Number.isFinite(nextIndex) ? nextIndex : index.current;
      routeRef.current = next;
      remember(next);
      setRoute(next);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  function navigate(next: AdminRoute, replace = false, confirmedDiscard = false) {
    if (!confirmedDiscard && !allowRef.current(next)) return;
    if (routePath(next) === routePath(routeRef.current)) return;
    if (!replace) index.current += 1;
    history[replace ? 'replaceState' : 'pushState']({ ...history.state, adminIndex: index.current }, '', routePath(next));
    routeRef.current = next;
    remember(next);
    setRoute(next);
    window.scrollTo(0, 0);
  }
  return { route, navigate };
}
