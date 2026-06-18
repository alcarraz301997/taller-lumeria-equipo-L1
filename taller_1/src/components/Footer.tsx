import { Box, Typography } from "@mui/material";


export default function Footer() {
  return (
    <Box
      className="footer"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pt: 1
      }}
    >
      <Typography className="footer-text">junior-alcarraz@portfolio:~</Typography>
      <Typography className="footer-text">Sistema operativo: Ubuntu 22.04 LTS</Typography>
    </Box>
  )
}