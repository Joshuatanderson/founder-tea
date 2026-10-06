import { sql, isUuid, isUniqueViolation } from "@/lib/db";
import { Group } from "@semaphore-protocol/group";
import { SemaphoreProof, unpackGroth16Proof } from "@semaphore-protocol/proof";
import { groth16 } from "snarkjs";
import { keccak256, toBeHex } from "ethers";

// Semaphore hash function - creates a keccak256 hash compatible with SNARK scalar modulus
// This matches the hash function used in @semaphore-protocol/proof
function semaphoreHash(message: string): string {
  return (BigInt(keccak256(toBeHex(message, 32))) >> BigInt(8)).toString();
}

export async function POST(request: Request) {
  console.log("[reviews] POST request received");

  try {
    const body = await request.json();
    const { vcId, validationGroupId, proof, content } = body as {
      vcId: string;
      validationGroupId: string;
      proof: SemaphoreProof;
      content: string;
    };

    console.log("[reviews] Request body:", {
      vcId,
      validationGroupId,
      hasProof: !!proof,
      contentLength: content?.length,
    });

    // Validate inputs
    if (!vcId || !validationGroupId || !proof || !content) {
      console.log("[reviews] Missing required fields");
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate content length
    if (content.length < 10) {
      return Response.json(
        { error: "Review must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return Response.json(
        { error: "Review must be less than 5000 characters" },
        { status: 400 },
      );
    }

    // Check if VC exists
    const vcs = isUuid(vcId) ? await sql`select id from vc where id = ${vcId}` : [];

    if (vcs.length === 0) {
      return Response.json({ error: "VC not found" }, { status: 404 });
    }

    // Check if validation group exists
    const groups = isUuid(validationGroupId)
      ? await sql`select id from validation_group where id = ${validationGroupId}`
      : [];

    if (groups.length === 0) {
      return Response.json(
        { error: "Validation group not found" },
        { status: 404 },
      );
    }

    // Fetch all commitments for this validation group to build Merkle tree
    // IMPORTANT: Must use same ordering as /api/groups/[id]/commitments for consistent Merkle root
    const commitments = await sql<{ commitment: string }>`
      select commitment from identity_commitment
      where validation_group_id = ${validationGroupId}
      order by created_at asc`;

    if (commitments.length === 0) {
      return Response.json(
        { error: "No verified members in this group" },
        { status: 400 },
      );
    }

    // Build Merkle tree from commitments to verify root matches
    console.log("[reviews] Building Merkle tree from", commitments.length, "commitments");
    const semaphoreGroup = new Group();
    for (const c of commitments) {
      semaphoreGroup.addMember(BigInt(c.commitment));
    }
    console.log("[reviews] Merkle tree built, root:", semaphoreGroup.root.toString().slice(0, 20) + "...");

    // Verify the Merkle root matches
    if (semaphoreGroup.root.toString() !== proof.merkleTreeRoot) {
      console.error("[reviews] Merkle root mismatch - server:", semaphoreGroup.root.toString(), "client:", proof.merkleTreeRoot);
      return Response.json(
        { error: "Invalid proof: group state has changed" },
        { status: 403 },
      );
    }
    console.log("[reviews] Merkle root matches");

    // Verify the ZK proof cryptographically (off-chain verification)
    // Bypassing @semaphore-protocol/proof wrapper to use snarkjs directly
    // This avoids potential WASM initialization issues in the wrapper
    console.log("[reviews] Starting ZK proof verification (direct snarkjs)...");

    // Fetch the Semaphore verification key
    // URL format: https://snark-artifacts.pse.dev/semaphore/{version}/semaphore-{depth}.json
    const treeDepth = proof.merkleTreeDepth;
    console.log("[reviews] Fetching verification key for tree depth:", treeDepth);

    const vKeyUrl = `https://snark-artifacts.pse.dev/semaphore/latest/semaphore-${treeDepth}.json`;
    console.log("[reviews] Verification key URL:", vKeyUrl);

    const vKeyResponse = await fetch(vKeyUrl);
    if (!vKeyResponse.ok) {
      console.error("[reviews] Failed to fetch verification key:", vKeyResponse.status);
      return Response.json(
        { error: "Failed to verify proof: could not fetch verification key" },
        { status: 500 },
      );
    }
    const vKey = await vKeyResponse.json();
    console.log("[reviews] Verification key fetched successfully");

    // Unpack the proof from Semaphore's packed format to snarkjs format
    const unpackedProof = unpackGroth16Proof(proof.points);
    console.log("[reviews] Proof unpacked, running groth16.verify...");

    // Public signals for Semaphore: [merkleTreeRoot, nullifier, hash(message), hash(scope)]
    // IMPORTANT: message and scope must be hashed with the same function used in generateProof
    const publicSignals = [
      proof.merkleTreeRoot,
      proof.nullifier,
      semaphoreHash(proof.message),
      semaphoreHash(proof.scope),
    ];
    console.log("[reviews] Public signals prepared");

    const isValidProof = await groth16.verify(vKey, publicSignals, unpackedProof);

    // Terminate the bn128 curve worker threads to prevent hanging
    // See: https://github.com/iden3/snarkjs/issues/387
    const curve = (globalThis as unknown as { curve_bn128?: { terminate: () => Promise<void> } }).curve_bn128;
    if (curve) {
      console.log("[reviews] Terminating bn128 curve...");
      await curve.terminate();
    }

    console.log("[reviews] ZK proof verification result:", isValidProof);
    if (!isValidProof) {
      console.error("[reviews] ZK proof verification failed");
      return Response.json(
        { error: "Invalid proof" },
        { status: 401 },
      );
    }

    const nullifier = proof.nullifier;
    console.log("[reviews] Proof verified, nullifier:", nullifier.slice(0, 20) + "...");

    // Insert review (nullifier unique constraint handles duplicates)
    let review: { id: string };
    try {
      [review] = await sql<{ id: string }>`
        insert into review (vc_id, validation_group_id, nullifier, content)
        values (${vcId}, ${validationGroupId}, ${nullifier}, ${content})
        returning id`;
    } catch (insertError) {
      // Check for unique constraint violation (duplicate nullifier)
      if (isUniqueViolation(insertError)) {
        return Response.json(
          { error: "You have already reviewed this VC" },
          { status: 409 },
        );
      }

      console.error("[reviews] Insert error:", insertError);
      return Response.json(
        { error: "Failed to create review" },
        { status: 500 },
      );
    }

    console.log("[reviews] Review inserted successfully:", review.id);
    return Response.json({
      success: true,
      reviewId: review.id,
    });
  } catch (error) {
    console.error("[reviews] API error:", error);
    return Response.json({ error: "Failed to create review" }, { status: 500 });
  }
}
