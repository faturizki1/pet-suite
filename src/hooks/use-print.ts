"use client";

import { useCallback } from "react";

/**
 * usePrint — unified print hook.
 *
 * Does NOT generate HTML manually. Instead, it relies on PrintWrapper
 * which renders the content in the DOM and uses CSS @media print
 * to show only the print-content element.
 *
 * This hook provides a convenience function to programmatically trigger
 * the same print behavior (e.g., from a button outside PrintWrapper).
 */

export function usePrint() {
  const printElement = useCallback((elementId?: string) => {
    // If an element ID is given, scroll to it first so it's in view
    if (elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
    document.body.classList.add("vetcare-printing");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("vetcare-printing");
    }, 1000);
  }, []);

  return { printElement };
}