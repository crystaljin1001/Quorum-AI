"use client";

import { useMemo } from "react";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import { diffLines, formatLines } from "unidiff";
import "react-diff-view/style/index.css";

interface RedlineDiffProps {
  original: string;
  rewritten: string;
  fileName?: string;
}

export function RedlineDiff({ original, rewritten, fileName = "clause.txt" }: RedlineDiffProps) {
  const diffText = useMemo(() => {
    // Create unified diff format
    const oldLines = original.split('\n');
    const newLines = rewritten.split('\n');

    // Use unidiff to create proper diff format
    const diffResult = formatLines(diffLines(oldLines, newLines), {
      context: 3,
    });

    // Create proper unified diff header
    const unifiedDiff = `--- a/${fileName}\n+++ b/${fileName}\n${diffResult}`;

    return unifiedDiff;
  }, [original, rewritten, fileName]);

  const files = useMemo(() => {
    try {
      return parseDiff(diffText);
    } catch (error) {
      console.error("Failed to parse diff:", error);
      return [];
    }
  }, [diffText]);

  const renderToken = (token: any) => {
    // Custom token renderer for better styling
    const className = token.type === 'added'
      ? 'token-added'
      : token.type === 'deleted'
      ? 'token-deleted'
      : '';

    return (
      <span key={token.key} className={className}>
        {token.children}
      </span>
    );
  };

  if (files.length === 0) {
    return (
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">No differences to display</p>
      </div>
    );
  }

  return (
    <div className="redline-diff-container">
      <style jsx global>{`
        .redline-diff-container {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
        }

        /* Override react-diff-view styles for legal redline */
        .diff {
          background: #18181b !important;
          border: 2px solid #3f3f46 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }

        .diff-gutter {
          background: #27272a !important;
          border-right: 1px solid #3f3f46 !important;
          min-width: 50px !important;
          text-align: right !important;
          padding: 0 8px !important;
          color: #71717a !important;
          user-select: none;
        }

        .diff-gutter-col {
          vertical-align: top !important;
        }

        .diff-code {
          padding: 0 12px !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          color: #e4e4e7 !important;
        }

        /* Deletion styling - Red with strikethrough */
        .diff-gutter-delete {
          background: #450a0a !important;
          color: #fca5a5 !important;
        }

        .diff-code-delete {
          background: #7f1d1d !important;
          color: #fca5a5 !important;
          text-decoration: line-through !important;
          text-decoration-color: #dc2626 !important;
          text-decoration-thickness: 2px !important;
        }

        /* Addition styling - Green highlighting */
        .diff-gutter-insert {
          background: #052e16 !important;
          color: #86efac !important;
        }

        .diff-code-insert {
          background: #14532d !important;
          color: #86efac !important;
          font-weight: 500 !important;
        }

        /* Normal lines */
        .diff-gutter-normal {
          background: #27272a !important;
        }

        .diff-code-normal {
          background: #18181b !important;
          color: #d4d4d8 !important;
        }

        /* Omit gutter styling */
        .diff-gutter-omit {
          background: #27272a !important;
          color: #52525b !important;
        }

        /* Hunk header */
        .diff-hunk-header {
          background: #3f3f46 !important;
          color: #a1a1aa !important;
          padding: 6px 12px !important;
          font-weight: 600 !important;
        }

        /* Token-level changes */
        .token-added {
          background: #22c55e !important;
          color: #000 !important;
          font-weight: 700 !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
        }

        .token-deleted {
          background: #dc2626 !important;
          color: #fff !important;
          text-decoration: line-through !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
        }

        /* Table structure */
        .diff-table {
          border-collapse: collapse !important;
          width: 100% !important;
        }

        .diff-table tr {
          border: none !important;
        }

        .diff-table td {
          border: none !important;
          vertical-align: top !important;
        }
      `}</style>

      {files.map((file, fileIndex) => (
        <div key={fileIndex}>
          <div className="bg-zinc-800 border-b-2 border-zinc-700 px-4 py-2">
            <p className="text-xs font-bold text-zinc-400">
              Legal Redline: Original vs. Proposed Fix
            </p>
          </div>
          <Diff
            key={file.oldRevision + '-' + file.newRevision}
            viewType="unified"
            diffType={file.type}
            hunks={file.hunks || []}
            renderToken={renderToken}
          >
            {(hunks) => hunks.map((hunk) => (
              <Hunk key={hunk.content} hunk={hunk} />
            ))}
          </Diff>
        </div>
      ))}

      <div className="bg-zinc-900 border-t-2 border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-red-600 rounded"></span>
            <span className="text-zinc-400">Removed (strikethrough)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-green-600 rounded"></span>
            <span className="text-zinc-400">Added (highlighted)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
