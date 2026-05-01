// Shared config for the PointPilot extension.
// The publishable anon key is safe to ship in client-side code — RLS protects data.
const SUPABASE_URL = "https://byrvukoettovsqymvvhq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cnZ1a29ldHRvdnNxeW12dmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Njk4MzEsImV4cCI6MjA5MjE0NTgzMX0.78iipkT5RQecZQp8mqnaXDMzrHsYIgPB6WNTlTJ4Ez8";

// Map detected program slugs to canonical PointPilot program names + types.
const PROGRAM_REGISTRY = {
  marriott: { program: "Marriott Bonvoy", program_type: "hotel" },
  jetblue: { program: "JetBlue TrueBlue", program_type: "airline" },
  delta: { program: "Delta SkyMiles", program_type: "airline" },
};

self.PP_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY, PROGRAM_REGISTRY };
