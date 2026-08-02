import { useEffect, useRef } from "react";

const DRAWER_STATE = { drawerOpen: true } as const;

/**
 * Intercepts the browser/phone back button to close a drawer/dialog
 * instead of navigating away. Essential for PWA UX on mobile.
 *
 * When `isOpen` becomes true, a dummy history entry is pushed.
 * Pressing back pops that entry and calls `onClose` instead of navigating.
 */
export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  // Store onClose in a ref so the effect doesn't re-run when the
  // parent passes an unstable (inline) callback reference.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const didPushRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;

    // Push a dummy state so that "back" stays on the same page
    window.history.pushState(DRAWER_STATE, "");
    didPushRef.current = true;

    const handlePopState = (event: PopStateEvent) => {
      // Only intercept the dummy history entry we pushed for the drawer;
      // ignore real back/forward navigation triggered by the user.
      if (
        !event.state ||
        !event.state.drawerOpen
      ) {
        return;
      }

      // Back was pressed — close the drawer instead of navigating
      didPushRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If the drawer was closed programmatically (not via back button),
      // clean up the dummy history entry we pushed. Guard so we only
      // undo our own push and never the user's real history.
      if (didPushRef.current && window.history.state?.drawerOpen) {
        didPushRef.current = false;
        window.history.back();
      }
    };
  }, [isOpen]); // Only re-run when open state actually changes
}
