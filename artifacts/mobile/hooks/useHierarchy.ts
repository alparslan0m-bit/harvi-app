import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Lecture, Module, Year } from "@/types";

async function fetchHierarchy(): Promise<Year[]> {
  // Try fetching years — without .order() first to avoid "column not found" errors
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
    .select("id, name, external_id, module_id");

  if (lecturesError) throw new Error(`lectures table: ${lecturesError.message} (code: ${lecturesError.code})`);

  const lecturesByModule: Record<string, Lecture[]> = {};
  for (const lec of (lectures ?? [])) {
    if (!lecturesByModule[lec.module_id]) lecturesByModule[lec.module_id] = [];
    lecturesByModule[lec.module_id].push(lec);
  }

  const modulesByYear: Record<string, Module[]> = {};
  for (const mod of (modules ?? [])) {
    if (!modulesByYear[mod.year_id]) modulesByYear[mod.year_id] = [];
    modulesByYear[mod.year_id].push({
      ...mod,
      lectures: lecturesByModule[mod.id] ?? [],
    });
  }

  // Sort client-side if an `order` column exists
  const sortedYears = [...(years ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return sortedYears.map((y) => ({
    ...y,
    modules: (modulesByYear[y.id] ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));
}

export function useHierarchy() {
  return useQuery({
    queryKey: ["hierarchy"],
    queryFn: fetchHierarchy,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
