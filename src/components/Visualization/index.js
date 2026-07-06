// src/components/Visualization/index.js
// Core D3 rendering engine: draws the full protein "spine" SVG (domains, disulfide
// bonds, glycosylation, phosphosites, free residues) plus the zoomable window view.
import React, { useRef, useEffect, useState } from 'react';
import { select, scaleLinear, selectAll } from 'd3';
import PropTypes from 'prop-types';
import constants from '../../static/constants';
import Legend from '../Legend';
import ProteinWindow from './ProteinWindow';

import './index.scss';

const CIRCLE_RADIUS = 5;
const SPINE_HEIGHT = 30;

const { COLOR_PALLETE } = constants;
// #RD START
const {
  AMINO_ACID_RENDER_STYLE,
  DEFAULT_AMINO_ACID_RENDER_STYLE,
  MAX_SELECTED_AMINO_ACIDS
} = constants;
// #RD END

const calculateBondRanking = (array) => {
  const pairRanking = [];
  array.forEach((pair, idx) => {
    let total = 1;
    const [currLow, currHigh] = pair;
    for (let i = 0; i < array.length; i += 1) {
      if (idx !== i) {
        const [arrLow, arrHigh] = array[i];
        if (currLow < arrLow && currHigh > arrHigh) {
          total += 1;
        }
        if (currLow < arrLow && currHigh > arrLow && currHigh < arrHigh) {
          total += 0.55;
        }
        if (currLow > arrLow && currLow < arrHigh && currHigh > arrHigh) {
          total += 0.75;
        }
      }
    }
    pairRanking.push(total);
  });
  return pairRanking;
};

