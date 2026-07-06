// src/components/Introduction/index.js
// Landing-page card shown before a protein is selected: lab logo, app description,
// feature bullet list, links to past versions/tutorial, and citation info.
import React from 'react';
import {
  Card,
  CardActions,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Link
} from '@material-ui/core';
import Logo from '../../static/sunlab.png';
import './index.scss';

function Introduction(props) {
  const title = 'Protein Visualizer';

  const redirect = () => {
    window.location.href = 'http://www.sfu.ca/chemistry/groups/bingyun_sun/';
  };

  return (
    <div>
      <Card className="introduction--wrapper">
        <CardActionArea>
          <CardMedia
            component="img"
            alt="lab logo"
            // height="120"
            image={Logo}
            className="introduction--logo"
            onClick={redirect}
          />
        </CardActionArea>
        <CardContent className="introduction--body">
          <Typography variant="h5" className="introduction--title">
            Protein Visualizer 3.0
          </Typography>
          <Typography variant="body1">
            This web application visualizes protein topology (obtained from <a
            href="https://www.uniprot.org/">DeepTMHMM</a>), various relevant protein features
            (obtained from <a href="https://www.uniprot.org/">UniProt</a>) to illustrate patterns
            in their arrangement in relation to the protein topology.
          </Typography>
          <ul className="introduction--ul">
          <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                Search for a protein from ten different species (Human, mouse, yeast, worm, rat, Pyrobaculum, plant,
                fly, fish and Aeropyrum) to visualize from the Uniprot database.
                Search feature is case-insensitive.
              </Typography>
            </li>
            {/*
            #RD OLD CODE
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                Visualization features include inside domain, outside domain, glycosylation sites, O-linked GalNAc sites, O-linked Glc sites, N-linked Glc glycation site,
                phosphoserine sites, phosphothreonine sites, phosphotyrosine sites, disulfide bonds,
                sequon sites, cysteine sites, unoccupied serine sites, unoccupied threonine sites, unoccupied lysine sites, and
                unoccupied tryptophan sites
              </Typography>
            </li>
            #RD END OLD CODE
            */}
            {/* #RD START */}
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                Visualization features include inside domain, outside domain, glycosylation sites, O-linked GalNAc sites, O-linked Glc sites, N-linked Glc glycation site,
                phosphoserine sites, phosphothreonine sites, phosphotyrosine sites, disulfide bonds,
                sequon sites, and cysteine sites.
              </Typography>
            </li>
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                Users may also choose up to four amino acids from all twenty standard amino acids
                (A, R, N, D, C, Q, E, G, H, I, L, K, M, F, P, S, T, W, Y, V) to visualize their
                unoccupied (free) positions, so the display doesn&apos;t get too crowded.
              </Typography>
            </li>
            {/* #RD END */}
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                If the current scale of the visualization is not sufficient to identify patterns, a sliding scale is
                provided
                on the top right of the app bar to horizontally expand the protein.
              </Typography>
            </li>
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                In addition to the sliding scale, there is a window feature for each protein that allows users to target
                a specific
                region for visualization. This feature is located below the original visualization.
              </Typography>
            </li>
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                The legend moves with the page as the user scrolls, keeping the information always within reach.
                The legend and each protein feature can be toggled to enhance viewability. User can also switch between
                proteins features information and scientific symbols of features. The legend is transparent by default,
                unless the user hoover their mouse on the legend to provide visibility,
                and the transparent option can be turned off.
              </Typography>
            </li>
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                An export image feature is provided, allowing users to capture publication-quality snapshots of the
                protein and the window. User can choose between export PDF, PNG or SVG
              </Typography>
            </li>
          </ul>
          <Typography variant="body1">
            Previous Versions:
            <br />
            <Link href="https://sfu-sun-lab.github.io/protein-visualizer/">
              Protein Visualizer 1.0
            </Link>
            <br />
            <Link href="https://mdesai31.github.io/Protein-Visualizer-2.0/">
              Protein Visualizer 2.0
            </Link>

            <Typography variant="body1">
              Tutorial on how to use the visualizer 3.0:&nbsp;
              <Link href="https://www.youtube.com/watch?v=q8QaIdRW02g">
                Youtube Video
              </Link>
            </Typography>
          </Typography>
          <br />
          <Typography variant="body1">
          Please cite following publication(s) when using the visualizer:
          </Typography>
          <ul className="introduction--ul">
            <li className="introduction--bullet">
              <Typography variant="body2" display="inline">
                <Link href='https://doi.org/10.3390/ijms242216182'>
                Discovery and Visualization of the Hidden Relationships among N-Glycosylation, Disulfide Bonds, and Membrane Topology.
                </Link>
                <br/>
                International Journal of Molecular Sciences. 2023; 24(22):16182.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1">
          For further information, contact Dr. Bingyun Sun: bingyun_sun@sfu.ca
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

export default Introduction;
