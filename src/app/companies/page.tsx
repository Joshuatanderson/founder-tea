import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ExternalLink, Linkedin, Twitter } from "lucide-react";

interface Company {
  id: string;
  company_name: string;
  domain: string | null;
  year: number | null;
  program: string | null;
  location: string | null;
  industries: string | null;
  description: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  crunchbase_url: string | null;
  source: string;
}

export default async function CompaniesPage() {
  const supabase = await createClient();

  const { data: companies, error } = await supabase
    .from("portfolio_company")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
  }

  const techstarsCompanies = (companies || []) as Company[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Portfolio Companies
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse accelerator portfolio companies.
          </p>
        </div>

        {/* Techstars Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">Techstars</h2>
            <Badge variant="secondary">{techstarsCompanies.length} companies</Badge>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Company</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industries</TableHead>
                  <TableHead className="text-right">Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techstarsCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {company.image_url ? (
                          <Image
                            src={company.image_url}
                            alt={company.company_name}
                            width={32}
                            height={32}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {company.company_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div>{company.company_name}</div>
                          {company.description && (
                            <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {company.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.year}</TableCell>
                    <TableCell>
                      <span className="text-sm">{company.program?.replace("Techstars ", "")}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {company.location?.split(",")[0]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.industries?.split(",").slice(0, 2).map((industry, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {industry.trim()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {company.linkedin_url && (
                          <a
                            href={company.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {company.twitter_url && (
                          <a
                            href={company.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="Twitter"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {company.crunchbase_url && (
                          <a
                            href={company.crunchbase_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground text-xs font-bold"
                            title="Crunchbase"
                          >
                            CB
                          </a>
                        )}
                        {company.domain && (
                          <a
                            href={company.domain}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="Website"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
