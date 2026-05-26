import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'insight_ai',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [`${__dirname}/../**/*Entity.{ts,js}`],
  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
  ssl: isProd
    ? {
        rejectUnauthorized: false,
        ca: readFileSync(
          process.env.DB_SSL_CA_PATH || '/app/global-bundle.pem',
          'utf8',
        ),
      }
    : false,
});

export default dataSource;
