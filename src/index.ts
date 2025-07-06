import http from 'node:http';
import { URL } from 'node:url';
import { config } from './config/index.js';
import { SuiService } from './services/SuiService.js';
import { createEphemeralAccount, accountFromPrivateKey, createAccount } from './services/AccountService.js';
import { addressSchema } from './utils/validation.js';
import { z } from 'zod';

const publishParamsSchema = z.object({
  path: z.string(),
  network: z.string(),
  privateKey: z.string().optional(),
  ephemeral: z.boolean().optional(),
});

const transferParamsSchema = z.object({
  to: addressSchema,
  amount: z.number(),
  network: z.string(),
  privateKey: z.string().optional(),
  ephemeral: z.boolean().optional(),
});

const rpcParamsSchema = z.object({
  method: z.string(),
  params: z.array(z.any()).default([]),
  network: z.string().optional()
});

const moveCallParamsSchema = z.object({
  target: z.string(),
  args: z.array(z.any()).default([]),
  typeArguments: z.array(z.string()).optional(),
  network: z.string(),
  privateKey: z.string().optional(),
  ephemeral: z.boolean().optional()
});

const suiService = new SuiService(config.defaultNetwork);

function nestedAssign(obj: any, path: string[], value: string) {
  let curr = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    curr[key] = curr[key] ?? {};
    curr = curr[key];
  }
  curr[path[path.length - 1]] = value;
}

function parseQuery(searchParams: URLSearchParams) {
  const result: any = {};
  for (const [key, value] of searchParams.entries()) {
    nestedAssign(result, key.split('.'), value);
  }
  return result;
}

const tools = [
  {
    name: 'publish_package',
    description: 'Compile and publish a Move package',
    inputSchema: publishParamsSchema,
  },
  {
    name: 'create_account',
    description: 'Generate a new Sui account',
    inputSchema: z.object({}),
  },
  {
    name: 'transfer_sui',
    description: 'Transfer SUI to another address',
    inputSchema: transferParamsSchema,
  },
  {
    name: 'rpc_call',
    description: 'Invoke a Sui RPC method',
    inputSchema: rpcParamsSchema,
  },
  {
    name: 'move_call',
    description: 'Execute a Move call as a transaction',
    inputSchema: moveCallParamsSchema,
  },
];

async function handlePost(body: any) {
  const method = body.method as string;
  switch (method) {
    case 'publish_package': {
      const { path, network, privateKey, ephemeral } = publishParamsSchema.parse(body.params ?? {});
      suiService.setNetwork(network);
      let keypair;
      if (ephemeral) {
        keypair = createEphemeralAccount();
      } else if (privateKey) {
        keypair = accountFromPrivateKey(privateKey);
      } else {
        throw new Error('No account provided');
      }
      const compile = await suiService.compileMove(path);
      if (!compile.success) {
        return { success: false, error: compile.error };
      }
      const result = await suiService.publishPackage(path, keypair);
      return { success: true, result };
    }
    case 'create_account': {
      const account = createAccount();
      return { success: true, result: account };
    }
    case 'transfer_sui': {
      const { to, amount, network, privateKey, ephemeral } = transferParamsSchema.parse(body.params ?? {});
      suiService.setNetwork(network);
      let keypair;
      if (ephemeral) {
        keypair = createEphemeralAccount();
      } else if (privateKey) {
        keypair = accountFromPrivateKey(privateKey);
      } else {
        throw new Error('No account provided');
      }
      const result = await suiService.transferSui(amount, to, keypair);
      return { success: true, result };
    }
    case 'rpc_call': {
      const { method: rpcMethod, params, network } = rpcParamsSchema.parse(body.params ?? {});
      if (network) {
        suiService.setNetwork(network);
      }
      const result = await suiService.rpc(rpcMethod, params);
      return { success: true, result };
    }
    case 'move_call': {
      const { target, args, typeArguments, network, privateKey, ephemeral } = moveCallParamsSchema.parse(body.params ?? {});
      suiService.setNetwork(network);
      let keypair;
      if (ephemeral) {
        keypair = createEphemeralAccount();
      } else if (privateKey) {
        keypair = accountFromPrivateKey(privateKey);
      } else {
        throw new Error('No account provided');
      }
      const result = await suiService.moveCall(target, args, keypair, typeArguments);
      return { success: true, result };
    }
    default:
      throw new Error(`Unknown method ${method}`);
  }
}

const PORT = parseInt(process.env.PORT || '8000');

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  if (url.pathname !== '/mcp') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  const configParams = parseQuery(url.searchParams);
  (req as any).config = configParams;

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ tools }));
  } else if (req.method === 'POST') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', async () => {
      try {
        const body = JSON.parse(data || '{}');
        const result = await handlePost(body);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else if (req.method === 'DELETE') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } else {
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.error(`Sui MCP server listening on ${PORT}`);
});
