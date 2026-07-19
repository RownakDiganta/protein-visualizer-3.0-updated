// src/components/Visualization/labelPlacement.js
/* #RD OLD CODE
// Pure, dependency-free helper for staggering amino-acid labels that land close
// together on screen. Extracted out of attachFreeAmAcids() (Visualization/index.js)
// so the placement algorithm can be unit tested in isolation and is shared by both
// the full-length view and the zoomed window view (they call the same function on
// their own already-computed pixel positions).
//
// Root cause this replaces: labels used to be dropped entirely ("showLabel"/
// "isCrowded" flags) when two same-letter residues landed within a fixed pixel gap
// of each other - the connector line/marker still rendered, but the letter and/or
// position number silently disappeared (e.g. Q9H5I5's second W at position 137 in
// the full-length view). Every selected amino-acid occurrence must always produce
// a visible connector, letter, and position number - so instead of hiding labels,
// crowded ones are assigned an increasing vertical "level" (like lanes in a
// calendar/timeline view) and rendered further from the spine.

// Pixel distance below which two labels are considered "too close" and must be
// placed on different levels.
export const AMINO_LABEL_CLUSTER_DISTANCE = 18;

// Level 0 (uncrowded) gets no extra offset beyond the existing base/lane spacing,
// so single, well-spaced labels render exactly as before.
export const AMINO_LABEL_BASE_OFFSET = 0;
// Linear px added per level.
export const AMINO_LABEL_LEVEL_GAP = 26;
// Small quadratic term so deeper levels fan out a bit faster (mildly exponential),
// kept small enough to stay "visually controlled" per the requested design.
export const AMINO_LABEL_LEVEL_GROWTH = 4;
// Highest level the greedy algorithm will create; beyond this, positions are
// clamped to the last level instead of growing without bound.
export const AMINO_LABEL_MAX_LEVEL = 5;
// Hard cap on the computed pixel offset, regardless of level, as a second bound on
// top of AMINO_LABEL_MAX_LEVEL.
export const AMINO_LABEL_MAX_OFFSET = 160;

export const assignLabelLevels = (
  positions,
  clusterDistance = AMINO_LABEL_CLUSTER_DISTANCE,
  maxLevel = AMINO_LABEL_MAX_LEVEL
) => {
  const indexed = positions.map((x, index) => ({ x, index }));
  indexed.sort((a, b) => a.x - b.x || a.index - b.index);

  const lastPlacedAtLevel = [];
  const levelByIndex = new Array(positions.length);

  indexed.forEach(({ x, index }) => {
    let level = 0;
    while (
      level < maxLevel &&
      lastPlacedAtLevel[level] !== undefined &&
      Math.abs(x - lastPlacedAtLevel[level]) < clusterDistance
    ) {
      level += 1;
    }
    lastPlacedAtLevel[level] = x;
    levelByIndex[index] = level;
  });

  return levelByIndex;
};

export const computeLabelLevelOffset = (level) => {
  const raw =
    AMINO_LABEL_BASE_OFFSET +
    AMINO_LABEL_LEVEL_GAP * level +
    AMINO_LABEL_LEVEL_GROWTH * level * level;
  return Math.min(raw, AMINO_LABEL_MAX_OFFSET);
};
#RD END OLD CODE */

// #RD START
// Why the previous version (above) was replaced: it assigned each selected AMINO
// ACID TYPE its own independent "lane" (via a fixed per-selection-slot offset) and
// then, within one letter's own positions, staggered close residues by an
// increasing "level" based purely on residue-number/pixel proximity to the single
// previous label. That produced two problems reported after using it on a dense
// (2752-residue) protein: (1) different selected letters were never considered
// together, so e.g. a G label and an L label could still land in the same visual
// row and overlap each other's text; (2) "too close" was judged by a fixed pixel
// gap rather than actual label text width, so labels sharing a level could still
// visually collide, and the level-based y-growth created tall empty gaps in some
// spots while labels still touched in others.
//
// This version replaces per-letter leveling with true collision-aware lane
// packing across ALL selected amino acids on the same side (above or below the
// spine) at once: every label's rendered text width is estimated, treated as a
// horizontal interval around its x position, and packed into the first lane whose
// last-placed interval doesn't overlap it (a classic greedy interval/lane-packing
// algorithm, the same kind used for stacking overlapping calendar events). Labels
// are never dropped - a cluster too dense for existing lanes always gets a new
// lane instead of being hidden, filtered, or truncated.

