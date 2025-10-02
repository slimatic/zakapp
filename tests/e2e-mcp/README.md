# E2E Tests Using Playwright MCP Server

This directory contains E2E tests that use the Playwright MCP Server instead of requiring local browser installation.

## Why MCP Server?

The Playwright MCP Server approach solves the browser installation issues by providing browser automation through function calls without requiring browser binary downloads.

## Running Tests

Tests in this directory use MCP function calls and can be run directly without installing Playwright browsers.

See `../../E2E_PLAYWRIGHT_MCP_POC.md` for detailed documentation.

## Test Files

- `mcp-test-example.js` - Example test showing MCP approach
- (More tests to be added as they are converted)

## Converting Existing Tests

See the conversion guide in `E2E_PLAYWRIGHT_MCP_POC.md` for examples of converting traditional Playwright tests to MCP format.
