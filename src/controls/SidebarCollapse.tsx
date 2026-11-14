import Collapse from "@mui/material/Collapse";
import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";

/**
 * Smoothly hide or show a sidebar button: it fades while the space it takes
 * closes up. The padding stands in for the sidebar's gap, so there's no jump
 * when the button is removed.
 */
export function SidebarCollapse({
  in: show,
  children,
}: {
  in: boolean;
  children: React.ReactElement;
}) {
  return (
    <Collapse in={show} unmountOnExit appear={false}>
      <Fade in={show} appear={false}>
        <Box py={0.5} display="flex" justifyContent="center">
          {children}
        </Box>
      </Fade>
    </Collapse>
  );
}
