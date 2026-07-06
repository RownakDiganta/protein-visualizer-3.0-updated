// src/components/Legend/index.js
// Left/right floating legend cards: shows counts for each protein feature (glycans,
// phosphosites, disulfides, free residues, etc.) with per-feature visibility toggles.
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  // #RD START
  Chip
  // #RD END
} from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';
import PropTypes from 'prop-types';
// import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';

import { makeStyles } from '@material-ui/core/styles';
// #RD START
import constants from '../../static/constants';
// #RD END
import './index.scss';

// #RD START
const {
  AMINO_ACIDS,
  MAX_SELECTED_AMINO_ACIDS,
  AMINO_ACID_RENDER_STYLE,
  DEFAULT_AMINO_ACID_RENDER_STYLE
} = constants;
// #RD END

// const theme = createMuiTheme({
//   palette: {
//     primary: '#FF6088',
//     secondary: '#7B82EE',
//   },
// });

// apple: createColor('#FF6088'),
//     skyBlue: createColor('#7B82EE'),

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <CardContent>{children}</CardContent>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const useStyles = makeStyles({
  root: {
    Width: 245
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  title: {
    fontSize: 20,
    textDecoration: 'none',
    color: '#cb2d39',
    fontWeight: 'bold',
    marginBottom: '15px'
  },
  pos: {
    marginBottom: 12
  },
  tabs: {
    flexGrow: 1,
    backgroundColor: '#f8f8ff',
    width: '100%',
    marginBottom: '15px'
  },
  tab: {
    minWidth: 100,
    width: 100,
    fontSize: 10,
    fontWeight: 'bold'
  },
  card: {}
});
/**
 *
 * @param {Object} props
 * @property {Object} glycoslation object containing glyco bond info
 * @property {Object} o_glcnac object containing O-GalNAc bond info
 * @property {Object} o_glc object containing O-Glc bond info
 * @property {Object} glycation object containing N-linked Glycation bond info
 * @property {Object} disulfideBonds object containing sulfide bond info
 * @property {Object} free_s object containing Free S info
 * @property {Object} free_t object containing Free T info
 * @property {Object} free_k object containing Free K info
 * @property {Object} free_w object containing Free W info
 * @property {Object} phosphoserine object containing Phosphoserine info
 * @property {Object} phosphothreonine object containing Phosphothreonine info
 * @property {Object} phosphotyrosine object containing Phosphotyrosine info
 * @property {func} toggleGlyco Function that toggles glyco bond visibility
 * @property {func} toggleOGalNAc Function that toggles O-GalNAc bond visibility
 * @property {func} toggleOGlc Function that toggles O-Glc bond visibility
 * @property {func} toggleGlycation Function that toggles N-linked Glycation bond visibility
 * @property {func} toggleSulfide Function that toggles sulfide bond visibility
 * @property {func} toggleOutsideDomain Function that toggles Outside Domain visibility
 * @property {func} toggleInsideDomain Function that toggles Inside Domain visibility
 * @property {func} toggleSequons Function that toggles Sequons visibility
 * @property {func} toggleCysteines Function that toggles Cysteines visibility
 * @property {func} toggleFreeS Function that toggles Free S visibility
 * @property {func} toggleFreeT Function that toggles Free T visibility
 * @property {func} toggleFreeK Function that toggles Free K visibility
 * @property {func} toggleFreeW Function that toggles Free W visibility
 * @property {func} togglePhosphoserine Function that toggles Phosphoserine visibility
 * @property {func} togglePhosphothreonine Function that toggles Phosphothreonine visibility
 * @property {func} togglePhosphotyrosine Function that toggles Phosphotyrosine visibility
 * @property {number} length total length of protein structure
 * @property {string} species the species that the protein belong to
 */
function Legend(props) {
  const {
    glycoslation,
    o_glcnac,
    o_glc,
    glycation,
    phosphoserine,
    phosphothreonine,
    phosphotyrosine,
    disulfideBonds,
    sequons,
    cysteines,
    // #RD OLD CODE
    // free_s,
    // free_t,
    // free_k,
    // free_w,
    // #RD END OLD CODE
    // #RD START
    aminoAcids,
    selectedAminoAcids,
    toggleAminoAcid,
    // #RD END
    toggleGlyco,
    toggleOGalNAc,
    toggleOGlc,
    toggleGlycation,
    togglePhosphoserine,
    togglePhosphothreonine,
    togglePhosphotyrosine,
    toggleSulfide,
    toggleOutside,
    toggleInside,
    toggleSequons,
    toggleCysteines,
    // #RD OLD CODE
    // toggleFreeS,
    // toggleFreeT,
    // toggleFreeK,
    // toggleFreeW,
    // #RD END OLD CODE
    length,
    species
  } = props;
  const [tabTransparency, setTabTransparency] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showGlyco, setShowGlyco] = useState(true);
  const [showOGalNAc, setShowOGalNAc] = useState(true);
  const [showOGlc, setShowOGlc] = useState(true);
  const [showGlycation, setShowGlycation] = useState(true);
  const [showSulfide, setShowSulfide] = useState(true);
  const [showOutsideDomain, setShowOutside] = useState(true);
  const [showInsideDomain, setShowInside] = useState(true);
  const [showSequons, setShowSequons] = useState(false);
  const [showCysteines, setShowCysteines] = useState(false);
  // #RD OLD CODE
  // const [showFreeS, setShowFreeS] = useState(false);
  // const [showFreeT, setShowFreeT] = useState(false);
  // const [showFreeK, setShowFreeK] = useState(false);
  // const [showFreeW, setShowFreeW] = useState(false);
  // #RD END OLD CODE
  const [showPhosphoserine, setShowPhosphoserine] = useState(true);
  const [showPhosphothreonine, setShowPhosphothreonine] = useState(true);
  const [showPhosphotyrosine, setShowPhosphotyrosine] = useState(true);
  const classes = useStyles();

  const handleTabChange = (event, newTabValue) => {
    setTabValue(newTabValue);
  };

  const handleTransparency = (e) => {
    setTabTransparency(!tabTransparency);
  };

  const handleToggle = (element) => {
    if (element === 'sulfide') {
      toggleSulfide(!showSulfide);
      setShowSulfide(!showSulfide);
    } else if (element === 'glyco') {
      toggleGlyco(!showGlyco);
      setShowGlyco(!showGlyco);
    } else if (element === 'o_glcnac') {
      toggleOGalNAc(!showOGalNAc);
      setShowOGalNAc(!showOGalNAc);
    } else if (element === 'o_glc') {
      toggleOGlc(!showOGlc);
      setShowOGlc(!showOGlc);
    } else if (element === 'glycation') {
      toggleGlycation(!showGlycation);
      setShowGlycation(!showGlycation);
    } else if (element === 'phosphoserine') {
      togglePhosphoserine(!showPhosphoserine);
      setShowPhosphoserine(!showPhosphoserine);
    } else if (element === 'phosphothreonine') {
      togglePhosphothreonine(!showPhosphothreonine);
      setShowPhosphothreonine(!showPhosphothreonine);
    } else if (element === 'phosphotyrosine') {
      togglePhosphotyrosine(!showPhosphotyrosine);
      setShowPhosphotyrosine(!showPhosphotyrosine);
    } else if (element === 'outside') {
      toggleOutside(!showOutsideDomain);
      setShowOutside(!showOutsideDomain);
    } else if (element === 'sequons') {
      toggleSequons(!showSequons);
      setShowSequons(!showSequons);
    } else if (element === 'cysteines') {
      toggleCysteines(!showCysteines);
      setShowCysteines(!showCysteines);
      // #RD OLD CODE
      // } else if (element === 'free_k') {
      //   toggleFreeK(!showFreeK);
      //   setShowFreeK(!showFreeK);
      // } else if (element === 'free_s') {
      //   toggleFreeS(!showFreeS);
      //   setShowFreeS(!showFreeS);
      // } else if (element === 'free_t') {
      //   toggleFreeT(!showFreeT);
      //   setShowFreeT(!showFreeT);
      // } else if (element === 'free_w') {
      //   toggleFreeW(!showFreeW);
      //   setShowFreeW(!showFreeW);
      // #RD END OLD CODE
    } else {
      toggleInside(!showInsideDomain);
      setShowInside(!showInsideDomain);
    }
  };

  const infoLeft = (
    <TabPanel index={0} value={tabValue}>
      <div className="legend--menuItem">
        <Typography>
          N-Glycan:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {glycoslation.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showGlyco ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('glyco')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          O-GalNAc:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {o_glcnac.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showOGalNAc ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('o_glcnac')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          O-Glc:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {o_glc.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showOGlc ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('o_glc')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Glycation:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {glycation.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showGlycation ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('glycation')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          PhosphoS:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {phosphoserine.length}
          </Typography>
        </Typography>
        <div
          className={`button-visibility${showPhosphoserine ? '--on' : '--off'}`}
        >
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('phosphoserine')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          PhosphoT:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {phosphothreonine.length}
          </Typography>
        </Typography>
        <div
          className={`button-visibility${showPhosphothreonine ? '--on' : '--off'}`}
        >
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('phosphothreonine')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          PhosphoY:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {phosphotyrosine.length}
          </Typography>
        </Typography>
        <div
          className={`button-visibility${showPhosphotyrosine ? '--on' : '--off'}`}
        >
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              className={{ root: 'on' }}
              onClick={() => handleToggle('phosphotyrosine')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Disulfides:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {disulfideBonds.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showSulfide ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              onClick={() => handleToggle('sulfide')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div
        className="legend--menuItem"
        style={{
          alignItems: 'center',
          marginTop: '-33px',
          marginBottom: '-40px'
        }}
      >
        <Typography
          display="inline"
          placement="left-end"
          style={{ marginRight: '0.5rem', marginTop: '0.75rem' }}
        >
          Topology:
        </Typography>
        <Button
          placement="right-end"
          variant="outlined"
          color="primary"
          size="small"
          style={{ marginRight: '0.5rem', marginTop: '1rem', minWidth: '5px' }}
          onClick={() => handleToggle('outside')}
        >
          Out
        </Button>
        <Button
          placement="right-end"
          variant="outlined"
          color="secondary"
          size="small"
          style={{ marginTop: '1rem', minWidth: '5px' }}
          onClick={() => handleToggle('inside')}
        >
          In
        </Button>
      </div>
    </TabPanel>
  );

  const symbolLeft = (
    <TabPanel value={tabValue} index={1}>
      <div
        className="legend--menuSymbol"
        style={{
          marginTop: '-23px'
        }}
      >
        <Typography>N-Glycan:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <rect
              x="10"
              y="3"
              width="14"
              height="14"
              fill="blue"
              style={{ stroke: 'black' }}
            />
            <line x1="0" y1="10" x2="10" y2="10" style={{ stroke: 'black' }} />
            <rect
              x="40"
              y="3"
              width="14"
              height="14"
              fill="blue"
              style={{ stroke: 'black' }}
            />
            <line x1="24" y1="10" x2="40" y2="10" style={{ stroke: 'black' }} />
            <circle
              r="8"
              cx="76"
              cy="10"
              fill="green"
              style={{ stroke: 'black' }}
            />
            <line x1="54" y1="10" x2="68" y2="10" style={{ stroke: 'black' }} />
            <text x="86" y="16" fill="black" fontWeight="bold">
              N
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>O-GalNAc:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <rect
              x="20"
              y="3"
              width="14"
              height="14"
              fill="yellow"
              style={{ stroke: 'black' }}
            />
            <line x1="0" y1="10" x2="20" y2="10" style={{ stroke: 'black' }} />
            <text x="40" y="16" fill="black" fontWeight="bold">
              O
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>O-Glc:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle
              r="8"
              cx="27"
              cy="10"
              fill="blue"
              style={{ stroke: 'black' }}
            />
            <line x1="0" y1="10" x2="19" y2="10" style={{ stroke: 'black' }} />
            <text x="40" y="16" fill="black" fontWeight="bold">
              O
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>Glycation:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle
              r="8"
              cx="27"
              cy="10"
              fill="blue"
              style={{ stroke: 'black' }}
            />
            <line x1="0" y1="10" x2="19" y2="10" style={{ stroke: 'black' }} />
            <text x="40" y="16" fill="black" fontWeight="bold">
              N
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>PhosphoS:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle r="10" cx="27" cy="10" fill="#FDCC04" />
            <line x1="0" y1="10" x2="17" y2="10" style={{ stroke: 'black' }} />
            <text x="23" y="16" fill="black" fontWeight="bold">
              P
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>PhosphoT:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle r="10" cx="27" cy="10" fill="#627DCC" />
            <line x1="0" y1="10" x2="17" y2="10" style={{ stroke: 'black' }} />
            <text x="23" y="16" fill="black" fontWeight="bold">
              P
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>PhosphoY:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle r="10" cx="27" cy="10" fill="#93E37F" />
            <line x1="0" y1="10" x2="17" y2="10" style={{ stroke: 'black' }} />
            <text x="23" y="16" fill="black" fontWeight="bold">
              P
            </text>
          </svg>
        </div>
      </div>
      <div
        className="legend--menuSymbol"
        style={{
          marginBottom: '-40px'
        }}
      >
        <Typography>Disulfides:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="20"
            fill="none"
          >
            <circle
              r="5"
              cx="20"
              cy="6"
              fill="#C76861"
              style={{ stroke: 'white' }}
            />
            <circle
              r="5"
              cx="60"
              cy="6"
              fill="#C76861"
              style={{ stroke: 'white' }}
            />
            <line x1="20" y1="18" x2="60" y2="18" style={{ stroke: 'black' }} />
            <line x1="20" y1="18" x2="20" y2="11" style={{ stroke: 'black' }} />
            <text x="5" y="18" fill="black" fontWeight="bold" fontSize="small">
              C
            </text>
            <line x1="60" y1="18" x2="60" y2="11" style={{ stroke: 'black' }} />
            <text x="65" y="18" fill="black" fontWeight="bold" fontSize="small">
              C
            </text>
          </svg>
        </div>
      </div>
    </TabPanel>
  );

  const legendLeft = (
    <Card
      variant="outlined"
      raised
      classes={{
        root: `legend--wrapper${tabTransparency ? 'Transparent' : ''}`
      }}
    >
      <CardContent>
        <div className="legend--header">
          <Typography
            className={classes.title}
            color="textSecondary"
            gutterBottom
            display="inline"
          >
            Legend
          </Typography>
          <div
            className={`button-visibility${tabTransparency ? '--off' : '--on'}`}
          >
            <Tooltip
              title="toggle transparency for legend"
              placement="right-end"
            >
              <IconButton aria-label="delete" onClick={handleTransparency}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <Paper className={classes.tabs}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="simple tabs example"
          >
            <Tab
              classes={{ root: classes.tab }}
              label="Protein Features"
              {...a11yProps(0)}
            />
            <Tab
              classes={{ root: classes.tab }}
              label="Scientific Symbol"
              {...a11yProps(1)}
            />
          </Tabs>
        </Paper>
        {infoLeft}
        {symbolLeft}
      </CardContent>
    </Card>
  );

  const infoRight = (
    <TabPanel index={0} value={tabValue}>
      <div className="legend--menuItem">
        <Typography>
          Free Sequon:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {sequons.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showSequons ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('sequons')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Free Cysteine:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {cysteines.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showCysteines ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('cysteines')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      {/*
      #RD OLD CODE
      <div className="legend--menuItem">
        <Typography>
          Free S:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {free_s.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showFreeS ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('free_s')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Free T:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {free_t.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showFreeT ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('free_t')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Free K:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {free_k.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showFreeK ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('free_k')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="legend--menuItem">
        <Typography>
          Free W:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {free_w.length}
          </Typography>
        </Typography>
        <div className={`button-visibility${showFreeW ? '--on' : '--off'}`}>
          <Tooltip title="toggle visibility" placement="right-end">
            <IconButton
              aria-label="delete"
              // className={{ root: 'on' }}
              onClick={() => handleToggle('free_w')}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      #RD END OLD CODE
      */}
      {/* #RD START */}
      {/* legend--aminoAcidSection (not legend--menuItem) - this block wraps onto
          multiple lines, and --menuItem's -23px margins (meant for single-line rows)
          were squashing/overlapping it with the items above and below. */}
      <div className="legend--aminoAcidSection">
        <Typography>
          Free Amino Acids (choose up to {MAX_SELECTED_AMINO_ACIDS}):
        </Typography>
        <div className="legend--aminoAcidGrid">
          {AMINO_ACIDS.map((aminoAcid) => {
            const isSelected = selectedAminoAcids.includes(aminoAcid);
            const count =
              aminoAcids[aminoAcid] ? aminoAcids[aminoAcid].free.length : 0;
            const isDisabled =
              !isSelected &&
              selectedAminoAcids.length >= MAX_SELECTED_AMINO_ACIDS;
            return (
              <Chip
                key={aminoAcid}
                label={`${aminoAcid} ${count}`}
                size="small"
                clickable
                disabled={isDisabled}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'default' : 'outlined'}
                onClick={() => toggleAminoAcid(aminoAcid)}
                className="legend--aminoAcidChip"
              />
            );
          })}
        </div>
        {selectedAminoAcids.length >= MAX_SELECTED_AMINO_ACIDS ? (
          <Typography variant="caption" style={{ color: '#cb2d39' }}>
            Maximum of {MAX_SELECTED_AMINO_ACIDS} amino acids selected
          </Typography>
        ) : null}
      </div>
      {/* #RD END */}
      <div className="legend--menuItem">
        <Typography>
          Protein Length:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {length}
          </Typography>
        </Typography>
      </div>
      <div
        className="legend--menuItem"
        style={{
          marginTop: '23px',
          marginBottom: '-40px'
        }}
      >
        <Typography>
          Species:
          <Typography display="inline" classes={{ root: 'bold-text' }}>
            {species}
          </Typography>
        </Typography>
      </div>
    </TabPanel>
  );

  const symbolRight = (
    <TabPanel index={1} value={tabValue}>
      <div
        className="legend--menuSymbol"
        style={{
          marginTop: '-23px'
        }}
      >
        <Typography>Free Sequon:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="black" stroke="white" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              N
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>Free Cysteine:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="white" stroke="black" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              C
            </text>
          </svg>
        </div>
      </div>
      {/*
      #RD OLD CODE
      <div className="legend--menuSymbol">
        <Typography>Free S:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="black" stroke="white" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              S
            </text>
          </svg>
        </div>
      </div>
      <div
        className="legend--menuSymbol"
      >
        <Typography>Free T:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="black" stroke="white" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              T
            </text>
          </svg>
        </div>
      </div>
      <div className="legend--menuSymbol">
        <Typography>Free K:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="white" stroke="black" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              K
            </text>
          </svg>
        </div>
      </div>
      <div
        className="legend--menuSymbol"
        style={{
          marginBottom: '-40px'
        }}
      >
        <Typography>Free W:</Typography>
        <div className="symbol">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="20"
            fill="none"
          >
            <circle r="3" cx="5" cy="10" fill="white" stroke="black" />
            <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
            <text x="45" y="16" fill="black" fontWeight="bold">
              W
            </text>
          </svg>
        </div>
      </div>
      #RD END OLD CODE
      */}
      {/* #RD START */}
      {selectedAminoAcids.length === 0 ? (
        <div className="legend--menuSymbol">
          <Typography variant="body2">
            Select amino acids on the Protein Features tab to see their
            symbol here.
          </Typography>
        </div>
      ) : (
        selectedAminoAcids.map((aminoAcid, idx) => {
          const style =
            AMINO_ACID_RENDER_STYLE[aminoAcid] || DEFAULT_AMINO_ACID_RENDER_STYLE;
          const isSolid = style.visualize === 'solid';
          const isLast = idx === selectedAminoAcids.length - 1;
          return (
            <div
              className="legend--menuSymbol"
              key={aminoAcid}
              style={isLast ? { marginBottom: '-40px' } : {}}
            >
              <Typography>Free {aminoAcid}:</Typography>
              <div className="symbol">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="20"
                  fill="none"
                >
                  <circle
                    r="3"
                    cx="5"
                    cy="10"
                    fill={isSolid ? 'black' : 'white'}
                    stroke={isSolid ? 'white' : 'black'}
                  />
                  <line x1="12" y1="10" x2="40" y2="10" stroke="black" />
                  <text x="45" y="16" fill="black" fontWeight="bold">
                    {aminoAcid}
                  </text>
                </svg>
              </div>
            </div>
          );
        })
      )}
      {/* #RD END */}
    </TabPanel>
  );

  const legendRight = (
    <Card
      variant="outlined"
      raised
      classes={{
        root: `legend--wrapperRight${tabTransparency ? 'Transparent' : ''}`
      }}
    >
      <CardContent>
        <div className="legend--header">
          <Typography
            className={classes.title}
            color="textSecondary"
            gutterBottom
            display="inline"
          >
            Legend
          </Typography>
        </div>
        <Paper className={classes.tabs}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="simple tabs example"
          >
            <Tab
              classes={{ root: classes.tab }}
              label="Protein Features"
              {...a11yProps(0)}
            />
            <Tab
              classes={{ root: classes.tab }}
              label="Scientific Symbol"
              {...a11yProps(1)}
            />
          </Tabs>
        </Paper>
        {infoRight}
        {symbolRight}
      </CardContent>
    </Card>
  );

  return (
    <div>
      {legendLeft}
      {legendRight}
    </div>
  );
}

Legend.propTypes = {
  glycoslation: PropTypes.arrayOf(PropTypes.string).isRequired,
  o_glcnac: PropTypes.arrayOf(PropTypes.string).isRequired,
  o_glc: PropTypes.arrayOf(PropTypes.string).isRequired,
  glycation: PropTypes.arrayOf(PropTypes.string).isRequired,
  phosphoserine: PropTypes.arrayOf(PropTypes.string).isRequired,
  phosphothreonine: PropTypes.arrayOf(PropTypes.string).isRequired,
  phosphotyrosine: PropTypes.arrayOf(PropTypes.string).isRequired,
  disulfideBonds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sequons: PropTypes.arrayOf(PropTypes.string).isRequired,
  cysteines: PropTypes.arrayOf(PropTypes.string).isRequired,
  // #RD OLD CODE
  // free_s: PropTypes.arrayOf(PropTypes.string).isRequired,
  // free_k: PropTypes.arrayOf(PropTypes.string).isRequired,
  // free_t: PropTypes.arrayOf(PropTypes.string).isRequired,
  // free_w: PropTypes.arrayOf(PropTypes.string).isRequired,
  // #RD END OLD CODE
  // #RD START
  aminoAcids: PropTypes.object,
  selectedAminoAcids: PropTypes.arrayOf(PropTypes.string),
  toggleAminoAcid: PropTypes.func,
  // #RD END
  toggleOGalNAc: PropTypes.func,
  toggleGlyco: PropTypes.func,
  toggleOGlc: PropTypes.func,
  toggleGlycation: PropTypes.func,
  togglePhosphoserine: PropTypes.func,
  togglePhosphothreonine: PropTypes.func,
  togglePhosphotyrosine: PropTypes.func,
  toggleSulfide: PropTypes.func,
  toggleOutside: PropTypes.func,
  toggleInside: PropTypes.func,
  toggleSequons: PropTypes.func,
  // #RD OLD CODE
  // toggleFreeS: PropTypes.func,
  // toggleFreeK: PropTypes.func,
  // toggleFreeT: PropTypes.func,
  // toggleFreeW: PropTypes.func,
  // #RD END OLD CODE
  toggleCysteines: PropTypes.func,
  length: PropTypes.number.isRequired,
  species: PropTypes.string.isRequired
};

Legend.defaultProps = {
  toggleGlyco: () => {},
  toggleOGalNAc: () => {},
  toggleOGlc: () => {},
  toggleGlycation: () => {},
  togglePhosphoserine: () => {},
  togglePhosphothreonine: () => {},
  togglePhosphotyrosine: () => {},
  toggleSulfide: () => {},
  toggleOutside: () => {},
  toggleInside: () => {},
  toggleSequons: () => {},
  toggleCysteines: () => {},
  // #RD OLD CODE
  // toggleFreeS: () => {},
  // toggleFreeT: () => {},
  // toggleFreeK: () => {},
  // toggleFreeW: () => {},
  // #RD END OLD CODE
  // #RD START
  aminoAcids: {},
  selectedAminoAcids: [],
  toggleAminoAcid: () => {}
  // #RD END
};

export default Legend;
