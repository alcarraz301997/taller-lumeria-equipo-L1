export interface Experience {
  id: number,
  title: string;
  company: string;
  start_year: number;
  end_year?: number;
  city: string;
  descriptions: string[];
  tech: string[];
}