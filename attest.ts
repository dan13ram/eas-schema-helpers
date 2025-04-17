import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { Chain, Hex, zeroAddress } from "viem";
import { base, optimism, mainnet, arbitrum, sepolia } from "viem/chains";
//import deployments from "@ethereum-attestation-service/eas-contracts/deployments";

dotenv.config();

const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("MNEMONIC environment variable not set");
}

const getChainLabel = (chain: Chain) => {
  switch (chain.id) {
    case mainnet.id:
      return "mainnet";
    case optimism.id:
      return "optimism";
    case arbitrum.id:
      return "arbitrum-one";
    case base.id:
      return "base";
    case sepolia.id:
      return "sepolia";
    default:
      throw new Error("Unknown chain ID: " + chain.id);
  }
};

const readSchemaRegistryContractAddress = async (chain: Chain): Promise<Hex> => {
  const { address } = await import("@ethereum-attestation-service/eas-contracts/deployments/" + getChainLabel(chain) + "/SchemaRegistry.json");
  if (!address) {
    throw new Error("Schema registry contract address not found for " + chain.name);
  }
  return address as Hex;
};

const run = async (chain: Chain) => {
  const rpc = chain.rpcUrls.default.http[0];
  if (!rpc) {
    throw new Error("RPC URL not found for " + chain.name);
  }
  console.log("running on chain " + chain.name);

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const schemaRegistryContractAddress = await readSchemaRegistryContractAddress(chain);
  const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

  schemaRegistry.connect(wallet);

  const schema = "bytes32 proposalId, bytes32 originalMessageId, uint8 messageType, string message";
  const resolverAddress = zeroAddress;
  const revocable = true;

  try {
    const transaction = await schemaRegistry.register({
      schema,
      resolverAddress,
      revocable,
    });

    // Optional: Wait for transaction to be validated
    const hash = await transaction.wait(2);

    console.log("Schema registered on chain " + chain.name);
    console.log("Transaction hash:", hash);
  } catch (error) {
    console.error("Error registering schema on chain " + chain.name);
    console.error(error);
  }
}

const main = async () => {
  const chains = [sepolia];
  for (const chain of chains) {
    await run(chain);
  }
}

main();
