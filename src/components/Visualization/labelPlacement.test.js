// src/components/Visualization/labelPlacement.test.js
// #RD START
/* eslint-disable no-undef */
import {
  layoutAminoAcidLabels,
  estimateLabelWidth,
  computeRequiredLabelSpace,
  AMINO_LABEL_LANE_GAP,
  AMINO_LABEL_BASE_OFFSET,
  AMINO_LABEL_HORIZONTAL_PADDING
} from './labelPlacement';

// Two labels' intervals overlap if their [left, right] ranges (plus padding)
// intersect; used below to assert same-lane labels never visually collide.
const intervalsOverlap = (a, b, padding = 0) => {
  const aLeft = a.x - a.estimatedWidth / 2;
  const aRight = a.x + a.estimatedWidth / 2;
  const bLeft = b.x - b.estimatedWidth / 2;
  const bRight = b.x + b.estimatedWidth / 2;
  return aLeft < bRight + padding && bLeft < aRight + padding;
};

describe('layoutAminoAcidLabels', () => {
  test('a single label gets lane 0', () => {
    const layout = layoutAminoAcidLabels({
      labels: [{ x: 100, text: 'W137' }]
    });
    expect(layout).toHaveLength(1);
    expect(layout[0].lane).toBe(0);
  });

  test('labels far apart all fit in a single lane', () => {
    const layout = layoutAminoAcidLabels({
      labels: [
        { x: 100, text: 'G19' },
        { x: 500, text: 'K2750' },
        { x: 900, text: 'W137' }
      ]
    });
    expect(layout.every((label) => label.lane === 0)).toBe(true);
  });

  test('overlapping labels are pushed onto multiple lanes', () => {
    // All at nearly the same x - their text intervals must overlap regardless of
    // width, so each needs its own lane.
    const layout = layoutAminoAcidLabels({
      labels: [
        { x: 100, text: 'W137' },
        { x: 102, text: 'W140' },
        { x: 104, text: 'W142' }
      ]
    });
    const lanes = layout.map((label) => label.lane);
    expect(new Set(lanes).size).toBe(3);
  });

  test('handles labels with short and long residue numbers', () => {
    // "G9" is much narrower than "K2750" - the layout must use each label's own
    // estimated width, not a fixed assumed width, when deciding lane placement.
    const shortLabel = { x: 100, text: 'G9' };
    const longLabel = { x: 108, text: 'K2750' };
    const layout = layoutAminoAcidLabels({ labels: [shortLabel, longLabel] });
    expect(layout).toHaveLength(2);
    // The long label is wide enough to still collide with the short one at this
    // distance, so they must land on different lanes.
    expect(layout[0].lane).not.toBe(layout[1].lane);
  });

  test('labels from different amino-acid types participate in one shared layout', () => {
    // G, L, P and K (per the reported example) all landing close together must
    // collide with EACH OTHER, not just within their own letter.
    const layout = layoutAminoAcidLabels({
      labels: [
        { x: 100, text: 'G19', aminoAcid: 'G' },
        { x: 103, text: 'L20', aminoAcid: 'L' },
        { x: 106, text: 'P21', aminoAcid: 'P' },
        { x: 109, text: 'K22', aminoAcid: 'K' }
      ]
    });
    const lanes = layout.map((label) => label.lane);
    // They can't all be lane 0 - at least some must be pushed to other lanes.
    expect(new Set(lanes).size).toBeGreaterThan(1);
  });

  test('above and below layouts are independent of each other', () => {
    const aboveLabels = [
      { x: 100, text: 'W137' },
      { x: 102, text: 'W140' }
    ];
    const belowLabels = [{ x: 100, text: 'K22' }];

    const aboveLayout = layoutAminoAcidLabels({
      labels: aboveLabels,
      side: 'above'
    });
    const belowLayout = layoutAminoAcidLabels({
      labels: belowLabels,
      side: 'below'
    });

    // The below layout must not be affected by however crowded "above" was.
    expect(belowLayout[0].lane).toBe(0);
    expect(belowLayout.every((label) => label.side === 'below')).toBe(true);
    expect(aboveLayout.every((label) => label.side === 'above')).toBe(true);
  });

  test('output is deterministic for identical input', () => {
    const labels = [
      { x: 140, text: 'W140' },
      { x: 100, text: 'G100' },
      { x: 105, text: 'L105' },
      { x: 500, text: 'K500' }
    ];
    const first = layoutAminoAcidLabels({ labels });
    const second = layoutAminoAcidLabels({ labels });
    expect(second).toEqual(first);
  });

  test('no label is ever dropped - output length always matches input length', () => {
    const labels = Array.from({ length: 25 }, (_, i) => ({
      x: 100 + i * 2,
      text: `W${100 + i}`
    }));
    const layout = layoutAminoAcidLabels({ labels });
    expect(layout).toHaveLength(labels.length);
  });

  test('no two labels assigned to the same lane have overlapping intervals', () => {
    // A mix of clustered and spread-out labels of varying text length.
    const labels = [
      { x: 50, text: 'G9' },
      { x: 100, text: 'W101' },
      { x: 103, text: 'W104' },
      { x: 106, text: 'K2750' },
      { x: 109, text: 'L22' },
      { x: 300, text: 'P30' },
      { x: 700, text: 'T7000' }
    ];
    const layout = layoutAminoAcidLabels({
      labels,
      horizontalPadding: AMINO_LABEL_HORIZONTAL_PADDING
    });

    const laneGroups = {};
    layout.forEach((label) => {
      laneGroups[label.lane] = laneGroups[label.lane] || [];
      laneGroups[label.lane].push(label);
    });

    Object.values(laneGroups).forEach((group) => {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          expect(intervalsOverlap(group[i], group[j])).toBe(false);
        }
      }
    });
  });

  test('preserves the original input order in its return value', () => {
    const labels = [
      { x: 500, text: 'K500' },
      { x: 100, text: 'G100' },
      { x: 105, text: 'L105' }
    ];
    const layout = layoutAminoAcidLabels({ labels });
    expect(layout.map((label) => label.text)).toEqual([
      'K500',
      'G100',
      'L105'
    ]);
  });
});

describe('estimateLabelWidth', () => {
  test('longer residue numbers produce a wider estimate than shorter ones', () => {
    expect(estimateLabelWidth('K2750')).toBeGreaterThan(
      estimateLabelWidth('G9')
    );
  });
});

describe('computeRequiredLabelSpace', () => {
  test('an empty layout requires no extra space', () => {
    expect(computeRequiredLabelSpace([])).toBe(0);
  });

  test('grows with the maximum lane used, based on baseOffset + lanes * laneGap', () => {
    const layout = [{ lane: 0 }, { lane: 1 }, { lane: 3 }];
    const space = computeRequiredLabelSpace(layout);
    // maxLane = 3 -> 4 lanes deep
    expect(space).toBeGreaterThanOrEqual(
      AMINO_LABEL_BASE_OFFSET + 4 * AMINO_LABEL_LANE_GAP
    );
  });

  test('a denser layout (more lanes) requires more space than a sparser one', () => {
    const sparse = [{ lane: 0 }, { lane: 1 }];
    const dense = [{ lane: 0 }, { lane: 1 }, { lane: 2 }, { lane: 3 }, { lane: 4 }];
    expect(computeRequiredLabelSpace(dense)).toBeGreaterThan(
      computeRequiredLabelSpace(sparse)
    );
  });
});
// #RD END
