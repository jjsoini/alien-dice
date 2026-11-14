import Box from "@mui/material/Box";

import { DicePreview } from "../previews/DicePreview";
import { Die } from "../types/Die";

import successIcon from "../assets/success.svg";
import facehuggerIcon from "../assets/facehugger.svg";
import initIcon from "../assets/init.svg";
import shuffleIcon from "../assets/shuffle.svg";
import shuffleImage from "../previews/card-shuffle.png";

/**
 * Show single-colour icons on the sidebar and phone panel dice buttons
 * instead of the rendered dice and card previews. Set to false to go back
 * to the previews.
 */
export const USE_BUTTON_ICONS = true;

/** Where the button is: a 40px sidebar button or a phone panel grid cell */
type Variant = "sidebar" | "panel";

/** Icon size within the button */
const ICON_SIZE: Record<Variant, string> = {
  sidebar: "26px",
  panel: "50%",
};

/** Base die: the success symbol, stress die: a facehugger, card: initiative */
function getDieIcon(die: Pick<Die, "style" | "type">) {
  if (die.type === "CARD") {
    return initIcon;
  }
  return die.style === "STRESS" ? facehuggerIcon : successIcon;
}

/**
 * The image on a dice button. The icon takes the text colour, so it follows
 * light and dark mode.
 */
export function DieButtonImage({
  die,
  variant = "sidebar",
}: {
  die: Pick<Die, "style" | "type">;
  variant?: Variant;
}) {
  if (!USE_BUTTON_ICONS) {
    return (
      <DicePreview
        diceStyle={die.style}
        diceType={die.type}
        size={variant === "panel" ? "fill" : undefined}
      />
    );
  }
  return (
    <IconFrame variant={variant}>
      <MaskIcon src={getDieIcon(die)} variant={variant} />
    </IconFrame>
  );
}

/** The image on the Shuffle button */
export function ShuffleButtonImage({ variant = "sidebar" }: { variant?: Variant }) {
  if (!USE_BUTTON_ICONS) {
    return (
      <Box
        component="img"
        src={shuffleImage}
        alt="Shuffle"
        sx={
          variant === "panel"
            ? { width: "100%", height: "100%", display: "block" }
            : { width: "38px", height: "38px", display: "block" }
        }
      />
    );
  }
  return (
    <IconFrame variant={variant}>
      <MaskIcon src={shuffleIcon} variant={variant} />
    </IconFrame>
  );
}

/** Takes the space the preview images took, so the buttons keep their size */
function IconFrame({
  variant,
  children,
}: {
  variant: Variant;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="span"
      className="die-button-image"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(variant === "panel"
          ? // The whole button, which can be flatter than a square
            { width: "100%", height: "100%" }
          : // As big as the sidebar's other icon buttons
            { width: "40px", aspectRatio: "1" }),
      }}
    >
      {children}
    </Box>
  );
}

/** A single-colour SVG drawn as a mask, so it takes the current text colour */
function MaskIcon({ src, variant }: { src: string; variant: Variant }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "block",
        // In the panel half of the button's shorter side (the mask is
        // contained), in the sidebar a fixed square
        width: ICON_SIZE[variant],
        ...(variant === "panel"
          ? { height: ICON_SIZE[variant] }
          : { aspectRatio: "1" }),
        backgroundColor: "currentColor",
        mask: `url("${src}") center / contain no-repeat`,
        WebkitMask: `url("${src}") center / contain no-repeat`,
      }}
    />
  );
}
