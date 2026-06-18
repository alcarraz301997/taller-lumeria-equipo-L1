import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Grid,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import Command from "../Command";
import type { Skill } from "../../content/skills/Skill";
import { getSkills } from "../../loader/SkillsLoader";
import CodeIcon from "@mui/icons-material/Code";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useLanguage } from "../../context/LanguageContext";

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    getSkills(language).then(setSkills);
  }, [language]);

  const getIcon = (tech: string) => {
    switch (tech) {
      case "Languages":
      case "Lenguajes":
        return <CodeIcon />;

      case "Frameworks":
        return <StorageOutlinedIcon />;

      case "Databases":
      case "Bases de Datos":
        return <DnsOutlinedIcon />;

      case "Cloud & DevOps":
        return <CloudOutlinedIcon />;

      case "Tools":
      case "Herramientas":
        return <RouteOutlinedIcon />;

      case "Security":
      case "Seguridad":
        return <ShieldOutlinedIcon />;

      default:
        return <CodeIcon />;
    }
  };

  return (
    <Box className="sections">
      {/* Texto */}
      <Command command="$ cat skills.json | jq" />

      {/* Skills */}
      <Box className="cards">
        <Grid container spacing={2}>
          {skills.map((s) => (
            <Grid
              key={s.id}
              size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }}
              sx={{ display: "flex" }}
            >
              <Card className="skill-card" sx={{ flex: 1 }}>
                <CardHeader
                  className="skill-header"
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getIcon(s.title)}
                      <Typography className="card-title">{s.title}</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <List
                    sx={{
                      display: "grid",
                      gap: 1,
                    }}
                  >
                    {s.tech.map((t, index) => (
                      <ListItem
                        className="skill-item"
                        key={index}
                        sx={{ py: 0, minHeight: "unset" }}
                      >
                        <ListItemText
                          sx={{ m:0 }}
                          primary={
                            <Typography
                              className="skill-description"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              ▸ {t}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Whoami */}
      <Box className="whoami">
        <Typography className="text-whoami">
          $ echo "Siempre aprendiendo..."
        </Typography>
        <Typography className="description-whoami">
          Actualmente explorando: Spring-Boot, Oracle
        </Typography>
      </Box>
    </Box>
  );
}
