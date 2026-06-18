import { Box, Typography } from "@mui/material";

export default function Header() {
  return (
    <Box
      className="windows"
    >
      <Typography className="command">
        <span style={{ color: "var(--color-text-windows-code)" }}>&gt;_ </span>
        <span>junior-alcarraz@portfolio:~</span>
      </Typography>
    </Box>
  );
}
