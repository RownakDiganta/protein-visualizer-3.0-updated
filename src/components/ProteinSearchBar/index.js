// src/components/ProteinSearchBar/index.js
// Text input + Search button for looking up a protein by its UniProt accession number.
// Uppercases input as it's typed and submits on button click or Enter key.
import React, { useState } from 'react';
import FormControl from '@material-ui/core/FormControl';
import './index.scss';
// #RD OLD CODE
// import { Button, OutlinedInput, InputLabel } from '@material-ui/core';
// #RD END OLD CODE
// #RD START
// InputLabel (MUI's floating label) is no longer used - see the render method below
// for why it was replaced with a plain static Typography label.
import { Button, OutlinedInput, Typography } from '@material-ui/core';
// #RD END
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

/*
 * Protein search bar to search proteins in Uniprot database by their accession number.
 */
function SearchBar(props) {
  const [accessionNum, setAccessionNum] = useState('');

  //this function deals with individual character changes within the textfield
  const handleChange = (event) => {
    event.preventDefault();

    const value = event.target.value.toUpperCase();
    setAccessionNum({
      ...accessionNum,
      value
    });
  };
  //this function triggers when the submit button is hit
  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit(accessionNum);
  };

  //this function triggers when hit enter on the input bar
  const handleKeyUp = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  return (
    <MuiThemeProvider>
      <FormControl className="search-form">
        {/* #RD OLD CODE
        <InputLabel style={{ marginLeft: '0.4rem' }}>
          Protein Accession Number
        </InputLabel>
        <InputLabel shrink htmlFor="search-bar" style={{ marginLeft: '0.4rem' }}>
          Protein Accession Number
        </InputLabel>
        <Typography className="search-form__label">
          Protein Accession Number
        </Typography>
        #RD END OLD CODE */}
        {/* #RD OLD CODE
        <Typography className="search-form__label">
          Protein Accession
          <br />
          Number
        </Typography>
        <OutlinedInput
          id="search-bar"
          style={{ marginTop: '1.0rem' }}
          placeholder="Ex. P04439"
          onChange={handleChange}
          onKeyUp={handleKeyUp}
        />
        #RD END OLD CODE */}
        {/* #RD START */}
        {/* Static, centered, two-line label instead of MUI's floating InputLabel -
            the floating label (even with shrink) still overlapped the outlined
            box/typed value in both empty and filled states.
            The OutlinedInput now comes BEFORE the label in the DOM (with the label
            visually restored to the top via CSS `order: -1` in index.scss) so a pure
            CSS sibling selector - .Mui-focused ~ .search-form__label - can make the
            label glow while the input is focused, with no JS focus-tracking needed. */}
        <OutlinedInput
          id="search-bar"
          style={{ marginTop: '1.0rem' }}
          placeholder="Ex. P04439"
          onChange={handleChange}
          onKeyUp={handleKeyUp}
        />
        <Typography className="search-form__label">
          Protein Accession
          <br />
          Number
        </Typography>
        {/* #RD END */}
      </FormControl>
      <Button
        type="submit"
        variant="contained"
        style={{ marginTop: '1.5rem', marginLeft: '0.3rem' }}
        onClick={handleSubmit}
      >
        Search
      </Button>
    </MuiThemeProvider>
  );
}

export default SearchBar;
