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

// Helper function to find a node by fullPath in the tree
export function findNodeByPath(root: TagNode, fullPath: string): TagNode | null {
  if (root.fullPath === fullPath) {
    return root
  }
  
  for (const child of root.children.values()) {
    const found = findNodeByPath(child, fullPath)
    if (found) {
      return found
    }
  }
  
  return null
}

// Convert a string to a URL-friendly slug
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[\s|_]+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
}

// Find a node by slug (searches all nodes and compares slugs)
export function findNodeBySlug(root: TagNode, slug: string): TagNode | null {
  // Check current node
  if (toSlug(root.fullPath) === slug) {
    return root
  }
  
  // Check children
  for (const child of root.children.values()) {
    const found = findNodeBySlug(child, slug)
    if (found) {
      return found
    }
  }
  
  return null
}

// Convert endpoint path to slug (preserves structure but makes URL-friendly)
export function endpointPathToSlug(path: string): string {
  // Handle root path
  if (path === '/' || path === '') {
    return 'root'
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Split and process each segment
  const segments = cleanPath
    .split('/')
    .map(segment => {
      // Convert path parameters {id} to :id format for readability
      const segmentSlug = segment
        .replace(/^{([^}]+)}$/, ':$1')
        .replace(/[^a-zA-Z0-9:_-]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
      return segmentSlug
    })
    .filter(s => s.length > 0)
  
  // If no segments, return 'root'
  if (segments.length === 0) {
    return 'root'
  }
  
  return segments.join('/')
}

// Convert slug back to endpoint path
export function slugToEndpointPath(slug: string): string {
  // Handle root path
  if (slug === 'root' || slug === '') {
    return '/'
  }
  
  // Convert :param back to {param} and add leading slash
  const path = '/' + slug
    .split('/')
    .map(segment => {
      if (segment.startsWith(':')) {
        return `{${segment.slice(1)}}`
      }
      return segment
    })
    .join('/')
  return path
}
