import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SessionData } from '@insight-ai/domain-models';
import { errorMiddleware, standardMiddlewares } from './middlewares';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { getMainRouter } from './routes';
import { registry } from './schemas/registry';

export class InsightAPI {
  private static instance: InsightAPI;
  private constructor(readonly app: Express = express()) {}

  static getInstance(): InsightAPI {
    if (!InsightAPI.instance) {
      InsightAPI.instance = new InsightAPI();
    }
    return InsightAPI.instance;
  }

  start() {
    standardMiddlewares.forEach((middleware) => this.app.use(middleware));
    this.app.use(getMainRouter());

    if (process.env.GENERATE_OPENAPI_DOCS === 'true') {
      const openApiDocument = this.generateOpenAPIDocument();

      this.app.get('/api-docs/json', (_req, res) => {
        res.json(openApiDocument);
      });
      this.app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(openApiDocument),
      );
    }

    this.app.use(errorMiddleware);

    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`API server is running on port ${port}`);
    });
  }

  generateOpenAPIDocument(): object {
    const generator = new OpenApiGeneratorV31(registry.definitions);
    return generator.generateDocument({
      openapi: '3.1.0',
      info: {
        version: '1.0.0',
        title: 'InsightAI API',
        description: 'Backend API for the InsightAI platform',
      },
      servers: [{ url: '/' }],
    });
  }
}

function main() {
  const api = InsightAPI.getInstance();
  api.start();
}

main();

declare module 'express' {
  export interface Request {
    session?: SessionData;
    transaction?: {
      transactionId: string;
    };
  }
}
