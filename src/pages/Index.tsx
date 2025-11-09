import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Sidebar } from "@/components/Sidebar";
import { OperationView } from "@/components/OperationView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Download, FileJson } from "lucide-react";
import { OpenAPISpec, TagNode } from "@/types/openapi";
import { parseOpenAPISpec } from "@/utils/openapi-parser";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [tagTree, setTagTree] = useState<TagNode | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<{
    method: string;
    path: string;
  } | null>(null);

  useEffect(() => {
    if (spec) {
      const tree = parseOpenAPISpec(spec);
      setTagTree(tree);
    }
  }, [spec]);

  const handleSpecLoad = (loadedSpec: OpenAPISpec) => {
    setSpec(loadedSpec);
  };

  const handleDownload = () => {
    if (!spec) return;

    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.info?.title || "openapi"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "OpenAPI specification downloaded successfully",
    });
  };

  const handleOperationSelect = (method: string, path: string) => {
    setSelectedOperation({ method, path });
  };

  const getSelectedOperationDetails = () => {
    if (!spec || !selectedOperation) return null;

    const pathItem = spec.paths[selectedOperation.path];
    if (!pathItem) return null;

    const operation =
      pathItem[selectedOperation.method.toLowerCase() as keyof typeof pathItem];
    if (!operation) return null;

    return {
      method: selectedOperation.method,
      path: selectedOperation.path,
      operation,
      spec,
    };
  };

  if (!spec || !tagTree) {
    return <FileUpload onSpecLoad={handleSpecLoad} />;
  }

  const operationDetails = getSelectedOperationDetails();

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar
        root={tagTree}
        onOperationSelect={handleOperationSelect}
        selectedOperation={selectedOperation}
      />
      
      <div className="flex-1 flex flex-col h-screen">
        <header className="border-b border-border bg-card">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <FileJson className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {spec.info?.title || "OpenAPI Specification"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  v{spec.info?.version || "1.0.0"} | OpenAPI {spec.openapi}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <ThemeToggle />
            </div>
          </div>
          
          {/* Global info banner */}
          {(spec.info.description || spec.servers || spec.externalDocs) && (
            <div className="px-6 py-3 bg-muted/30 border-t border-border text-sm space-y-2">
              {spec.info.description && (
                <p className="text-muted-foreground">{spec.info.description}</p>
              )}
              {spec.servers && spec.servers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">Servers:</span>
                  {spec.servers.map((server, idx) => (
                    <code key={idx} className="px-2 py-0.5 bg-code-bg rounded text-xs">
                      {server.url}
                    </code>
                  ))}
                </div>
              )}
              {spec.externalDocs && (
                <a 
                  href={spec.externalDocs.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  📖 {spec.externalDocs.description || 'External Documentation'}
                </a>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-hidden">
          {operationDetails ? (
            <OperationView {...operationDetails} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <FileJson className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">
                  Select an operation
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose an endpoint from the sidebar to view details
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
