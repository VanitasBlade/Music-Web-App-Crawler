import { SELECTORS } from "./config.js";

export async function downloadSong(page, songElement, folderPath) {
  const flacButton = songElement.locator(
    SELECTORS.flacButton
  );

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    flacButton.click(),
  ]);

  const filename = download.suggestedFilename();

  await download.saveAs(`${folderPath}/${filename}`);

  return filename;
}
