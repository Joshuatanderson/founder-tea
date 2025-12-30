"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { ArrowLeft, ExternalLink, Linkedin } from "lucide-react";

interface ValidationGroup {
  id: string;
  name: string;
  website: string | null;
}

interface ValidationGroupMember {
  id: string;
  validation_group_id: string;
  company_name: string | null;
  domain: string;
  logo_url: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  industry_vertical: string[] | null;
  program_names: string[] | null;
  first_session_year: number | null;
  founded_year: number | null;
  worldregion: string | null;
  is_exit: boolean | null;
  is_unicorn: boolean | null;
}

export default function CompaniesPage() {
  const [validationGroups, setValidationGroups] = useState<ValidationGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<ValidationGroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch validation groups on mount
  useEffect(() => {
    async function fetchValidationGroups() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("validation_group")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching validation groups:", error);
        return;
      }

      setValidationGroups(data || []);
      // Select first group by default
      if (data && data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
      setLoading(false);
    }

    fetchValidationGroups();
  }, []);

  // Fetch companies when selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    async function fetchCompanies() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("validation_group_member")
        .select("*")
        .eq("validation_group_id", selectedGroupId)
        .order("first_session_year", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
        return;
      }

      setCompanies(data || []);
      setLoading(false);
    }

    fetchCompanies();
  }, [selectedGroupId]);

  const selectedGroup = validationGroups.find((g) => g.id === selectedGroupId);

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
            Browse accelerator portfolio companies by validation group.
          </p>
        </div>

        {/* Validation Group Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {validationGroups.map((group) => (
            <Button
              key={group.id}
              variant={selectedGroupId === group.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroupId(group.id)}
            >
              {group.name}
            </Button>
          ))}
        </div>

        {/* Companies Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">{selectedGroup?.name || "Companies"}</h2>
            <Badge variant="secondary">{companies.length} companies</Badge>
          </div>

          {loading ? (
            <div className="text-muted-foreground py-8 text-center">Loading...</div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Company</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <Image
                              src={company.logo_url}
                              alt={company.company_name || company.domain}
                              width={32}
                              height={32}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {(company.company_name || company.domain).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div>{company.company_name || company.domain}</div>
                            {company.is_unicorn && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Unicorn
                              </Badge>
                            )}
                            {company.is_exit && (
                              <Badge variant="outline" className="text-xs mt-1 ml-1">
                                Exit
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.first_session_year}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {company.program_names?.slice(0, 1).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {[company.city, company.country].filter(Boolean).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {company.industry_vertical?.slice(0, 2).map((industry, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {industry}
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
                          {company.domain && (
                            <a
                              href={
                                company.domain.startsWith("http")
                                  ? company.domain
                                  : `https://${company.domain}`
                              }
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
          )}
        </div>
      </main>
    </div>
  );
}
