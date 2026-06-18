import type { Experience } from "../content/experiences/Experience";
import experiencesEn from "../content/experiences/en/experiences.json";
import experiencesEs from "../content/experiences/es/experiences.json";
import type { Language } from "../context/LanguageContext";

const experiencesByLanguage = {
  en: experiencesEn,
  es: experiencesEs,
} satisfies Record<Language, typeof experiencesEn>;

export async function getExperiences(language: Language): Promise<Experience[]> {
  const experiences = experiencesByLanguage[language];

  return [...experiences]
    .reverse()
    .map((experience, index) => {
      return {
        id: index,
        title: experience.title,
        company: experience.company,
        start_year: experience.start_year,
        end_year: experience.end_year,
        city: experience.city,
        descriptions: experience.descriptions ?? [],
        tech: experience.tech ?? [],
      } as Experience;
    });
}
