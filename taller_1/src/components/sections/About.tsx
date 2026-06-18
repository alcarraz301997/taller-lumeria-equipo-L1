import { useEffect, useState } from "react";
import { Box, Typography, Grid } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GitHubIcon from "@mui/icons-material/GitHub";
import Command from "../Command";
import type { About } from "../../content/about/About";
import { getAbout } from "../../loader/AboutLoader";
import { useLanguage } from "../../context/LanguageContext";

export default function About() {
  const [about, setAbout] = useState<About | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    getAbout(language).then(setAbout);
  }, [language]);

  if (!about) return null;

  return (
    <Box className="sections">
      <Command command="$ cat about.txt" />

      <Typography className="title">▸ {about.title}</Typography>

      <Typography
        className="description"
        sx={{
          mt: 1,
          fontFamily: "monospace",
          color: "#cbd5e1",
          lineHeight: 1.6,
        }}
      >
        {about.description}
      </Typography>

      <Box className="information">
        <Grid container spacing={2}>
          <Grid size={6} sx={{ display: "flex", alignItems: "center", gap: 1}}>
            <PersonIcon className="icon-information" />
            <Typography className="text-information">
              {about.name}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center", gap: 1}}>
            <EmailIcon className="icon-information" />
            <Typography className="text-information">
              {about.email}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center", gap: 1}}>
            <LocationOnIcon className="icon-information" />
            <Typography className="text-information">
              {about.location}
            </Typography>
          </Grid>
          <Grid size={6} sx={{ display: "flex", alignItems: "center", gap: 1}}>
            <GitHubIcon className="icon-information" />
            <Typography className="text-information">
              {about.github}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Box className="whoami">
        <Typography className="text-whoami">{about.whoamiCommand}</Typography>
        <Typography className="description-whoami">{about.whoamiText}</Typography>
      </Box>
    </Box>
  );
}