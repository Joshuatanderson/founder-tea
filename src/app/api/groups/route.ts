import { sql, isUuid } from "@/lib/db";

type Group = { id: string; name: string; website: string | null };

// GET /api/groups              -> all validation groups
// GET /api/groups?ids=a,b      -> only those groups
// GET /api/groups?domain=x.com -> groups that list this email domain
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");
  const domain = searchParams.get("domain");

  try {
    let groups: Group[];

    if (ids !== null) {
      const idList = ids.split(",").filter(isUuid);
      groups = idList.length
        ? await sql<Group>`
            select id, name, website from validation_group
            where id = any(${idList}::uuid[])
            order by name`
        : [];
    } else if (domain !== null) {
      groups = await sql<Group>`
        select distinct g.id, g.name, g.website
        from validation_group_member m
        join validation_group g on g.id = m.validation_group_id
        where m.domain = ${domain.toLowerCase()}
        order by g.name`;
    } else {
      groups = await sql<Group>`
        select id, name, website from validation_group order by name`;
    }

    return Response.json({ groups });
  } catch (error) {
    console.error("[groups] Error fetching groups:", error);
    return Response.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}
