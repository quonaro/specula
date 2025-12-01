import type { TagNode, Operation, OpenAPISpec } from '@/types/openapi'

/**
 * Normalize search query - lowercase and trim
 */
function normalizeQuery(query: string): string {
    return query.toLowerCase().trim()
}

/**
 * Check if text matches search query
 */
function matchesQuery(text: string | undefined, query: string): boolean {
    if (!text) return false
    return normalizeQuery(text).includes(normalizeQuery(query))
}

/**
 * Search in operation data
 */
export function searchInOperation(
    operation: Operation,
    method: string,
    path: string,
    query: string
): boolean {
    const normalizedQuery = normalizeQuery(query)

    // Search in method
    if (matchesQuery(method, query)) return true

    // Search in path
    if (matchesQuery(path, query)) return true

    // Search in summary
    if (operation.summary && matchesQuery(operation.summary, query)) return true

    // Search in description
    if (operation.description && matchesQuery(operation.description, query)) return true

    // Search in operationId
    if (operation.operationId && matchesQuery(operation.operationId, query)) return true

    // Search in tags
    if (operation.tags) {
        for (const tag of operation.tags) {
            if (matchesQuery(tag, query)) return true
        }
    }

    // Search in parameters
    if (operation.parameters) {
        for (const param of operation.parameters) {
            if (matchesQuery(param.name, query)) return true
            if (param.description && matchesQuery(param.description, query)) return true
        }
    }

    // Search in requestBody description
    if (operation.requestBody?.description && matchesQuery(operation.requestBody.description, query)) {
        return true
    }

    // Search in responses
    if (operation.responses) {
        for (const [statusCode, response] of Object.entries(operation.responses)) {
            if (matchesQuery(statusCode, query)) return true
            if (response.description && matchesQuery(response.description, query)) return true
        }
    }

    return false
}

/**
 * Filter TagNode tree based on search query
 * Returns filtered tree with only matching nodes and operations
 */
export function filterTagNodeTree(node: TagNode, query: string): TagNode | null {
    if (!query.trim()) {
        return node
    }

    const normalizedQuery = normalizeQuery(query)

    // Check if node name matches
    const nodeMatches = matchesQuery(node.name, query)

    // Filter operations
    const matchingOperations = node.operations.filter(op =>
        searchInOperation(op.operation, op.method, op.path, query)
    )

    // Filter children recursively
    const matchingChildren: Map<string, TagNode> = new Map()
    for (const [key, child] of node.children.entries()) {
        const filteredChild = filterTagNodeTree(child, query)
        if (filteredChild && (
            filteredChild.operations.length > 0 ||
            filteredChild.children.size > 0
        )) {
            matchingChildren.set(key, filteredChild)
        }
    }

    // If node matches, has matching operations, or has matching children, include it
    if (nodeMatches || matchingOperations.length > 0 || matchingChildren.size > 0) {
        return {
            ...node,
            operations: matchingOperations,
            children: matchingChildren
        }
    }

    return null
}

/**
 * Search across all operations in all specs
 * Returns array of matching operations with their metadata
 */
export interface SearchResult {
    method: string
    path: string
    operation: Operation
    specTitle?: string
    specIndex: number
    tags?: string[]
}

export function searchAllOperations(
    specs: Array<{ spec: OpenAPISpec; title?: string }>,
    query: string
): SearchResult[] {
    if (!query.trim()) {
        return []
    }

    const results: SearchResult[] = []
    const normalizedQuery = normalizeQuery(query)

    specs.forEach((specWithSource, specIndex) => {
        const spec = specWithSource.spec

        if (!spec.paths) return

        for (const [path, pathItem] of Object.entries(spec.paths)) {
            const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const

            for (const method of methods) {
                const operation = pathItem[method]
                if (!operation) continue

                if (searchInOperation(operation, method.toUpperCase(), path, query)) {
                    results.push({
                        method: method.toUpperCase(),
                        path,
                        operation,
                        specTitle: specWithSource.title || spec.info?.title,
                        specIndex,
                        tags: operation.tags
                    })
                }
            }
        }
    })

    return results
}

