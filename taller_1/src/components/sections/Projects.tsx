import { Box, Card, CardHeader, CardContent, Typography, IconButton } from "@mui/material";
import Command from "../Command";
import { useEffect, useState } from "react";
import type { Project } from "../../content/projects/Project";
import { getProjects } from "../../loader/ProjectsLoader";
import GitHubIcon from '@mui/icons-material/GitHub';
import LaunchIcon from '@mui/icons-material/Launch';
import CodeIcon from '@mui/icons-material/Code';
import { useLanguage } from "../../context/LanguageContext";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    getProjects(language).then(setProjects);
  }, [language])

  return (
    <Box className="sections">

      {/* Texto */}
      <Command command="$ ls -la ./projects" />

      {/* Proyectos */}
      <Box className="cards">
        {projects.map((p) => (
          <Card
            className="card"
            key={p.id}
          >
            <CardHeader
              className="card-header"
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CodeIcon />
                  <Typography className="card-title">{p.title}</Typography>
                </Box>
              }
              action={
                <Box>
                  <IconButton
                    className="icon-button"
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubIcon />
                  </IconButton>
                  <IconButton
                    className="icon-button"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LaunchIcon />
                  </IconButton>
                </Box>
              }
            />

            <CardContent>
              <Typography className="card-description">{p.description}</Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {p.tech.map((t) => (
                  <Box className="box-projects" key={t}>{t}</Box>
                ))}
              </Box>
            </CardContent>

          </Card>
        ))}
      </Box>

      {/* Contador de proyectos */}
      <Box>
        <Typography className="footer-projects">
          $ total {projects.length} {language === "es" ? "proyectos" : "projects"}
        </Typography>
      </Box>
    </Box>
  );
}
