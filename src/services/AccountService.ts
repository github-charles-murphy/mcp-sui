import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export interface NewAccount {
  address: string;
  privateKey: string;
}

export function createEphemeralAccount(): Ed25519Keypair {
  return Ed25519Keypair.generate();
}

export function accountFromPrivateKey(privateKeyHex: string): Ed25519Keypair {
  if (privateKeyHex.startsWith('suiprivkey')) {
    return Ed25519Keypair.fromSecretKey(privateKeyHex);
  }
  const secretKey = Buffer.from(privateKeyHex, 'hex');
  return Ed25519Keypair.fromSecretKey(secretKey);
}

export function createAccount(): NewAccount {
  const keypair = Ed25519Keypair.generate();
  return {
    address: keypair.getPublicKey().toSuiAddress(),
    privateKey: keypair.getSecretKey()
  };
}
