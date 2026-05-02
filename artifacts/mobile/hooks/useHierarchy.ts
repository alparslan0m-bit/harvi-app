import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Lecture, Module, Year } from "@/types";

// Common column name variations for module foreign key in lectures table
const MODULE_FK_CANDIDATES = [
  "module_id",
  "subject_id",
  "topic_id",
  "section_id",
  "chapter_id",
  "unit_id",
  "course_id",
  "parent_id",
];

// Common column name variations for year foreign key in modules table
const YEAR_FK_CANDIDATES = [
  "year_id",
  "course_id",
  "level_id",
  "stage_id",
  "parent_id",
  "category_id",
];

function detectForeignKey(row: Record<string, unknown>, candidates: string[]): string | null {
  // Prefer exact candidate matches first
  for (const col of candidates) {
    if (col in row) return col;
  }
  // Fallback: any column ending in _id that isn't "id"
  const idCols = Object.keys(row).filter((k) => k !== "id" && k.endsWith("_id"));
  return idCols[0] ?? null;
}

async function fetchHierarchy(): Promise<Year[]> {
  const { data: years, error: yearsError } = await supabase
    .from("years")
    .select("*");
  if (yearsError) throw new Error(`years table: ${yearsError.message} (code: ${yearsError.code})`);

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("*");
  if (modulesError) throw new Error(`modules table: ${modulesError.message} (code: ${modulesError.code})`);

  const { data: lectures, error: lecturesError } = await supabase
    .from("lectures")
    .select("*");
  if (lecturesError) throw new Error(`lectures table: ${lecturesError.message} (code: ${lecturesError.code})`);

  // Auto-detect the FK column names from the first row of each table
  const firstModule = modules?.[0] as Record<string, unknown> | undefined;
  const firstLecture = lectures?.[0] as Record<string, unknown> | undefined;

  const yearFk = firstModule ? detectForeignKey(firstModule, YEAR_FK_CANDIDATES) : "year_id";
  const moduleFk = firstLecture ? detectForeignKey(firstLecture, MODULE_FK_CANDIDATES) : "module_id";

  // Build lookup maps
  const lecturesByModule: Record<string, Lecture[]> = {};
  for (const lec of (lectures ?? [])) {
    const row = lec as Record<string, unknown>;
    const moduleKey = String(row[moduleFk ?? "module_id"] ?? "");
    if (!lecturesByModule[moduleKey]) lecturesByModule[moduleKey] = [];
    lecturesByModule[moduleKey].push({
      id: String(row.id ?? ""),
      name: String(row.name ?? row.title ?? ""),
      external_id: String(row.external_id ?? row.id ?? ""),
      module_id: moduleKey,
    });
  }

  const modulesByYear: Record<string, Module[]> = {};
  for (const mod of (modules ?? [])) {
    const row = mod as Record<string, unknown>;
    const yearKey = String(row[yearFk ?? "year_id"] ?? "");
    if (!modulesByYear[yearKey]) modulesByYear[yearKey] = [];
    modulesByYear[yearKey].push({
      id: String(row.id ?? ""),
      name: String(row.name ?? row.title ?? ""),
      year_id: yearKey,
      order: Number(row.order ?? row.sort_order ?? 0),
      lectures: lecturesByModule[String(row.id ?? "")] ?? [],
    });
  }

  const sortedYears = [...(years ?? [])].sort(
    (a, b) => (Number((a as Record<string, unknown>).order ?? 0)) - (Number((b as Record<string, unknown>).order ?? 0))
  );

  return sortedYears.map((y) => {
    const row = y as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      name: String(row.name ?? row.title ?? ""),
      order: Number(row.order ?? 0),
      modules: (modulesByYear[String(row.id ?? "")] ?? []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    };
  });
}

export function useHierarchy() {
  return useQuery({
    queryKey: ["hierarchy"],
    queryFn: fetchHierarchy,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
