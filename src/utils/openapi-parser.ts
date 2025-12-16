import { OpenAPISpec, TagNode, Operation, PathItem } from "@/types/openapi";
import type { SpecWithSource } from "@/stores/spec";

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
            // Check for duplicates to avoid adding the same operation multiple times
            if (index === parts.length - 1) {
              // Check if this operation already exists in this node
              const operationId = operation.operationId || `${method.toUpperCase()}_${path}`;
              const alreadyExists = currentNode.operations.some(
                op => op.method === method.toUpperCase() && 
                      op.path === path &&
                      (op.operation.operationId || `${op.method}_${op.path}`) === operationId
              );
              
              if (!alreadyExists) {
                currentNode.operations.push({
                  method: method.toUpperCase(),
                  path,
                  operation,
                });
              }
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

/**
 * Get operation identifier - uses operationId if available, otherwise falls back to method_path format
 */
export function getOperationId(operation: Operation, method: string, path: string): string {
  if (operation.operationId) {
    return operation.operationId
  }
  // Fallback: use method_path format, sanitized for URL
  const sanitizedPath = path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/{([^}]+)}/g, '$1')
    .replace(/[^a-zA-Z0-9_]/g, '_')
  return `${method.toLowerCase()}_${sanitizedPath}`
}

/**
 * Find operation by operationId in specs
 */
export function findOperationById(
  specs: Array<{ spec: OpenAPISpec; sourceUrl?: string; title: string }>,
  operationId: string
): { method: string; path: string; operation: Operation; spec: OpenAPISpec; sourceUrl?: string } | null {
  for (const specWithSource of specs) {
    for (const [path, pathItem] of Object.entries(specWithSource.spec.paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const
      for (const method of methods) {
        const operation = pathItem[method]
        if (operation) {
          const opId = getOperationId(operation, method.toUpperCase(), path)
          if (opId === operationId) {
            return {
              method: method.toUpperCase(),
              path,
              operation,
              spec: specWithSource.spec,
              sourceUrl: specWithSource.sourceUrl,
            }
          }
        }
      }
    }
  }
  return null
}

// Parse multiple specs into a single tree structure where each spec becomes a top-level group
export function parseMultipleSpecs(specs: SpecWithSource[]): TagNode {
  const root: TagNode = {
    name: "root",
    fullPath: "",
    children: new Map(),
    operations: [],
  };

  specs.forEach((specWithSource) => {
    const specTitle = specWithSource.title;
    const specNode = parseOpenAPISpec(specWithSource.spec);
    
    // Create a top-level node for this spec
    if (!root.children.has(specTitle)) {
      root.children.set(specTitle, {
        name: specTitle,
        fullPath: specTitle,
        children: specNode.children, // Use the children from the parsed spec
        operations: specNode.operations, // Use the operations from the parsed spec
      });
    } else {
      // If a spec with the same title already exists, merge the children and operations
      const existingNode = root.children.get(specTitle)!;
      // Merge children
      specNode.children.forEach((childNode, childName) => {
        if (!existingNode.children.has(childName)) {
          existingNode.children.set(childName, childNode);
        } else {
          // Merge operations if child already exists
          const existingChild = existingNode.children.get(childName)!;
          childNode.operations.forEach(op => {
            if (!existingChild.operations.some(existingOp => 
              existingOp.method === op.method && existingOp.path === op.path
            )) {
              existingChild.operations.push(op);
            }
          });
        }
      });
      // Merge operations at the spec level
      specNode.operations.forEach(op => {
        if (!existingNode.operations.some(existingOp => 
          existingOp.method === op.method && existingOp.path === op.path
        )) {
          existingNode.operations.push(op);
        }
      });
    }
  });

  return root;
}

/**
 * Get security requirements for an operation
 * Security can be defined at three levels (in order of precedence):
 * 1. Operation level (operation.security)
 * 2. Path level (pathItem.security)
 * 3. Spec level (spec.security)
 * 
 * An empty array [] at any level means the endpoint is public (overrides parent security)
 * Returns the effective security requirements array
 */
export function getOperationSecurity(
  operation: Operation,
  pathItem: PathItem | undefined,
  spec: OpenAPISpec
): Array<Record<string, string[]>> | undefined {
  // Check operation level security first
  if (operation.security !== undefined) {
    return operation.security
  }

  // Check path level security
  if (pathItem?.security !== undefined) {
    return pathItem.security
  }

  // Check spec level security
  if (spec.security !== undefined) {
    return spec.security
  }

  // No security defined at any level
  return undefined
}

/**
 * Check if an operation requires authentication (is private)
 * Security can be defined at three levels (in order of precedence):
 * 1. Operation level (operation.security)
 * 2. Path level (pathItem.security)
 * 3. Spec level (spec.security)
 * 
 * An empty array [] at any level means the endpoint is public (overrides parent security)
 */
export function isOperationPrivate(
  operation: Operation,
  pathItem: PathItem | undefined,
  spec: OpenAPISpec
): boolean {
  const security = getOperationSecurity(operation, pathItem, spec)
  
  if (security === undefined) {
    return false
  }
  
  // Empty array means public
  if (security.length === 0) {
    return false
  }
  
  // Non-empty array means private
  return true
}
