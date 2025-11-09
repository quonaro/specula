import { OpenAPISpec, TagNode } from "@/types/openapi";

export function parseOpenAPISpec(spec: OpenAPISpec): TagNode {
  const root: TagNode = {
    name: "root",
    fullPath: "",
    children: new Map(),
    operations: [],
  };

  // Helper function to process paths
  const processPaths = (paths: Record<string, any>, isWebhook: boolean = false) => {
    Object.entries(paths).forEach(([path, pathItem]) => {
      const methods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"] as const;
      
      methods.forEach((method) => {
        const operation = pathItem[method];
        if (!operation) return;

        // Add webhook prefix if processing webhooks
        const tags = operation.tags || ["Untagged"];
        const processedTags = isWebhook 
          ? tags.map((tag: string) => `Webhooks | ${tag}`)
          : tags;
        
        processedTags.forEach((tag: string) => {
          // Normalize tag: remove spaces around "|" to handle all variants (auth | login, auth|login, etc.)
          const normalizedTag = tag.replace(/\s*\|\s*/g, "|");
          // Split tag by "|" to create hierarchy
          const parts = normalizedTag.split("|").map(p => p.trim()).filter(p => p.length > 0);
          
          if (parts.length === 0) {
            // Handle edge case: empty tag
            parts.push(isWebhook ? "Webhooks" : "Untagged");
          }
          
          // Navigate/create the tree structure
          let currentNode = root;
          let fullPath = "";
          
          parts.forEach((part, index) => {
            fullPath = fullPath ? `${fullPath} | ${part}` : part;
            
            if (!currentNode.children.has(part)) {
              currentNode.children.set(part, {
                name: part,
                fullPath,
                children: new Map(),
                operations: [],
              });
            }
            
            currentNode = currentNode.children.get(part)!;
            
            // Add operation to the deepest node only
            if (index === parts.length - 1) {
              currentNode.operations.push({
                method: method.toUpperCase(),
                path,
                operation,
              });
            }
          });
        });
      });
    });
  };

  // Process regular paths
  processPaths(spec.paths, false);

  // Process webhooks if present (OpenAPI 3.1+)
  if (spec.webhooks) {
    processPaths(spec.webhooks, true);
  }

  return root;
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "method-get",
    POST: "method-post",
    PUT: "method-put",
    DELETE: "method-delete",
    PATCH: "method-patch",
    OPTIONS: "method-options",
    HEAD: "method-head",
    TRACE: "method-trace",
  };
  return colors[method.toUpperCase()] || "muted";
}