// Nominal font size (px) used only for estimating label width - the actual letter
// and position-number text use two real CSS font sizes (see index.scss), but a
// single representative size is enough for the width heuristic below.
export const AMINO_LABEL_FONT_SIZE = 14;
// Average glyph width as a fraction of font size for the bold sans-serif label
// text; used to estimate a label's rendered width from its character count
// without needing a canvas/DOM text-measurement (which isn't reliably available
// in the jsdom test environment) - see estimateLabelWidth().
const AMINO_LABEL_AVG_CHAR_WIDTH_RATIO = 0.62;
// Minimum horizontal gap required between two labels' estimated intervals before
// they're considered non-overlapping and allowed to share a lane.
export const AMINO_LABEL_HORIZONTAL_PADDING = 6;
// Vertical distance between adjacent lanes - noticeably larger than the old
// per-level growth, and constant (linear) rather than growing per lane, per the
// requested "font size + 8 to 14px" guidance (14 + 14 = 28).
export const AMINO_LABEL_LANE_GAP = 28;
// Distance from the spine to lane 0, matching where labels sat before this change
// (bond end was previously SULFIDE_POS +/- 50) so the common, uncrowded case looks
// the same as before.
export const AMINO_LABEL_BASE_OFFSET = 50;
// Extra breathing room reserved beyond the last lane when sizing the SVG, so the
// outermost label's own text/halo isn't flush against the edge.
export const AMINO_LABEL_SAFETY_BUFFER = 20;
// Soft, non-enforced reference point: lane counts at or under this are the
// "typical" case. Real lane counts are never capped or truncated at this value -
// it only triggers a console warning so unusually dense proteins are noticeable
// during development; the SVG is still expanded to fit however many lanes are
// actually required.
export const AMINO_LABEL_MAX_VISIBLE_LANES = 12;

/**
 * Estimate a label's rendered pixel width from its character count. Deterministic
 * and environment-independent (no canvas/DOM dependency), which also makes it
 * reliably unit-testable; CanvasRenderingContext2D.measureText would be more
 * precise but isn't reliably available under jsdom without an extra canvas-mock
 * dependency this project doesn't otherwise need.
 *
 * @param {string} text - the full label text, e.g. "W137", "K2750".
 * @param {number} fontSize
 * @returns {number}
 */
export const estimateLabelWidth = (text, fontSize = AMINO_LABEL_FONT_SIZE) =>
  text.length * fontSize * AMINO_LABEL_AVG_CHAR_WIDTH_RATIO;

/**
 * Collision-aware lane packing for a set of labels on ONE side (above or below
 * the spine). Every input label is always returned (never dropped): labels are
 * sorted by x (tie-broken by their original array index, for determinism), then
 * greedily assigned to the first lane whose rightmost occupied edge is far enough
 * to the left of the new label's left edge; a new lane is created only when no
 * existing lane has room.
 *
 * @param {Object} params
 * @param {Array<{x: number, text: string}>} params.labels - arbitrary extra
 *   fields (color, aminoAcid, position, ...) are preserved on the output.
 * @param {'above'|'below'} [params.side] - not used by the packing math itself
 *   (each call already only receives one side's labels), passed through onto the
 *   output for the caller's convenience.
 * @param {number} [params.fontSize]
 * @param {number} [params.horizontalPadding]
 * @param {number} [params.laneGap]
 * @param {number} [params.baseOffset]
 * @returns {Array} each input label plus { lane, y, estimatedWidth }, in the same
 *   order the labels were supplied in.
 */
export const layoutAminoAcidLabels = ({
  labels,
  side,
  fontSize = AMINO_LABEL_FONT_SIZE,
  horizontalPadding = AMINO_LABEL_HORIZONTAL_PADDING,
  laneGap = AMINO_LABEL_LANE_GAP,
  baseOffset = AMINO_LABEL_BASE_OFFSET
}) => {
  const indexed = labels.map((label, index) => ({ ...label, _index: index }));
  // Sort by rendered x-coordinate; ties broken by original index (stable and
  // deterministic regardless of which amino acid contributed which label), so the
  // same protein + selection always produces the same layout.
  indexed.sort((a, b) => a.x - b.x || a._index - b._index);

  // laneRightEdge[lane] = right edge (x + halfWidth) of the last label placed in
  // that lane.
  const laneRightEdge = [];

  const placed = indexed.map((label) => {
    const estimatedWidth = estimateLabelWidth(label.text, fontSize);
    const halfWidth = estimatedWidth / 2;
    const left = label.x - halfWidth;
    const right = label.x + halfWidth;

    let lane = 0;
    while (
      laneRightEdge[lane] !== undefined &&
      left <= laneRightEdge[lane] + horizontalPadding
    ) {
      lane += 1;
    }
    laneRightEdge[lane] = right;

    return {
      ...label,
      side,
      lane,
      y: baseOffset + lane * laneGap,
      estimatedWidth
    };
  });

  // Restore original input order (packing needed x-sorted order, but callers
  // zipping this back with other per-label state expect the input order back)
  // and drop the internal sort key.
  placed.sort((a, b) => a._index - b._index);
  return placed.map(({ _index, ...rest }) => rest);
};

/**
 * How much vertical pixel space (from the spine outward) a side's layout needs so
 * its farthest lane isn't clipped - used to grow the SVG/container dynamically
 * instead of assuming a fixed small number of lanes.
 *
 * @param {Array<{lane: number}>} layout - output of layoutAminoAcidLabels().
 * @param {Object} [config]
 * @returns {number} required pixels from the spine outward; 0 if layout is empty.
 */
export const computeRequiredLabelSpace = (
  layout,
  {
    laneGap = AMINO_LABEL_LANE_GAP,
    baseOffset = AMINO_LABEL_BASE_OFFSET,
    buffer = AMINO_LABEL_SAFETY_BUFFER
  } = {}
) => {
  const maxLane = layout.reduce((max, label) => Math.max(max, label.lane), -1);
  if (maxLane < 0) {
    return 0;
  }
  return baseOffset + (maxLane + 1) * laneGap + buffer;
};
// #RD END
