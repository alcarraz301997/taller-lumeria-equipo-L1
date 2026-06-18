import type { Skill } from "../content/skills/Skill";
import skillsEn from "../content/skills/en/skills.json";
import skillsEs from "../content/skills/es/skills.json";
import type { Language } from "../context/LanguageContext";

const skillsByLanguage = {
  en: skillsEn,
  es: skillsEs,
} satisfies Record<Language, typeof skillsEn>;

export async function getSkills(language: Language): Promise<Skill[]> {
  const skills = skillsByLanguage[language];

  return skills.map((skill, index) => {
    return {
      id: index,
      title: skill.title,
      tech: skill.tech ?? [],
    } as Skill;
  });
}
