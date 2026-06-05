import { RequestHandler } from 'express';
import { RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z, registry } from '../schemas/registry';
import { ErrorResponseSchema } from '../schemas/common';

export interface ValidationRouteMiddlewareOptions {
  fullPath: string;
  method: RouteConfig['method'];
  secure?: boolean;
  summary?: string;
  tags?: string[];
  body?: { schema: z.ZodObject; required?: boolean; contentType?: string };
  query?: z.ZodObject;
  params?: z.ZodObject;
  responses: {
    [statusCode: number]: {
      description: string;
      content?: {
        [contentType: string]: z.ZodType;
      };
    };
  };
  loadErrorResponses?: boolean;
}

const errors = {
  400: {
    description: 'Bad request',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  500: {
    description: 'Internal server error',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};

export function validateMiddleware({
  method,
  fullPath,
  ...options
}: ValidationRouteMiddlewareOptions): RequestHandler {
  const mappedResponses: RouteConfig['responses'] = Object.entries(
    options.responses,
  ).reduce(
    (acc, [k, v]) => {
      acc[k] = {
        description: v.description,
      };
      if (v.content)
        acc[k].content = Object.entries(v.content).reduce(
          (contentAcc, [contentType, schema]) => {
            return {
              ...contentAcc,
              [contentType]: { schema },
            };
          },
          {} as { [contentType: string]: { schema: z.ZodType } },
        );
      return acc;
    },
    {} as RouteConfig['responses'],
  );

  const config: RouteConfig = {
    method,
    path: fullPath,
    summary: options.summary,
    tags: options.tags,
    responses: {
      ...(options.loadErrorResponses !== false ? errors : {}),
      ...mappedResponses,
    },
    security: options.secure === false ? [] : [{ UserEmail: [] }],
  };

  const requestConfig: RouteConfig['request'] = {};
  const hasRequestConfig = options.body || options.query || options.params;

  if (options.body) {
    requestConfig.body = {
      content: {
        [options.body.contentType || 'application/json']: {
          schema: options.body.schema,
        },
      },
      required: options.body.required ?? true,
    };
  }

  if (options.query) {
    requestConfig.query = options.query;
  }

  if (options.params) {
    requestConfig.params = options.params;
  }

  if (hasRequestConfig) {
    config.request = requestConfig;
  }

  registry.registerPath(config);
  return (req, res, next) => {
    if (options.body) {
      const bodyResult = options.body.schema.safeParse(req.body);
      if (!bodyResult.success && options.body.required) {
        return res.status(400).json({
          error: bodyResult.error.issues[0]?.message ?? 'Invalid request body.',
        });
      }
    }

    if (options.query) {
      const queryResult = options.query.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          error:
            queryResult.error.issues[0]?.message ?? 'Invalid query parameters.',
        });
      }
    }

    if (options.params) {
      const paramsResult = options.params.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          error:
            paramsResult.error.issues[0]?.message ?? 'Invalid URL parameters.',
        });
      }
    }

    next();
  };
}
