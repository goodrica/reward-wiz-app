import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-soft">
            <Plane className="h-4 w-4 -rotate-45" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">PointPilot</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/compare"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            activeProps={{ className: "text-foreground" }}
          >
            New comparison
          </Link>
          {user ? (
            <>
              <Link
                to="/account"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                My rewards
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="rounded-full">
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
