import { describe, it, expect } from 'vitest';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { encodeAbiParameters, parseAbiParameters, Hex, zeroAddress } from 'viem';
import { ethers } from 'ethers';

describe('All Schema Encodings - SchemaEncoder vs encodeAbiParameters', () => {

  describe('PROPDATE_SCHEMA', () => {
    const schema = "bytes32 proposalId, bytes32 originalMessageId, uint8 messageType, string message";

    it('should encode with basic message', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const proposalId = "0x" + "11".repeat(32) as Hex;
      const originalMessageId = "0x" + "22".repeat(32) as Hex;
      const messageType = 0;
      const message = "Basic propdate message";

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "originalMessageId", value: originalMessageId, type: "bytes32" },
        { name: "messageType", value: messageType, type: "uint8" },
        { name: "message", value: message, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [proposalId, originalMessageId, messageType, message]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with different message types', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const testCases = [
        { messageType: 1, message: "Update message" },
        { messageType: 2, message: "Cancellation notice" },
        { messageType: 255, message: "Maximum uint8 type value" },
      ];

      testCases.forEach(({ messageType, message }) => {
        const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`proposal-${messageType}`));
        const originalMessageId = ethers.keccak256(ethers.toUtf8Bytes(`message-${messageType}`));

        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "proposalId", value: proposalId, type: "bytes32" },
          { name: "originalMessageId", value: originalMessageId, type: "bytes32" },
          { name: "messageType", value: messageType, type: "uint8" },
          { name: "message", value: message, type: "string" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [proposalId as Hex, originalMessageId as Hex, messageType, message]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with empty message', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const proposalId = "0x" + "33".repeat(32) as Hex;
      const originalMessageId = "0x" + "44".repeat(32) as Hex;
      const messageType = 0;
      const message = "";

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "originalMessageId", value: originalMessageId, type: "bytes32" },
        { name: "messageType", value: messageType, type: "uint8" },
        { name: "message", value: message, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [proposalId, originalMessageId, messageType, message]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with long JSON message', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const proposalId = "0x" + "55".repeat(32) as Hex;
      const originalMessageId = "0x" + "66".repeat(32) as Hex;
      const messageType = 1;
      const message = JSON.stringify({
        title: "Complex Proposal Update",
        description: "This is a detailed description with special characters: !@#$%^&*()",
        tags: ["governance", "treasury", "voting"],
        metadata: {
          author: "0x1234567890123456789012345678901234567890",
          timestamp: 1735689600,
        }
      });

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "originalMessageId", value: originalMessageId, type: "bytes32" },
        { name: "messageType", value: messageType, type: "uint8" },
        { name: "message", value: message, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [proposalId, originalMessageId, messageType, message]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('ESCROW_DELEGATE_SCHEMA', () => {
    const schema = "address daoMultiSig";

    it('should encode with regular address', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const daoMultiSig = "0x1234567890123456789012345678901234567890" as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "daoMultiSig", value: daoMultiSig, type: "address" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [daoMultiSig]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with zero address', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const daoMultiSig = zeroAddress;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "daoMultiSig", value: daoMultiSig, type: "address" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [daoMultiSig]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with checksum addresses', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const addresses = [
        "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
      ];

      addresses.forEach(address => {
        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "daoMultiSig", value: address, type: "address" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [address as Hex]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with max address value', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const daoMultiSig = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF" as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "daoMultiSig", value: daoMultiSig, type: "address" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [daoMultiSig]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('TREASURY_ASSET_PIN_SCHEMA', () => {
    const schema = "uint8 tokenType, address token, bool isCollection, uint256 tokenId";

    it('should encode ERC20 token (isCollection=true, tokenId=0)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 0; // ERC20
      const token = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Hex; // USDC
      const isCollection = true;
      const tokenId = 0n;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode ERC721 collection (isCollection=true, tokenId=0)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 1; // ERC721
      const token = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" as Hex; // BAYC
      const isCollection = true;
      const tokenId = 0n;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode specific ERC721 NFT (isCollection=false, specific tokenId)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 1; // ERC721
      const token = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" as Hex; // BAYC
      const isCollection = false;
      const tokenId = 1234n;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode ERC1155 collection (isCollection=true, tokenId=0)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 2; // ERC1155
      const token = "0x76BE3b62873462d2142405439777e971754E8E77" as Hex;
      const isCollection = true;
      const tokenId = 0n;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode specific ERC1155 token (isCollection=false, specific tokenId)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 2; // ERC1155
      const token = "0x76BE3b62873462d2142405439777e971754E8E77" as Hex;
      const isCollection = false;
      const tokenId = 9999n;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with very large tokenId', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const tokenType = 1; // ERC721
      const token = "0x1111111111111111111111111111111111111111" as Hex;
      const isCollection = false;
      const tokenId = ethers.parseEther("999999999"); // Very large number

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "tokenType", value: tokenType, type: "uint8" },
        { name: "token", value: token, type: "address" },
        { name: "isCollection", value: isCollection, type: "bool" },
        { name: "tokenId", value: tokenId, type: "uint256" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [tokenType, token, isCollection, tokenId]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('PROFILE_LINK_SCHEMA', () => {
    const schema = "string key,string value";

    it('should encode with basic key-value pair', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const key = "twitter";
      const value = "@nounsDAO";

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "key", value: key, type: "string" },
        { name: "value", value: value, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [key, value]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with various social media links', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const testCases = [
        { key: "github", value: "https://github.com/nounsDAO" },
        { key: "discord", value: "https://discord.gg/nouns" },
        { key: "website", value: "https://nouns.wtf" },
        { key: "email", value: "contact@nouns.wtf" },
      ];

      testCases.forEach(({ key, value }) => {
        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "key", value: key, type: "string" },
          { name: "value", value: value, type: "string" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [key, value]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with empty strings', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const testCases = [
        { key: "", value: "" },
        { key: "empty", value: "" },
        { key: "", value: "some value" },
      ];

      testCases.forEach(({ key, value }) => {
        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "key", value: key, type: "string" },
          { name: "value", value: value, type: "string" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [key, value]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with special characters and unicode', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const testCases = [
        { key: "bio", value: "Building ⌐◨-◨ with Nouns!" },
        { key: "location", value: "São Paulo, Brasil 🇧🇷" },
        { key: "name", value: "Владимир Путин" },
        { key: "data", value: '{"nested": "json", "values": [1, 2, 3]}' },
      ];

      testCases.forEach(({ key, value }) => {
        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "key", value: key, type: "string" },
          { name: "value", value: value, type: "string" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [key, value]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with very long values', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const key = "bio";
      const value = "A".repeat(1000) + " Very long biography text " + "Z".repeat(1000);

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "key", value: key, type: "string" },
        { name: "value", value: value, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [key, value]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('PROPOSAL_CANDIDATE_SCHEMA', () => {
    const schema = "bytes32 candidateId,bytes32 salt,address[] targets,uint256[] values,bytes[] calldatas,string description";

    it('should encode with empty arrays', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-empty"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: [], type: "address[]" },
        { name: "values", value: [], type: "uint256[]" },
        { name: "calldatas", value: [], type: "bytes[]" },
        { name: "description", value: "Empty proposal", type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId as Hex, salt as Hex, [], [], [], "Empty proposal"]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with single ETH transfer', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-single-transfer"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      const targets = ["0x1234567890123456789012345678901234567890"];
      const values = [ethers.parseEther("10.0")];
      const calldatas = ["0x"];

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: targets, type: "address[]" },
        { name: "values", value: values, type: "uint256[]" },
        { name: "calldatas", value: calldatas, type: "bytes[]" },
        { name: "description", value: "Transfer 10 ETH", type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId as Hex, salt as Hex, targets as readonly Hex[], values, calldatas as readonly Hex[], "Transfer 10 ETH"]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with multiple function calls', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-multi-call"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      const targets = [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
      ];

      const values = [0n, 0n, 0n];

      const iface = new ethers.Interface([
        "function transfer(address to, uint256 amount)",
        "function approve(address spender, uint256 amount)",
      ]);

      const calldatas = [
        iface.encodeFunctionData("transfer", [
          "0x1111111111111111111111111111111111111111",
          ethers.parseUnits("1000", 6), // USDC has 6 decimals
        ]),
        iface.encodeFunctionData("transfer", [
          "0x2222222222222222222222222222222222222222",
          ethers.parseEther("5000"), // DAI has 18 decimals
        ]),
        iface.encodeFunctionData("approve", [
          "0x3333333333333333333333333333333333333333",
          ethers.parseUnits("10000", 6), // USDT has 6 decimals
        ]),
      ];

      const description = JSON.stringify({
        title: "Multi-token treasury operations",
        summary: "Transfer USDC, DAI, and approve USDT",
      });

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: targets, type: "address[]" },
        { name: "values", value: values, type: "uint256[]" },
        { name: "calldatas", value: calldatas, type: "bytes[]" },
        { name: "description", value: description, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId as Hex, salt as Hex, targets as readonly Hex[], values, calldatas as readonly Hex[], description]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with mixed ETH and contract calls', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-mixed"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      const targets = [
        "0x1234567890123456789012345678901234567890",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ];

      const values = [
        ethers.parseEther("5.0"),
        0n,
      ];

      const iface = new ethers.Interface([
        "function transfer(address to, uint256 amount)",
      ]);

      const calldatas = [
        "0x",
        iface.encodeFunctionData("transfer", [
          "0x9999999999999999999999999999999999999999",
          ethers.parseUnits("1000", 6),
        ]),
      ];

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: targets, type: "address[]" },
        { name: "values", value: values, type: "uint256[]" },
        { name: "calldatas", value: calldatas, type: "bytes[]" },
        { name: "description", value: "Mixed ETH and token transfer", type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId as Hex, salt as Hex, targets as readonly Hex[], values, calldatas as readonly Hex[], "Mixed ETH and token transfer"]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with complex calldata and long description', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-complex"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      const targets = [
        "0x1111111111111111111111111111111111111111",
      ];

      const values = [0n];

      const iface = new ethers.Interface([
        "function complexFunction(address[] memory addresses, uint256[] memory amounts, bytes memory data)",
      ]);

      const calldatas = [
        iface.encodeFunctionData("complexFunction", [
          ["0x2222222222222222222222222222222222222222", "0x3333333333333333333333333333333333333333"],
          [ethers.parseEther("1"), ethers.parseEther("2")],
          ethers.toUtf8Bytes("Additional data payload"),
        ]),
      ];

      const description = JSON.stringify({
        title: "Complex multi-parameter proposal",
        summary: "Testing complex nested parameters in calldata",
        rationale: "This ensures we can handle complex function calls with multiple array parameters and nested data",
        tags: ["testing", "complex", "calldata"],
      });

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: targets, type: "address[]" },
        { name: "values", value: values, type: "uint256[]" },
        { name: "calldatas", value: calldatas, type: "bytes[]" },
        { name: "description", value: description, type: "string" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId as Hex, salt as Hex, targets as readonly Hex[], values, calldatas as readonly Hex[], description]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('CANDIDATE_COMMENT_SCHEMA', () => {
    const schema = "bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID";

    it('should encode with support type 0 (against)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "11".repeat(32) as Hex;
      const support = 0;
      const comment = "I disagree with this proposal";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with support type 1 (for)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "22".repeat(32) as Hex;
      const support = 1;
      const comment = "Great proposal! Voting in favor.";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with support type 2 (abstain)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "33".repeat(32) as Hex;
      const support = 2;
      const comment = "Abstaining from this vote";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode threaded reply comment', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "44".repeat(32) as Hex;
      const support = 1;
      const comment = "I agree with the parent comment";
      const parentCommentUID = "0x" + "55".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with empty comment', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "66".repeat(32) as Hex;
      const support = 1;
      const comment = "";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with long markdown comment', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "77".repeat(32) as Hex;
      const support = 1;
      const comment = `# Detailed Analysis

## Summary
This proposal is well thought out and addresses key concerns.

## Key Points
- Point 1: Strong community support
- Point 2: Clear implementation plan
- Point 3: Reasonable budget

## Conclusion
Voting **FOR** this proposal.

\`\`\`solidity
// Sample code
function vote() external {
  // implementation
}
\`\`\`
`;
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with special characters and emojis', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "88".repeat(32) as Hex;
      const support = 1;
      const comment = "⌐◨-◨ Nouns! Love this proposal 🎉🎨🔥";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, support, comment, parentCommentUID]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('CANDIDATE_SPONSOR_SIGNATURE_SCHEMA', () => {
    const schema = "bytes32 candidateId,bytes32 proposalId,uint256 nonce,uint256 deadline,bytes signature";

    it('should encode with empty signature', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "11".repeat(32) as Hex;
      const proposalId = "0x" + "22".repeat(32) as Hex;
      const nonce = 0n;
      const deadline = 1735689600n;
      const signature = "0x" as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "nonce", value: nonce, type: "uint256" },
        { name: "deadline", value: deadline, type: "uint256" },
        { name: "signature", value: signature, type: "bytes" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, proposalId, nonce, deadline, signature]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with standard ECDSA signature (65 bytes)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "33".repeat(32) as Hex;
      const proposalId = "0x" + "44".repeat(32) as Hex;
      const nonce = 1n;
      const deadline = 1735689700n;
      // Standard ECDSA signature: r (32 bytes) + s (32 bytes) + v (1 byte)
      const signature = `0x${"aa".repeat(32)}${"bb".repeat(32)}1b` as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "nonce", value: nonce, type: "uint256" },
        { name: "deadline", value: deadline, type: "uint256" },
        { name: "signature", value: signature, type: "bytes" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, proposalId, nonce, deadline, signature]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with different v values (27 and 28)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const testCases = [
        { v: "1b", desc: "v=27" },
        { v: "1c", desc: "v=28" },
      ];

      testCases.forEach(({ v, desc }) => {
        const candidateId = ethers.keccak256(ethers.toUtf8Bytes(`candidate-${v}`));
        const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`proposal-${v}`));
        const nonce = BigInt(parseInt(v, 16));
        const deadline = 1735689800n;
        const signature = `0x${"cc".repeat(32)}${"dd".repeat(32)}${v}` as Hex;

        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "candidateId", value: candidateId, type: "bytes32" },
          { name: "proposalId", value: proposalId, type: "bytes32" },
          { name: "nonce", value: nonce, type: "uint256" },
          { name: "deadline", value: deadline, type: "uint256" },
          { name: "signature", value: signature, type: "bytes" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [candidateId as Hex, proposalId as Hex, nonce, deadline, signature]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with increasing nonce values', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const nonces = [0n, 1n, 100n, 1000n, 999999n];

      nonces.forEach(nonce => {
        const candidateId = "0x" + "55".repeat(32) as Hex;
        const proposalId = "0x" + "66".repeat(32) as Hex;
        const deadline = 1735689900n;
        const signature = `0x${"ee".repeat(32)}${"ff".repeat(32)}1b` as Hex;

        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "candidateId", value: candidateId, type: "bytes32" },
          { name: "proposalId", value: proposalId, type: "bytes32" },
          { name: "nonce", value: nonce, type: "uint256" },
          { name: "deadline", value: deadline, type: "uint256" },
          { name: "signature", value: signature, type: "bytes" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [candidateId, proposalId, nonce, deadline, signature]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with various deadline timestamps', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const deadlines = [
        0n, // No deadline
        1735689600n, // Jan 1, 2025
        1767225600n, // Jan 1, 2026
        2524608000n, // Jan 1, 2050
      ];

      deadlines.forEach(deadline => {
        const candidateId = "0x" + "77".repeat(32) as Hex;
        const proposalId = "0x" + "88".repeat(32) as Hex;
        const nonce = 1n;
        const signature = `0x${"11".repeat(32)}${"22".repeat(32)}1c` as Hex;

        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "candidateId", value: candidateId, type: "bytes32" },
          { name: "proposalId", value: proposalId, type: "bytes32" },
          { name: "nonce", value: nonce, type: "uint256" },
          { name: "deadline", value: deadline, type: "uint256" },
          { name: "signature", value: signature, type: "bytes" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [candidateId, proposalId, nonce, deadline, signature]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });

    it('should encode with EIP-2098 compact signature (64 bytes)', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "99".repeat(32) as Hex;
      const proposalId = "0x" + "aa".repeat(32) as Hex;
      const nonce = 5n;
      const deadline = 1735690000n;
      // EIP-2098 compact signature: r (32 bytes) + vs (32 bytes with v encoded in high bit)
      const signature = `0x${"33".repeat(32)}${"44".repeat(32)}` as Hex;

      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "nonce", value: nonce, type: "uint256" },
        { name: "deadline", value: deadline, type: "uint256" },
        { name: "signature", value: signature, type: "bytes" },
      ]);

      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [candidateId, proposalId, nonce, deadline, signature]
      );

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with custom signature lengths', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const signatureLengths = [
        { len: 0, hex: "0x" },
        { len: 32, hex: "0x" + "ab".repeat(32) },
        { len: 64, hex: "0x" + "cd".repeat(64) },
        { len: 65, hex: "0x" + "ef".repeat(64) + "1b" },
        { len: 100, hex: "0x" + "12".repeat(100) },
      ];

      signatureLengths.forEach(({ len, hex }) => {
        const candidateId = "0x" + "bb".repeat(32) as Hex;
        const proposalId = "0x" + "cc".repeat(32) as Hex;
        const nonce = BigInt(len);
        const deadline = 1735690100n;
        const signature = hex as Hex;

        const encodedWithSchemaEncoder = schemaEncoder.encodeData([
          { name: "candidateId", value: candidateId, type: "bytes32" },
          { name: "proposalId", value: proposalId, type: "bytes32" },
          { name: "nonce", value: nonce, type: "uint256" },
          { name: "deadline", value: deadline, type: "uint256" },
          { name: "signature", value: signature, type: "bytes" },
        ]);

        const encodedWithViem = encodeAbiParameters(
          parseAbiParameters(schema),
          [candidateId, proposalId, nonce, deadline, signature]
        );

        expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
      });
    });
  });
});
