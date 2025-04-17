import { gql, request } from "graphql-request";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { Chain, Hex, zeroHash } from "viem";
import { base, optimism, mainnet, sepolia } from "viem/chains";

dotenv.config();

const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("MNEMONIC environment variable not set");
}

const schemaUID =
  "0x8bd0d42901ce3cd9898dbea6ae2fbf1e796ef0923e7cbb0a1cecac2e42d47cb3";

const daoTokenAddress = "0x9cf0f70bbb25383f964f2a79e18a9680a08a33ae";
const daoChainId = 11155111;
const proposalNumber = 12;

const query = gql`
  query {
    daos (where: {tokenAddress: "${daoTokenAddress}"}) {
      treasuryAddress
      proposals {
        proposalId
        proposalNumber
      }
    }
  }
`;


export const PUBLIC_SUBGRAPH_URL: Record<number, string> = Object.fromEntries([
  [
    1,
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-ethereum-mainnet/latest/gn",
  ],
  [
    10,
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-optimism-mainnet/latest/gn",
  ],
  [
    11155111,
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-ethereum-sepolia/latest/gn",
  ],
  [
    8453,
    "https://api.goldsky.com/api/public/project_cm33ek8kjx6pz010i2c3w8z25/subgraphs/nouns-builder-base-mainnet/latest/gn",
  ]
]);

const getEASChainLabel = (chain: Chain) => {
  switch (chain.id) {
    case mainnet.id:
      return "mainnet";
    case optimism.id:
      return "optimism";
    case base.id:
      return "base";
    case sepolia.id:
      return "sepolia";
    default:
      throw new Error("Unknown chain ID: " + chain.id);
  }
};

type ProposalData = {
  treasuryAddress: Hex;
  proposalId: Hex;
};

const readProposalData = async (): Promise<ProposalData> => {
  const response: any = await request(PUBLIC_SUBGRAPH_URL[daoChainId], query);
  const treasuryAddress = response?.daos?.[0]?.treasuryAddress;
  if (!treasuryAddress) {
    throw new Error("Treasury address not found");
  }
  const proposalId = response.daos[0].proposals?.find(
    (p) => p.proposalNumber === proposalNumber
  )?.proposalId;
  if (!proposalId) {
    throw new Error("Proposal ID not found");
  }
  return {
    treasuryAddress: treasuryAddress as Hex,
    proposalId: proposalId as Hex,
  };
};

const readEASContractAddress = async (chain: Chain): Promise<Hex> => {
  const { address } = await import(
    "@ethereum-attestation-service/eas-contracts/deployments/" +
    getEASChainLabel(chain) +
    "/EAS.json"
  );
  if (!address) {
    throw new Error(
      "Schema registry contract address not found for " + chain.name
    );
  }
  return address as Hex;
};

const getSchemaData = (proposalId: Hex, messageType: number, message: string) => {
  if (messageType > 3 || messageType < 0) {
    throw new Error("Invalid message type");
  }
  const schemaEncoder = new SchemaEncoder(
    "bytes32 proposalId, bytes32 originalMessageId, uint8 messageType, string message"
  );
  if (messageType === 0) {
    const encodedData = schemaEncoder.encodeData([
      { name: "proposalId", value: proposalId, type: "bytes32" },
      { name: "originalMessageId", value: zeroHash, type: "bytes32" },
      { name: "messageType", value: messageType, type: "uint8" },
      { name: "message", value: message, type: "string" },
    ]);
    return encodedData;
  }
  if (messageType === 1) {
    const encodedData = schemaEncoder.encodeData([
      { name: "proposalId", value: proposalId, type: "bytes32" },
      { name: "originalMessageId", value: zeroHash, type: "bytes32" },
      { name: "messageType", value: messageType, type: "uint8" },
      { name: "message", value: message, type: "string" },
    ]);
    return encodedData;
  }
  if (messageType === 2) {
    const urlMessage = "ipfs://bafkreifaybtaf6fpcleobt4ooij2f3u4rdhgl233sst3e2qprw3w7lopy4";
    const encodedData = schemaEncoder.encodeData([
      { name: "proposalId", value: proposalId, type: "bytes32" },
      { name: "originalMessageId", value: zeroHash, type: "bytes32" },
      { name: "messageType", value: messageType, type: "uint8" },
      { name: "message", value: urlMessage, type: "string" },
    ]);
    return encodedData;
  }
  if (messageType === 3) {
    const urlJsonMessage = "ipfs://bafkreie6d33ij6pyfh22evaozn5dhxk25kls5hy3dmnzj43sz2nust3mey";
    //const urlJsonMessageWithMilestone = "ipfs://bafkreie2grbchrbpd6genmtnfvbwafsnuw2qsyem2ehf6fqylfnkgqfsum";
    const encodedData = schemaEncoder.encodeData([
      { name: "proposalId", value: proposalId, type: "bytes32" },
      { name: "originalMessageId", value: zeroHash, type: "bytes32" },
      { name: "messageType", value: messageType, type: "uint8" },
      { name: "message", value: urlJsonMessage, type: "string" },
    ]);
    return encodedData;
  }
  throw new Error("Invalid message type");
};
const run = async (chain: Chain) => {
  const rpc = chain.rpcUrls.default.http[0];
  if (!rpc) {
    throw new Error("RPC URL not found for " + chain.name);
  }
  console.log("running on chain " + chain.name);

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const { treasuryAddress, proposalId } = await readProposalData();

  const easContractAddress = await readEASContractAddress(chain);
  const eas = new EAS(easContractAddress);

  // Signer must be an ethers-like signer.
  eas.connect(wallet);

  const messageType = 1;
  const message = {
    content: "This is type 1 message with milestone id",
    milestoneId: 0
  };

  const encodedData = getSchemaData(proposalId, messageType, JSON.stringify(message));
  try {
    const tx = await eas.attest({
      schema: schemaUID,
      data: {
        recipient: treasuryAddress,
        expirationTime: 0n,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData,
      },
    });
    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID);

  } catch (error) {
    console.error("Error attesting:", error);
  }
};

const main = async () => {
  await run(sepolia);
};

main();
