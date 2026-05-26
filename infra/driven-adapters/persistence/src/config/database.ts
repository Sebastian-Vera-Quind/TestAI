import { readFileSync } from 'node:fs';

import { DataSource } from 'typeorm';

export class Database {
  private static instance: DataSource | null = null;

  static async getInstance(): Promise<DataSource> {
    if (this.instance) {
      return this.instance;
    }

    const isProd = process.env.NODE_ENV === 'production';

    this.instance = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'insight_ai',
      ssl: isProd
        ? {
            rejectUnauthorized: false,
            ca: readFileSync(
              process.env.DB_SSL_CA_PATH || '/app/global-bundle.pem',
              'utf8',
            ),
          }
        : false,
      synchronize: !isProd,
      logging: process.env.DB_LOGGING === 'true',
      entities: [
        `${__dirname}/../**/*Entity.ts`,
        `${__dirname}/../**/*Entity.js`,
      ],
    });

    await this.instance.initialize();

    return this.instance;
  }
}
