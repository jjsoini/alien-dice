import React from "react";
import ReactDOM from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";
import MuiGlobalStyles from "@mui/material/GlobalStyles";

import { App } from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "./fonts/fonts.css";
import { GlobalStyles } from "./GlobalStyles";
import { PluginThemeProvider } from "./plugin/PluginThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PluginThemeProvider>
      <CssBaseline />
      <GlobalStyles />
      {/* The main window has our own background instead of OBR's panel
          colour. The trays popover stays transparent around its trays. */}
      <MuiGlobalStyles
        styles={(theme) => ({
          body: { backgroundColor: theme.palette.background.default },
        })}
      />
      <App />
    </PluginThemeProvider>
  </React.StrictMode>
);
