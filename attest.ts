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

// Schema UIDs - ETH Sepolia
const proposalCandidateSchemaUID = "0xc3315fb5b910e904d24f56c5b37dd5a5d06392bb040ba8ad669a9f7b3bbe2e4f";
const candidateCommentSchemaUID = "0x1decf999b02cbecd8697ae7cf0c4017bc0115adbee476da79634332fdff965b2";
const candidateSponsorSignatureSchemaUID = "0x58cd8b0e3e1bd4c8c0d980826c3a041d315132ecccbfb7063f6458c05809e54a";

const proposalCandidateSchema = "bytes32 candidateId,bytes32 salt,address[] targets,uint256[] values,bytes[] calldatas,string description";
const candidateCommentSchema = "bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID";
const candidateSponsorSignatureSchema = "bytes32 candidateId, bytes32 proposalId,uint256 nonce,uint256 deadline,bytes signature";

const testRecipient = "0x000000000000000000000000000000000000dead" as Hex;

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

const getProposalCandidateData = () => {
  const schemaEncoder = new SchemaEncoder(
    proposalCandidateSchema
  );
  const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-empty-v2"));
  const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
  const candidateId = ethers.keccak256(
    ethers.solidityPacked(["address", "bytes32"], [attester, salt])
  );
  const encodedData = schemaEncoder.encodeData([
    { name: "candidateId", value: candidateId, type: "bytes32" },
    { name: "salt", value: salt, type: "bytes32" },
    { name: "targets", value: [], type: "address[]" },
    { name: "values", value: [], type: "uint256[]" },
    { name: "calldatas", value: [], type: "bytes[]" },
    { name: "description", value: "Empty proposal candidate fixture", type: "string" },
  ]);
  return { encodedData, candidateId, salt };
};

const getProposalCandidateDataWithCalldata = () => {
  const schemaEncoder = new SchemaEncoder(
    proposalCandidateSchema
  );

  const targets = [
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  ];

  const values = [
    ethers.parseEther("1.0"),
    0n,
  ];

  const iface = new ethers.Interface([
    "function transfer(address to, uint256 amount)",
  ]);
  const calldatas = [
    "0x",
    iface.encodeFunctionData("transfer", [
      "0x9999999999999999999999999999999999999999",
      ethers.parseEther("100"),
    ]),
  ];

  const descriptionJSON = JSON.stringify({
    title: "Treasury diversification v2",
    summary: "One ETH transfer plus an ERC20 transfer call",
    scenario: "proposal-with-calldata",
  });

  const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-calldata-v2"));
  const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
  const candidateId = ethers.keccak256(
    ethers.solidityPacked(["address", "bytes32"], [attester, salt])
  );

  const encodedData = schemaEncoder.encodeData([
    { name: "candidateId", value: candidateId, type: "bytes32" },
    { name: "salt", value: salt, type: "bytes32" },
    { name: "targets", value: targets, type: "address[]" },
    { name: "values", value: values, type: "uint256[]" },
    { name: "calldatas", value: calldatas, type: "bytes[]" },
    { name: "description", value: descriptionJSON, type: "string" },
  ]);
  return { encodedData, candidateId, salt };
};

const getCandidateCommentData = (candidateId: Hex, parentCommentUID: Hex, comment: string, support: number) => {
  const schemaEncoder = new SchemaEncoder(candidateCommentSchema);
  const encodedData = schemaEncoder.encodeData([
    { name: "candidateId", value: candidateId, type: "bytes32" },
    { name: "support", value: support, type: "uint8" },
    { name: "comment", value: comment, type: "string" },
    { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
  ]);
  return encodedData;
};

const getCandidateSponsorSignatureData = (candidateVersionUID: Hex, nonce: bigint, deadline: bigint, signature: Hex) => {
  const schemaEncoder = new SchemaEncoder(candidateSponsorSignatureSchema);
  const encodedData = schemaEncoder.encodeData([
    { name: "candidateVersionUID", value: candidateVersionUID, type: "bytes32" },
    { name: "nonce", value: nonce, type: "uint256" },
    { name: "deadline", value: deadline, type: "uint256" },
    { name: "signature", value: signature, type: "bytes" },
  ]);
  return encodedData;
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

const attestScenario = async (
  eas: EAS,
  schema: Hex,
  label: string,
  encodedData: Hex,
  recipient: Hex
) => {
  console.log(`\n--- ${label} ---`);
  console.log("Schema:", schema);
  console.log("Encoded data:", encodedData);

  const tx = await eas.attest({
    schema,
    data: {
      recipient,
      expirationTime: 0n,
      revocable: true,
      data: encodedData,
    },
  });

  const sentTx = await tx.signer.sendTransaction(tx.data);
  const receipt = await sentTx.wait();
  const attestationUID = await tx.waitCallback(receipt);

  console.log(JSON.stringify({
    label,
    txHash: sentTx.hash,
    attestationUID,
  }, null, 2));

  return { txHash: sentTx.hash, attestationUID };
};

const run = async (chain: Chain) => {
  const rpc = process.env.SEPOLIA_RPC_URL ?? sepolia.rpcUrls.default.http[0];
  if (!rpc) {
    throw new Error("RPC URL not found for " + chain.name);
  }
  console.log("running on chain " + chain.name);

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const easContractAddress = await readEASContractAddress(chain);
  const eas = new EAS(easContractAddress);

  eas.connect(wallet);

  const proposalEmpty = getProposalCandidateData();
  const proposalCalldata = getProposalCandidateDataWithCalldata();

  await attestScenario(
    eas,
    proposalCandidateSchemaUID,
    "Attesting Proposal Candidate (empty arrays)",
    proposalEmpty.encodedData,
    testRecipient
  );

  const proposalCalldataResult = await attestScenario(
    eas,
    proposalCandidateSchemaUID,
    "Attesting Proposal Candidate (with calldata)",
    proposalCalldata.encodedData,
    testRecipient
  );

  const commentTop = getCandidateCommentData(
    proposalEmpty.candidateId,
    zeroHash,
    "Top-level comment for the new fixture set",
    1
  );
  const commentTopResult = await attestScenario(
    eas,
    candidateCommentSchemaUID,
    "Attesting Candidate Comment (top-level)",
    commentTop,
    testRecipient
  );

  const commentReply = getCandidateCommentData(
    proposalEmpty.candidateId,
    commentTopResult.attestationUID as Hex,
    "Reply comment used to verify threading",
    2
  );
  await attestScenario(
    eas,
    candidateCommentSchemaUID,
    "Attesting Candidate Comment (reply)",
    commentReply,
    testRecipient
  );

  const signatureEmpty = getCandidateSponsorSignatureData(
    proposalCalldataResult.attestationUID as Hex,
    1n,
    1735689600n,
    "0x"
  );
  await attestScenario(
    eas,
    candidateSponsorSignatureSchemaUID,
    "Attesting Candidate Sponsor Signature (empty bytes)",
    signatureEmpty,
    testRecipient
  );

  const signatureBytes = `0x${"11".repeat(64)}1b` as Hex;
  const signatureFilled = getCandidateSponsorSignatureData(
    proposalCalldataResult.attestationUID as Hex,
    2n,
    1735689601n,
    signatureBytes
  );
  await attestScenario(
    eas,
    candidateSponsorSignatureSchemaUID,
    "Attesting Candidate Sponsor Signature (65-byte signature)",
    signatureFilled,
    testRecipient
  );
};

const main = async () => {
  await run(sepolia);
};

main();
