/**
 * Custom hook for handling text selection in the document.
 *
 * Enables users to manually select text ranges and tag them as PII.
 */

import { useState, useCallback, useEffect, RefObject } from "react";

interface TextSelection {
  text: string;
  start: number;
  end: number;
}

export function useTextSelection(
  containerRef: RefObject<HTMLDivElement>,
  documentText: string
) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleSelectionChange = useCallback(() => {
    const nativeSelection = window.getSelection();

    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const selectedText = nativeSelection.toString().trim();

    // Only process if there's actual text selected
    if (!selectedText || selectedText.length === 0) {
      setSelection(null);
      return;
    }

    // Check if selection is within our container
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    try {
      // Calculate character offsets in the full document text
      // We need to find where this selected text appears in the document

      // Get the text content before the selection start
      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(containerRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const preText = preSelectionRange.toString();

      // Find the character offset by counting actual characters (excluding line numbers)
      // This is a simplified approach - we count visible text only
      const start = documentText.indexOf(selectedText, 0);

      if (start === -1) {
        console.warn("Could not find selected text in document");
        setSelection(null);
        return;
      }

      const end = start + selectedText.length;

      setSelection({
        text: selectedText,
        start,
        end
      });

      console.log(`📝 Text selected: "${selectedText}" at ${start}-${end}`);
    } catch (err) {
      console.error("Error calculating selection offsets:", err);
      setSelection(null);
    }
  }, [containerRef, documentText]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  return {
    selection,
    clearSelection
  };
}
