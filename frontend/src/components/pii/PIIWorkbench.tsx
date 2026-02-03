"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  X,
  Eye,
  EyeOff,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Plus,
  User,
  Mail,
  Phone
} from "lucide-react";
import { useTextSelection } from "@/lib/hooks/useTextSelection";
import type { PIIEntity } from "@/types/pii";

interface PIIWorkbenchProps {
  sessionId: string;
  documentText: string;
  detectedEntities: PIIEntity[];
  onApprove: (validatedEntities: PIIEntity[]) => void;
  onCancel: () => void;
}

export function PIIWorkbench({
  sessionId,
  documentText,
  detectedEntities,
  onApprove,
  onCancel
}: PIIWorkbenchProps) {
  const [entities, setEntities] = useState<PIIEntity[]>(detectedEntities);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number | null>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Text selection for manual tagging
  const { selection, clearSelection } = useTextSelection(documentContainerRef, documentText);

  // Calculate stats
  const activeEntities = entities.filter(e => !e.dismissed);
  const dismissedEntities = entities.filter(e => e.dismissed);
  const humanAddedEntities = entities.filter(e => e.source === "human" && !e.dismissed);
  const machineDetectedEntities = entities.filter(e => e.source === "machine" && !e.dismissed);

  const handleDismiss = useCallback((index: number) => {
    setEntities(prev =>
      prev.map((e, i) => i === index ? {...e, dismissed: true} : e)
    );
    console.log(`🚫 Dismissed entity at index ${index}`);
  }, []);

  const handleRestore = useCallback((index: number) => {
    setEntities(prev =>
      prev.map((e, i) => i === index ? {...e, dismissed: false} : e)
    );
    console.log(`✅ Restored entity at index ${index}`);
  }, []);

  const handleManualTag = useCallback((entityType: "PERSON" | "EMAIL_ADDRESS" | "PHONE_NUMBER") => {
    if (!selection) {
      console.warn("No text selected for tagging");
      return;
    }

    // Check if this range overlaps with any existing entity
    const overlaps = entities.some(e =>
      !e.dismissed && (
        (selection.start >= e.start && selection.start < e.end) ||
        (selection.end > e.start && selection.end <= e.end) ||
        (selection.start <= e.start && selection.end >= e.end)
      )
    );

    if (overlaps) {
      alert("Selected text overlaps with an existing entity. Please dismiss the existing entity first or select different text.");
      return;
    }

    // Generate pseudonym ID
    const existingCountsForType = entities.filter(e => e.entity_type === entityType).length;
    const pseudo_id = `[${entityType}_${existingCountsForType + 1}]`;

    const newEntity: PIIEntity = {
      entity_type: entityType,
      start: selection.start,
      end: selection.end,
      text: selection.text,
      confidence: 1.0,
      pseudo_id,
      source: "human",
      dismissed: false
    };

    setEntities(prev => [...prev, newEntity].sort((a, b) => a.start - b.start));
    clearSelection();

    console.log(`➕ Manually added ${entityType} entity: "${selection.text}" at ${selection.start}-${selection.end}`);
  }, [selection, entities, clearSelection]);

  const handleApprove = useCallback(() => {
    console.log(`🚀 Approving ${activeEntities.length} entities for session ${sessionId}`);
    onApprove(entities);
  }, [entities, activeEntities.length, onApprove, sessionId]);

  // Get entity type badge color
  const getEntityTypeBadge = (entityType: string) => {
    const colors = {
      PERSON: "bg-blue-600 border-blue-400",
      EMAIL_ADDRESS: "bg-purple-600 border-purple-400",
      PHONE_NUMBER: "bg-green-600 border-green-400"
    };
    return colors[entityType as keyof typeof colors] || "bg-zinc-600 border-zinc-400";
  };

  // Render document with highlighted entities
  const renderHighlightedDocument = () => {
    const lines = documentText.split("\n");

    return lines.map((line, lineIdx) => {
      // Find entities in this line
      const lineStart = documentText.split("\n").slice(0, lineIdx).join("\n").length + (lineIdx > 0 ? 1 : 0);
      const lineEnd = lineStart + line.length;

      const lineEntities = activeEntities.filter(
        e => e.start >= lineStart && e.start < lineEnd
      );

      if (lineEntities.length === 0) {
        // No entities in this line
        return (
          <div key={lineIdx} className="flex">
            <span className="select-none text-zinc-600 text-right w-12 shrink-0 pr-3 border-r-2 border-zinc-800 font-bold">
              {lineIdx + 1}
            </span>
            <span className="pl-4 flex-1 whitespace-pre-wrap text-zinc-300">
              {line || "\u00A0"}
            </span>
          </div>
        );
      }

      // Render line with highlighted entities
      const parts = [];
      let lastIndex = lineStart;

      lineEntities.forEach((entity, idx) => {
        // Text before entity
        if (entity.start > lastIndex) {
          parts.push({
            type: "text",
            content: documentText.slice(lastIndex, entity.start)
          });
        }

        // Entity itself
        const entityIndex = entities.findIndex(e => e === entity);
        const isSelected = entityIndex === selectedEntityIndex;

        parts.push({
          type: "entity",
          content: entity.text,
          entity,
          entityIndex,
          isSelected
        });

        lastIndex = entity.end;
      });

      // Text after last entity
      if (lastIndex < lineEnd) {
        parts.push({
          type: "text",
          content: documentText.slice(lastIndex, lineEnd)
        });
      }

      return (
        <div key={lineIdx} className="flex">
          <span className="select-none text-zinc-600 text-right w-12 shrink-0 pr-3 border-r-2 border-zinc-800 font-bold">
            {lineIdx + 1}
          </span>
          <span className="pl-4 flex-1 whitespace-pre-wrap text-zinc-300">
            {parts.map((part, partIdx) => {
              if (part.type === "text") {
                return <span key={partIdx}>{part.content}</span>;
              } else {
                return (
                  <span
                    key={partIdx}
                    onClick={() => setSelectedEntityIndex(part.entityIndex!)}
                    className={`inline-block px-2 py-1 mx-0.5 rounded font-bold cursor-pointer transition-all ${
                      getEntityTypeBadge(part.entity!.entity_type)
                    } ${
                      part.isSelected
                        ? "ring-2 ring-white scale-105"
                        : "hover:scale-105"
                    }`}
                  >
                    {part.entity!.pseudo_id}
                  </span>
                );
              }
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">PII Validation Workbench</h2>
              <p className="text-sm text-zinc-400 font-medium">Session: {sessionId.slice(0, 8)}</p>
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Document */}
        <div className="flex-1 flex flex-col border-r-2 border-zinc-700 min-h-0">
          <div className="bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4 flex-shrink-0">
            <h3 className="text-xl font-bold text-white">Document with Detected PII</h3>
            <p className="text-sm text-zinc-400 mt-1 font-medium">
              Click highlighted entities to view details, or select text to manually tag
            </p>
          </div>
          <ScrollArea className="flex-1 min-h-0 bg-black p-6">
            <div ref={documentContainerRef} className="font-mono text-sm leading-relaxed">
              {renderHighlightedDocument()}
            </div>

            {/* Manual Tagging Panel */}
            {selection && (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
                <Card className="bg-zinc-800 border-2 border-blue-500 shadow-2xl shadow-blue-500/50 animate-fade-in">
                  <CardContent className="pt-4 pb-4 px-6">
                    <div className="flex flex-col gap-3">
                      <div className="text-center">
                        <p className="text-sm text-zinc-400 mb-2">Tag selected text as:</p>
                        <p className="text-white font-mono text-sm mb-3 max-w-xs overflow-hidden text-ellipsis">
                          "{selection.text.length > 50 ? selection.text.slice(0, 50) + "..." : selection.text}"
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleManualTag("PERSON")}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                          size="sm"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Name
                        </Button>
                        <Button
                          onClick={() => handleManualTag("EMAIL_ADDRESS")}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                          size="sm"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          onClick={() => handleManualTag("PHONE_NUMBER")}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold"
                          size="sm"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Phone
                        </Button>
                        <Button
                          onClick={clearSelection}
                          variant="ghost"
                          className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel: Entity List & Actions */}
        <div className="w-96 bg-zinc-900 flex flex-col min-h-0">
          <div className="border-b-2 border-zinc-700 px-6 py-4 flex-shrink-0">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Shield className="w-6 h-6" />
              Detected Entities
            </h3>
            <p className="text-sm text-zinc-400 mt-1 font-medium">
              Review and approve PII redactions
            </p>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-6">
              {/* Stats Card */}
              <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-xl">
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div>
                      <div className="text-3xl font-bold text-blue-400">
                        {activeEntities.length}
                      </div>
                      <p className="text-sm text-zinc-300 font-medium">Active</p>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-zinc-500">
                        {dismissedEntities.length}
                      </div>
                      <p className="text-sm text-zinc-300 font-medium">Dismissed</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-700">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">Machine detected:</span>
                      <span className="text-blue-400 font-bold">{machineDetectedEntities.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Human added:</span>
                      <span className="text-green-400 font-bold">{humanAddedEntities.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Entity List */}
              <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg font-bold">Entity List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {entities.map((entity, idx) => {
                    const isSelected = idx === selectedEntityIndex;
                    const isDismissed = entity.dismissed;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedEntityIndex(idx)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-zinc-700 border-white"
                            : isDismissed
                            ? "bg-zinc-900 border-zinc-800 opacity-50"
                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getEntityTypeBadge(entity.entity_type)} text-white border-2 font-bold text-xs`}>
                              {entity.entity_type}
                            </Badge>
                            {entity.source === "human" && (
                              <Badge className="bg-green-600 border-green-400 text-white border-2 font-bold text-xs">
                                <Plus className="w-3 h-3 mr-1" />
                                Manual
                              </Badge>
                            )}
                          </div>
                          {isDismissed ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(idx);
                              }}
                              className="text-green-400 hover:text-green-300 hover:bg-zinc-800 h-6 px-2"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(idx);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-zinc-800 h-6 px-2"
                            >
                              <EyeOff className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                          )}
                        </div>
                        <div className="text-sm font-mono text-zinc-300 mb-1">
                          "{entity.text}"
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            Position: {entity.start}-{entity.end}
                          </span>
                          <span className={`font-bold ${
                            entity.source === "human" ? "text-green-400" : "text-blue-400"
                          }`}>
                            {entity.source}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer: Approval Actions */}
      <div className="bg-zinc-900 border-t-2 border-zinc-700 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-zinc-300">
            {activeEntities.length === 0 ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium">
                  No PII will be redacted - document is clean
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <p className="text-sm font-medium">
                  {activeEntities.length} {activeEntities.length === 1 ? "entity" : "entities"} will be masked before AI processing
                </p>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-2 border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 font-semibold px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/30 font-bold px-8"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Approve & Start Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
