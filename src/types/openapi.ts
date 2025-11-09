export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Server[];
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    responses?: Record<string, Response>;
    parameters?: Record<string, Parameter>;
    examples?: Record<string, Example>;
    requestBodies?: Record<string, RequestBody>;
    headers?: Record<string, Header>;
    securitySchemes?: Record<string, SecurityScheme>;
    links?: Record<string, Link>;
    callbacks?: Record<string, Callback>;
  };
  security?: Array<Record<string, string[]>>;
  tags?: Array<{
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
  }>;
  externalDocs?: ExternalDocumentation;
  webhooks?: Record<string, PathItem>;
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
  security?: Array<Record<string, string[]>>;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  callbacks?: Record<string, Callback>;
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
  servers?: Server[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
  content?: Record<string, MediaType>;
  $ref?: string;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
  $ref?: string;
}

export interface Response {
  description: string;
  headers?: Record<string, Header>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link>;
  $ref?: string;
}

export interface MediaType {
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
  encoding?: Record<string, Encoding>;
}

export interface Encoding {
  contentType?: string;
  headers?: Record<string, Header>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface Schema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  items?: Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  not?: Schema;
  discriminator?: {
    propertyName: string;
    mapping?: Record<string, string>;
  };
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  };
  externalDocs?: ExternalDocumentation;
  example?: any;
  deprecated?: boolean;
  $ref?: string;
}

export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
  $ref?: string;
}

export interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
  $ref?: string;
}

export interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
  $ref?: string;
}

export interface Callback {
  $ref?: string;
  [expression: string]: PathItem | string | undefined;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: {
    implicit?: OAuthFlow;
    password?: OAuthFlow;
    clientCredentials?: OAuthFlow;
    authorizationCode?: OAuthFlow;
  };
  openIdConnectUrl?: string;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

export interface TagNode {
  name: string;
  fullPath: string;
  children: Map<string, TagNode>;
  operations: Array<{
    method: string;
    path: string;
    operation: Operation;
  }>;
}
