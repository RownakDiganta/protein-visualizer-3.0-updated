// src/static/constants.js
// Static app constants: a handful of hardcoded example proteins shown before any
// search, plus the color palette used to draw overlapping disulfide bonds.
const initialOptions = [
  {
    value: 'HLAA_HUMAN',
    label: 'HLAA_HUMAN',
    description:
      'HLA class I histocompatibility antigen, A alpha chain (Human leukocyte antigen A) (HLA-A)',
    disulfideBonds: ['125 188', '227 283'],
    glycoslation: ['110'],
    length: 365
  },
  {
    value: 'ELNE_HUMAN',
    label: 'ELNE_HUMAN',
    description:
      'Neutrophil elastase (EC 3.4.21.37) (Bone marrow serine protease) (Elastase-2) (Human leukocyte elastase) (HLE) (Medullasin) (PMN elastase)',
    disulfideBonds: ['55 71', '151 208', '181 187', '198 223'],
    glycoslation: ['88', '124', '173'],
    length: 267
  },
  {
    value: 'GRAB_HUMAN',
    label: 'GRAB_HUMAN',
    description:
      'Granzyme B (EC 3.4.21.79) (C11) (CTLA-1) (Cathepsin G-like 1) (CTSGL1) (Cytotoxic T-lymphocyte proteinase 2) (Lymphocyte protease) (Fragmentin-2) (Granzyme-2) (Human lymphocyte protein) (HLP) (SECT) (T-cell serine protease 1-3E)',
    disulfideBonds: ['49 65', '142 209', '173 188'],
    glycoslation: ['71', '104'],
    length: 247
  }
];

const COLOR_PALLETE = [
  '#c76861',
  '#e6c11e',
  '#90de1b',
  '#1bde97',
  '#1bc7de',
  '#1b66de',
  '#421bde',
  '#901bde',
  '#d618d3',
  '#d6186a'
];

// #RD START
// All 20 standard amino acids, shared by the backend extraction (App.jsx) and the
// frontend selection UI (Legend/Visualization) so the letter list lives in one place.
const AMINO_ACIDS = [
  'A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I',
  'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'
];

// Users may display at most this many free-amino-acid tracks at once, to keep the
// visualization from getting crowded.
const MAX_SELECTED_AMINO_ACIDS = 4;

// Rendering style per letter, reusing the 'solid'/'white' circle styles and text
// offset that attachFreeAmAcids() already supports. Amino acids not listed here fall
// back to DEFAULT_AMINO_ACID_RENDER_STYLE.
const AMINO_ACID_RENDER_STYLE = {
  S: { visualize: 'solid', textDistance: 0 },
  T: { visualize: 'solid', textDistance: 0 },
  K: { visualize: 'white', textDistance: 0 },
  W: { visualize: 'white', textDistance: 5 }
};

const DEFAULT_AMINO_ACID_RENDER_STYLE = { visualize: 'solid', textDistance: 0 };
// #RD END

// #RD START
// Stable per-selection-slot colors (Okabe-Ito colorblind-friendly palette) so the
// 1st/2nd/3rd/4th selected amino acid each get a distinct, readable connector-line/
// marker/label color. Shared between Visualization (rendering) and Legend
// (chip color-dot), indexed by the amino acid's position in selectedAminoAcids.
const SELECTED_AMINO_ACID_COLORS = [
  '#0072B2',
  '#D55E00',
  '#009E73',
  '#CC79A7'
];
// #RD END

export default {
  initialOptions,
  COLOR_PALLETE,
  // #RD START
  AMINO_ACIDS,
  MAX_SELECTED_AMINO_ACIDS,
  AMINO_ACID_RENDER_STYLE,
  DEFAULT_AMINO_ACID_RENDER_STYLE,
  SELECTED_AMINO_ACID_COLORS
  // #RD END
};
