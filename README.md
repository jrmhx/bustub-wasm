# BusTub WebAssembly Project

This project integrates the BusTub C++ database with WebAssembly to run in the browser, using Next.js and shadcn/ui for the frontend.

## Prerequisites

- Node.js 18+ 
- Emscripten SDK for compiling C++ to WebAssembly
- Your BusTub C++ source code

## Setting up Emscripten

1. Install Emscripten:
\`\`\`bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
\`\`\`

## Compiling BusTub to WebAssembly

1. Navigate to your BusTub project directory
2. Create a build script for WebAssembly:

\`\`\`bash
#!/bin/bash
# build-wasm.sh

emcc -O3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_execute_query", "_init_database", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='BusTubModule' \
  --bind \
  src/*.cpp \
  -o public/bustub.wasm
\`\`\`

3. Run the build script:
\`\`\`bash
chmod +x build-wasm.sh
./build-wasm.sh
\`\`\`

## Running the Project

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/components/database-interface.tsx` - Main UI component
- `/app/api/database/` - API routes for database operations
- `/lib/bustub-wasm.ts` - WebAssembly integration utilities
- `/public/bustub.wasm` - Your compiled WebAssembly module (after compilation)

## Integration Steps

1. Compile your BusTub C++ code to WebAssembly using the instructions above
2. Update `/lib/bustub-wasm.ts` to import and use your compiled WASM module
3. Modify the API routes to use the actual WASM functions instead of mock data
4. Test your database operations in the browser interface

## Features

- ✅ SQL query execution interface
- ✅ Database initialization
- ✅ Sample data loading
- ✅ Query results visualization
- ✅ Performance metrics
- ✅ Responsive design with shadcn/ui

## Next Steps

1. Compile your BusTub database to WebAssembly
2. Integrate the WASM module with the provided API routes
3. Add more advanced database features as needed
4. Deploy to Vercel for production use
