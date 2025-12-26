import type { OpenAPISpec, Operation, Response, Schema } from '@/types/openapi'
import { RefResolver } from './ref-resolver'

export interface ValidationError {
  path: string
  message: string
  value?: any
  expected?: any
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validate response against OpenAPI schema
 */
export class ResponseValidator {
  private spec: OpenAPISpec
  private resolver: RefResolver

  constructor(spec: OpenAPISpec) {
    this.spec = spec
    this.resolver = new RefResolver(spec)
  }

  /**
   * Validate response against operation schema
   */
  validateResponse(
    operation: Operation,
    statusCode: number | string,
    responseData: any,
    responseHeaders: Record<string, string> = {}
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Find response schema for status code
    const statusCodeStr = String(statusCode)
    const responses = operation.responses || {}
    
    // Try exact match first
    let response: Response | undefined = responses[statusCodeStr]
    
    // Try range match (e.g., 2xx, 4xx)
    if (!response) {
      if (statusCodeStr.startsWith('2')) {
        response = responses['2xx'] || responses['default']
      } else if (statusCodeStr.startsWith('4')) {
        response = responses['4xx'] || responses['default']
      } else if (statusCodeStr.startsWith('5')) {
        response = responses['5xx'] || responses['default']
      } else {
        response = responses['default']
      }
    }

    if (!response) {
      warnings.push({
        path: 'response',
        message: `No response schema defined for status code ${statusCode}`,
      })
      return { valid: true, errors, warnings }
    }

    const resolvedResponse = this.resolver.resolve<Response>(response)

    // Validate headers if defined
    if (resolvedResponse.headers) {
      for (const [headerName, header] of Object.entries(resolvedResponse.headers)) {
        const resolvedHeader = this.resolver.resolve(header)
        const headerValue = responseHeaders[headerName.toLowerCase()]
        
        if (resolvedHeader.required && !headerValue) {
          errors.push({
            path: `headers.${headerName}`,
            message: `Required header '${headerName}' is missing`,
          })
        }

        // Validate header schema if defined
        if (headerValue && resolvedHeader.schema) {
          const headerSchema = this.resolver.resolve<Schema>(resolvedHeader.schema)
          const headerValidation = this.validateValue(headerValue, headerSchema, `headers.${headerName}`)
          errors.push(...headerValidation.errors)
          warnings.push(...headerValidation.warnings)
        }
      }
    }

    // Validate content if defined
    if (resolvedResponse.content) {
      const contentType = responseHeaders['content-type'] || 'application/json'
      const mediaType = Object.keys(resolvedResponse.content).find(ct => 
        contentType.includes(ct) || ct.includes('*')
      ) || Object.keys(resolvedResponse.content)[0]

      if (mediaType) {
        const content = resolvedResponse.content[mediaType]
        if (content?.schema) {
          const schema = this.resolver.resolve<Schema>(content.schema)
          const validation = this.validateValue(responseData, schema, 'body')
          errors.push(...validation.errors)
          warnings.push(...validation.warnings)
        }
      } else {
        warnings.push({
          path: 'content-type',
          message: `Content-Type '${contentType}' not defined in response schema`,
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate value against schema
   */
  private validateValue(value: any, schema: Schema, path: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Handle $ref
    if (schema.$ref) {
      const resolved = this.resolver.resolve<Schema>(schema)
      return this.validateValue(value, resolved, path)
    }

    // Handle allOf
    if (schema.allOf) {
      for (const subSchema of schema.allOf) {
        const resolved = this.resolver.resolve<Schema>(subSchema)
        const validation = this.validateValue(value, resolved, path)
        errors.push(...validation.errors)
        warnings.push(...validation.warnings)
      }
      return { valid: errors.length === 0, errors, warnings }
    }

    // Handle oneOf
    if (schema.oneOf) {
      let validCount = 0
      for (const subSchema of schema.oneOf) {
        const resolved = this.resolver.resolve<Schema>(subSchema)
        const validation = this.validateValue(value, resolved, path)
        if (validation.errors.length === 0) {
          validCount++
        }
      }
      if (validCount === 0) {
        errors.push({
          path,
          message: 'Value does not match any of the oneOf schemas',
          value,
        })
      } else if (validCount > 1) {
        warnings.push({
          path,
          message: 'Value matches multiple oneOf schemas (should match exactly one)',
          value,
        })
      }
      return { valid: errors.length === 0, errors, warnings }
    }

    // Handle anyOf
    if (schema.anyOf) {
      let validCount = 0
      for (const subSchema of schema.anyOf) {
        const resolved = this.resolver.resolve<Schema>(subSchema)
        const validation = this.validateValue(value, resolved, path)
        if (validation.errors.length === 0) {
          validCount++
        }
      }
      if (validCount === 0) {
        errors.push({
          path,
          message: 'Value does not match any of the anyOf schemas',
          value,
        })
      }
      return { valid: errors.length === 0, errors, warnings }
    }

    // Handle null
    if (value === null) {
      if (schema.nullable !== true && schema.type !== 'null') {
        errors.push({
          path,
          message: 'Value is null but schema does not allow null',
          value: null,
        })
      }
      return { valid: errors.length === 0, errors, warnings }
    }

    // Handle type validation
    const type = schema.type
    if (type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value

      if (type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({
            path,
            message: `Expected array, got ${actualType}`,
            value,
            expected: 'array',
          })
          return { valid: false, errors, warnings }
        }

        // Validate array items
        if (schema.items) {
          const itemsSchema = this.resolver.resolve<Schema>(schema.items)
          value.forEach((item, index) => {
            const itemValidation = this.validateValue(item, itemsSchema, `${path}[${index}]`)
            errors.push(...itemValidation.errors)
            warnings.push(...itemValidation.warnings)
          })
        }

        // Validate array length constraints
        if (schema.minItems !== undefined && value.length < schema.minItems) {
          errors.push({
            path,
            message: `Array length ${value.length} is less than minimum ${schema.minItems}`,
            value: value.length,
            expected: `>= ${schema.minItems}`,
          })
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
          errors.push({
            path,
            message: `Array length ${value.length} is greater than maximum ${schema.maxItems}`,
            value: value.length,
            expected: `<= ${schema.maxItems}`,
          })
        }
      } else if (type === 'object') {
        if (actualType !== 'object' || Array.isArray(value)) {
          errors.push({
            path,
            message: `Expected object, got ${actualType}`,
            value,
            expected: 'object',
          })
          return { valid: false, errors, warnings }
        }

        // Validate required properties
        if (schema.required) {
          for (const propName of schema.required) {
            if (!(propName in value)) {
              errors.push({
                path: `${path}.${propName}`,
                message: `Required property '${propName}' is missing`,
              })
            }
          }
        }

        // Validate properties
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const resolvedPropSchema = this.resolver.resolve<Schema>(propSchema)
            if (propName in value) {
              const propValidation = this.validateValue(
                value[propName],
                resolvedPropSchema,
                `${path}.${propName}`
              )
              errors.push(...propValidation.errors)
              warnings.push(...propValidation.warnings)
            }
          }
        }

        // Check for additional properties
        if (schema.additionalProperties === false) {
          const allowedProps = new Set(Object.keys(schema.properties || {}))
          for (const propName of Object.keys(value)) {
            if (!allowedProps.has(propName)) {
              errors.push({
                path: `${path}.${propName}`,
                message: `Additional property '${propName}' is not allowed`,
                value: value[propName],
              })
            }
          }
        }
      } else {
        // Primitive types
        if (actualType !== type) {
          errors.push({
            path,
            message: `Expected ${type}, got ${actualType}`,
            value,
            expected: type,
          })
        }

        // Validate string constraints
        if (type === 'string' && typeof value === 'string') {
          if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
              path,
              message: `String length ${value.length} is less than minimum ${schema.minLength}`,
              value: value.length,
              expected: `>= ${schema.minLength}`,
            })
          }

          if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
              path,
              message: `String length ${value.length} is greater than maximum ${schema.maxLength}`,
              value: value.length,
              expected: `<= ${schema.maxLength}`,
            })
          }

          if (schema.pattern) {
            const regex = new RegExp(schema.pattern)
            if (!regex.test(value)) {
              errors.push({
                path,
                message: `String does not match pattern: ${schema.pattern}`,
                value,
              })
            }
          }

          if (schema.enum && !schema.enum.includes(value)) {
            errors.push({
              path,
              message: `Value '${value}' is not in enum: ${schema.enum.join(', ')}`,
              value,
              expected: schema.enum,
            })
          }
        }

        // Validate number constraints
        if ((type === 'number' || type === 'integer') && typeof value === 'number') {
          if (schema.minimum !== undefined) {
            const min = schema.exclusiveMinimum ? schema.minimum + Number.MIN_VALUE : schema.minimum
            if (value < min) {
              errors.push({
                path,
                message: `Value ${value} is less than minimum ${schema.minimum}`,
                value,
                expected: `>= ${schema.minimum}`,
              })
            }
          }

          if (schema.maximum !== undefined) {
            const max = schema.exclusiveMaximum ? schema.maximum - Number.MIN_VALUE : schema.maximum
            if (value > max) {
              errors.push({
                path,
                message: `Value ${value} is greater than maximum ${schema.maximum}`,
                value,
                expected: `<= ${schema.maximum}`,
              })
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

