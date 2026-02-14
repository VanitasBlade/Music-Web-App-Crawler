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
  } catch (e) {
    console.warn("WARN: input not visible within 15s, will try attached+DOM fallback");
    const fallback = 'input[placeholder*="Search"], input[type="search"], input';
    try {
      // wait until an input is attached to the DOM (may still be hidden)
      await page.waitForSelector(fallback, { state: "attached", timeout: 15000 });
    } catch (e2) {
      console.warn("WARN: no input attached within 15s");
      // continue; we'll attempt evaluate-based find later which will handle nulls
    }
  }

  // attempt to fill the input robustly
  let inputLocator = page.locator(inputSelector).first();
  let filled = false;

  // helper: try a locator if present and visible
  const tryLocatorFill = async (loc) => {
    try {
      if ((await loc.count()) && (await loc.isVisible())) {
        await loc.fill(query, { timeout: 20000 });
        return true;
      }
    } catch (e) {}
    return false;
  };

  // 1) Try primary locator on main page
  filled = await tryLocatorFill(inputLocator);

  // 2) Try explicit aria-labeled input
  if (!filled) {
    inputLocator = page.locator('input[aria-label="Search query"]').first();
    filled = await tryLocatorFill(inputLocator);
  }

  // 3) Try all frames (covers iframes) and use DOM-based set for shadow roots
  if (!filled) {
    const frames = page.frames();
    for (const f of frames) {
      try {
        const ok = await f.evaluate((q) => {
          // recursively search root + shadow roots for an input-like element
          function findInRoot(root) {
            const selectors = [
              'input[aria-label="Search query"]',
              'input[placeholder*="Search"]',
              'input[type="search"]',
              'input',
              '[contenteditable="true"]',
              'div[role="search"]',
              'textarea'
            ];

            for (const s of selectors) {
              const el = root.querySelector(s);
              if (el) return el;
            }

            const all = root.querySelectorAll('*');
            for (const node of all) {
              if (node.shadowRoot) {
                const found = findInRoot(node.shadowRoot);
                if (found) return found;
              }
            }
            return null;
          }

          const el = findInRoot(document);
          if (!el) return false;
          try {
            if (el.disabled) el.disabled = false;
            // set both value and attribute, dispatch input events
            el.value = q;
            el.setAttribute && el.setAttribute('value', q);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.focus && el.focus();
            // try click to ensure frameworks pick up the change
            try { el.click && el.click(); } catch(e) {}
            return true;
          } catch (err) {
            return false;
          }
        }, query);

        if (ok) {
          filled = true;
          console.log('INFO: search input set via frame/shadow fallback');
          break;
        }
      } catch (e) {}
    }
  }

  // 4) Final DOM fallback on main document
  if (!filled) {
    const ok = await page.evaluate((q) => {
      const el =
        document.querySelector('input[aria-label="Search query"]') ||
        document.querySelector('input[placeholder*="Search"]') ||
        document.querySelector('input[type="search"]') ||
        document.querySelector('input') ||
        document.querySelector('[contenteditable="true"]') ||
        document.querySelector('div[role="search"]') ||
        document.querySelector('textarea');
      if (!el) return false;
      try {
        if (el.disabled) el.disabled = false;
        el.value = q;
        el.setAttribute && el.setAttribute('value', q);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus && el.focus();
        el.blur && el.blur();
        return true;
      } catch (err) {
        return false;
      }
    }, query);

    if (!ok) {
      throw new Error('Unable to locate or set any input element on page');
    } else {
      console.log('INFO: search input set via DOM fallback');
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
