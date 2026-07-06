// src/components/AppBar/index.js
// Top navigation bar: legend toggle, full-scale toggle, home button, export menu
// (PDF/PNG/SVG) and the horizontal scaling-factor slider.
import React, { useState } from 'react';
import {
  AppBar,
  MenuItem,
  Typography,
  IconButton,
  Menu,
  Toolbar,
  Tooltip
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import { makeStyles } from '@material-ui/core/styles';
import AspectRatioIcon from '@material-ui/icons/AspectRatio';
import HomeIcon from '@material-ui/icons/Home';
import ImageIcon from '@material-ui/icons/Image';
import Slider from '@material-ui/core/Slider';
import './index.scss';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));

function CustomAppBar(props) {
  const {
    toggleLegend,
    scaleVisualization,
    showHome,
    captureScreenshot,
    captureFullSVG,
    captureWindowSVG,
    captureFullImage,
    captureWindowsImage,
    setScaleFactor,
    toggleFullScale,
    disableFullScale,
    fullScale
  } = props;
  const classes = useStyles();

  const [anchorSliderEl, setAnchorSliderEl] = useState(null);
  const [anchorExportEl, setAnchorExportEl] = useState(null);
  const sliderOpen = Boolean(anchorSliderEl);
  const exportOpen = Boolean(anchorExportEl);

  const handleSliderClose = () => {
    setAnchorSliderEl(null);
  };
  const handleExportClose = () => {
    setAnchorExportEl(null);
  };
  const handleSliderMenu = (event) => {
    setAnchorSliderEl(event.currentTarget);
  };
  const handleExportMenu = (event) => {
    setAnchorExportEl(event.currentTarget);
  };
  const handleExportPDF = (event) => {
    handleExportClose();
    captureScreenshot();
  };
  const handleExportFullSVG = (event) => {
    handleExportClose();
    captureFullSVG();
  };
  const handleExportWindowSVG = (event) => {
    handleExportClose();
    captureWindowSVG();
  };
  const handleExportFullImage = (event) => {
    handleExportClose();
    captureFullImage();
  };
  const handleExportWindowImage = (event) => {
    handleExportClose();
    captureWindowsImage();
  }

  const valueText = (val) => {
    setScaleFactor(val);
    return `${val}x`;
  };

  const updateFullScale = () => {
    toggleFullScale();
  };

  return (
    <AppBar>
      <Toolbar>
        <Tooltip title="Toggle Legend">
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={toggleLegend}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Turn off Scaling (Proteins must have min 3000 length)">
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="scale"
            onClick={updateFullScale}
            disabled={disableFullScale}
          >
            <AspectRatioIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Home">
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="home"
            onClick={showHome}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <div>
          <Tooltip title="Export Image">
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="export"
              onClick={handleExportMenu}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="basic-menu"
            anchorEl={anchorExportEl}
            open={exportOpen}
            onClose={handleExportClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button'
            }}
          >
            <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
            <MenuItem onClick={handleExportFullImage}>
              Export Full Protein as Image
            </MenuItem>
            <MenuItem onClick={handleExportWindowImage}>
              Export Window Protein as Image
            </MenuItem>
            <MenuItem onClick={handleExportFullSVG}>
              Export Full Protein as SVG
            </MenuItem>
            <MenuItem onClick={handleExportWindowSVG}>
              Export Window Protein as SVG
            </MenuItem>
          </Menu>
        </div>
        <Typography variant="h6" className={classes.title}>
          Sun Lab
        </Typography>
        <div>
          <Tooltip title="Increase Scaling Factor">
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              disabled={fullScale}
              onClick={(evt) => {
                handleSliderMenu(evt);
                scaleVisualization();
              }}
              color="inherit"
            >
              <LinearScaleIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="menu-appbar"
            anchorEl={anchorSliderEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            open={sliderOpen}
            onClose={handleSliderClose}
            classes={{
              paper: 'wide-menu'
            }}
          >
            <MenuItem onClick={handleSliderClose}>
              <Typography id="discrete-slider" gutterBottom>
                Protein Scaling Factor
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={handleSliderClose}
              classes={{ root: 'menuItem--large' }}
            >
              <Slider
                defaultValue={1}
                getAriaValueText={valueText}
                aria-labelledby="discrete-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={15}
              />
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
}

CustomAppBar.propTypes = {
  toggleLegend: PropTypes.bool.isRequired,
  scaleVisualization: PropTypes.func,
  setScaleFactor: PropTypes.func,
  toggleFullScale: PropTypes.func.isRequired,
  disableFullScale: PropTypes.bool,
  fullScale: PropTypes.bool
};

CustomAppBar.defaultProps = {
  scaleVisualization: () => {},
  setScaleFactor: () => {},
  disableFullScale: false,
  fullScale: false
};

export default CustomAppBar;
