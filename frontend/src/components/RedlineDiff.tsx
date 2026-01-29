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
      console.log('🔍 Parsing diff text:', diffText);
      const parsed = parseDiff(diffText);
      console.log('✅ Parsed diff files:', parsed);

      // Filter out any undefined or invalid file objects
      const validFiles = parsed.filter(file => {
        if (!file) {
          console.warn('⚠️ Undefined file in parsed diff');
          return false;
        }
        if (!file.hunks) {
          console.warn('⚠️ File missing hunks:', file);
          return false;
        }
        return true;
      });

      console.log(`✅ Valid files: ${validFiles.length}/${parsed.length}`);
      return validFiles;
    } catch (error) {
      console.error("❌ Failed to parse diff:", error);
      console.error("Diff text was:", diffText);
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
    // Fallback: Show original and rewritten side by side if diff parsing fails
    return (
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-zinc-800 border-b-2 border-zinc-700 px-4 py-2">
          <p className="text-xs font-bold text-zinc-400">
            Comparison View (diff parsing unavailable)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <h4 className="text-xs font-bold text-red-400 mb-2">Original</h4>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap bg-red-950/30 border border-red-800/50 rounded p-3">
              {original}
            </pre>
          </div>
          <div>
            <h4 className="text-xs font-bold text-green-400 mb-2">Proposed Fix</h4>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap bg-green-950/30 border border-green-800/50 rounded p-3">
              {rewritten}
            </pre>
          </div>
        </div>
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

      {files.map((file, fileIndex) => {
        // Safety check
        if (!file || !file.hunks) {
          console.warn('⚠️ Skipping invalid file at index:', fileIndex);
          return null;
        }

        return (
          <div key={fileIndex}>
            <div className="bg-zinc-800 border-b-2 border-zinc-700 px-4 py-2">
              <p className="text-xs font-bold text-zinc-400">
                Legal Redline: Original vs. Proposed Fix
              </p>
            </div>
            <Diff
              key={`${file.oldRevision || 'old'}-${file.newRevision || 'new'}-${fileIndex}`}
              viewType="unified"
              diffType={file.type || 'modify'}
              hunks={file.hunks}
              renderToken={renderToken}
            >
              {(hunks) => hunks.map((hunk, hunkIdx) => (
                <Hunk key={`${hunk.content}-${hunkIdx}`} hunk={hunk} />
              ))}
            </Diff>
          </div>
        );
      })}

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
