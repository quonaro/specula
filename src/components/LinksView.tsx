import { Link } from "@/types/openapi";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { RefResolver } from "@/utils/ref-resolver";
import { ExternalLink } from "lucide-react";

interface LinksViewProps {
  links: Record<string, Link>;
  resolver: RefResolver;
}

export function LinksView({ links, resolver }: LinksViewProps) {
  if (!links || Object.keys(links).length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Links</h3>
      <p className="text-sm text-muted-foreground">
        Links to other operations that can be performed using values from this response
      </p>
      
      <div className="space-y-3">
        {Object.entries(links).map(([linkName, link]) => {
          const resolvedLink = resolver.resolve<Link>(link);
          
          return (
            <Card key={linkName} className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <ExternalLink className="w-4 h-4 mt-0.5 text-primary" />
                <h4 className="font-medium">{linkName}</h4>
              </div>
              
              {resolvedLink.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {resolvedLink.description}
                </p>
              )}

              <div className="space-y-2">
                {resolvedLink.operationId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Operation ID</Badge>
                    <code className="text-sm">{resolvedLink.operationId}</code>
                  </div>
                )}

                {resolvedLink.operationRef && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Operation Ref</Badge>
                    <code className="text-sm">{resolvedLink.operationRef}</code>
                  </div>
                )}

                {resolvedLink.parameters && Object.keys(resolvedLink.parameters).length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Parameters:</span>
                    <pre className="mt-1 p-2 bg-code-bg rounded text-xs overflow-x-auto">
                      {JSON.stringify(resolvedLink.parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {resolvedLink.requestBody !== undefined && (
                  <div>
                    <span className="text-sm font-medium">Request Body:</span>
                    <pre className="mt-1 p-2 bg-code-bg rounded text-xs overflow-x-auto">
                      {JSON.stringify(resolvedLink.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {resolvedLink.server && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Server</Badge>
                    <code className="text-sm">{resolvedLink.server.url}</code>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
