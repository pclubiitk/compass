import { useEffect, useRef } from "react";

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
    if (isOpen) {
      // Push a dummy state so that "back" stays on the same page
      window.history.pushState({ drawerOpen: true }, "");
      didPushRef.current = true;

      const handlePopState = () => {
        // Back was pressed — close the drawer instead of navigating
        didPushRef.current = false;
        onCloseRef.current();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If the drawer was closed programmatically (not via back button),
        // clean up the dummy history entry we pushed
        if (didPushRef.current) {
          didPushRef.current = false;
          window.history.back();
        }
      };
    }
  }, [isOpen]); // Only re-run when open state actually changes
}
