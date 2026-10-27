// Scrapes question papers / syllabus links from your college website into Supabase.
// Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... COLLEGE_PAPERS_URL=https://... npm run scrape
// !! The SERVICE ROLE key bypasses RLS. Use it ONLY on your machine / CI. Never put it in VITE_* vars or commit it.
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COLLEGE_PAPERS_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !COLLEGE_PAPERS_URL) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and COLLEGE_PAPERS_URL"); process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---- 1. Fetch the listing page ----
const html = await (await fetch(COLLEGE_PAPERS_URL)).text();
const $ = cheerio.load(html);

// ---- 2. ADAPT THIS to your college site's markup ----
// Collect every PDF link plus the text around it. Inspect the page (right-click → Inspect) and refine selectors.
const found = [];
$("a[href$='.pdf']").each((_, a) => {
  const href = new URL($(a).attr("href"), COLLEGE_PAPERS_URL).href;
  const label = $(a).text().trim() || decodeURIComponent(href.split("/").pop());
  const row = $(a).closest("tr, li").text().replace(/\s+/g, " ");
  found.push({ href, label, context: row });
});
console.log(`Found ${found.length} PDF links`);

// ---- 3. Parse metadata (adapt regexes to your naming style, e.g. "AIML503 DBMS Dec 2024 End Sem.pdf") ----
const parse = (f) => {
  const text = `${f.label} ${f.context}`;
  const code = text.match(/\b[A-Z]{2,5}\d{3,4}\b/)?.[0];
  const year = Number(text.match(/\b(20\d{2})\b/)?.[1]);
  const exam_type = /mid/i.test(text) ? "Mid-Semester" : "End-Semester";
  return code && year ? { code, year, exam_type, source_url: f.href } : null;
};

let ok = 0, skipped = 0;
for (const f of found) {
  const m = parse(f);
  if (!m) { skipped++; console.warn("skip (could not parse):", f.label); continue; }

  const { data: subj } = await db.from("subjects").select("id").eq("code", m.code).maybeSingle();
  if (!subj) { skipped++; console.warn("skip (unknown subject code, add it to `subjects` first):", m.code); continue; }

  // Download the PDF and store it in the private bucket
  const res = await fetch(m.source_url);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `${m.code}/${m.year}-${m.exam_type.replace(/\W+/g, "")}.pdf`;
  const up = await db.storage.from("papers").upload(path, buf, { contentType: "application/pdf", upsert: true });
  if (up.error) { console.warn("upload failed:", path, up.error.message); continue; }

  const { error } = await db.from("papers").upsert({
    subject_id: subj.id, year: m.year, exam_type: m.exam_type, file_path: path, source_url: m.source_url,
    size_mb: +(buf.length / 1048576).toFixed(1), verified: true,
  }, { onConflict: "subject_id,year,exam_type" });
  if (error) console.warn("db error:", error.message); else ok++;
}
console.log(`Imported ${ok}, skipped ${skipped}`);
