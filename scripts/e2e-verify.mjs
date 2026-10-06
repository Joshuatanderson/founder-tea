// End-to-end check of the anonymous review flow against a running site.
//
//   node scripts/e2e-verify.mjs send <baseUrl> <email>
//     -> emails a code, prints the challenge token
//   node scripts/e2e-verify.mjs finish <baseUrl> <email> <token> <code> <groupName> <vcName>
//     -> registers a fresh Semaphore identity in the group, then posts a
//        zero-knowledge-proved test review on the VC
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { webcrypto } from "node:crypto";

const [mode, baseUrl, email, token, code, groupName, vcName] = process.argv.slice(2);

async function call(path, body) {
  const response = await fetch(baseUrl + path, body && {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  console.log(`${body ? "POST" : "GET"} ${path} -> ${response.status}`);
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function sha256BigInt(text) {
  const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return BigInt("0x" + Buffer.from(digest).toString("hex"));
}

if (mode === "send") {
  const data = await call("/api/verify/send-code", { email });
  console.log("eligible groups:", data.eligibleGroups.map((g) => g.name).join(", "));
  console.log("token:", data.token);
} else if (mode === "finish") {
  const { groups } = await call(`/api/groups?domain=${email.split("@")[1]}`);
  const group = groups.find((g) => g.name === groupName);
  if (!group) throw new Error(`Group ${groupName} does not list this email domain`);

  // Register a new anonymous identity (what the verify modal does)
  const identity = new Identity();
  await call("/api/verify/confirm", {
    token, email, code, groupId: group.id, commitment: identity.commitment.toString(),
  });

  // Prove membership and post a review (what the review form does)
  const { commitments } = await call(`/api/groups/${group.id}/commitments`);
  const tree = new Group(commitments.map((c) => BigInt(c)));

  const vcsPage = await (await fetch(baseUrl + "/vcs")).text();
  const vcId = vcsPage.match(new RegExp(`href="/vcs/([0-9a-f-]{36})"(?:(?!href=).)*?${vcName}`, "s"))?.[1];
  if (!vcId) throw new Error(`VC ${vcName} not found on /vcs`);

  const content = `Automated end-to-end test review, ${new Date().toISOString()}. Safe to delete.`;
  const proof = await generateProof(identity, tree, await sha256BigInt(content), await sha256BigInt(vcId));
  const review = await call("/api/reviews", { vcId, validationGroupId: group.id, proof, content });
  console.log("review id:", review.reviewId);

  const vcPage = await (await fetch(`${baseUrl}/vcs/${vcId}`)).text();
  console.log("review visible on VC page:", vcPage.includes("Automated end-to-end test review"));
  process.exit(0);
} else {
  console.error("usage: see the comment at the top of this file");
  process.exit(1);
}
