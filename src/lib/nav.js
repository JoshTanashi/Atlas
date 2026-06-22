import { useEffect, useState } from 'react';

const ROUTE_CHANGE_EVENT = 'atlas:routechange';

export function navigate(path) {
  if (path === window.location.pathname) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

export function replaceRoute(path) {
  window.history.replaceState({}, '', path);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

export function useRoute() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onChange);
    window.addEventListener(ROUTE_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener(ROUTE_CHANGE_EVENT, onChange);
    };
  }, []);

  return pathname;
}
