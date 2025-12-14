import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Shield, MessageSquare, Search, Send } from "lucide-react";

const accelerators = [
  { name: "Techstars", slug: "techstars" },
  { name: "Antler", slug: "antler" },
];

const steps = [
  {
    icon: Mail,
    title: "Verify your email",
    description: "Use your company email to prove you're part of an accelerator portfolio.",
  },
  {
    icon: Shield,
    title: "Generate your credential",
    description: "We create a cryptographic identity that can never be linked back to you.",
  },
  {
    icon: MessageSquare,
    title: "Share anonymously",
    description: "Submit reports that are mathematically proven to be untraceable.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">
            founder<span className="text-primary">tea</span>
          </span>
          <Button variant="ghost" size="sm">
            About
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Anonymous VC reviews from{" "}
          <span className="text-primary">verified founders</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Find out the founder tea on VCs, or submit cryptographically anonymized feedback to help out other founders.
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

      <Separator className="mx-auto max-w-5xl" />

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Zero-knowledge proofs let you prove you're a verified founder without revealing who you are.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute right-4 top-4 text-5xl font-bold text-muted/30">
                  {i + 1}
                </div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* Stats */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary">0</div>
            <div className="mt-1 text-sm text-muted-foreground">Reports submitted</div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div>
            <div className="text-4xl font-bold text-primary">0</div>
            <div className="mt-1 text-sm text-muted-foreground">VCs reviewed</div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div>
            <div className="text-4xl font-bold text-primary">2</div>
            <div className="mt-1 text-sm text-muted-foreground">Accelerators supported</div>
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
            <Badge key={acc.slug} variant="secondary" className="px-4 py-2 text-sm">
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
            founder<span className="text-primary">tea</span> · Built with zero-knowledge proofs
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">How we protect you</a>
            <a href="#" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
