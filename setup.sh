# /bin/bash

echo "migrating database..."
npm --prefix infra/driven-adapters/persistence run migration:run

echo "starting server..."
node infra/api/dist/index.js