import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import About from "./sections/About";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";
import Experience from "./sections/Experience";

export default function TabMenu() {
  const [value, setValue] = useState("1");

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const renderContent = () => {
    switch (value) {
      case '1':
        return <About/>;

      case '2':
        return <Projects/>;

      case '3':
        return <Skills/>;

      case '4':
        return <Experience/>;

      default:
        return <About/>;
    }
  }

  return (
    <>
      <Box className="tab-principal">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="menu"
          sx={{
            "& .MuiTabs-indicator": {
              display: "none",
            },
          }}
        >
          <Tab
            className="tab-terminal"
            value="1"
            label="about.sh"
            disableRipple
          />
          <Tab
            className="tab-terminal"
            value="2"
            label="projects.sh"
            disableRipple
          />
          <Tab
            className="tab-terminal"
            value="3"
            label="skills.sh"
            disableRipple
          />
          <Tab
            className="tab-terminal"
            value="4"
            label="experience.sh"
            disableRipple
          />
        </Tabs>
      </Box>
      {renderContent()}
    </>
  );
}
