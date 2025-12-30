"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Linkedin, ChevronLeft, ChevronRight, Search } from "lucide-react";

const PAGE_SIZE = 25;

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [validationGroups, setValidationGroups] = useState<ValidationGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<ValidationGroupMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch && currentPage !== 1) {
      router.push("/companies");
    }
  }, [debouncedSearch]);

  // Fetch companies when selected group, page, or search changes
  useEffect(() => {
    if (!selectedGroupId) return;

    async function fetchCompanies() {
      setLoading(true);
      const supabase = createClient();
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("validation_group_member")
        .select("*", { count: "exact" })
        .eq("validation_group_id", selectedGroupId);

      // Add fuzzy search filter for company_name and domain
      if (debouncedSearch) {
        query = query.or(`company_name.ilike.*${debouncedSearch}*,domain.ilike.*${debouncedSearch}*`);
      }

      const { data, error, count } = await query
        .order("first_session_year", { ascending: true, nullsFirst: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
        return;
      }

      setCompanies(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    }

    fetchCompanies();
  }, [selectedGroupId, currentPage, debouncedSearch]);

  const selectedGroup = validationGroups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSearchInput("");
    setDebouncedSearch("");
    // Reset to page 1 when changing groups
    router.push("/companies");
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(`/companies?page=${page}`);
  };

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
              onClick={() => handleGroupChange(group.id)}
            >
              {group.name}
            </Button>
          ))}
        </div>

        {/* Companies Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{selectedGroup?.name || "Companies"}</h2>
              <Badge variant="secondary">{totalCount} companies</Badge>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-muted-foreground py-8 text-center">Loading...</div>
          ) : companies.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {debouncedSearch ? `No companies found matching "${debouncedSearch}"` : "No companies found"}
            </div>
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
                            <div className="w-8 h-8 rounded-md bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <Image
                                src={company.logo_url}
                                alt={company.company_name || company.domain}
                                width={32}
                                height={32}
                                className="object-contain w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
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

          {/* Pagination Controls */}
          {!loading && totalCount > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
