import { Box } from "@mui/material";
import Header from "./Header";
import TabMenu from "./TabMenu";
import Footer from "./Footer";

export default function Terminal() {

  return (
    <Box
      className="terminal"
    >
      <Header/>
      <TabMenu/>
      <Footer/>
    </Box>
  )
}
