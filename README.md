# MCP Sui Server

This project provides a minimal Model Context Protocol (MCP) server that exposes basic operations for interacting with the Sui blockchain. The server can compile and publish Move packages using the Sui CLI and execute transactions through Sui's JSON-RPC API.

## Features

- Switch between mainnet, testnet, devnet and local networks.
- Compile Move packages and report compilation errors.
- Publish packages with either an ephemeral account or a user supplied private key.
- Transfer SUI balances between accounts.
- Generate new Sui accounts.
- Simple JSON-RPC passthrough via the `@mysten/sui` SDK.
- Invoke arbitrary Sui RPC methods.
- Execute Move function calls as transactions.

## Development

Install dependencies and build the project:

```bash
npm install
npm run build
```

Run the server:

```bash
npm start
```

The server listens on `PORT` (default `8000`) and exposes an HTTP endpoint `/mcp`.
Tool definitions are returned when sending a `GET` request to `/mcp`.

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_account` | Generate a new Sui account. Returns the address and private key. | none |
| `publish_package` | Compile and publish a Move package. | `path`, `network`, `privateKey` (or `ephemeral`) |
| `transfer_sui` | Transfer SUI from the provided account to another address. | `to`, `amount`, `network`, `privateKey` (or `ephemeral`) |
| `rpc_call` | Invoke a Sui RPC method. | `method`, `params`, `network?` |
| `move_call` | Execute a Move function call. | `target`, `args`, `typeArguments?`, `network`, `privateKey` (or `ephemeral`) |

## Environment Variables

- `SUI_NETWORK` – default network (mainnet, testnet, devnet, local)
- `SUI_MAINNET_RPC`, `SUI_TESTNET_RPC`, etc – override RPC URLs

The server relies on the Sui CLI being installed and available in `PATH` for Move compilation.

## References

- [Sui Documentation](https://docs.sui.io)
- [Sui JSON-RPC API](https://docs.sui.io/build/reference/sui-jsonrpc)
- [Sui CLI Installation](https://docs.sui.io/build/install)
- [Sui TypeScript SDK](https://docs.sui.io/build/typescript)
- [Model Context Protocol](https://modelcontextprotocol.org)

## Docker

`Dockerfile`, `smithery.yaml`, and `mcp.json` examples are provided.
The container listens on `PORT` and exposes `/mcp` as required by [Smithery](https://smithery.ai/docs).
Build the image and start the container with:

```bash
docker build -t mcp-sui .
docker run --rm -it \
  -e SUI_NETWORK=testnet \
  mcp-sui
```

Set additional `SUI_*_RPC` variables if you need custom RPC endpoints.

## RPC Connectivity

When running inside certain restricted environments the Node.js runtime may not
be permitted to reach the configured Sui RPC URLs and will throw `ENETUNREACH`
errors. You can verify network access with a simple `curl` command:

```bash
curl -X POST $SUI_TESTNET_RPC \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"sui_getLatestCheckpointSequenceNumber","id":1}'
```

If the command returns a numeric result, the endpoint is reachable and the MCP
server will work correctly when network egress is allowed.

## Example mcp.json

Chat-oriented MCP hosts like Claude Desktop expect a `mcp.json` file describing
how to start the server. An example configuration that runs the HTTP server via
Node on the testnet network is shown below:

```json
{
  "schema": "https://modelcontextprotocol.org/manifest.schema.json",
  "name": "mcp-sui",
  "description": "Expose Sui blockchain tools over MCP",
  "transport": {
    "http": {
      "url": "http://localhost:8000/mcp",
      "method": "POST",
      "env": { "SUI_NETWORK": "testnet" }
    }
  }
}
```

The server can also be launched through Docker. In that case the
`mcp.json` would use a Docker command to run the container:

```json
{
  "schema": "https://modelcontextprotocol.org/manifest.schema.json",
  "name": "mcp-sui",
  "description": "Expose Sui blockchain tools over MCP",
  "transport": {
    "http": {
      "url": "http://localhost:8000/mcp",
      "method": "POST",
      "command": ["docker", "run", "--rm", "-p", "8000:8000", "-e", "SUI_NETWORK=testnet", "mcp-sui"]
    }
  }
}
```

## Smithery Deployment

Smithery requires a `Dockerfile` and `smithery.yaml` describing how to run the server.
The included `smithery.yaml` uses the container runtime. The image must listen on
`PORT` and expose `/mcp` for GET, POST and DELETE requests as defined by Smithery.
See the [Smithery docs](https://smithery.ai/docs/build/deployments) for details.

## Testing

### cURL

After building the Docker image, start the MCP server:

```bash
docker build -t mcp-sui .
docker run --rm -p 8000:8000 -e SUI_NETWORK=testnet mcp-sui
```

In another terminal, verify that tools are listed:

```bash
curl http://localhost:8000/mcp
```

Invoke a tool, for example `create_account`:

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"method":"create_account"}' \
  http://localhost:8000/mcp
```

### MCP Inspector

You can explore the server using the MCP Inspector. This command launches the
inspector and starts the server via Docker:

```bash
npx @modelcontextprotocol/inspector \
  docker run --rm -p 8000:8000 -e SUI_NETWORK=testnet mcp-sui
```

The inspector UI will open in your browser and let you call tools interactively.

