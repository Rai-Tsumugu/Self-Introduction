import identity from "../data/identity.json";
import core from "../data/core.json";
import now from "../data/now.json";
import awards from "../data/awards.json";
import skills from "../data/skills.json";
import works from "../data/works.json";
import pcs from "../data/pcs.json";

export const DATA = {
  identity,
  core,
  now,
  awards,
  languages: skills.languages,
  frameworks: skills.frameworks,
  ai: skills.ai,
  works: works as Array<{
    repo: string;
    name: string;
    desc: string;
    tags: string[];
    live: string | null;
    featured?: boolean;
  }>,
  pcs: pcs as Array<{
    kind: string;
    specs: [string, string][];
    note: string;
  }>,
};
