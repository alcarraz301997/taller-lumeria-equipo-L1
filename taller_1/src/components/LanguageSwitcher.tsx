import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useLanguage, type Language } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newLang: Language | null
  ) => {
    if (newLang) {
      setLanguage(newLang);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        background: "var(--color-menu)",
        border: "1px solid var(--color-border)",
        borderRadius: 2,
        p: 0.5,
      }}
    >
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleChange}
        size="small"
      >
        <ToggleButton value="en">
          <Typography
            className="text-toggle"
            sx={{
              color: language === 'en'
                ? "var(--color-select-yellow)"
                : "var(--color-whoami)",
            }}
          >
            EN
          </Typography>
        </ToggleButton>
        <ToggleButton value="es">
          <Typography
            className="text-toggle"
            sx={{
              color: language === 'es'
              ? "var(--color-select-yellow)"
              : "var(--color-whoami)"
            }}
          >
            ES
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
