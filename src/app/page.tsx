"use client";

import { Button } from "@/components/ui/button";
import {
  HeroBackground,
  PatternSwitcher,
  useHeroPattern,
} from "@/components/hero-backgrounds";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  MailCheck,
  Search,
  Send,
  ArrowRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const accelerators = [
  { name: "Techstars", slug: "techstars" },
  { name: "Antler", slug: "antler" },
];

export default function Home() {
  const { pattern, setPattern } = useHeroPattern();

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
        <HeroBackground pattern={pattern} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">
            founder<span className="text-primary">tea</span> 🍵
          </span>
          <Button variant="ghost" size="sm">
            About
          </Button>
        </div>
      </nav>

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
          <Button size="lg">
            <Search className="mr-2 h-4 w-4" />
            Find a VC
          </Button>
          <Button variant="outline" size="lg">
            <Send className="mr-2 h-4 w-4" />
            Submit a Report
          </Button>
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

        {/* Visual Flow */}
        <div className="mt-16 flex flex-col items-center gap-8">
          {/* Step 1: Verify */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <Card className="w-full sm:w-72">
              <CardContent className="pt-6">
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

            <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
            <div className="h-6 w-px bg-border sm:hidden" />

            {/* Step 2: Transform */}
            <Card className="w-full sm:w-72 border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
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
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground">
                      Cryptographic proof generated
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Email deleted. Only the proof remains.
                </p>
              </CardContent>
            </Card>

            <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
            <div className="h-6 w-px bg-border sm:hidden" />

            {/* Step 3: Publish */}
            <Card className="w-full sm:w-72">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <EyeOff className="h-5 w-5 text-primary" />
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
                    ✓ YC Founder
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Identity: ???
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom explanation */}
          <div className="mt-8 max-w-2xl text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                The math guarantees it:
              </span>{" "}
              We can verify the report came from someone with a domain at a real
              YC portfolio company, but{" "}
              <span className="text-primary font-medium">
                you're anonymous even to us.
              </span>
            </p>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Stats */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary">0</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Reports submitted
            </div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div>
            <div className="text-4xl font-bold text-primary">0</div>
            <div className="mt-1 text-sm text-muted-foreground">
              VCs reviewed
            </div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div>
            <div className="text-4xl font-bold text-primary">2</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Accelerators supported
            </div>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Accelerator Badges */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-xl font-semibold tracking-tight">
          Verified accelerator networks
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Only founders from verified portfolio companies can submit reports.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {accelerators.map((acc) => (
            <Badge
              key={acc.slug}
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              {acc.name}
            </Badge>
          ))}
          <Badge variant="outline" className="px-4 py-2 text-sm">
            + Request yours
          </Badge>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            founder<span className="text-primary">tea</span> 🍵 · Built with
            zero-knowledge proofs
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            🥸
            <a href="#" className="hover:text-foreground transition-colors">
              How we protect you
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>

      {/* Pattern Switcher for testing */}
      <PatternSwitcher currentPattern={pattern} onPatternChange={setPattern} />
    </div>
  );
}
