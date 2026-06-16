import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SessionData } from '@insight-ai/domain-models';
import { errorMiddleware, standardMiddlewares } from './middlewares';
import { getMainRouter } from './routes';
import { generateOpenAPIDocument } from './openapi';

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
      const openApiDocument = generateOpenAPIDocument();

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
