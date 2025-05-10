# MCP Events

A Model Context Protocol (MCP) server for managing Kaltura events.

## Project Structure

The project has been organized into a clean, modular structure:

```
src/
├── api/            # API client implementations
├── config/         # Configuration management
├── schemas/        # Zod schema definitions
├── tools/          # MCP tool implementations
├── client.ts       # Example client for testing
├── index.ts        # Main entry point
└── server.ts       # Server setup and initialization
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your Kaltura Session:
```
KS=your_kaltura_session_here
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

To start the MCP server:

```bash
npm start
```

### Running the Example Client

To run the example client that connects to the server:

```bash
node dist/client.js
```

## Available Tools

The MCP server provides the following tools:

1. `create-event` - Create a new Kaltura event
2. `list-events` - List events with filtering and pagination
3. `update-event` - Update an existing event
4. `delete-event` - Delete an event

## Development

To make changes to the project:

1. Modify the source files in the `src` directory
2. Rebuild the project:
```bash
npm run build
```
3. Run the server or client as needed

## Adding New Features

To add new features:

1. Add new schemas in `src/schemas/`
2. Implement API methods in `src/api/`
3. Create MCP tools in `src/tools/`
4. Register the tools in `src/server.ts`