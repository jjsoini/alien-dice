import backImage from "./card-initiative-back.png";
import { getCardFileName } from "./cards";

/** Card face images by file name, e.g. "card-7-initiative" */
const faceImages: Record<string, string> = {};
const faceModules = import.meta.glob("./faces-initiative/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;
for (const [path, url] of Object.entries(faceModules)) {
  const name = path.split("/").pop()!.replace(".png", "");
  faceImages[name] = url;
}

/** Image of a card's face, see `faces-initiative/` */
export function getCardImage(card: number): string | undefined {
  return faceImages[getCardFileName(card)];
}

/** Image of a card's back */
export function getCardBackImage(_card?: number): string {
  return backImage;
}

/** Card backs, for preloading */
export const cardBackImages = [backImage];
