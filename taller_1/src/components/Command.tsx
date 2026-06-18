import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

type CommandProps = {
  command: string;
  speed?: number;
};

export default function Command({ command, speed = 40 }: CommandProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < command.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + command.charAt(index));
        setIndex(index + 1);
      }, speed);

      return () => clearTimeout(timeoutId);
    }
  }, [index, command, speed]);

  return (
    <Typography>
      <Box component="span" sx={{ color: "var(--color-select-yellow)" }}>
        junior-alcarraz@portfolio
      </Box>
      <Box component="span" sx={{ color: "var(--color-text)" }}>
        :
      </Box>
      <Box component="span" sx={{ color: "var(--color-select-blue)" }}>
        ~
      </Box>
      <Box component="span" sx={{ color: "var(--color-terminal-green)" }}>
        {displayedText}
      </Box>
      <Box component="span" className="cursor" sx={{ color: "var(--color-text)" }}>
        █
      </Box>
    </Typography>
  );
}
