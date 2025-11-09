import { useState } from "react";
import { Operation, OpenAPISpec } from "@/types/openapi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefResolver } from "@/utils/ref-resolver";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TryItOutProps {
  method: string;
  path: string;
  operation: Operation;
  spec: OpenAPISpec;
}

export function TryItOut({ method, path, operation, spec }: TryItOutProps) {
  const resolver = new RefResolver(spec);
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // State for parameters
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("{}");
  const [selectedServer, setSelectedServer] = useState(
    operation.servers?.[0]?.url || spec.servers?.[0]?.url || ""
  );

  const handleExecute = async () => {
    setIsExecuting(true);
    setResponse(null);

    try {
      // Build URL with path parameters
      let url = selectedServer + path;
      const queryParams: string[] = [];

      // Get resolved parameters
      const parameters = operation.parameters || [];
      parameters.forEach((param) => {
        const resolvedParam = resolver.resolve(param);
        const value = paramValues[resolvedParam.name];
        
        if (value) {
          if (resolvedParam.in === "path") {
            url = url.replace(`{${resolvedParam.name}}`, encodeURIComponent(value));
          } else if (resolvedParam.in === "query") {
            queryParams.push(`${encodeURIComponent(resolvedParam.name)}=${encodeURIComponent(value)}`);
          }
        }
      });

      if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
      }

      // Build headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      parameters.forEach((param) => {
        const resolvedParam = resolver.resolve(param);
        const value = paramValues[resolvedParam.name];
        if (value && resolvedParam.in === "header") {
          headers[resolvedParam.name] = value;
        }
      });

      // Build request options
      const options: RequestInit = {
        method: method.toUpperCase(),
        headers,
      };

      // Add body for non-GET requests
      if (method.toLowerCase() !== "get" && method.toLowerCase() !== "head") {
        try {
          const bodyObj = JSON.parse(requestBody);
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "Request body must be valid JSON",
            variant: "destructive",
          });
          setIsExecuting(false);
          return;
        }
      }

      // Execute request
      const startTime = Date.now();
      const res = await fetch(url, options);
      const duration = Date.now() - startTime;

      // Parse response
      const contentType = res.headers.get("content-type");
      let responseData;
      
      if (contentType?.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      // Build response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        duration,
        url,
      });

      toast({
        title: `Response: ${res.status}`,
        description: `Request completed in ${duration}ms`,
      });
    } catch (error: any) {
      setResponse({
        error: true,
        message: error.message,
        url: selectedServer + path,
      });
      
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard",
    });
  };

  const parameters = operation.parameters || [];
  const hasParameters = parameters.length > 0;
  const hasRequestBody = operation.requestBody !== undefined;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Play className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Try It Out</h3>
      </div>

      {/* Server Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Server URL</label>
        <Input
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          placeholder="https://api.example.com"
        />
      </div>

      {/* Parameters */}
      {hasParameters && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Parameters</h4>
          {parameters.map((param, idx) => {
            const resolvedParam = resolver.resolve(param);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {resolvedParam.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {resolvedParam.in}
                  </Badge>
                  {resolvedParam.required && (
                    <Badge variant="destructive" className="text-xs">
                      required
                    </Badge>
                  )}
                </div>
                {resolvedParam.description && (
                  <p className="text-xs text-muted-foreground">
                    {resolvedParam.description}
                  </p>
                )}
                <Input
                  value={paramValues[resolvedParam.name] || ""}
                  onChange={(e) =>
                    setParamValues({
                      ...paramValues,
                      [resolvedParam.name]: e.target.value,
                    })
                  }
                  placeholder={`Enter ${resolvedParam.name}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Request Body */}
      {hasRequestBody && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Request Body</h4>
          <Textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            placeholder="Enter JSON request body"
            className="font-mono text-xs min-h-[150px]"
          />
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full"
      >
        <Play className="w-4 h-4 mr-2" />
        {isExecuting ? "Executing..." : "Execute"}
      </Button>

      {/* Response */}
      {response && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Response</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(JSON.stringify(response, null, 2))}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {response.error ? (
            <Card className="p-4 bg-destructive/10 border-destructive">
              <p className="text-sm font-semibold text-destructive">Error</p>
              <p className="text-xs text-muted-foreground mt-1">
                {response.message}
              </p>
            </Card>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={
                    response.status >= 200 && response.status < 300
                      ? "default"
                      : "destructive"
                  }
                >
                  {response.status} {response.statusText}
                </Badge>
                <Badge variant="outline">{response.duration}ms</Badge>
              </div>

              <Tabs defaultValue="body" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="body" className="flex-1">Body</TabsTrigger>
                  <TabsTrigger value="headers" className="flex-1">Headers</TabsTrigger>
                </TabsList>

                <TabsContent value="body" className="mt-2">
                  <ScrollArea className="h-[300px] w-full">
                    <pre className="bg-code-bg border border-code-border rounded-lg p-3 text-xs overflow-x-auto">
                      {typeof response.data === "string"
                        ? response.data
                        : JSON.stringify(response.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="headers" className="mt-2">
                  <ScrollArea className="h-[300px] w-full">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div
                          key={key}
                          className="border border-border rounded p-2"
                        >
                          <code className="text-xs font-semibold">{key}</code>
                          <p className="text-xs text-muted-foreground mt-1">
                            {value as string}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
