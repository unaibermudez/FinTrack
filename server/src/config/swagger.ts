import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'FinTrack API',
    version: '1.0.0',
    description:
      'API REST para el seguimiento de portfolios de inversión. Gestiona usuarios, portfolios, transacciones y consulta precios en tiempo real.',
  },
  servers: [{ url: '/api', description: 'API base' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token obtenido en /auth/login (expira en 15 min)',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
        },
      },
      Portfolio: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          userId: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0e' },
          name: { type: 'string', example: 'Mi portfolio principal' },
          description: { type: 'string', example: 'Acciones tecnológicas' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0f' },
          portfolioId: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          assetSymbol: { type: 'string', example: 'AAPL' },
          type: { type: 'string', enum: ['buy', 'sell'] },
          quantity: { type: 'number', example: 10 },
          priceAtTransaction: { type: 'number', example: 182.5 },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string', example: 'Compra inicial' },
        },
      },
      HoldingResult: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'AAPL' },
          quantity: { type: 'number', example: 10 },
          avgCost: { type: 'number', example: 182.5 },
          currentPrice: { type: 'number', example: 207.5 },
          currentValue: { type: 'number', example: 2075.0 },
          plAbsolute: { type: 'number', example: 250.0 },
          plPercent: { type: 'number', example: 13.7 },
        },
      },
      PerformanceResult: {
        type: 'object',
        properties: {
          portfolioId: { type: 'string' },
          totalValue: { type: 'number', example: 12500.0 },
          totalPl: { type: 'number', example: 1250.0 },
          totalPlPercent: { type: 'number', example: 11.11 },
          holdings: {
            type: 'array',
            items: { $ref: '#/components/schemas/HoldingResult' },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registro de usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          '409': { description: 'Email ya en uso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login — devuelve access token y establece cookie refreshToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login correcto',
            headers: {
              'Set-Cookie': {
                description: 'refreshToken httpOnly cookie (7 días)',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit superado (10 intentos / 15 min)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renueva el access token usando la cookie refreshToken',
        responses: {
          '200': {
            description: 'Nuevo access token emitido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' } },
                },
              },
            },
          },
          '401': { description: 'Refresh token inválido o expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalida el refresh token y limpia la cookie',
        responses: {
          '204': { description: 'Sesión cerrada' },
        },
      },
    },
    '/portfolios': {
      get: {
        tags: ['Portfolios'],
        summary: 'Lista los portfolios del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de portfolios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    portfolios: { type: 'array', items: { $ref: '#/components/schemas/Portfolio' } },
                  },
                },
              },
            },
          },
          '401': { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Portfolios'],
        summary: 'Crea un nuevo portfolio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Mi portfolio' },
                  description: { type: 'string', example: 'Descripción opcional' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Portfolio creado',
            content: { 'application/json': { schema: { type: 'object', properties: { portfolio: { $ref: '#/components/schemas/Portfolio' } } } } },
          },
          '401': { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/portfolios/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del portfolio' }],
      get: {
        tags: ['Portfolios'],
        summary: 'Detalle de un portfolio',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Portfolio encontrado', content: { 'application/json': { schema: { type: 'object', properties: { portfolio: { $ref: '#/components/schemas/Portfolio' } } } } } },
          '404': { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Portfolios'],
        summary: 'Edita nombre o descripción del portfolio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Nuevo nombre' },
                  description: { type: 'string', example: 'Nueva descripción' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Portfolio actualizado', content: { 'application/json': { schema: { type: 'object', properties: { portfolio: { $ref: '#/components/schemas/Portfolio' } } } } } },
          '404': { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Portfolios'],
        summary: 'Elimina un portfolio',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Eliminado correctamente' },
          '404': { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/portfolios/{id}/transactions': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del portfolio' }],
      get: {
        tags: ['Transacciones'],
        summary: 'Lista las transacciones de un portfolio',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de transacciones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } } },
                },
              },
            },
          },
          '404': { description: 'Portfolio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Transacciones'],
        summary: 'Registra una transacción de compra o venta',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetSymbol', 'type', 'quantity', 'priceAtTransaction'],
                properties: {
                  assetSymbol: { type: 'string', example: 'AAPL' },
                  type: { type: 'string', enum: ['buy', 'sell'] },
                  quantity: { type: 'number', example: 10 },
                  priceAtTransaction: { type: 'number', example: 182.5 },
                  date: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', example: 'Compra inicial' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Transacción registrada', content: { 'application/json': { schema: { type: 'object', properties: { transaction: { $ref: '#/components/schemas/Transaction' } } } } } },
          '404': { description: 'Portfolio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/portfolios/{id}/transactions/{txId}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del portfolio' },
        { name: 'txId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la transacción' },
      ],
      delete: {
        tags: ['Transacciones'],
        summary: 'Elimina una transacción',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Eliminada correctamente' },
          '404': { description: 'Portfolio o transacción no encontrados', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/portfolios/{id}/performance': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del portfolio' }],
      get: {
        tags: ['Métricas'],
        summary: 'P&L total y por activo del portfolio',
        description: 'Calcula el coste medio ponderado de cada posición abierta y consulta el precio actual en Alpha Vantage (caché 60s).',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Métricas de rendimiento',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceResult' } } },
          },
          '404': { description: 'Portfolio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '502': { description: 'Error al consultar Alpha Vantage', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/assets/price/{symbol}': {
      parameters: [{ name: 'symbol', in: 'path', required: true, schema: { type: 'string' }, example: 'AAPL', description: 'Símbolo del activo' }],
      get: {
        tags: ['Métricas'],
        summary: 'Precio actual de un activo via Alpha Vantage',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Precio actual',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    symbol: { type: 'string', example: 'AAPL' },
                    price: { type: 'number', example: 207.5 },
                  },
                },
              },
            },
          },
          '404': { description: 'Símbolo no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '502': { description: 'Error al consultar Alpha Vantage', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'FinTrack API Docs',
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
};
