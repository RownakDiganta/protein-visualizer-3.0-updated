// src/App.test.js
// Default create-react-app smoke test for the App component.
// Renders <App /> and asserts the intro text is present in the DOM.
/* eslint-disable no-undef */
import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(
    'Disulfide bond and Glycoslyation Visualization'
  );
  expect(linkElement).toBeInTheDocument();
});
