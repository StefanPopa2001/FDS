import { useEffect, useRef } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * useMobileBackToClose
 * - On mobile, when a modal/dialog opens, push a history state so the first back gesture closes it
 * - If the modal is closed programmatically, pop the pushed state to avoid accumulating extra back steps
 *
 * @param {boolean} open - whether the modal is open
 * @param {() => void} onClose - function to close the modal
 */
export default function useMobileBackToClose(open, onClose) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pushedRef = useRef(false);
  const ignoreNextPopRef = useRef(false);
  const poppedRef = useRef(false); // tracks if user popstate already removed our entry

  useEffect(() => {
    if (!isMobile) return; // only on mobile

    if (open) {
      // Push a marker state so that the first back pops here instead of navigating away
      try {
        window.history.pushState({ __rf_modal: true, t: Date.now() }, '');
        pushedRef.current = true;
      } catch {}

      const onPopState = (evt) => {
        // If the pop was triggered by our own cleanup back, ignore
        if (ignoreNextPopRef.current) {
          ignoreNextPopRef.current = false;
          return;
        }
        // Close the modal on back gesture
        // Mark that our pushed state has already been popped by user gesture
        pushedRef.current = false;
        poppedRef.current = true;
        if (typeof onClose === 'function') {
          onClose();
        }
      };

      window.addEventListener('popstate', onPopState);

      return () => {
        window.removeEventListener('popstate', onPopState);
      };
    } else {
      // If we had pushed a state when the modal opened and it wasn't already popped by user, remove it
      if (pushedRef.current && !poppedRef.current) {
        pushedRef.current = false;
        try {
          ignoreNextPopRef.current = true; // prevent calling onClose again during programmatic back
          window.history.back();
        } catch {}
      }
      // Reset the popped flag for next open cycle
      poppedRef.current = false;
    }
  }, [open, isMobile, onClose]);
}
