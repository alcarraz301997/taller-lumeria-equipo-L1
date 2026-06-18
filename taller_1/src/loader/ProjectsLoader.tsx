import type { Project } from "../content/projects/Project";
import projectsEn from "../content/projects/en/projects.json";
import projectsEs from "../content/projects/es/projects.json";
import type { Language } from "../context/LanguageContext";

const projectsByLanguage = {
  en: projectsEn,
  es: projectsEs,
} satisfies Record<Language, typeof projectsEn>;

export async function getProjects(language: Language): Promise<Project[]> {
  const projects = projectsByLanguage[language];

  return projects.map((project, index) => {
    return {
      id: index,
      title: project.title,
      url: project.url,
      github: project.github,
      tech: project.tech ?? [],
      description: project.description.trim(),
    } as Project;
  });
}
