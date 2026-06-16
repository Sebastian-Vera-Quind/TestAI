import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './schemas/registry';

export function generateOpenAPIDocument(): object {
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
