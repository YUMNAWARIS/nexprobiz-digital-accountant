/** Swagger at /api/docs, generated from the SAME Zod schemas that validate at runtime. */
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ApiErrorBody } from '@fa/contracts';
import { ROUTE_REGISTRY } from './route-registry';

extendZodWithOpenApi(z);

export type OpenApiDocument = ReturnType<OpenApiGeneratorV3['generateDocument']>;

export function buildOpenApiDocument(version: string): OpenApiDocument {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  registry.register('ApiError', ApiErrorBody);

  for (const r of ROUTE_REGISTRY) {
    const request: Record<string, unknown> = {};
    if (r.schemas?.params) request.params = r.schemas.params;
    if (r.schemas?.query) request.query = r.schemas.query;
    if (r.schemas?.body)
      request.body = {
        content: { 'application/json': { schema: r.schemas.body } },
      };
    if (r.upload)
      request.body = {
        content: {
          'multipart/form-data': {
            schema: z.object({
              [r.upload.field]: z.string().openapi({ type: 'string', format: 'binary' }),
            }),
          },
        },
      };

    const status = r.response?.status ?? 200;
    const responses: Record<string, unknown> = {
      [status]: r.response?.schema
        ? {
            description: 'OK',
            content: {
              [r.response.contentType ?? 'application/json']: {
                schema: r.response.schema,
              },
            },
          }
        : { description: 'OK' },
      400: {
        description: 'Validation failed',
        content: { 'application/json': { schema: ApiErrorBody } },
      },
      ...(r.public
        ? {}
        : {
            401: {
              description: 'Unauthorized',
              content: { 'application/json': { schema: ApiErrorBody } },
            },
          }),
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ApiErrorBody } },
      },
    };

    registry.registerPath({
      method: r.method,
      path: r.fullPath.replace(/:([A-Za-z_]+)/g, '{$1}'),
      summary: r.summary,
      tags: [r.tag],
      security: r.public ? [] : [{ bearerAuth: [] }],
      request: request,
      responses: responses as never,
    });
  }

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Freelancer Accounting — Germany Sandbox API',
      version,
      description: 'Sandbox — For testing only. Do not use for official bookkeeping or tax filing.',
    },
    servers: [{ url: '/api/v1' }],
  });
}
