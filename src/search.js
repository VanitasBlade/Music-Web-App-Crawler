import { SELECTORS } from "./config.js";

export async function searchSongs(page, query) {
  // Fill search input
  await page.fill(SELECTORS.searchInput, query);

  // Click search
  await page.click(SELECTORS.searchButton);

  // Wait for results to load
  await page.waitForSelector(SELECTORS.resultsContainer, {
    timeout: 10000,
  });

  const results = page.locator(SELECTORS.resultsContainer);
  const count = await results.count();

  const songs = [];

  for (let i = 0; i < count; i++) {
    const result = results.nth(i);

    const title = await result
      .locator(SELECTORS.title)
      .textContent();

    const artist = await result
      .locator(SELECTORS.artist)
      .first()
      .textContent();

    songs.push({
      index: i,
      title: title?.trim() || "Unknown",
      artist: artist?.trim() || "Unknown",
      element: result,
    });
  }

  return songs;
}
