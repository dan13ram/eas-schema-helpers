import { describe, it, expect } from 'vitest';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { encodeAbiParameters, parseAbiParameters, Hex } from 'viem';
import { ethers } from 'ethers';

describe('SchemaEncoder vs encodeAbiParameters comparison', () => {
  describe('Proposal Candidate Schema (complex with arrays)', () => {
    const schema = "bytes32 candidateId,bytes32 salt,address[] targets,uint256[] values,bytes[] calldatas,string description";

    it('should encode empty arrays the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const salt = ethers.keccak256(ethers.toUtf8Bytes("proposal-empty-v2"));
      const attester = "0x19a8eb80c1483CEAA1278B16C5D5eF0104F85905";
      const candidateId = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [attester, salt])
      );

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: [], type: "address[]" },
        { name: "values", value: [], type: "uint256[]" },
        { name: "calldatas", value: [], type: "bytes[]" },
        { name: "description", value: "Empty proposal candidate fixture", type: "string" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId as Hex,
          salt as Hex,
          [],
          [],
          [],
          "Empty proposal candidate fixture"
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with calldata arrays the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

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

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "salt", value: salt, type: "bytes32" },
        { name: "targets", value: targets, type: "address[]" },
        { name: "values", value: values, type: "uint256[]" },
        { name: "calldatas", value: calldatas, type: "bytes[]" },
        { name: "description", value: descriptionJSON, type: "string" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId as Hex,
          salt as Hex,
          targets as readonly Hex[],
          values,
          calldatas as readonly Hex[],
          descriptionJSON
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('Candidate Comment Schema (simple types with uint8)', () => {
    const schema = "bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID";

    it('should encode with top-level comment the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "11".repeat(32) as Hex;
      const support = 1;
      const comment = "Top-level comment for the new fixture set";
      const parentCommentUID = "0x" + "00".repeat(32) as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId,
          support,
          comment,
          parentCommentUID
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with reply comment the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "22".repeat(32) as Hex;
      const support = 2;
      const comment = "Reply comment used to verify threading";
      const parentCommentUID = "0x" + "33".repeat(32) as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "support", value: support, type: "uint8" },
        { name: "comment", value: comment, type: "string" },
        { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId,
          support,
          comment,
          parentCommentUID
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('Candidate Sponsor Signature Schema (with bytes type)', () => {
    const schema = "bytes32 candidateId, bytes32 proposalId,uint256 nonce,uint256 deadline,bytes signature";

    it('should encode with empty signature bytes the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "44".repeat(32) as Hex;
      const proposalId = "0x" + "55".repeat(32) as Hex;
      const nonce = 1n;
      const deadline = 1735689600n;
      const signature = "0x" as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "nonce", value: nonce, type: "uint256" },
        { name: "deadline", value: deadline, type: "uint256" },
        { name: "signature", value: signature, type: "bytes" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId,
          proposalId,
          nonce,
          deadline,
          signature
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode with 65-byte signature the same way', () => {
      const schemaEncoder = new SchemaEncoder(schema);

      const candidateId = "0x" + "66".repeat(32) as Hex;
      const proposalId = "0x" + "77".repeat(32) as Hex;
      const nonce = 2n;
      const deadline = 1735689601n;
      const signature = `0x${"11".repeat(64)}1b` as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "candidateId", value: candidateId, type: "bytes32" },
        { name: "proposalId", value: proposalId, type: "bytes32" },
        { name: "nonce", value: nonce, type: "uint256" },
        { name: "deadline", value: deadline, type: "uint256" },
        { name: "signature", value: signature, type: "bytes" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [
          candidateId,
          proposalId,
          nonce,
          deadline,
          signature
        ]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });

  describe('Edge cases and additional type coverage', () => {
    it('should encode bool type the same way', () => {
      const schema = "bool isActive,bytes32 id";
      const schemaEncoder = new SchemaEncoder(schema);

      const isActive = true;
      const id = "0x" + "88".repeat(32) as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "isActive", value: isActive, type: "bool" },
        { name: "id", value: id, type: "bytes32" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [isActive, id]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode different uint sizes the same way', () => {
      const schema = "uint8 a,uint16 b,uint32 c,uint64 d,uint128 e,uint256 f";
      const schemaEncoder = new SchemaEncoder(schema);

      const values = [255, 65535, 4294967295, 18446744073709551615n, 340282366920938463463374607431768211455n, ethers.parseEther("1000")];

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "a", value: values[0], type: "uint8" },
        { name: "b", value: values[1], type: "uint16" },
        { name: "c", value: values[2], type: "uint32" },
        { name: "d", value: values[3], type: "uint64" },
        { name: "e", value: values[4], type: "uint128" },
        { name: "f", value: values[5], type: "uint256" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        values
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode address array the same way', () => {
      const schema = "address[] addresses,uint256 count";
      const schemaEncoder = new SchemaEncoder(schema);

      const addresses = [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
      ];
      const count = 3n;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "addresses", value: addresses, type: "address[]" },
        { name: "count", value: count, type: "uint256" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [addresses as readonly Hex[], count]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode long strings the same way', () => {
      const schema = "string text,bytes32 id";
      const schemaEncoder = new SchemaEncoder(schema);

      const longText = "This is a much longer string that contains multiple sentences and special characters like !@#$%^&*() to test encoding. ".repeat(5);
      const id = "0x" + "99".repeat(32) as Hex;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "text", value: longText, type: "string" },
        { name: "id", value: id, type: "bytes32" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [longText, id]
      );

      console.log('SchemaEncoder output (length):', encodedWithSchemaEncoder.length);
      console.log('encodeAbiParameters output (length):', encodedWithViem.length);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode empty string the same way', () => {
      const schema = "string text,bool flag";
      const schemaEncoder = new SchemaEncoder(schema);

      const text = "";
      const flag = false;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "text", value: text, type: "string" },
        { name: "flag", value: flag, type: "bool" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [text, flag]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });

    it('should encode bytes32 array the same way', () => {
      const schema = "bytes32[] hashes,uint256 total";
      const schemaEncoder = new SchemaEncoder(schema);

      const hashes = [
        "0x" + "aa".repeat(32),
        "0x" + "bb".repeat(32),
        "0x" + "cc".repeat(32),
      ] as Hex[];
      const total = 3n;

      // SchemaEncoder encoding
      const encodedWithSchemaEncoder = schemaEncoder.encodeData([
        { name: "hashes", value: hashes, type: "bytes32[]" },
        { name: "total", value: total, type: "uint256" },
      ]);

      // encodeAbiParameters encoding
      const encodedWithViem = encodeAbiParameters(
        parseAbiParameters(schema),
        [hashes, total]
      );

      console.log('SchemaEncoder output:', encodedWithSchemaEncoder);
      console.log('encodeAbiParameters output:', encodedWithViem);

      expect(encodedWithSchemaEncoder).toBe(encodedWithViem);
    });
  });
});