function Visualization(props) {
  const {
    height,
    width: initialWidth,
    currSelection,
    isLegendOpen,
    initialOptions,
    scaleFactor,
    fullScale,
    setFullScaleDisabled
  } = props;

  const {
    disulfideBonds,
    glycoslation,
    o_glcnac,
    o_glc,
    glycation,
    phosphoserine,
    phosphothreonine,
    phosphotyrosine,
    length: proteinLength,
    outsideDomain,
    insideDomain,
    sequons,
    cysteines,
    // #RD OLD CODE
    // freeS,
    // freeT,
    // freeK,
    // freeW,
    // #RD END OLD CODE
    // #RD START
    aminoAcids = {},
    // #RD END
    species
  } = initialOptions[currSelection];

  console.log('Visualization -> proteinLength', proteinLength);

  const svgRef = useRef(null);
  const windowSvgRef = useRef(null);
  const [windowPos, setWindowPos] = useState({ start: 0, end: proteinLength });
  const { start: windowStart, end: windowEnd } = windowPos;
  const [windowView, setWindowView] = useState(false);
  const [showGlyco, setShowGlyco] = useState(true);
  const [showOGalNAc, setShowOGalNAc] = useState(true);
  const [showOGlc, setShowOGlc] = useState(true);
  const [showGlycation, setShowGlycation] = useState(true);
  const [showPhosphoserine, setShowPhosphoserine] = useState(true);
  const [showPhosphothreonine, setShowPhosphothreonine] = useState(true);
  const [showPhosphotyrosine, setShowPhosphotyrosine] = useState(true);
  const [showDisulfide, setShowDisulfide] = useState(true);
  const [showOutsideDomain, setShowOutisde] = useState(true);
  const [showInsideDomain, setShowInside] = useState(true);
  const [showSequons, setShowSequons] = useState(false);
  const [showCysteines, setShowCysteines] = useState(false);
  // #RD OLD CODE
  // const [showFreeS, setShowFreeS] = useState(false);
  // const [showFreeT, setShowFreeT] = useState(false);
  // const [showFreeK, setShowFreeK] = useState(false);
  // const [showFreeW, setShowFreeW] = useState(false);
  // #RD END OLD CODE
  // #RD START
  const [selectedAminoAcids, setSelectedAminoAcids] = useState([]);

  const toggleAminoAcidSelection = (aminoAcid) => {
    setSelectedAminoAcids((prev) => {
      if (prev.includes(aminoAcid)) {
        return prev.filter((el) => el !== aminoAcid);
      }
      if (prev.length >= MAX_SELECTED_AMINO_ACIDS) {
        return prev;
      }
      return [...prev, aminoAcid];
    });
  };
  // #RD END

  const scaleVisualization = scaleFactor !== 1;
  const scaledWidth = initialWidth * scaleFactor;

  const margin = {
    top: height / 15,
    right: initialWidth / 15,
    bottom: height / 15,
    left: initialWidth / 10
  };
  const innerHeight = height - margin.top - margin.bottom;
  const SULFIDE_POS = innerHeight / 2 + SPINE_HEIGHT / 2;
  const SULFIDE_BOND_LENGTH = 40;
  const SULFIDE_ATOM_OFFSET = 20;
  const GLYCO_STEM_LENGTH = 60;
  const GLYCO_LINK_LENGTH = 10;
  const SPINE_START_POS = 30;
  const WINDOW_SPINE_START_POS = 0.1 * margin.left;

  const SPINE_WIDTH = scaledWidth - scaleFactor * 2 * margin.left;

  const WINDOW_SPINE_WIDTH = initialWidth - 2 * margin.left;

  const glycoBonds = initialOptions[currSelection].disulfideBonds.map(
    (pair) => {
      const bondPos = [];
      const atoms = pair.split(' ');
      atoms.forEach((el) => {
        const atom = parseInt(el, 10);
        bondPos.push(atom);
      });
      return bondPos;
    }
  );

  const updateWindowStart = (newStart) => {
    setWindowPos({ ...windowPos, start: parseInt(newStart, 10) });
  };

  const updateWindowEnd = (newEnd) => {
    setWindowPos({ ...windowPos, end: parseInt(newEnd, 10) });
  };

  if (proteinLength < 3000) {
    setFullScaleDisabled(true);
  } else {
    setFullScaleDisabled(false);
  }
  const pairRanking = calculateBondRanking(glycoBonds);
  const makePairRankArray = (array) => {
    let arr = [];
    array.forEach((pair, idx) => {
      let entry = {
        bond: pair,
        index: idx,
        rank: pairRanking[idx]
      };
      arr.push(entry);
    });
    return arr;
  };
  const pairRankArray = makePairRankArray(glycoBonds);

  const xScale = scaleLinear()
    .domain([0, proteinLength])
    .range([
      fullScale ? 0 : SPINE_START_POS,
      fullScale ? proteinLength : SPINE_WIDTH
    ]);

  const windowScale = scaleLinear()
    .domain([windowStart, windowEnd])
    .range([
      fullScale ? 0 : WINDOW_SPINE_START_POS,
      fullScale ? proteinLength : WINDOW_SPINE_WIDTH
    ]);

  const toggleWindowView = () => {
    setWindowView(!windowView);
  };

  const bondHeight = (bond) => {
    const [x, y] = bond;
    let rightIdx = 0;
    for (let i = 0; i < pairRankArray.length; i += 1) {
      const [arrX, arrY] = pairRankArray[i].bond;
      if (x == arrX && y == arrY) {
        rightIdx = i;
        break;
      }
    }
    const bHeight = SULFIDE_POS + SULFIDE_BOND_LENGTH * pairRanking[rightIdx];
    return bHeight;
  };

  const attachGlycoBonds = (g, isWindowView) => {
    let gBonds = glycoslation.map((el) => parseInt(el, 10));
    if (isWindowView) {
      gBonds = gBonds.filter(
        (bond) => bond >= windowStart && bond <= windowEnd
      );
    }

    // const scale = isWindowView ? windowScale : xScale;
    gBonds.forEach((el) => {
      let bondProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let bondPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + bondProportion * SPINE_WIDTH;

      const atom = g.append('text');

      atom
        .attr('dx', bondPos - 8)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 5.5)
        .text(() => `N`)
        .attr('class', 'glyco-labels');

      const pos = g.append('text');
      pos
        .attr('dx', bondPos + 4)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 5.0)
        .text(() => `${el}`)
        .attr('class', 'glyco-labels--pos');

      const stem = g.append('line');
      stem
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - 10)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('stroke', 'black');

      const mol1 = g.append('rect');
      mol1
        .attr('width', 14)
        .attr('height', 14)
        .attr('x', bondPos - 7)
        .attr('y', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('fill', 'blue')
        .style('stroke', 'black');

      const link = g.append('line');
      link
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 2)
        .style('stroke', 'black');

      const link2 = g.append('line');
      link2
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 2)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 3.5)
        .style('stroke', 'black');

      const mol2 = g.append('rect');
      mol2
        .attr('width', 14)
        .attr('height', 14)
        .attr('x', bondPos - 7)
        .attr('y', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 2)
        .style('fill', 'blue')
        .style('stroke', 'black');

      const mol3 = g.append('circle');
      mol3
        .attr('cx', bondPos)
        .attr('cy', SULFIDE_POS - GLYCO_STEM_LENGTH - GLYCO_LINK_LENGTH * 3.5)
        .attr('r', CIRCLE_RADIUS + 3)
        .style('stroke', 'black')
        .style('fill', 'green');
    });
  };

  const attachOGalNAcBonds = (g, isWindowView) => {
    let oBonds = o_glcnac.map((el) => parseInt(el, 10));
    if (isWindowView) {
      oBonds = oBonds.filter(
        (bond) => bond >= windowStart && bond <= windowEnd
      );
    }
    oBonds.forEach((el) => {
      let bondProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let bondPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + bondProportion * SPINE_WIDTH;

      const atom = g.append('text');

      atom
        .attr('dx', bondPos - 8)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.15)
        .text(() => `O`)
        .attr('class', 'glyco-labels');

      const pos = g.append('text');
      pos
        .attr('dx', bondPos + 4)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.1)
        .text(() => `${el}`)
        .attr('class', 'glyco-labels--pos');

      const stem = g.append('line');
      stem
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - 10)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('stroke', 'black');

      const mol = g.append('rect');
      mol
        .attr('width', 14)
        .attr('height', 14)
        .attr('x', bondPos - 7)
        .attr('y', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('stroke', 'black')
        .style('fill', 'yellow');
    });
  };

  const attachOGlcBonds = (g, isWindowView) => {
    let oBonds = o_glc.map((el) => parseInt(el, 10));
    if (isWindowView) {
      oBonds = oBonds.filter(
        (bond) => bond >= windowStart && bond <= windowEnd
      );
    }
    oBonds.forEach((el) => {
      let bondProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let bondPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + bondProportion * SPINE_WIDTH;

      const atom = g.append('text');

      atom
        .attr('dx', bondPos - 8)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.15)
        .text(() => `O`)
        .attr('class', 'glyco-labels');

      const pos = g.append('text');
      pos
        .attr('dx', bondPos + 4)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.1)
        .text(() => `${el}`)
        .attr('class', 'glyco-labels--pos');

      const stem = g.append('line');
      stem
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - 10)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('stroke', 'black');

      const mol = g.append('circle');
      mol
        .attr('cx', bondPos)
        .attr('cy', SULFIDE_POS - GLYCO_STEM_LENGTH + CIRCLE_RADIUS)
        .attr('r', CIRCLE_RADIUS + 3)
        .style('stroke', 'black')
        .style('fill', 'blue');
    });
  };

  const attachPhosphorylation = (g, isWindowView, phosphorylation, color) => {
    let phosphos = phosphorylation.map((el) => parseInt(el, 10));
    if (isWindowView) {
      phosphos = phosphos.filter(
        (phospho) => phospho >= windowStart && phospho <= windowEnd
      );
    }

    phosphos.forEach((el) => {
      let phosphoProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let phosphoPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + phosphoProportion * SPINE_WIDTH;
      const pos = g.append('text');
      pos
        .attr('dx', phosphoPos + 4)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 0.8 * 0.5)
        .text(() => `${el}`)
        .attr('class', 'glyco-labels--pos');

      const stem = g.append('line');
      stem
        .attr('x1', phosphoPos)
        .attr('y1', SULFIDE_POS - 10)
        .attr('x2', phosphoPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH * 0.8)
        .style('stroke', 'black');

      const mol = g.append('circle');
      mol
        .attr('cx', phosphoPos)
        .attr('cy', SULFIDE_POS - GLYCO_STEM_LENGTH * 0.8 + CIRCLE_RADIUS)
        .attr('r', CIRCLE_RADIUS + 5)
        .style('fill', `${color}`);

      const atom = g.append('text');
      atom
        .attr('dx', phosphoPos - 5)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 0.8 + CIRCLE_RADIUS + 6)
        .text(() => `P`)
        .attr('class', 'glyco-labels');
    });
  };

  const attachGlycationBonds = (g, isWindowView) => {
    let nBonds = glycation.map((el) => parseInt(el, 10));
    if (isWindowView) {
      nBonds = nBonds.filter(
        (bond) => bond >= windowStart && bond <= windowEnd
      );
    }
    nBonds.forEach((el) => {
      let bondProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let bondPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + bondProportion * SPINE_WIDTH;

      const atom = g.append('text');

      atom
        .attr('dx', bondPos - 8)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.15)
        .text(() => `N`)
        .attr('class', 'glyco-labels');

      const pos = g.append('text');
      pos
        .attr('dx', bondPos + 4)
        .attr('dy', SULFIDE_POS - GLYCO_STEM_LENGTH * 1.1)
        .text(() => `${el}`)
        .attr('class', 'glyco-labels--pos');

      const stem = g.append('line');
      stem
        .attr('x1', bondPos)
        .attr('y1', SULFIDE_POS - 10)
        .attr('x2', bondPos)
        .attr('y2', SULFIDE_POS - GLYCO_STEM_LENGTH)
        .style('stroke', 'black');

      const mol = g.append('circle');
      mol
        .attr('cx', bondPos)
        .attr('cy', SULFIDE_POS - GLYCO_STEM_LENGTH + CIRCLE_RADIUS)
        .attr('r', CIRCLE_RADIUS + 3)
        .style('stroke', 'black')
        .style('fill', 'blue');
    });
  };

  const attachSulfides = (g, isWindowView) => {
    let bonds = disulfideBonds.map((pair) => {
      const bondPos = [];
      const atoms = pair.split(' ');
      atoms.forEach((el) => {
        const atom = parseInt(el, 10);
        bondPos.push(atom);
      });
      return bondPos;
    });

    const scale = isWindowView ? windowScale : xScale;
    if (isWindowView) {
      bonds = bonds.filter((bond) => {
        const [x, y] = bond;
        return x >= windowStart && y <= windowEnd;
      });

      // attach bonds that arent fully in window
      // 1. Bonds that cut off to the left

      const leftBonds = disulfideBonds.filter((b) => {
        const [x, y] = b.split(' ');
        const b1 = parseInt(x, 10);
        const b2 = parseInt(y, 10);
        return b1 < windowStart && b2 <= windowEnd && b2 > windowStart;
      });

      console.log('attachSulfides -> leftBonds', leftBonds);

      leftBonds.forEach((pair, idx) => {
        const [x, y] = pair.split(' ');
        // attach sulfide
        let bondProportion = y / proteinLength;
        let windowProportion =
          (y - windowPos.start) / (windowPos.end - windowPos.start);
        let bondPos = isWindowView
          ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
          : SPINE_START_POS + bondProportion * SPINE_WIDTH;

        const atom = g.append('circle');
        atom
          .attr('cx', bondPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS)
          .style('stroke', 'white')
          .style('fill', COLOR_PALLETE[idx % COLOR_PALLETE.length]);

        // attach stem
        const bond = g.append('line');
        bond
          .attr('x1', bondPos)
          .attr('y1', SULFIDE_POS + 20)
          .attr('x2', bondPos)
          .attr('y2', bondHeight([x, y]))
          .style('stroke', 'black');

        const sulfide = g.append('text');
        sulfide
          .attr('dx', bondPos - 5)
          .attr('dy', bondHeight([x, y]) + SULFIDE_ATOM_OFFSET)
          .text(() => 'C')
          .attr('class', 'sulfide-labels');

        const pos = g.append('text');
        pos
          .attr('dx', bondPos + 6)
          .attr('dy', bondHeight([x, y]) + SULFIDE_ATOM_OFFSET + 5)
          .text(() => `${y}`)
          .attr('class', 'sulfide-labels--pos');

        const link = g.append('line');
        link
          .attr('x1', WINDOW_SPINE_START_POS)
          .attr('y1', bondHeight([x, y]))
          .attr('x2', bondPos)
          .attr('y2', bondHeight([x, y]))
          .style('stroke', 'black');
      });

      const rightBonds = disulfideBonds.filter((b) => {
        const [x, y] = b.split(' ');
        const b1 = parseInt(x, 10);
        const b2 = parseInt(y, 10);
        return b1 > windowStart && b1 <= windowEnd && b2 > windowEnd;
      });

      rightBonds.forEach((pair, idx) => {
        const [x, y] = pair.split(' ');
        // attach sulfide
        let bondProportion = x / proteinLength;
        let windowProportion =
          (x - windowPos.start) / (windowPos.end - windowPos.start);
        let bondPos = isWindowView
          ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
          : SPINE_START_POS + bondProportion * SPINE_WIDTH;
        let scaledWindowEnd = WINDOW_SPINE_WIDTH + 15;

        const atom = g.append('circle');
        atom
          .attr('cx', bondPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS)
          .style('stroke', 'white')
          .style('fill', COLOR_PALLETE[idx % COLOR_PALLETE.length]);

        // attach stem
        const bond = g.append('line');
        bond
          .attr('x1', bondPos)
          .attr('y1', SULFIDE_POS + 20)
          .attr('x2', bondPos)
          .attr('y2', bondHeight([x, y]))
          .style('stroke', 'black');

        const sulfide = g.append('text');
        sulfide
          .attr('dx', bondPos - 5)
          .attr('dy', bondHeight([x, y]) + SULFIDE_ATOM_OFFSET)
          .text(() => 'C')
          .attr('class', 'sulfide-labels');

        const pos = g.append('text');
        pos
          .attr('dx', bondPos + 7)
          .attr('dy', bondHeight([x, y]) + SULFIDE_ATOM_OFFSET + 5)
          .text(() => `${x}`)
          .attr('class', 'sulfide-labels--pos');

        const link = g.append('line');
        link
          .attr('x1', bondPos)
          .attr('y1', bondHeight([x, y]))
          .attr('x2', scaledWindowEnd)
          .attr('y2', bondHeight([x, y]))
          .style('stroke', 'black');
      });
    }

    bonds.forEach((pair, idx) => {
      const [x, y] = pair;
      let xProportion = x / proteinLength;
      let xWindowProp =
        (x - windowPos.start) / (windowPos.end - windowPos.start);
      let xPos = isWindowView
        ? WINDOW_SPINE_START_POS + xWindowProp * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + xProportion * SPINE_WIDTH;

      let yProportion = y / proteinLength;
      let yWindowProp =
        (y - windowPos.start) / (windowPos.end - windowPos.start);
      let yPos = isWindowView
        ? WINDOW_SPINE_START_POS + yWindowProp * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + yProportion * SPINE_WIDTH;

      pair.forEach((el) => {
        const atom = g.append('circle');
        atom
          .attr('cx', xPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS)
          .style('stroke', 'white')
          .style('fill', COLOR_PALLETE[idx % COLOR_PALLETE.length]);

        const atom2 = g.append('circle');
        atom2
          .attr('cx', yPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS)
          .style('stroke', 'white')
          .style('fill', COLOR_PALLETE[idx % COLOR_PALLETE.length]);

        const bond = g.append('line');
        bond
          .attr('x1', xPos)
          .attr('y1', SULFIDE_POS + 20)
          .attr('x2', xPos)
          .attr('y2', bondHeight(pair))
          .style('stroke', 'black');

        const bond2 = g.append('line');
        bond2
          .attr('x1', yPos)
          .attr('y1', SULFIDE_POS + 20)
          .attr('x2', yPos)
          .attr('y2', bondHeight(pair))
          .style('stroke', 'black');

        const sulfide = g.append('text');
        sulfide
          .attr('dx', xPos - 5)
          .attr('dy', bondHeight(pair) + SULFIDE_ATOM_OFFSET)
          .text(() => 'C')
          .attr('class', 'sulfide-labels');

        const sulfide2 = g.append('text');
        sulfide2
          .attr('dx', yPos - 5)
          .attr('dy', bondHeight(pair) + SULFIDE_ATOM_OFFSET)
          .text(() => 'C')
          .attr('class', 'sulfide-labels');

        const pos = g.append('text');
        pos
          .attr('dx', xPos + 4)
          .attr('dy', bondHeight(pair) + SULFIDE_ATOM_OFFSET + 5)
          .text(() => `${x}`)
          .attr('class', 'sulfide-labels--pos');

        const pos2 = g.append('text');
        pos2
          .attr('dx', yPos + 4)
          .attr('dy', bondHeight(pair) + SULFIDE_ATOM_OFFSET + 5)
          .text(() => `${y}`)
          .attr('class', 'sulfide-labels--pos');
      });
      const link = g.append('line');
      link
        .attr('x1', xPos)
        .attr('y1', bondHeight(pair))
        .attr('x2', yPos)
        .attr('y2', bondHeight(pair))
        .style('stroke', 'black');
    });
  };

  const attachOutsideDomain = (g, isWindowView) => {
    let start_position = outsideDomain.map((obj) => obj.start_pos);
    let end_position = outsideDomain.map((obj) => obj.end_pos);

    console.log('Visualization -> attach Outside Domain');

    for (let i = 0; i < start_position.length; i++) {
      const rectBase = g.append('rect');

      let startProportion = start_position[i] / proteinLength;
      let startPos = isWindowView
        ? WINDOW_SPINE_START_POS + startProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + startProportion * SPINE_WIDTH;

      if (!isWindowView) {
        let widthProportion =
          (end_position[i] - start_position[i]) / proteinLength;
        let rectWidth = fullScale
          ? end_position[i] - start_position[i]
          : widthProportion * SPINE_WIDTH;
        // console.log("non-window outside domain rect:", rectWidth)
        // console.log('non window widthProportion:', widthProportion)
        rectBase
          .attr('width', rectWidth)
          .attr('height', SPINE_HEIGHT)
          .attr('x', startPos)
          .attr('y', innerHeight / 2)
          .style('fill', '#7B82EE');
      } else {
        if (startPos >= windowStart || startPos <= windowEnd) {
          let newLength = windowEnd - windowStart;
          let startProportion = (start_position[i] - windowStart) / newLength;
          let widthProportion = 0;

          //scaling calculations to adjust coloring outside the spine
          if (parseInt(end_position[i]) > parseInt(windowEnd)) {
            if (startProportion < 0) {
              startProportion = 0;
              widthProportion = (windowEnd - windowStart) / newLength;
            } else {
              widthProportion = (windowEnd - start_position[i]) / newLength;
              // console.log(startProportion, end_position[i], windowEnd)
            }
          } else {
            if (startProportion < 0) {
              startProportion = 0;
              widthProportion = (end_position[i] - windowStart) / newLength;
            } else {
              widthProportion =
                (end_position[i] - start_position[i]) / newLength;
            }
          }

          let rectWidth = widthProportion * WINDOW_SPINE_WIDTH;
          startPos =
            WINDOW_SPINE_START_POS + startProportion * WINDOW_SPINE_WIDTH;
          // console.log("protein window outside domain rect:", rectWidth)
          // console.log('protein window widthProportion:', widthProportion)
          rectBase
            .attr('width', rectWidth)
            .attr('height', SPINE_HEIGHT)
            .attr('x', startPos)
            .attr('y', innerHeight / 2)
            .style('fill', '#7B82EE'); //#3f51b5
        }
      }
    }
  };

  const attachInsideDomain = (g, isWindowView) => {
    let start_position = insideDomain.map((obj) => obj.start_pos);
    let end_position = insideDomain.map((obj) => obj.end_pos);

    console.log('Visualization -> attach Inside Domain');

    for (let i = 0; i < start_position.length; i++) {
      const rectBase = g.append('rect');

      let startProportion = start_position[i] / proteinLength;
      let startPos = isWindowView
        ? WINDOW_SPINE_START_POS + startProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + startProportion * SPINE_WIDTH;

      if (!isWindowView) {
        //regular view with adjustments for the scaling factor
        let widthProportion =
          (end_position[i] - start_position[i]) / proteinLength;
        let rectWidth = fullScale
          ? end_position[i] - start_position[i]
          : widthProportion * SPINE_WIDTH;

        rectBase
          .attr('width', rectWidth)
          .attr('height', SPINE_HEIGHT)
          .attr('x', startPos)
          .attr('y', innerHeight / 2)
          .style('fill', '#FF6088');
      } else {
        //windowView with adjustments based on protein position
        if (startPos >= windowStart || startPos <= windowEnd) {
          let newLength = windowEnd - windowStart;
          let startProportion = (start_position[i] - windowStart) / newLength;
          let widthProportion = 0;

          //scaling calculations to adjust coloring outside the spine
          if (parseInt(end_position[i]) > parseInt(windowEnd)) {
            if (startProportion < 0) {
              startProportion = 0;
              widthProportion = (windowEnd - windowStart) / newLength;
            } else {
              widthProportion = (windowEnd - start_position[i]) / newLength;
            }
          } else {
            if (startProportion < 0) {
              startProportion = 0;
              widthProportion = (end_position[i] - windowStart) / newLength;
            } else {
              widthProportion =
                (end_position[i] - start_position[i]) / newLength;
            }
          }

          let rectWidth = widthProportion * WINDOW_SPINE_WIDTH;
          startPos =
            WINDOW_SPINE_START_POS + startProportion * WINDOW_SPINE_WIDTH;
          // console.log("inside domain rect:", rectWidth)
          rectBase
            .attr('width', rectWidth)
            .attr('height', SPINE_HEIGHT)
            .attr('x', startPos)
            .attr('y', innerHeight / 2)
            .style('fill', '#FF6088'); //#f50057
        }
      }
    }
  };

  const attachSequons = (g, isWindowView) => {
    console.log('Visualization -> attach Free Sequons');
    let seq = sequons.map((el) => parseInt(el, 10));
    if (isWindowView) {
      seq = seq.filter((pos) => pos >= windowStart && pos <= windowEnd);
    }
    // const scale = isWindowView ? windowScale : xScale;
    seq.forEach((el) => {
      let seqProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let seqPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + seqProportion * SPINE_WIDTH;

      const bond = g.append('line');
      bond
        .attr('x1', seqPos)
        .attr('y1', SULFIDE_POS - 20)
        .attr('x2', seqPos)
        .attr('y2', SULFIDE_POS - 50)
        .style('stroke', 'black');

      const label = g.append('text');
      label
        .attr('dx', seqPos - 4)
        .attr('dy', SULFIDE_POS - 60)
        .text(() => 'N')
        .attr('class', 'sulfide-labels');

      const pos = g.append('text');
      pos
        .attr('dx', seqPos + 8)
        .attr('dy', SULFIDE_POS - 55)
        .text(() => `${el}`)
        .attr('class', 'sulfide-labels--pos');

      const atom = g.append('circle');
      atom
        .attr('cx', seqPos)
        .attr('cy', SULFIDE_POS)
        .attr('r', CIRCLE_RADIUS - 2)
        .style('stroke', 'white')
        .style('fill', 'black');
      //COLOR_PALLETE[idx % COLOR_PALLETE.length]
    });
  };

  // #RD OLD CODE
  // const attachFreeAmAcids = (
  //   g,
  //   isWindowView,
  //   freeAmAcids,
  //   symAmAcids,
  //   visualize,
  //   text_distance = 0
  // ) => {
  //   console.log(`Visualization -> attach Free ${symAmAcids}`);
  //   let seq = freeAmAcids.map((el) => parseInt(el, 10));
  //   if (isWindowView) {
  //     seq = seq.filter((pos) => pos >= windowStart && pos <= windowEnd);
  //   }
  //   // const scale = isWindowView ? windowScale : xScale;
  //
  //   if (visualize === 'solid') {
  //     seq.forEach((el) => {
  //       let seqProportion = el / proteinLength;
  //       let windowProportion =
  //         (el - windowPos.start) / (windowPos.end - windowPos.start);
  //       let seqPos = isWindowView
  //         ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
  //         : SPINE_START_POS + seqProportion * SPINE_WIDTH;
  //
  //       const bond = g.append('line');
  //       bond
  //         .attr('x1', seqPos)
  //         .attr('y1', SULFIDE_POS - 20)
  //         .attr('x2', seqPos)
  //         .attr('y2', SULFIDE_POS - 50)
  //         .style('stroke', 'black');
  //
  //       const label = g.append('text');
  //       label
  //         .attr('dx', seqPos - 4)
  //         .attr('dy', SULFIDE_POS - 60)
  //         .text(() => `${symAmAcids}`)
  //         .attr('class', 'sulfide-labels');
  //
  //       const pos = g.append('text');
  //       pos
  //         .attr('dx', seqPos + 4 + text_distance)
  //         .attr('dy', SULFIDE_POS - 55)
  //         .text(() => `${el}`)
  //         .attr('class', 'sulfide-labels--pos');
  //
  //       const atom = g.append('circle');
  //       atom
  //         .attr('cx', seqPos)
  //         .attr('cy', SULFIDE_POS)
  //         .attr('r', CIRCLE_RADIUS - 2)
  //         .style('stroke', 'white')
  //         .style('fill', 'black');
  //     });
  //   } else {
  //     seq.forEach((el) => {
  //       let seqProportion = el / proteinLength;
  //       let windowProportion =
  //         (el - windowPos.start) / (windowPos.end - windowPos.start);
  //       let seqPos = isWindowView
  //         ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
  //         : SPINE_START_POS + seqProportion * SPINE_WIDTH;
  //
  //       const bond = g.append('line');
  //       bond
  //         .attr('x1', seqPos)
  //         .attr('y1', SULFIDE_POS + 20)
  //         .attr('x2', seqPos)
  //         .attr('y2', SULFIDE_POS + 50)
  //         .style('stroke', 'black');
  //
  //       const label = g.append('text');
  //       label
  //         .attr('dx', seqPos - 4)
  //         .attr('dy', SULFIDE_POS + 60)
  //         .text(() => `${symAmAcids}`)
  //         .attr('class', 'sulfide-labels');
  //
  //       const pos = g.append('text');
  //       pos
  //         .attr('dx', seqPos + 6  + text_distance)
  //         .attr('dy', SULFIDE_POS + 65)
  //         .text(() => `${el}`)
  //         .attr('class', 'sulfide-labels--pos');
  //
  //       const atom = g.append('circle');
  //       atom
  //         .attr('cx', seqPos)
  //         .attr('cy', SULFIDE_POS)
  //         .attr('r', CIRCLE_RADIUS - 2)
  //         .style('stroke', 'black')
  //         .style('fill', 'white');
  //     });
  //   }
  // };
  // #RD END OLD CODE

  // #RD START
  // Extra vertical offset per selected-amino-acid "lane" (based on its index in
  // selectedAminoAcids) so that when more than one letter is displayed at once they
  // don't all stack their labels on the exact same line - previously every 'solid'
  // letter (and every 'white' letter) rendered at an identical y, which is what
  // caused heavy overlap near the C-terminus once multiple letters were selected.
  const AMINO_ACID_LANE_SPACING = 16;
  // Minimum horizontal pixel gap required between two consecutive labels of the same
  // amino acid before the later one's text is hidden; the atom marker itself is
  // still always drawn, so no position is silently dropped from the visualization.
  const AMINO_ACID_LABEL_MIN_GAP = 14;

  const attachFreeAmAcids = (
    g,
    isWindowView,
    freeAmAcids,
    symAmAcids,
    visualize,
    text_distance = 0,
    laneOffset = 0
  ) => {
    console.log(`Visualization -> attach Free ${symAmAcids}`);
    let seq = freeAmAcids.map((el) => parseInt(el, 10));
    if (isWindowView) {
      seq = seq.filter((pos) => pos >= windowStart && pos <= windowEnd);
    }
    seq = [...seq].sort((a, b) => a - b);
    // const scale = isWindowView ? windowScale : xScale;

    const laneShift = laneOffset * AMINO_ACID_LANE_SPACING;
    let lastLabelPos = null;

    if (visualize === 'solid') {
      seq.forEach((el) => {
        let seqProportion = el / proteinLength;
        let windowProportion =
          (el - windowPos.start) / (windowPos.end - windowPos.start);
        let seqPos = isWindowView
          ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
          : SPINE_START_POS + seqProportion * SPINE_WIDTH;

        const showLabel =
          lastLabelPos === null ||
          Math.abs(seqPos - lastLabelPos) >= AMINO_ACID_LABEL_MIN_GAP;
        if (showLabel) {
          lastLabelPos = seqPos;
        }

        const bond = g.append('line');
        bond
          .attr('x1', seqPos)
          .attr('y1', SULFIDE_POS - 20)
          .attr('x2', seqPos)
          .attr('y2', SULFIDE_POS - 50 - laneShift)
          .style('stroke', 'black');

        if (showLabel) {
          const label = g.append('text');
          label
            .attr('dx', seqPos - 4)
            .attr('dy', SULFIDE_POS - 60 - laneShift)
            .text(() => `${symAmAcids}`)
            .attr('class', 'sulfide-labels');

          const pos = g.append('text');
          pos
            .attr('dx', seqPos + 4 + text_distance)
            .attr('dy', SULFIDE_POS - 55 - laneShift)
            .text(() => `${el}`)
            .attr('class', 'sulfide-labels--pos');
        }

        const atom = g.append('circle');
        atom
          .attr('cx', seqPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS - 2)
          .style('stroke', 'white')
          .style('fill', 'black');
      });
    } else {
      seq.forEach((el) => {
        let seqProportion = el / proteinLength;
        let windowProportion =
          (el - windowPos.start) / (windowPos.end - windowPos.start);
        let seqPos = isWindowView
          ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
          : SPINE_START_POS + seqProportion * SPINE_WIDTH;

        const showLabel =
          lastLabelPos === null ||
          Math.abs(seqPos - lastLabelPos) >= AMINO_ACID_LABEL_MIN_GAP;
        if (showLabel) {
          lastLabelPos = seqPos;
        }

        const bond = g.append('line');
        bond
          .attr('x1', seqPos)
          .attr('y1', SULFIDE_POS + 20)
          .attr('x2', seqPos)
          .attr('y2', SULFIDE_POS + 50 + laneShift)
          .style('stroke', 'black');

        if (showLabel) {
          const label = g.append('text');
          label
            .attr('dx', seqPos - 4)
            .attr('dy', SULFIDE_POS + 60 + laneShift)
            .text(() => `${symAmAcids}`)
            .attr('class', 'sulfide-labels');

          const pos = g.append('text');
          pos
            .attr('dx', seqPos + 6 + text_distance)
            .attr('dy', SULFIDE_POS + 65 + laneShift)
            .text(() => `${el}`)
            .attr('class', 'sulfide-labels--pos');
        }

        const atom = g.append('circle');
        atom
          .attr('cx', seqPos)
          .attr('cy', SULFIDE_POS)
          .attr('r', CIRCLE_RADIUS - 2)
          .style('stroke', 'black')
          .style('fill', 'white');
      });
    }
  };
  // #RD END

  const attachCysteines = (g, isWindowView) => {
    console.log('Visualization -> attach Free Sequons');
    let cys = cysteines.map((el) => parseInt(el, 10));
    if (isWindowView) {
      cys = cys.filter((pos) => pos >= windowStart && pos <= windowEnd);
    }

    // const scale = isWindowView ? windowScale : xScale;
    cys.forEach((el) => {
      let cysProportion = el / proteinLength;
      let windowProportion =
        (el - windowPos.start) / (windowPos.end - windowPos.start);
      let cysPos = isWindowView
        ? WINDOW_SPINE_START_POS + windowProportion * WINDOW_SPINE_WIDTH
        : SPINE_START_POS + cysProportion * SPINE_WIDTH;

      const bond = g.append('line');
      bond
        .attr('x1', cysPos)
        .attr('y1', SULFIDE_POS + 20)
        .attr('x2', cysPos)
        .attr('y2', SULFIDE_POS + 50)
        .style('stroke', 'black');

      const label = g.append('text');
      label
        .attr('dx', cysPos - 4)
        .attr('dy', SULFIDE_POS + 60)
        .text(() => 'C')
        .attr('class', 'sulfide-labels');

      const pos = g.append('text');
      pos
        .attr('dx', cysPos + 6)
        .attr('dy', SULFIDE_POS + 65)
        .text(() => `${el}`)
        .attr('class', 'sulfide-labels--pos');

      const atom = g.append('circle');
      atom
        .attr('cx', cysPos)
        .attr('cy', SULFIDE_POS)
        .attr('r', CIRCLE_RADIUS - 2)
        .style('stroke', 'black')
        .style('fill', 'white');
      //COLOR_PALLETE[idx % COLOR_PALLETE.length]
    });
  };

  const attachSpine = (g, isWindowView) => {
    const spineBase = g.append('rect');
    let spineWidth = fullScale ? proteinLength : SPINE_WIDTH;
    const startPos = isWindowView ? WINDOW_SPINE_START_POS : SPINE_START_POS;
    if (isWindowView) {
      spineWidth = WINDOW_SPINE_WIDTH;
    }

    spineBase
      .attr('width', spineWidth)
      .attr('height', SPINE_HEIGHT)
      .attr('x', startPos)
      .attr('y', innerHeight / 2)
      .style('fill', 'white')
      .style('stroke', 'black');
  };

  const attachNTerminus = (g) => {
    const NTerm = g.append('text');
    NTerm.attr('dx', SPINE_START_POS - 55)
      .attr('dy', innerHeight / 2 + 20)
      .text(() => 'NH2 --')
      .style('font-weight', 'bold');
  };

  const attachCTerminus = (g) => {
    const CTerm = g.append('text');
    CTerm.attr('dx', SPINE_START_POS + SPINE_WIDTH + 5)
      .attr('dy', innerHeight / 2 + 20)
      .text(() => '-- COOH')
      .style('font-weight', 'bold');
  };

  const renderVisualization = (id, isWindowView) => {
    const svg = select(id);
    svg.style('background-color', 'white');

    const translateX = isWindowView ? initialWidth / 15 : margin.left;
    const translateY = isWindowView ? initialWidth / 15 : margin.top;

    const g = svg.append('g');
    g.attr('transform', `translate(${translateX}, ${translateY})`);
    attachSpine(g, isWindowView);
    if (showOutsideDomain) {
      attachOutsideDomain(g, isWindowView);
    }
    if (showInsideDomain) {
      attachInsideDomain(g, isWindowView);
    }
    if (showSequons) {
      attachSequons(g, isWindowView);
    }
    if (showCysteines) {
      attachCysteines(g, isWindowView);
    }
    if (showDisulfide) {
      attachSulfides(g, isWindowView);
    }
    if (showGlyco) {
      attachGlycoBonds(g, isWindowView);
    }
    if (showOGalNAc) {
      attachOGalNAcBonds(g, isWindowView);
    }
    if (showOGlc) {
      attachOGlcBonds(g, isWindowView);
    }
    if (showGlycation) {
      attachGlycationBonds(g, isWindowView);
    }
    // #RD OLD CODE
    // if (showFreeS) {
    //   attachFreeAmAcids(g, isWindowView, freeS, 'S', 'solid');
    // }
    // if (showFreeT) {
    //   attachFreeAmAcids(g, isWindowView, freeT, 'T', 'solid');
    // }
    // if (showFreeK) {
    //   attachFreeAmAcids(g, isWindowView, freeK, 'K', 'white');
    // }
    // if (showFreeW) {
    //   attachFreeAmAcids(g, isWindowView, freeW, 'W', 'white', 5);
    // }
    // #RD END OLD CODE
    // #RD START
    selectedAminoAcids.forEach((aminoAcid, aminoAcidLane) => {
      const style =
        AMINO_ACID_RENDER_STYLE[aminoAcid] || DEFAULT_AMINO_ACID_RENDER_STYLE;
      const freePositions = aminoAcids[aminoAcid]
        ? aminoAcids[aminoAcid].free
        : [];
      attachFreeAmAcids(
        g,
        isWindowView,
        freePositions,
        aminoAcid,
        style.visualize,
        style.textDistance,
        aminoAcidLane
      );
    });
    // #RD END
    if (showPhosphoserine) {
      attachPhosphorylation(g, isWindowView, phosphoserine, '#FDCC04');
    }
    if (showPhosphotyrosine) {
      attachPhosphorylation(g, isWindowView, phosphotyrosine, '#627DCC');
    }
    if (showPhosphothreonine) {
      attachPhosphorylation(g, isWindowView, phosphothreonine, '#93E37F');
    }
    if (!isWindowView) {
      attachNTerminus(g);
      attachCTerminus(g);
    }
  };

  const removeElements = () => {
    const svgEls = ['text', 'line', 'circle', 'rect'];
    svgEls.forEach((el) => {
      const allNodes = selectAll(el);
      allNodes.remove();
    });
  };

  useEffect(() => {
    removeElements();
    renderVisualization('#svg');
    renderVisualization('#windowSvg', true);
    if (scaleFactor !== 1) {
      document.getElementById('svg').style.marginLeft =
        (scaleFactor - 1) * window.innerWidth;
      // document.getElementById('svg').scrollIntoView({behavior: "auto", inline: "center"});
    } else if (fullScale) {
      document.getElementById('svg').style.marginLeft = 0;
      // 0.95 * proteinLength + 2 * margin.left;
    } else {
      document.getElementById('svg').style.marginLeft = 0;
    }
  }, [
    svgRef.current,
    showDisulfide,
    showGlyco,
    showOGalNAc,
    showOGlc,
    showGlycation,
    showPhosphoserine,
    showPhosphothreonine,
    showPhosphotyrosine,
    showSequons,
    showCysteines,
    showOutsideDomain,
    showInsideDomain,
    // #RD OLD CODE
    // showFreeS,
    // showFreeT,
    // showFreeK,
    // showFreeW,
    // #RD END OLD CODE
    // #RD START
    selectedAminoAcids,
    // #RD END
    scaleVisualization,
    scaleFactor,
    fullScale,
    windowStart,
    windowEnd
  ]);

  const svg = Number.isInteger(currSelection) ? (
    <div className="svg-wrapper">
      <svg
        style={
          fullScale ? {} : { marginLeft: (scaleFactor - 1) * window.innerWidth }
        }
        height={`${height}`}
        width={`${
          fullScale
            ? proteinLength + margin.left * 2
            : window.innerWidth * scaleFactor
        }`}
        ref={svgRef}
        id="svg"
        overflow="visible"
      >
        <rect />
      </svg>
    </div>
  ) : null;

  const windowSvg = Number.isInteger(currSelection) ? (
    <div className="windowSvg--wrapper">
      <svg
        height={`${height}`}
        width={`${initialWidth}`}
        ref={windowSvgRef}
        id="windowSvg"
        overflow="visible"
      >
        <rect />
      </svg>
    </div>
  ) : null;

  return (
    <div>
      {isLegendOpen ? (
        <Legend
          glycoslation={glycoslation}
          o_glcnac={o_glcnac}
          o_glc={o_glc}
          glycation={glycation}
          disulfideBonds={disulfideBonds}
          sequons={sequons}
          cysteines={cysteines}
          // #RD OLD CODE
          // free_s={freeS}
          // free_t={freeT}
          // free_k={freeK}
          // free_w={freeW}
          // #RD END OLD CODE
          // #RD START
          aminoAcids={aminoAcids}
          selectedAminoAcids={selectedAminoAcids}
          toggleAminoAcid={toggleAminoAcidSelection}
          // #RD END
          phosphoserine={phosphoserine}
          phosphothreonine={phosphothreonine}
          phosphotyrosine={phosphotyrosine}
          toggleGlyco={setShowGlyco}
          toggleOGalNAc={setShowOGalNAc}
          toggleOGlc={setShowOGlc}
          toggleGlycation={setShowGlycation}
          toggleSulfide={setShowDisulfide}
          toggleOutside={setShowOutisde}
          toggleInside={setShowInside}
          toggleSequons={setShowSequons}
          toggleCysteines={setShowCysteines}
          // #RD OLD CODE
          // toggleFreeS={setShowFreeS}
          // toggleFreeT={setShowFreeT}
          // toggleFreeK={setShowFreeK}
          // toggleFreeW={setShowFreeW}
          // #RD END OLD CODE
          togglePhosphoserine={setShowPhosphoserine}
          togglePhosphothreonine={setShowPhosphothreonine}
          togglePhosphotyrosine={setShowPhosphotyrosine}
          length={proteinLength}
          species={species}
        />
      ) : null}
      {svg}
      <ProteinWindow
        length={proteinLength}
        updateWindowStart={updateWindowStart}
        updateWindowEnd={updateWindowEnd}
      />
      {windowSvg}
    </div>
  );
}

Visualization.propTypes = {
  isLegendOpen: PropTypes.bool,
  initialOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  currSelection: PropTypes.number.isRequired,
  scaleFactor: PropTypes.number,
  fullScale: PropTypes.bool,
  setFullScaleDisabled: PropTypes.func
};

Visualization.defaultProps = {
  isLegendOpen: false,
  setFullScaleDisabled: () => {},
  scaleFactor: 1,
  fullScale: false,
  height: 500,
  width: 500
};

export default Visualization;
