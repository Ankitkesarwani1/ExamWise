import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";

export type PaperRow = [name: string, code: string, year: string, type: string, size: string, pages: string, filePath: string | null, id: string];
export type SubjectRow = [name: string, code: string, papers: string, progress: number];

// Shown only when Supabase is not configured yet (local demo) — remove once your DB is seeded.
const DEMO_SUBJECTS: SubjectRow[] = [
  ["Database Management Systems", "AIML503", "24 papers", 72], ["Machine Learning", "AIML504", "19 papers", 58],
  ["Computer Networks", "AIML505", "22 papers", 64], ["Design & Analysis of Algorithms", "AIML501", "21 papers", 45],
  ["Software Engineering", "AIML502", "18 papers", 81], ["Web Technologies", "AIML506", "24 papers", 69],
];
const DEMO_PAPERS: PaperRow[] = [
  ["Database Management Systems", "AIML503", "2025", "End-Semester", "2.4 MB", "8 pages", null, "d1"],
  ["Database Management Systems", "AIML503", "2024", "End-Semester", "2.1 MB", "7 pages", null, "d2"],
  ["Machine Learning", "AIML504", "2024", "End-Semester", "1.8 MB", "6 pages", null, "d3"],
  ["Computer Networks", "AIML505", "2025", "Mid-Semester", "1.2 MB", "4 pages", null, "d4"],
];

export function useSubjects(semester = 5) {
  const [rows, setRows] = useState<SubjectRow[]>(supabaseConfigured ? [] : DEMO_SUBJECTS);
  const [loading, setLoading] = useState(supabaseConfigured);
  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.from("subjects").select("code, name, papers(count)").eq("semester", semester).order("code")
      .then(({ data }) => {
        setRows((data ?? []).map((s: any) => [s.name, s.code, `${s.papers?.[0]?.count ?? 0} papers`, 0] as SubjectRow));
        setLoading(false);
      });
  }, [semester]);
  return { rows, loading };
}

export function usePapers() {
  const [rows, setRows] = useState<PaperRow[]>(supabaseConfigured ? [] : DEMO_PAPERS);
  const [loading, setLoading] = useState(supabaseConfigured);
  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.from("papers").select("id, year, exam_type, file_path, pages, size_mb, subjects(name, code)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []).map((p: any) => [
          p.subjects?.name ?? "—", p.subjects?.code ?? "—", String(p.year), p.exam_type,
          p.size_mb ? `${p.size_mb} MB` : "—", p.pages ? `${p.pages} pages` : "—", p.file_path, p.id,
        ] as PaperRow));
        setLoading(false);
      });
  }, []);
  return { rows, loading };
}

/** Time-limited link to a private PDF in the 'papers' bucket. */
export async function paperUrl(filePath: string | null) {
  if (!filePath) return null;
  const { data } = await supabase.storage.from("papers").createSignedUrl(filePath, 60 * 10);
  return data?.signedUrl ?? null;
}
