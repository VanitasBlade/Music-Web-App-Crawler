export const BASE_URL = "https://dabmusic.xyz/";

export const SELECTORS = {
  // tolerate aria-label, partial placeholder, or search input type
  searchInput: 'input[aria-label="Search query"], input[placeholder*="Search"], input[type="search"]',

  // the site uses a submit button inside the form; try submit button first, then a button with text
  searchButton: 'form.flex button[type="submit"], button:has-text("Search")',

  resultsContainer: "div.space-y-2 > div",

  title: "h3",
  artist: "p",

  flacButton: 'button:has-text("FLAC")',
};
