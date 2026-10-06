import { sql, isUuid } from "@/lib/db";

const PAGE_SIZE = 25;

// GET /api/companies?groupId=...&page=1&search=foo
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const search = (searchParams.get("search") || "").trim();

  if (!isUuid(groupId)) {
    return Response.json({ error: "Group ID required" }, { status: 400 });
  }

  // Escape LIKE wildcards so the search term is matched literally
  const pattern = search ? `%${search.replace(/[\\%_]/g, "\\$&")}%` : null;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const [companies, counts] = await Promise.all([
      sql`
        select id, validation_group_id, company_name, domain, logo_url, linkedin_url,
               city, country, industry_vertical, program_names, first_session_year,
               founded_year, worldregion, is_exit, is_unicorn
        from validation_group_member
        where validation_group_id = ${groupId}
          and (${pattern}::text is null or company_name ilike ${pattern} or domain ilike ${pattern})
        order by first_session_year asc nulls last, domain asc
        limit ${PAGE_SIZE} offset ${offset}`,
      sql<{ count: number }>`
        select count(*)::int as count
        from validation_group_member
        where validation_group_id = ${groupId}
          and (${pattern}::text is null or company_name ilike ${pattern} or domain ilike ${pattern})`,
    ]);

    return Response.json({ companies, count: counts[0]?.count ?? 0 });
  } catch (error) {
    console.error("[companies] Error fetching companies:", error);
    return Response.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
