import { SELECTORS } from "./config.js";
export async function searchSongs(page, query) {
  // ensure page finished loading
  await page.waitForLoadState("networkidle");

  // dismiss common overlays/cookies if present
  try {
    const overlays = page.locator(
      'button:has-text("Accept"), button:has-text("I agree"), button:has-text("Close"), button:has-text("Got it")'
    );
    const overlayCount = await overlays.count();
    for (let i = 0; i < overlayCount; i++) {
      const b = overlays.nth(i);
      if (await b.isVisible()) {
        await b.click().catch(() => {});
      }
    }
  } catch (e) {}

  // wait for the input with a visible state, use fallback if needed
  const inputSelector = SELECTORS.searchInput;
  try {
    await page.waitForSelector(inputSelector, { state: "visible", timeout: 15000 });
  } catch {
    const fallback = 'input[placeholder*="Search"], input[type="search"], input';
    await page.waitForSelector(fallback, { state: "visible", timeout: 15000 });
  }

  // attempt to fill the input robustly
  let inputLocator = page.locator(inputSelector).first();
  try {
    if (!(await inputLocator.isVisible())) throw new Error("not visible");
    await inputLocator.fill(query, { timeout: 20000 });
  } catch {
    try {
      inputLocator = page.locator('input[aria-label="Search query"]').first();
      await inputLocator.fill(query, { timeout: 20000 });
    } catch {
      // last-resort: set value via DOM
      await page.evaluate((q) => {
        const el =
          document.querySelector('input[aria-label="Search query"]') ||
          document.querySelector('input[placeholder*="Search"]') ||
          document.querySelector('input[type="search"]') ||
          document.querySelector('input');
        if (el) {
          el.value = q;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, query);
    }
  }

  // submit search: try form submit button, then fallback to Enter
  try {
    await page.click(SELECTORS.searchButton, { timeout: 10000 });
  } catch {
    try {
      await inputLocator.press('Enter');
    } catch {
      await page.keyboard.press('Enter');
    }
  }

  // wait for results container
  await page.waitForSelector(SELECTORS.resultsContainer, { timeout: 20000 });

  const results = page.locator(SELECTORS.resultsContainer);
  const count = await results.count();

  const songs = [];

  for (let i = 0; i < count; i++) {
    const result = results.nth(i);

    const title = (await result.locator(SELECTORS.title).textContent())?.trim() || 'Unknown';
    const artist = (await result.locator(SELECTORS.artist).first().textContent())?.trim() || 'Unknown';

    songs.push({
      index: i,
      title,
      artist,
      element: result,
    });
  }

  return songs;
}
