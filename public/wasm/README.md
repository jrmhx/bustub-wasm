# WASM Files Directory

This directory contains the WebAssembly files for the BusTub database engine.

## File Structure

Place your compiled WASM files here:

- `bustub-wasm-shell.wasm` - The main database shell/engine module
- `bustub-wasm-shell.js` - JavaScript glue code for the shell
- `bustub-wasm-bpt-printer.wasm` - B+ Tree visualization module
- `bustub-wasm-bpt-printer.js` - JavaScript glue code for tree printer

## Module Purposes

### Shell Module (`bustub-wasm-shell`)
- Main database engine functionality
- SQL query execution
- Transaction processing
- Storage management

### BPT Printer Module (`bustub-wasm-bpt-printer`)
- B+ Tree structure visualization
- Index debugging and analysis
- Educational tree demonstrations
- Performance diagnostics

## Usage

The files in this directory are automatically served by Next.js as static assets and can be accessed via:

- `/wasm/bustub-wasm-shell.wasm`
- `/wasm/bustub-wasm-shell.js`
- `/wasm/bustub-wasm-bpt-printer.wasm`
- `/wasm/bustub-wasm-bpt-printer.js`

## Building WASM Files

To generate these files, you'll typically compile your BusTub source:

```bash
# For the main shell module
emcc -o bustub-wasm-shell.js shell_src.cpp -s WASM=1 -s EXPORTED_FUNCTIONS='["_execute_query", "_init_db"]'

# For the B+ tree printer module
emcc -o bustub-wasm-bpt-printer.js bpt_printer_src.cpp -s WASM=1 -s EXPORTED_FUNCTIONS='["_print_bpt", "_analyze_tree"]'
```

## Integration

Both WASM modules are loaded in `/lib/bustub-wasm.ts`:
- Shell module handles SQL queries and database operations
- BPT printer module provides tree visualization capabilities
