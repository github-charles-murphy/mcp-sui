import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { networks } from '../config/networks.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CompileResult {
  success: boolean;
  modules?: string[];
  dependencies?: string[];
  error?: string;
}

export class SuiService {
  private client: SuiClient;

  constructor(private network: string) {
    const cfg = networks[network];
    this.client = new SuiClient({ url: cfg.rpcUrl });
  }

  setNetwork(network: string) {
    this.network = network;
    this.client = new SuiClient({ url: networks[network].rpcUrl });
  }

  async compileMove(pkgPath: string): Promise<CompileResult> {
    try {
      const { stdout } = await execFileAsync('sui', ['move', 'build', '--dump-bytecode-as-base64', '--path', pkgPath], { encoding: 'utf8' });
      const data = JSON.parse(stdout);
      return { success: true, modules: data.modules, dependencies: data.dependencies };
    } catch (err: any) {
      return { success: false, error: err.stderr || err.message };
    }
  }

  async publishPackage(pkgPath: string, keypair: Ed25519Keypair) {
    const build = await this.compileMove(pkgPath);
    if (!build.success) throw new Error(build.error || 'compile failed');

    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules: build.modules!,
      dependencies: build.dependencies!
    });
    tx.transferObjects([upgradeCap], keypair.toSuiAddress());
    const result = await this.client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
    return result;
  }

  async transferSui(amount: number, to: string, keypair: Ed25519Keypair) {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    tx.transferObjects([coin], to);
    const result = await this.client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
    return result;
  }

  async rpc(method: string, params: any[]) {
    return await this.client.call(method, params);
  }

  async moveCall(
    target: string,
    args: any[],
    keypair: Ed25519Keypair,
    typeArguments: string[] = []
  ) {
    const tx = new Transaction();
    tx.moveCall({
      target,
      typeArguments,
      arguments: args.map((a) => tx.pure(a))
    });
    const result = await this.client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
    return result;
  }
}
