import { useState } from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { CreatorIcon } from "../icons/CreatorIcon";
import { getAccentForegroundColor } from "../helpers/accent";

const PATREON_URL = "https://patreon.com/pulpscape";

/**
 * The creator's support link, in the desktop sidebar only. The extension runs
 * in an iframe, so links open in a new tab.
 */
export function SupportCreator() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Support me" placement="right" disableInteractive>
        <IconButton
          aria-label="Support me"
          id="support-button"
          aria-controls={open ? "support-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(event.currentTarget)
          }
        >
          <CreatorIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="support-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ "aria-labelledby": "support-button" }}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
      >
        <Stack width="240px" px={1} gap={0.5}>
          <SupportMessage />
        </Stack>
      </Menu>
    </>
  );
}

function SupportMessage() {
  return (
    <Stack alignItems="center" gap={2} p={1}>
      <Stack pt={1} direction="row" spacing={1}>
        <CreatorIcon sx={{ width: "32px", height: "32px" }} />
        <Typography variant="caption" textAlign="left">
          <b>Hi!</b> I make maps and assets for modern TTRPGs. Check out{" "}
          <Link
            href={PATREON_URL}
            target="_blank"
            rel="noopener noreferrer"
            color={getAccentForegroundColor}
          >
            patreon.com/pulpscape
          </Link>{" "}
          for more!
        </Typography>
      </Stack>
      <Link href={PATREON_URL} target="_blank" rel="noopener noreferrer">
        <Box
          component="img"
          src="./thumb.jpg"
          alt="Pulpscape on Patreon"
          sx={{ display: "block", borderRadius: "8px", width: "100%" }}
        />
      </Link>
    </Stack>
  );
}
