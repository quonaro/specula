import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { TagNode } from "@/types/openapi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMethodColor } from "@/utils/openapi-parser";

interface SidebarProps {
  root: TagNode;
  onOperationSelect: (method: string, path: string) => void;
  selectedOperation: { method: string; path: string } | null;
}

export function Sidebar({ root, onOperationSelect, selectedOperation }: SidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("expandedNodes");
    if (saved) {
      setExpandedNodes(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem("expandedNodes", JSON.stringify(Array.from(expandedNodes)));
  }, [expandedNodes]);

  const toggleNode = (fullPath: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(fullPath)) {
      newExpanded.delete(fullPath);
    } else {
      newExpanded.add(fullPath);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: TagNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.fullPath);
    const hasChildren = node.children.size > 0;
    const hasOperations = node.operations.length > 0;

    if (node.name === "root") {
      return (
        <div>
          {Array.from(node.children.values()).map((child) => (
            <div key={child.fullPath}>{renderNode(child, level)}</div>
          ))}
        </div>
      );
    }

    return (
      <div key={node.fullPath}>
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors"
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            if (hasChildren || hasOperations) {
              toggleNode(node.fullPath);
            }
          }}
        >
          {(hasChildren || hasOperations) && (
            <div className="text-sidebar-foreground/70">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          {!hasChildren && !hasOperations && <div className="w-4" />}
          <span className="text-sm font-medium text-sidebar-foreground">
            {node.name}
          </span>
          {hasOperations && (
            <span className="ml-auto text-xs text-muted-foreground">
              {node.operations.length}
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            {/* Render operations */}
            {hasOperations &&
              node.operations.map((op) => {
                const isSelected =
                  selectedOperation?.method === op.method &&
                  selectedOperation?.path === op.path;
                return (
                  <div
                    key={`${op.method}-${op.path}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-sidebar-accent"
                    }`}
                    style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
                    onClick={() => onOperationSelect(op.method, op.path)}
                  >
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded bg-${getMethodColor(
                        op.method
                      )} text-white`}
                    >
                      {op.method}
                    </span>
                    <span className="text-sm truncate text-sidebar-foreground">
                      {op.path}
                    </span>
                  </div>
                );
              })}

            {/* Render child nodes */}
            {Array.from(node.children.values()).map((child) => (
              <div key={child.fullPath}>{renderNode(child, level + 1)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Navigation</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">{renderNode(root)}</div>
      </ScrollArea>
    </div>
  );
}
