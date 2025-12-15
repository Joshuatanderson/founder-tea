"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-backgrounds";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VerifyModal } from "@/components/verify-modal";
import { Header } from "@/components/header";
import {
  Mail,
  MailCheck,
  Search,
  Send,
  XCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background layer - extends below hero and fades out */}
      <div
        className="absolute inset-x-0 top-0 h-[900px] pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
        }}
      >
        <HeroBackground />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Anonymous Founders Helping Founders with the tea 🫖 on VC's
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Find out the founder tea on VCs, or submit cryptographically
          anonymized feedback to help out other founders.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/vcs">
            <Button size="lg">
              <Search className="mr-2 h-4 w-4" />
              Find a VC
            </Button>
          </Link>
          <VerifyModal />
        </div>
      </section>

      <Separator className="relative z-10 mx-auto max-w-5xl" />

      {/* How It Works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Zero-knowledge proofs let you prove you&apos;re a verified founder
          without revealing who you are.
        </p>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Verify */}
          <Card className="flex flex-col">
            <CardContent className="pt-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step 1
                </span>
              </div>
              <h3 className="text-lg font-medium">Verify your email</h3>
              <div className="mt-4 rounded-lg bg-muted/50 p-3 font-mono text-sm">
                <span className="text-muted-foreground">brian@</span>
                <span className="text-primary">airbnb.com</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-green-500">
                <MailCheck className="h-4 w-4" />
                Domain matches a YC portfolio company
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Transform */}
          <Card className="flex flex-col border-primary/50">
            <CardContent className="pt-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <EyeOff className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step 2
                </span>
              </div>
              <h3 className="text-lg font-medium">Identity transforms</h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="line-through text-muted-foreground">
                    brian@airbnb.com
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  YC founder
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Publish */}
          <Card className="flex flex-col">
            <CardContent className="pt-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step 3
                </span>
              </div>
              <h3 className="text-lg font-medium">Report published</h3>
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="italic">
                  &quot;They ghosted us after the term sheet...&quot;
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <Badge variant="secondary" className="text-xs">
                  ✓ YC founder
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Identity: ???
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground max-w-xl mx-auto">
          <span className="font-medium text-foreground">The math guarantees it:</span>{" "}
          We verify you have a domain at a real portfolio company, but{" "}
          <span className="text-primary font-medium">you're anonymous even to us.</span>
        </p>
      </section>
    </div>
  );
}
