import { sql, isUniqueViolation } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, website, linkedin } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [vc] = await sql<{ id: string }>`
      insert into vc (name, website, linkedin)
      values (${name.trim()}, ${website || null}, ${linkedin || null})
      returning id`;

    return Response.json({ success: true, vcId: vc.id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json(
        { error: "A VC with this name already exists" },
        { status: 409 }
      );
    }
    console.error("[vcs] API error:", error);
    return Response.json(
      { error: "Failed to add VC" },
      { status: 500 }
    );
  }
}
