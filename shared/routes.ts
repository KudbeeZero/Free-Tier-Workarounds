import { z } from 'zod';
import { 
  insertTrendSchema, 
  insertExecutionLogSchema, 
  trends, 
  executionLogs,
  trendHashes,
  priceSnapshots,
  users
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  trends: {
    list: {
      method: 'GET' as const,
      path: '/api/trends',
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof trends.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trends/:id',
      responses: {
        200: z.custom<typeof trends.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trends',
      input: insertTrendSchema,
      responses: {
        201: z.custom<typeof trends.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getPrices: {
      method: 'GET' as const,
      path: '/api/trends/:id/prices',
      responses: {
        200: z.array(z.custom<typeof priceSnapshots.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    getHashes: {
      method: 'GET' as const,
      path: '/api/trends/:id/hashes',
      responses: {
        200: z.array(z.custom<typeof trendHashes.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
  },
  executions: {
    create: {
      method: 'POST' as const,
      path: '/api/executions',
      input: insertExecutionLogSchema.omit({ userId: true }), // UserId comes from session
      responses: {
        201: z.custom<typeof executionLogs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    listByUser: {
      method: 'GET' as const,
      path: '/api/users/:id/executions',
      responses: {
        200: z.array(z.custom<typeof executionLogs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/auth/me', // Alias for /api/auth/user from Replit Auth
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    updateWallet: {
      method: 'PATCH' as const,
      path: '/api/users/wallet',
      input: z.object({ walletAddress: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type Trend = z.infer<typeof api.trends.get.responses[200]>;
export type PriceSnapshot = z.infer<typeof api.trends.getPrices.responses[200]>[number];
