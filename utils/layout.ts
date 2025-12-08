import { GridLayout } from './types';

/**
 * Calculates the optimal grid dimensions to maximize tile area while maintaining aspect ratio.
 */
export function computeOptimalLayout(
  participantCount: number,
  containerWidth: number,
  containerHeight: number,
  targetAspectRatio = 16 / 9
): GridLayout {
  if (participantCount === 0) {
    return { rows: 0, cols: 0, tileWidth: 0, tileHeight: 0 };
  }

  let bestLayout: GridLayout = {
    rows: 1,
    cols: participantCount,
    tileWidth: 0,
    tileHeight: 0,
  };
  let maxArea = 0;

  // Try all possible row configurations from 1 to N
  for (let rows = 1; rows <= participantCount; rows++) {
    const cols = Math.ceil(participantCount / rows);
    
    // Available space per tile (ignoring gaps for calculation simplicity, handled in CSS)
    const availableWidth = containerWidth / cols;
    const availableHeight = containerHeight / rows;

    // Calculate tile dimensions based on aspect ratio
    let tileWidth = availableWidth;
    let tileHeight = tileWidth / targetAspectRatio;

    if (tileHeight > availableHeight) {
      tileHeight = availableHeight;
      tileWidth = tileHeight * targetAspectRatio;
    }

    const area = tileWidth * tileHeight;

    if (area > maxArea) {
      maxArea = area;
      bestLayout = { rows, cols, tileWidth, tileHeight };
    }
  }

  return bestLayout;
}