import { Server } from "@/types/openapi";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Globe } from "lucide-react";

interface ServersViewProps {
  servers: Server[];
  title?: string;
}

export function ServersView({ servers, title = "Servers" }: ServersViewProps) {
  if (!servers || servers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Globe className="w-5 h-5" />
        {title}
      </h3>
      
      <div className="space-y-2">
        {servers.map((server, idx) => (
          <Card key={idx} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <code className="text-sm font-mono bg-code-bg px-2 py-1 rounded flex-1">
                  {server.url}
                </code>
              </div>
              
              {server.description && (
                <p className="text-sm text-muted-foreground">{server.description}</p>
              )}

              {server.variables && Object.keys(server.variables).length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-xs font-medium">Variables:</span>
                  {Object.entries(server.variables).map(([varName, variable]) => (
                    <div key={varName} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{varName}</Badge>
                      <span className="text-muted-foreground">default:</span>
                      <code className="text-xs">{variable.default}</code>
                      {variable.enum && variable.enum.length > 1 && (
                        <>
                          <span className="text-muted-foreground">options:</span>
                          <code className="text-xs">[{variable.enum.join(', ')}]</code>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
