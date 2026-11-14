import { styled } from "@mui/material/styles";

import { DiceStyle } from "../types/DiceStyle";
import { DiceType } from "../types/DiceType";

import * as baseDiePreviews from "./basedie";
import * as stressDiePreviews from "./stressdie";

const previews: Record<DiceStyle, Record<DiceType, string>> = {
  BASE: baseDiePreviews,
  STRESS: stressDiePreviews,
};

type PreviewSize = "small" | "medium" | "large" | "fill";

const PREVIEW_SIZES: Record<PreviewSize, string> = {
  small: "28px",
  medium: "34px",
  large: "38px",
  /** As big as its container */
  fill: "100%",
};

interface PreviewImageProps {
  size?: PreviewSize;
}

const PreviewImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "size",
})<PreviewImageProps>(({ size }) => ({
  width: PREVIEW_SIZES[size ?? "large"],
  height: PREVIEW_SIZES[size ?? "large"],
}));

type DiePreviewProps = {
  diceType: DiceType;
  diceStyle: DiceStyle;
  size?: PreviewSize;
};

export function DicePreview({ diceType, diceStyle, size }: DiePreviewProps) {
  return (
    <PreviewImage
      src={previews[diceStyle][diceType]}
      alt={`${diceStyle} ${diceType} preview`}
      size={size}
    />
  );
}
