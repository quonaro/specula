import { Schema } from "@/types/openapi";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RefResolver } from "@/utils/ref-resolver";

interface SchemaViewProps {
  schema: Schema;
  title?: string;
  resolver: RefResolver;
}

export function SchemaView({ schema, title, resolver }: SchemaViewProps) {
  const resolvedSchema = resolver.resolve<Schema>(schema);

  const renderSchemaContent = (s: Schema, depth: number = 0): React.ReactNode => {
    if (depth > 10) return <span className="text-muted-foreground">Max depth reached</span>;

    const indent = depth * 16;

    return (
      <div style={{ marginLeft: depth > 0 ? `${indent}px` : 0 }} className="space-y-2">
        {s.description && (
          <p className="text-sm text-muted-foreground">{s.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {s.type && <Badge variant="outline">type: {s.type}</Badge>}
          {s.format && <Badge variant="outline">format: {s.format}</Badge>}
          {s.pattern && <Badge variant="outline">pattern: {s.pattern}</Badge>}
          {s.minimum !== undefined && <Badge variant="outline">min: {s.minimum}</Badge>}
          {s.maximum !== undefined && <Badge variant="outline">max: {s.maximum}</Badge>}
          {s.minLength !== undefined && <Badge variant="outline">minLength: {s.minLength}</Badge>}
          {s.maxLength !== undefined && <Badge variant="outline">maxLength: {s.maxLength}</Badge>}
          {s.minItems !== undefined && <Badge variant="outline">minItems: {s.minItems}</Badge>}
          {s.maxItems !== undefined && <Badge variant="outline">maxItems: {s.maxItems}</Badge>}
          {s.uniqueItems && <Badge variant="outline">uniqueItems</Badge>}
          {s.readOnly && <Badge variant="outline">readOnly</Badge>}
          {s.writeOnly && <Badge variant="outline">writeOnly</Badge>}
          {s.deprecated && <Badge variant="destructive">deprecated</Badge>}
        </div>

        {s.enum && (
          <div className="mt-2">
            <span className="text-sm font-medium">Enum values:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {s.enum.map((val, idx) => (
                <Badge key={idx} variant="secondary">{JSON.stringify(val)}</Badge>
              ))}
            </div>
          </div>
        )}

        {s.default !== undefined && (
          <div className="mt-2">
            <span className="text-sm font-medium">Default:</span>
            <code className="ml-2 px-2 py-1 bg-code-bg rounded text-sm">
              {JSON.stringify(s.default)}
            </code>
          </div>
        )}

        {s.properties && (
          <div className="mt-3">
            <span className="text-sm font-semibold">Properties:</span>
            <div className="mt-2 space-y-3 border-l-2 border-border pl-3">
              {Object.entries(s.properties).map(([propName, propSchema]) => {
                const isRequired = s.required?.includes(propName);
                return (
                  <div key={propName}>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{propName}</code>
                      {isRequired && <Badge variant="destructive" className="text-xs">required</Badge>}
                    </div>
                    {renderSchemaContent(resolver.resolve(propSchema), depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {s.items && (
          <div className="mt-3">
            <span className="text-sm font-semibold">Array items:</span>
            {renderSchemaContent(resolver.resolve(s.items), depth + 1)}
          </div>
        )}

        {s.example !== undefined && (
          <div className="mt-2">
            <span className="text-sm font-medium">Example:</span>
            <pre className="mt-1 p-3 bg-code-bg rounded text-sm overflow-x-auto">
              {JSON.stringify(s.example, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderAllOf = (schemas: Schema[]) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All of the following schemas must be satisfied:</p>
      {schemas.map((s, idx) => (
        <Card key={idx} className="p-4">
          <h4 className="font-medium mb-2">Schema {idx + 1}</h4>
          {renderSchemaContent(resolver.resolve(s))}
        </Card>
      ))}
    </div>
  );

  const renderOneOf = (schemas: Schema[]) => (
    <Tabs defaultValue="0" className="w-full">
      <TabsList className="w-full flex-wrap h-auto">
        {schemas.map((s, idx) => (
          <TabsTrigger key={idx} value={String(idx)}>
            Option {idx + 1}
            {s.title && `: ${s.title}`}
          </TabsTrigger>
        ))}
      </TabsList>
      {schemas.map((s, idx) => (
        <TabsContent key={idx} value={String(idx)}>
          <Card className="p-4">
            {renderSchemaContent(resolver.resolve(s))}
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );

  const renderAnyOf = (schemas: Schema[]) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Any of the following schemas can be satisfied:</p>
      <Tabs defaultValue="0" className="w-full">
        <TabsList className="w-full flex-wrap h-auto">
          {schemas.map((s, idx) => (
            <TabsTrigger key={idx} value={String(idx)}>
              Option {idx + 1}
              {s.title && `: ${s.title}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {schemas.map((s, idx) => (
          <TabsContent key={idx} value={String(idx)}>
            <Card className="p-4">
              {renderSchemaContent(resolver.resolve(s))}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      
      {resolvedSchema.allOf && renderAllOf(resolvedSchema.allOf)}
      {resolvedSchema.oneOf && renderOneOf(resolvedSchema.oneOf)}
      {resolvedSchema.anyOf && renderAnyOf(resolvedSchema.anyOf)}
      
      {!resolvedSchema.allOf && !resolvedSchema.oneOf && !resolvedSchema.anyOf && (
        renderSchemaContent(resolvedSchema)
      )}

      {resolvedSchema.externalDocs && (
        <a 
          href={resolvedSchema.externalDocs.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          📖 {resolvedSchema.externalDocs.description || 'External Documentation'}
        </a>
      )}
    </div>
  );
}
