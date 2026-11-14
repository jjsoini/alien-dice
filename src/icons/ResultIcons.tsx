import Box from "@mui/material/Box";

import successIcon from "../assets/success.svg";
import facehuggerIcon from "../assets/facehugger.svg";

/** Render a single-colour SVG as a mask so it takes the current text colour */
function MaskIcon({ src, size, title }: { src: string; size: string; title: string }) {
  return (
    <Box
      component="span"
      role="img"
      aria-label={title}
      title={title}
      sx={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        backgroundColor: "currentColor",
        mask: `url("${src}") center / contain no-repeat`,
        WebkitMask: `url("${src}") center / contain no-repeat`,
      }}
    />
  );
}

export function SuccessIcon({ size = "1em" }: { size?: string }) {
  return <MaskIcon src={successIcon} size={size} title="Successes" />;
}

export function FacehuggerIcon({ size = "1em" }: { size?: string }) {
  return <MaskIcon src={facehuggerIcon} size={size} title="Panic" />;
}
