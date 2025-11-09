import { useState, useRef } from "react";
import { Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { OpenAPISpec } from "@/types/openapi";

interface FileUploadProps {
  onSpecLoad: (spec: OpenAPISpec) => void;
}

export function FileUpload({ onSpecLoad }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid file",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const spec = JSON.parse(e.target?.result as string);
        validateAndLoad(spec);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Could not parse the JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const validateAndLoad = (spec: any) => {
    if (!spec.openapi || !spec.paths) {
      toast({
        title: "Invalid OpenAPI spec",
        description: "Missing required fields (openapi, paths)",
        variant: "destructive",
      });
      return;
    }

    onSpecLoad(spec as OpenAPISpec);
    toast({
      title: "Success",
      description: `Loaded ${spec.info?.title || "OpenAPI specification"}`,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = () => {
    try {
      const spec = JSON.parse(jsonText);
      validateAndLoad(spec);
      setJsonText("");
      setShowPaste(false);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Could not parse the pasted JSON",
        variant: "destructive",
      });
    }
  };

  const loadExample = async () => {
    try {
      const response = await fetch("/example-openapi.json");
      const spec = await response.json();
      validateAndLoad(spec);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load example specification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <FileJson className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">OpenAPI Viewer</h1>
          <p className="text-muted-foreground">
            Load your OpenAPI 3.0+ specification to explore
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">Drop your openapi.json here</p>
              <p className="text-sm text-muted-foreground">or</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
              <Button variant="outline" onClick={() => setShowPaste(!showPaste)}>
                Paste JSON
              </Button>
              <Button variant="secondary" onClick={loadExample}>
                Load Example
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>

        {showPaste && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <Textarea
              placeholder="Paste your OpenAPI JSON here..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaste(false)}>
                Cancel
              </Button>
              <Button onClick={handlePaste}>Load Specification</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
