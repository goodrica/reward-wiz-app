// Shared config for the PointPilot extension.
// The publishable anon key is safe to ship in client-side code — RLS protects data.
const SUPABASE_URL = "https://byrvukoettovsqymvvhq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cnZ1a29ldHRvdnNxeW12dmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Njk4MzEsImV4cCI6MjA5MjE0NTgzMX0.78iipkT5RQecZQp8mqnaXDMzrHsYIgPB6WNTlTJ4Ez8";

// Map detected program slugs to canonical PointPilot program names + types.
// `balanceUrl` is the page we open during a "Refresh all" sweep.
const PROGRAM_REGISTRY = {
  // Hotels
  marriott:   { program: "Marriott Bonvoy",       program_type: "hotel",       balanceUrl: "https://www.marriott.com/loyalty/myAccount/activity.mi" },
  hilton:     { program: "Hilton Honors",         program_type: "hotel",       balanceUrl: "https://www.hilton.com/en/hilton-honors/account/" },
  hyatt:      { program: "World of Hyatt",        program_type: "hotel",       balanceUrl: "https://world.hyatt.com/content/gp/en/member/dashboard.html" },
  ihg:        { program: "IHG One Rewards",       program_type: "hotel",       balanceUrl: "https://www.ihg.com/rewardsclub/us/en/account/dashboard" },
  wyndham:    { program: "Wyndham Rewards",       program_type: "hotel",       balanceUrl: "https://www.wyndhamhotels.com/wyndham-rewards/member/account" },
  choice:     { program: "Choice Privileges",     program_type: "hotel",       balanceUrl: "https://www.choicehotels.com/choice-privileges/account" },

  // Airlines
  delta:      { program: "Delta SkyMiles",        program_type: "airline",     balanceUrl: "https://www.delta.com/profile/accountActivity.action" },
  jetblue:    { program: "JetBlue TrueBlue",      program_type: "airline",     balanceUrl: "https://www.jetblue.com/trueblue/account-summary" },
  united:     { program: "United MileagePlus",    program_type: "airline",     balanceUrl: "https://www.united.com/en/us/account-summary" },
  aa:         { program: "American AAdvantage",   program_type: "airline",     balanceUrl: "https://www.aa.com/loyalty/myaccount/summary" },
  alaska:     { program: "Alaska Mileage Plan",   program_type: "airline",     balanceUrl: "https://www.alaskaair.com/account/mileage-plan/activity" },
  southwest:  { program: "Southwest Rapid Rewards", program_type: "airline",   balanceUrl: "https://www.southwest.com/myaccount" },

  // Transferable currencies
  amex:       { program: "Amex Membership Rewards", program_type: "credit_card", balanceUrl: "https://global.americanexpress.com/rewards/summary" },
  chase:      { program: "Chase Ultimate Rewards",  program_type: "credit_card", balanceUrl: "https://ultimaterewards.chase.com/" },
  capitalone: { program: "Capital One Venture",     program_type: "credit_card", balanceUrl: "https://verified.capitalone.com/auth/signin" },
  citi:       { program: "Citi ThankYou",           program_type: "credit_card", balanceUrl: "https://www.thankyou.com/cms/thankyou/index.htm" },
  bilt:       { program: "Bilt Rewards",            program_type: "credit_card", balanceUrl: "https://www.biltrewards.com/account" },
};

self.PP_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY, PROGRAM_REGISTRY };
