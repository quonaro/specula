import { Operation, OpenAPISpec } from "@/types/openapi";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMethodColor } from "@/utils/openapi-parser";
import { RefResolver } from "@/utils/ref-resolver";
import { SchemaView } from "./SchemaView";
import { CallbacksView } from "./CallbacksView";
import { LinksView } from "./LinksView";
import { ServersView } from "./ServersView";
import { TryItOut } from "./TryItOut";
import { Separator } from "./ui/separator";

interface OperationViewProps {
  method: string;
  path: string;
  operation: Operation;
  spec: OpenAPISpec;
}

export function OperationView({ method, path, operation, spec }: OperationViewProps) {
  const methodColor = getMethodColor(method);
  const resolver = new RefResolver(spec);

  return (
    <ScrollArea className="h-screen">
      <div className="p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={`bg-${methodColor} text-white font-bold px-3 py-1`}>
              {method}
            </Badge>
            <code className="text-lg font-mono text-foreground">{path}</code>
          </div>
          {operation.summary && (
            <h2 className="text-2xl font-bold text-foreground">{operation.summary}</h2>
          )}
          {operation.description && (
            <p className="text-muted-foreground">{operation.description}</p>
          )}
          <div className="flex gap-2">
            {operation.deprecated && (
              <Badge variant="destructive">Deprecated</Badge>
            )}
            {operation.operationId && (
              <Badge variant="outline">ID: {operation.operationId}</Badge>
            )}
          </div>
          {operation.externalDocs && (
            <a 
              href={operation.externalDocs.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              📖 {operation.externalDocs.description || 'External Documentation'}
            </a>
          )}
        </div>

        {/* Try It Out */}
        <Separator />
        <TryItOut method={method} path={path} operation={operation} spec={spec} />

        {/* Operation-specific Servers */}
        {operation.servers && operation.servers.length > 0 && (
          <>
            <Separator />
            <ServersView servers={operation.servers} title="Operation Servers" />
          </>
        )}

        {/* Parameters */}
        {operation.parameters && operation.parameters.length > 0 && (
          <>
            <Separator />
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Parameters</h3>
              <div className="space-y-3">
                {operation.parameters.map((param, idx) => {
                  const resolvedParam = resolver.resolve(param);
                  return (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-semibold text-foreground">
                          {resolvedParam.name}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {resolvedParam.in}
                        </Badge>
                        {resolvedParam.required && (
                          <Badge variant="destructive" className="text-xs">
                            required
                          </Badge>
                        )}
                        {resolvedParam.deprecated && (
                          <Badge variant="destructive" className="text-xs">
                            deprecated
                          </Badge>
                        )}
                      </div>
                      {resolvedParam.description && (
                        <p className="text-sm text-muted-foreground">
                          {resolvedParam.description}
                        </p>
                      )}
                      {resolvedParam.schema && (
                        <div className="mt-2">
                          <SchemaView schema={resolvedParam.schema} resolver={resolver} />
                        </div>
                      )}
                      {resolvedParam.examples && Object.keys(resolvedParam.examples).length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Examples:</span>
                          {Object.entries(resolvedParam.examples).map(([exName, ex]: [string, any]) => {
                            const resolvedEx = resolver.resolve(ex);
                            return (
                              <div key={exName} className="mt-1">
                                <Badge variant="secondary" className="text-xs mb-1">{exName}</Badge>
                                {resolvedEx.description && (
                                  <p className="text-xs text-muted-foreground">{resolvedEx.description}</p>
                                )}
                                {resolvedEx.value !== undefined && (
                                  <pre className="text-xs bg-code-bg px-2 py-1 rounded mt-1">
                                    {JSON.stringify(resolvedEx.value, null, 2)}
                                  </pre>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* Request Body */}
        {operation.requestBody && (
          <>
            <Separator />
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Request Body</h3>
              {(() => {
                const resolvedBody = resolver.resolve(operation.requestBody);
                return (
                  <>
                    {resolvedBody.description && (
                      <p className="text-sm text-muted-foreground">
                        {resolvedBody.description}
                      </p>
                    )}
                    {resolvedBody.required && (
                      <Badge variant="destructive" className="text-xs">
                        required
                      </Badge>
                    )}
                    {Object.entries(resolvedBody.content || {}).map(
                      ([contentType, mediaType]: [string, any]) => (
                        <div key={contentType} className="space-y-3">
                          <div className="text-sm font-medium text-foreground">
                            Content-Type: <code>{contentType}</code>
                          </div>
                          {mediaType?.schema && (
                            <SchemaView schema={mediaType.schema} title="Schema" resolver={resolver} />
                          )}
                          {mediaType?.examples && Object.keys(mediaType.examples).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Examples:</h4>
                              {Object.entries(mediaType.examples).map(([exName, ex]: [string, any]) => {
                                const resolvedEx = resolver.resolve(ex);
                                return (
                                  <div key={exName}>
                                    <Badge variant="secondary" className="mb-1">{exName}</Badge>
                                    {resolvedEx.description && (
                                      <p className="text-sm text-muted-foreground">{resolvedEx.description}</p>
                                    )}
                                    {resolvedEx.value !== undefined && (
                                      <pre className="bg-code-bg border border-code-border rounded-lg p-3 overflow-x-auto text-xs">
                                        {JSON.stringify(resolvedEx.value, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {mediaType?.encoding && Object.keys(mediaType.encoding).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Encoding:</h4>
                              {Object.entries(mediaType.encoding).map(([fieldName, encoding]: [string, any]) => (
                                <div key={fieldName} className="border border-border rounded p-2">
                                  <code className="text-xs font-semibold">{fieldName}</code>
                                  {encoding.contentType && (
                                    <div className="text-xs text-muted-foreground">
                                      Content-Type: {encoding.contentType}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </>
                );
              })()}
            </Card>
          </>
        )}

        {/* Responses */}
        {operation.responses && (
          <>
            <Separator />
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Responses</h3>
              <div className="space-y-4">
                {Object.entries(operation.responses).map(([code, response]) => {
                  const resolvedResponse = resolver.resolve(response);
                  return (
                    <div
                      key={code}
                      className="border border-border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            code.startsWith("2") ? "default" : "destructive"
                          }
                        >
                          {code}
                        </Badge>
                        <span className="text-sm text-foreground">
                          {resolvedResponse.description}
                        </span>
                      </div>
                      
                      {resolvedResponse.headers && Object.keys(resolvedResponse.headers).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Headers:</h4>
                          {Object.entries(resolvedResponse.headers).map(([headerName, header]: [string, any]) => {
                            const resolvedHeader = resolver.resolve(header);
                            return (
                              <div key={headerName} className="text-sm">
                                <code className="font-semibold">{headerName}</code>
                                {resolvedHeader.description && (
                                  <span className="text-muted-foreground ml-2">
                                    - {resolvedHeader.description}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {resolvedResponse.content &&
                        Object.entries(resolvedResponse.content).map(
                          ([contentType, mediaType]: [string, any]) => (
                            <div key={contentType} className="space-y-2">
                              <div className="text-sm font-medium text-foreground">
                                Content-Type: <code>{contentType}</code>
                              </div>
                              {mediaType?.schema && (
                                <SchemaView schema={mediaType.schema} title="Schema" resolver={resolver} />
                              )}
                              {mediaType?.examples && Object.keys(mediaType.examples).length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Examples:</h4>
                                  {Object.entries(mediaType.examples).map(([exName, ex]: [string, any]) => {
                                    const resolvedEx = resolver.resolve(ex);
                                    return (
                                      <div key={exName}>
                                        <Badge variant="secondary" className="mb-1">{exName}</Badge>
                                        {resolvedEx.description && (
                                          <p className="text-sm text-muted-foreground">{resolvedEx.description}</p>
                                        )}
                                        {resolvedEx.value !== undefined && (
                                          <pre className="bg-code-bg border border-code-border rounded-lg p-3 overflow-x-auto text-xs">
                                            {JSON.stringify(resolvedEx.value, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      
                      {resolvedResponse.links && (
                        <LinksView links={resolvedResponse.links} resolver={resolver} />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* Callbacks */}
        {operation.callbacks && Object.keys(operation.callbacks).length > 0 && (
          <>
            <Separator />
            <CallbacksView callbacks={operation.callbacks} resolver={resolver} />
          </>
        )}

        {/* Security */}
        {operation.security && operation.security.length > 0 && (
          <>
            <Separator />
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Security</h3>
              <div className="space-y-2">
                {operation.security.map((sec, idx) => (
                  <div key={idx} className="flex gap-2 flex-wrap">
                    {Object.entries(sec).map(([scheme, scopes]) => (
                      <Badge key={scheme} variant="outline">
                        {scheme}
                        {scopes.length > 0 && `: ${scopes.join(", ")}`}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
