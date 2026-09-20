"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import type { MindMapGraph } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, HelpCircle, Layers } from "lucide-react";

interface MindMapTabProps {
  mindMap: MindMapGraph;
}

// Custom Node component definitions
const NodeCustomStyle = (type: string) => {
  switch (type) {
    case "root":
      return {
        background: "#4F46E5", // Indigo
        color: "#FFF",
        border: "1px solid #4338CA",
        borderRadius: "8px",
        padding: "10px 14px",
        fontWeight: "bold",
        fontSize: "14px",
        boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
      };
    case "concept":
      return {
        background: "#14B8A6", // Teal
        color: "#FFF",
        border: "1px solid #0D9488",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "13px",
        fontWeight: "600",
        boxShadow: "0 2px 4px -1px rgba(20, 184, 166, 0.15)",
      };
    case "detail":
      return {
        background: "#FFF",
        color: "#0F172A",
        border: "1px solid #CBD5E1",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
      };
    case "example":
      return {
        background: "#FEF3C7", // Amber light
        color: "#92400E",
        border: "1px dashed #F59E0B",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
        fontStyle: "italic",
      };
    default:
      return {
        background: "#F1F5F9",
        color: "#334155",
        border: "1px solid #E2E8F0",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
      };
  }
};

export function MindMapTab({ mindMap }: MindMapTabProps) {
  // Format graph objects for React Flow
  const initialNodes = useMemo(() => {
    return (mindMap.nodes || []).map((node) => ({
      id: node.id,
      position: node.position || { x: 100, y: 100 },
      data: { label: node.label },
      style: NodeCustomStyle(node.type),
    }));
  }, [mindMap.nodes]);

  const initialEdges = useMemo(() => {
    return (mindMap.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || undefined,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#94A3B8",
      },
      style: { stroke: "#94A3B8" },
    }));
  }, [mindMap.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state with props changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="space-y-4">
      {/* Legend & Guide */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-3 border-l-4 border-l-[#4F46E5]">
          <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Root Topic</div>
          <div className="text-sm font-semibold mt-0.5">Central Thesis</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-[#14B8A6]">
          <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Concept</div>
          <div className="text-sm font-semibold mt-0.5">Core Module</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-slate-300">
          <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Detail</div>
          <div className="text-sm font-semibold mt-0.5">Key Sub-elements</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-[#F59E0B] border-dashed">
          <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Example</div>
          <div className="text-sm font-semibold mt-0.5">Illustrations</div>
        </Card>
      </div>

      {/* React Flow Board */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 flex flex-row items-center justify-between border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Interactive Mind Map
          </CardTitle>
          <span className="text-xs text-muted-foreground">Scroll to zoom, drag to pan and rearrange nodes</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[480px] w-full bg-slate-950 relative rounded-b-xl border-t border-purple-500/20">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              role="application"
              aria-label="Interactive concept map"
            >
              <Background color="#CBD5E1" gap={16} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  const style = node.style;
                  return (style?.background as string) || "#EEE";
                }}
                nodeStrokeWidth={3}
                zoomable
                pannable
              />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
