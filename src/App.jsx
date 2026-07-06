// src/App.jsx
// Root component: fetches protein data from UniProt (or the local CSV), holds all app-level state,
// and wires together the search bar, dropdown, app bar, and Visualization/Introduction views.
import React, { useState, useEffect } from 'react';
import { StylesProvider } from '@material-ui/core';
import html2canvas from 'html2canvas';
import { Canvg } from 'canvg';
import { csv } from 'd3';
import { jsPDF } from 'jspdf';
import Dropdown from './components/Dropdown';
import Visualization from './components/Visualization';
import CustomAppBar from './components/AppBar';
import Introduction from './components/Introduction';
import './App.scss';
import SearchBar from './components/ProteinSearchBar';
import parser from './parser';
import csvData from './parser/Total_combined_wHuman_results_updated.csv';
// #RD START
import constants from './static/constants';

const { AMINO_ACIDS } = constants;
// #RD END

const { getProteins } = parser;
// one-time command to setup and activate the virtual environemnt script: ./venv/Scripts/activate
const { innerWidth, innerHeight } = window;

function App() {
  const ToCaptureRef = React.useRef();
  const [currSelection, updateSelection] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [scaleVisualization, setScaleVisualization] = useState(false);
  const [isLegendOpen, setLegendState] = useState(true);
  const [proteinOpts, setProteinOpts] = useState([]);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [fullScale, setFullScale] = useState(false);
  const [fullScaleDisabled, setFullScaleDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  const updateScaleFactor = (val) => {
    setScaleFactor(val);
  };

  const toggleScaling = () => {
    setScaleVisualization(!scaleVisualization);
  };

  const showHome = () => {
    updateSelection(null);
    setShowIntro(true);
  };

  const updateSel = (index) => {
    updateSelection(null);
    setShowIntro(false);
    setTimeout(() => updateSelection(index), 500);
    if (!Number.isInteger(index)) {
      setShowIntro(true);
    }
  };

  function processAPIData(data, topDf, accessionNum) {
    function extractGlycoBonds() {
      const filtered = data.features.filter((x) => x.type === 'Glycosylation');
      const positions = filtered
        .filter(
          (x) =>
            x.description.includes('N-linked') &&
            !x.description.includes('glycation')
        )
        .map((x) => x.location.start);
      if (positions.length != 0) {
        const strPos = positions.map((x) => x.value).join(',');
        return strPos.match(/\d+/g);
      }
      return [];
    }

    function extractOGalNAc() {
      const filtered = data.features.filter((x) => x.type === 'Glycosylation');
      const positions = filtered
        .filter(
          (x) =>
            x.description.includes('O-linked') &&
            x.description.includes('GalNAc') &&
            !x.description.includes('Glc')
        )
        .map((x) => x.location.start);
      if (positions.length != 0) {
        const strPos = positions.map((x) => x.value).join(',');
        return strPos.match(/\d+/g);
      }
      return [];
    }

    function extractOGlc() {
      const filtered = data.features.filter((x) => x.type === 'Glycosylation');
      const positions = filtered
        .filter(
          (x) =>
            x.description.includes('O-linked') &&
            x.description.includes('Glc') &&
            !x.description.includes('GalNAc')
        )
        .map((x) => x.location.start);
      if (positions.length != 0) {
        const strPos = positions.map((x) => x.value).join(',');
        return strPos.match(/\d+/g);
      }
      return [];
    }

    function extractGlycation() {
      const filtered = data.features.filter((x) => x.type === 'Glycosylation');
      const positions = filtered
        .filter(
          (x) =>
            x.description.includes('N-linked') &&
            x.description.includes('Glc') &&
            x.description.includes('glycation')
        )
        .map((x) => x.location.start);
      if (positions.length != 0) {
        const strPos = positions.map((x) => x.value).join(',');
        return strPos.match(/\d+/g);
      }
      return [];
    }

    function extractDsBonds() {
      const filtered = data.features.filter((x) => x.type === 'Disulfide bond');
      const startPositions = filtered.map((x) => x.location.start);
      const endPositions = filtered.map((x) => x.location.end);
      const startPos = startPositions.map((x) => x.value);
      const endPos = endPositions.map((x) => x.value);
      const dsBonds = startPos.map(
        (start, index) => `${start} ${endPos[index]}`
      );

      return dsBonds.filter((element) => element.indexOf('null') === -1);
    }

    function extractCysteines(dsBonds) {
      const sequence = data.sequence.value;
      const pos = [...sequence.matchAll(/C/g)].map((match) => match.index + 1);
      const totalCys = pos.map((x) => x.toString());

      const freeCys = [];
      const dsList = dsBonds.map((x) => x.split(' '));
      for (const cys of totalCys) {
        let isSame = false;
        for (const ds of dsList) {
          if (ds.includes(cys)) {
            isSame = true;
            break;
          }
        }
        if (!isSame) {
          freeCys.push(cys);
        }
      }
      return [totalCys, freeCys];
    }

    function extractFreeAnimo(aminoAcid, coveredGlycans, dsBonds) {
      const sequence = data.sequence.value;
      let re = new RegExp(String.raw`${aminoAcid}`, 'g');
      const seqPos = [...sequence.matchAll(re)].map((match) => match.index + 1);
      const totalAmAcid = seqPos.map((x) => x.toString());

      let nonCoveredAmAcid = totalAmAcid;

      for (const coveredGlycan of coveredGlycans) {
        nonCoveredAmAcid = nonCoveredAmAcid.filter(
          (pos) => !coveredGlycan.includes(pos)
        );
      }

      const freeAmAcid = [];
      const dsList = dsBonds.map((x) => x.split(' '));
      for (const aa of nonCoveredAmAcid) {
        let isSame = false;
        for (const ds of dsList) {
          if (ds.includes(aa)) {
            isSame = true;
            break;
          }
        }
        if (!isSame) {
          freeAmAcid.push(aa);
        }
      }

      return [totalAmAcid, freeAmAcid];
    }

    function extractPhosphorylation(phosphoType) {
      const positions = data.features
        .filter((x) => x.description.includes(phosphoType))
        .map((x) => x.location.start);
      if (positions.length != 0) {
        const strPos = positions.map((x) => x.value).join(',');
        return strPos.match(/\d+/g);
      }
      return [];
    }

    function extractSequons(glycoBonds) {
      const sequence = data.sequence.value;
      const nxtPos = [...sequence.matchAll(/N[A-Z]T/g)].map(
        (match) => match.index + 1
      );
      const nxsPos = [...sequence.matchAll(/N[A-Z]S/g)].map(
        (match) => match.index + 1
      );
      const seqPos = [...nxtPos, ...nxsPos].sort((a, b) => a - b).map(String);
      const freeSeq = seqPos.filter((pos) => !glycoBonds.includes(pos));
      return [seqPos, freeSeq];
    }

    function parseSequence(sequence, length) {
      let newString = '';
      let start;
      let end;
      let outside = [];
      let inside = [];
      let pos = '';
      /* Object template
        {
            start_pos: start,
            end_pos: end
        }
      */

      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] !== '-') {
          if (sequence[i] === 'o') {
            pos = sequence[i];
            start = newString;
            newString = '';
            if (start == null || start == '') {
              start = 0;
            }
            if (i == sequence.length - 1) {
              //last character scenario
              end = length;
              let entry = {
                start_pos: start,
                end_pos: end
              };
              outside.push(entry);
            }
          } else if (sequence[i] === 'i') {
            pos = sequence[i];
            start = newString;
            newString = '';
            if (start == null || start == '') {
              start = 0;
            }
            if (i == sequence.length - 1) {
              //last character scenario
              end = length;
              let entry = {
                start_pos: start,
                end_pos: end
              };
              inside.push(entry);
            }
          } else {
            newString += sequence[i];
          }
        } else {
          end = newString;
          let entry = {
            start_pos: start,
            end_pos: end
          };
          if (pos === 'o') {
            outside.push(entry);
          } else {
            inside.push(entry);
          }

          newString = '';
        }
      }
      return [outside, inside];
    }

    // #RD START
    // Generalized coverage lookup so extractFreeAnimo() can be reused for all 20
    // amino acids instead of one bespoke call per letter. Only S/T/K have bonds that
    // "cover" them (O-linked glycans/phosphorylation for S & T, glycation for K);
    // every other amino acid (including C, which only needs to respect disulfide
    // bonds - already handled by the dsBonds argument) has no extra coverage.
    function extractCoveredPositions(aminoAcid) {
      if (aminoAcid === 'S') {
        return [
          extractOGalNAc(),
          extractOGlc(),
          extractPhosphorylation('Phosphoserine')
        ];
      }
      if (aminoAcid === 'T') {
        return [
          extractOGalNAc(),
          extractOGlc(),
          extractPhosphorylation('Phosphothreonine')
        ];
      }
      if (aminoAcid === 'K') {
        return [extractGlycation()];
      }
      return [];
    }

    function buildAminoAcids(dsBonds) {
      const result = {};
      AMINO_ACIDS.forEach((aminoAcid) => {
        const [total, free] = extractFreeAnimo(
          aminoAcid,
          extractCoveredPositions(aminoAcid),
          dsBonds
        );
        result[aminoAcid] = { total, free };
      });
      return result;
    }
    // #RD END

    function getProteinInfo() {
      const entry = topDf.filter(
        (row) => row['Name'] === accessionNum.value
      )[0];
      const domain = parseSequence(entry['Orientation'], entry['Length']);
      const sequons = extractSequons(extractGlycoBonds());
      const cysteines = extractCysteines(extractDsBonds());
      // #RD OLD CODE
      // const serines = extractFreeAnimo(
      //   'S',
      //   [
      //     extractOGalNAc(),
      //     extractOGlc(),
      //     extractPhosphorylation('Phosphoserine')
      //   ],
      //   extractDsBonds()
      // );
      // const threonines = extractFreeAnimo(
      //   'T',
      //   [
      //     extractOGalNAc(),
      //     extractOGlc(),
      //     extractPhosphorylation('Phosphothreonine')
      //   ],
      //   extractDsBonds()
      // );
      // const lysines = extractFreeAnimo(
      //   'K',
      //   [extractGlycation()],
      //   extractDsBonds()
      // );
      // const tryptophan = extractFreeAnimo(
      //   'W',
      //   [],
      //   extractDsBonds()
      // );
      // #RD END OLD CODE
      // #RD START
      const aminoAcids = buildAminoAcids(extractDsBonds());
      // #RD END
      return {
        value: entry['Name'],
        description: '',
        species: entry['Species'],
        topology: entry['Orientation'],
        length: entry['Length'],
        outsideDomain: domain[0],
        insideDomain: domain[1],
        glycoslation: extractGlycoBonds(),
        o_glcnac: extractOGalNAc(),
        o_glc: extractOGlc(),
        glycation: extractGlycation(),
        phosphoserine: extractPhosphorylation('Phosphoserine'),
        phosphothreonine: extractPhosphorylation('Phosphothreonine'),
        phosphotyrosine: extractPhosphorylation('Phosphotyrosine'),
        disulfideBonds: extractDsBonds(),
        totalSequons: sequons[0],
        sequons: sequons[1],
        totalCysteines: cysteines[0],
        cysteines: cysteines[1],
        // #RD OLD CODE
        // totalS: serines[0],
        // freeS: serines[1],
        // totalT: threonines[0],
        // freeT: threonines[1],
        // totalK: lysines[0],
        // freeK: lysines[1],
        // totalW: tryptophan[0],
        // freeW: tryptophan[1]
        // #RD END OLD CODE
        // #RD START
        aminoAcids
        // #RD END
      };
    }
    return getProteinInfo();
  }

  const updateAccession = async (accessionNum) => {
    const topDf = await csv(csvData);
    let url = 'https://rest.uniprot.org/uniprotkb/' + accessionNum.value;
    const response = await fetch(`${url}?`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accessionNum)
    });
    const data = await response.json();

    try {
      const protein = processAPIData(data, topDf, accessionNum);

      //check if protein is already in the list
      let index = proteinOpts.findIndex((p) => p.value == protein.value);
      if (index > -1) {
        updateSel(index);
      } else {
        if (protein.value !== undefined) {
          proteinOpts.push(protein);
          console.log('Protein added to the list');
          index = proteinOpts.findIndex((p) => p.value == protein.value);
          updateSel(index);
        }
      }
    } catch (error) {
      console.log(error);
      //catches internal servor errors (most likely from invalid input or if the excel file doesnt contain the number)
      setErrorMessage('Please enter a valid protein accession number');
      updateSel(-1);
    }
  };

  const toggleLegend = () => {
    setLegendState(!isLegendOpen);
  };

  const toggleFullScale = () => {
    setFullScale(!fullScale);
  };

  const captureScreenshot = () => {
    let canvasPromise = html2canvas(ToCaptureRef.current, {
      useCORS: true, // in case you have images stored in your application
      scrollX: -window.scrollX
    });
    canvasPromise.then((canvas) => {
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const doc = new jsPDF('p', 'px', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const widthRatio = pageWidth / canvas.width;
      const heightRatio = pageHeight / canvas.height;
      const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;

      const canvasWidth = canvas.width * ratio;
      const canvasHeight = canvas.height * ratio;

      const marginX = (pageWidth - canvasWidth) / 2;
      const marginY = (pageHeight - canvasHeight) / 2;

      doc.addImage(image, 'JPEG', marginX, marginY, canvasWidth, canvasHeight);
      doc.output('dataurlnewwindow');
    });
  };

  const createStyleElementFromCSS = () => {
    // query the last style sheet as it contain all scss file
    const sheetStartID = () => {
      for (let index = 0; index < document.styleSheets.length; index++) {
        if (document.styleSheets.item(index).title === 'end') {
          return index + 1;
        }
      }
      return 0;
    };

    const styleRules = [];
    for (
      let index = sheetStartID();
      index < document.styleSheets.length;
      index++
    ) {
      const sheet = document.styleSheets.item(index);
      for (let i = 0; i < sheet.cssRules.length; i++)
        styleRules.push(sheet.cssRules.item(i).cssText);
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(styleRules.join(' ')));

    return style;
  };

  const captureFullSVG = () => {
    const htmlStr = document.getElementById('svg');
    const style = createStyleElementFromCSS();
    htmlStr.insertBefore(style, htmlStr.firstChild);

    const data = new XMLSerializer().serializeToString(htmlStr);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    style.remove();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('download', 'output.svg');
    a.setAttribute('href', url);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const captureWindowSVG = () => {
    const htmlStr = document.getElementById('windowSvg');
    const style = createStyleElementFromCSS();
    htmlStr.insertBefore(style, htmlStr.firstChild);

    const data = new XMLSerializer().serializeToString(htmlStr);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    style.remove();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('download', 'output.svg');
    a.setAttribute('href', url);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const captureFullImage = async () => {
    const svg = document.getElementById('svg');
    const bbox = svg.getBBox();

    const style = createStyleElementFromCSS();
    svg.insertBefore(style, svg.firstChild);

    const data = new XMLSerializer().serializeToString(svg);
    style.remove();

    const canvas = document.createElement('canvas');
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    const ctx = canvas.getContext('2d');
    const v = await Canvg.fromString(ctx, data);
    await v.render();
    const base64 = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.setAttribute('download', 'output.png');
    a.setAttribute('href', base64);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const captureWindowsImage = async () => {
    const svg = document.getElementById('windowSvg');
    const bbox = svg.getBBox();

    const style = createStyleElementFromCSS();
    svg.insertBefore(style, svg.firstChild);

    const data = new XMLSerializer().serializeToString(svg);
    style.remove();

    const canvas = document.createElement('canvas');
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    const ctx = canvas.getContext('2d');
    const v = await Canvg.fromString(ctx, data);
    await v.render();
    const base64 = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.setAttribute('download', 'output.png');
    a.setAttribute('href', base64);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const intro = showIntro ? <Introduction /> : null;

  return (
    <StylesProvider injectFirst>
      <div className="App">
        <CustomAppBar
          toggleLegend={toggleLegend}
          scaleVisualization={toggleScaling}
          showHome={showHome}
          captureScreenshot={captureScreenshot}
          captureFullSVG={captureFullSVG}
          captureWindowSVG={captureWindowSVG}
          captureFullImage={captureFullImage}
          captureWindowsImage={captureWindowsImage}
          setScaleFactor={updateScaleFactor}
          toggleFullScale={toggleFullScale}
          disableFullScale={fullScaleDisabled}
          fullScale={fullScale}
        />
        <div className="page-wrap">
          <div className="App-searchbar">
            <SearchBar onSubmit={updateAccession} />
          </div>
        </div>
        {currSelection == -1 ? (
          <div style={{ marginTop: '1rem', color: 'red' }}>{errorMessage}</div>
        ) : (
          <div />
        )}
        {currSelection != null &&
        currSelection != -1 &&
        Number.isInteger(currSelection) ? (
          <div className="html2canvas-container" ref={ToCaptureRef}>
            <Visualization
              width={innerWidth}
              height={innerHeight}
              currSelection={currSelection}
              isLegendOpen={isLegendOpen}
              initialOptions={proteinOpts}
              scaleFactor={scaleFactor}
              fullScale={fullScale}
              setFullScaleDisabled={setFullScaleDisabled}
            />
          </div>
        ) : (
          <div>{intro}</div>
        )}
      </div>
    </StylesProvider>
  );
}

export default App;
