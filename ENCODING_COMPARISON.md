# SchemaEncoder vs encodeAbiParameters Comparison Results

## Summary

**All tests passed! ✅**

The encoding output from `SchemaEncoder` (from `@ethereum-attestation-service/eas-sdk`) and `encodeAbiParameters` (from `viem`) is **100% identical** across all tested scenarios.

## Test Coverage

The test suite in `encoding.test.ts` compares both encoders across 12 different scenarios:

### 1. Proposal Candidate Schema (Complex with Arrays)
**Schema:** `bytes32 candidateId,bytes32 salt,address[] targets,uint256[] values,bytes[] calldatas,string description`

- ✅ Empty arrays encoding
- ✅ Arrays with multiple elements and complex calldata

### 2. Candidate Comment Schema (Simple Types with uint8)
**Schema:** `bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID`

- ✅ Top-level comment encoding
- ✅ Reply comment encoding

### 3. Candidate Sponsor Signature Schema (with bytes type)
**Schema:** `bytes32 candidateId, bytes32 proposalId,uint256 nonce,uint256 deadline,bytes signature`

- ✅ Empty signature bytes
- ✅ 65-byte signature (typical ECDSA signature)

### 4. Additional Edge Cases
- ✅ Boolean types
- ✅ Different uint sizes (uint8, uint16, uint32, uint64, uint128, uint256)
- ✅ Address arrays
- ✅ Long strings (600+ characters)
- ✅ Empty strings
- ✅ bytes32 arrays

## Conclusion

**Yes, you can completely replace SchemaEncoder with encodeAbiParameters from viem!**

### Benefits of using `encodeAbiParameters`:

1. **Fewer dependencies** - You already have viem in your project
2. **Better TypeScript support** - viem has excellent type inference
3. **Simpler API** - No need to create SchemaEncoder instances or specify types in the data array
4. **Smaller bundle size** - No need for the EAS SDK if only using it for encoding

### Migration Example

**Before (SchemaEncoder):**
```typescript
const schemaEncoder = new SchemaEncoder(
  "bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID"
);
const encodedData = schemaEncoder.encodeData([
  { name: "candidateId", value: candidateId, type: "bytes32" },
  { name: "support", value: support, type: "uint8" },
  { name: "comment", value: comment, type: "string" },
  { name: "parentCommentUID", value: parentCommentUID, type: "bytes32" },
]);
```

**After (encodeAbiParameters):**
```typescript
import { encodeAbiParameters, parseAbiParameters } from 'viem';

const encodedData = encodeAbiParameters(
  parseAbiParameters("bytes32 candidateId,uint8 support,string comment,bytes32 parentCommentUID"),
  [candidateId, support, comment, parentCommentUID]
);
```

## Running the Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with verbose output to see encoded values
pnpm vitest run --reporter=verbose
```

## Notes

- The schema string format is identical between both libraries (ABI parameter format)
- The order of parameters in the values array must match the schema order
- All Solidity types are supported by both libraries
- The encoding follows the Ethereum ABI specification exactly
