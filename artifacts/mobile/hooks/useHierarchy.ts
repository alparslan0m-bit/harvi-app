import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Lecture, Module, Year } from "@/types";

async function fetchHierarchy(): Promise<Year[]> {
  const { data: years, error: yearsError } = await supabase
    .from("years")
    .select("*")
    .order("order");

  if (yearsError) throw yearsError;

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("*")
    .order("order");

  if (modulesError) throw modulesError;

  const { data: lectures, error: lecturesError } = await supabase
    .from("lectures")
    .select("id, name, external_id, module_id");

  if (lecturesError) throw lecturesError;

  const lecturesByModule: Record<string, Lecture[]> = {};
  for (const lec of lectures) {
    if (!lecturesByModule[lec.module_id]) lecturesByModule[lec.module_id] = [];
    lecturesByModule[lec.module_id].push(lec);
  }

  const modulesByYear: Record<string, Module[]> = {};
  for (const mod of modules) {
    if (!modulesByYear[mod.year_id]) modulesByYear[mod.year_id] = [];
    modulesByYear[mod.year_id].push({
      ...mod,
      lectures: lecturesByModule[mod.id] ?? [],
    });
  }

  return years.map((y: Year) => ({
    ...y,
    modules: modulesByYear[y.id] ?? [],
  }));
}

export function useHierarchy() {
  return useQuery({
    queryKey: ["hierarchy"],
    queryFn: fetchHierarchy,
    staleTime: 1000 * 60 * 10,
  });
}
