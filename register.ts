import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { Chain, Hex, zeroAddress } from "viem";
import { base, optimism, mainnet, arbitrum, sepolia, baseSepolia, optimismSepolia } from "viem/chains";

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
    case optimismSepolia.id:
      return "optimism-sepolia";
    case baseSepolia.id:
      return "base-sepolia";
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


const proposalCandidateSchema = "bytes32 candidateId,bytes32 salt,uint64 versionNumber,address[] targets,uint256[] values,bytes[] calldatas,string description,bytes32 proposalId"

const candidateCommentSchema = "bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID"

const candidateSponsorSignatureSchema = "bytes32 candidateVersionUID,bytes32 proposalId,uint256 nonce,uint256 deadline,bytes signature"

// const schema = "bytes32 proposalId, bytes32 originalMessageId, uint8 messageType, string message";
// const schema = "uint8 tokenType, address token, bool isCollection, uint256 tokenId";
// const schema = "address daoMultiSig";


const run = async (chain: Chain, schema: string) => {
  if (!chain || !chain.id) {
    throw new Error("Chain not found");
  }
  if (!schema) {
    throw new Error("Schema not found");
  }
  const rpc = chain.rpcUrls?.default?.http[0];
  if (!rpc) {
    throw new Error("RPC URL not found for " + chain.name);
  }
  console.log("Running on chain:", chain.name);
  console.log("Schema:", schema);

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const schemaRegistryContractAddress = await readSchemaRegistryContractAddress(chain);
  const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

  schemaRegistry.connect(wallet);

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
    console.log("Schema ID:", hash);
  } catch (error) {
    console.error("Error registering schema on chain " + chain.name);
    console.error(error);
  }
}


const main = async () => {
  const chains = [sepolia];
  const schemas = [
    proposalCandidateSchema,
    candidateCommentSchema,
    candidateSponsorSignatureSchema,
  ];
  for (const chain of chains) {
    for (const schema of schemas) {
      await run(chain, schema);
    }
  }
}

main();
