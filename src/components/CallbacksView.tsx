import { Callback, PathItem, Operation } from "@/types/openapi";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { RefResolver } from "@/utils/ref-resolver";
import { getMethodColor } from "@/utils/openapi-parser";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { SchemaView } from "./SchemaView";

interface CallbacksViewProps {
  callbacks: Record<string, Callback>;
  resolver: RefResolver;
}

export function CallbacksView({ callbacks, resolver }: CallbacksViewProps) {
  if (!callbacks || Object.keys(callbacks).length === 0) return null;

  const renderOperation = (method: string, operation: Operation) => {
    const resolvedOp = resolver.resolve<Operation>(operation);
    
    return (
      <div className="space-y-3 mt-2">
        {resolvedOp.summary && (
          <p className="text-sm font-medium">{resolvedOp.summary}</p>
        )}
        {resolvedOp.description && (
          <p className="text-sm text-muted-foreground">{resolvedOp.description}</p>
        )}

        {resolvedOp.requestBody && (
          <div className="space-y-2">
            <h5 className="text-sm font-semibold">Request Body:</h5>
            {Object.entries(resolvedOp.requestBody.content || {}).map(([contentType, mediaType]: [string, any]) => (
              <Card key={contentType} className="p-3">
                <Badge variant="outline" className="mb-2">{contentType}</Badge>
                {mediaType?.schema && (
                  <SchemaView 
                    schema={mediaType.schema} 
                    resolver={resolver}
                  />
                )}
              </Card>
            ))}
          </div>
        )}

        {resolvedOp.responses && (
          <div className="space-y-2">
            <h5 className="text-sm font-semibold">Responses:</h5>
            {Object.entries(resolvedOp.responses).map(([statusCode, response]) => {
              const resolvedResponse = resolver.resolve(response);
              return (
                <Card key={statusCode} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{statusCode}</Badge>
                    <span className="text-sm">{resolvedResponse.description}</span>
                  </div>
                  {resolvedResponse.content && Object.entries(resolvedResponse.content).map(([ct, mt]: [string, any]) => (
                    <div key={ct} className="mt-2">
                      <Badge variant="secondary" className="mb-2">{ct}</Badge>
                      {mt?.schema && (
                        <SchemaView schema={mt.schema} resolver={resolver} />
                      )}
                    </div>
                  ))}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPathItem = (expression: string, pathItem: PathItem) => {
    const resolvedPath = resolver.resolve<PathItem>(pathItem);
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;

    return (
      <Card key={expression} className="p-4">
        <h4 className="text-sm font-mono mb-3 text-muted-foreground">
          Expression: <code className="text-foreground">{expression}</code>
        </h4>
        <Accordion type="single" collapsible className="w-full">
          {methods.map((method) => {
            const operation = resolvedPath[method];
            if (!operation) return null;

            return (
              <AccordionItem key={method} value={method}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`bg-method-${getMethodColor(method)} text-white`}
                    >
                      {method.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{operation.summary || 'Callback operation'}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderOperation(method, operation)}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Callbacks</h3>
      <p className="text-sm text-muted-foreground">
        Webhooks that may be triggered by this operation
      </p>
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(callbacks).map(([callbackName, callback]) => {
          const resolvedCallback = resolver.resolve<Callback>(callback);
          const expressions = Object.keys(resolvedCallback).filter(k => k !== '$ref');

          return (
            <AccordionItem key={callbackName} value={callbackName}>
              <AccordionTrigger>
                <span className="font-medium">{callbackName}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {expressions.map(expr => {
                    const pathItem = resolvedCallback[expr];
                    if (typeof pathItem === 'string' || !pathItem) return null;
                    return renderPathItem(expr, pathItem as PathItem);
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
