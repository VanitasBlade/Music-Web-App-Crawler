import fs from "fs";
import { chromium } from "playwright";
import promptSync from "prompt-sync";
// import searchSong from "./metadataHandler.js";

const prompt = promptSync();
const mainLink = "https://dabmusic.xyz/";
const fallbackLink = "https://us.qobuz.squid.wtf/";

(async () => {
  console.log(`
   _____  ___  ______ 
  / _ \\ \\/ / |/ / __ \\
 / // /\\  /    / /_/ /
/____/ /_/_/|_/\\____/ 
`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Ensure songs directory exists
  if (!fs.existsSync("./songs")) {
    fs.mkdirSync("./songs", { recursive: true });
  }

  // Step 1: Route to dabmusic.xyz
  console.log(" 🌐 Routing to dabmusic.xyz...");
  await page.goto(mainLink);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  // Step 2: Get song search query from user
  const searchQuery = prompt("🔍 Enter song name to search: ");

  if (!searchQuery.trim()) {
    console.log(" ❌ Search query is empty. Exiting...");
    await context.close();
    await browser.close();
    process.exit(0);
  }

  // Step 3: Perform search
  console.log(" 🔍 Searching for: " + searchQuery);
  const searchBox = page.getByRole("textbox", { name: "Search query" });
  await searchBox.waitFor({ timeout: 60000 });
  await searchBox.click({ timeout: 60000 });
  await searchBox.fill(searchQuery);
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Search", exact: true }).click({ timeout: 60000 });
  await page.waitForTimeout(3000);

  // Step 4: Get all search results
  const songResults = await page.locator("div.space-y-2 > div").all();

  if (songResults.length === 0) {
    console.log(" ❌ No search results found. Exiting...");
    await context.close();
    await browser.close();
    process.exit(0);
  }

  console.log(" ✅ Found " + songResults.length + " result(s):\n");

  // Display all search results
  for (let i = 0; i < songResults.length; i++) {
    const titleElement = await songResults[i].locator("h3, span.font-semibold").first();
    const artistElement = await songResults[i].locator("p, span.text-gray-400").nth(1);
    
    const title = await titleElement.textContent();
    const artist = await artistElement.textContent();

    console.log(" [" + (i + 1) + "] " + (title || "Unknown") + " - " + (artist || "Unknown"));
  }

  console.log("");

  // Step 5: Let user select which song to download
  const selectionStr = prompt("📌 Enter the number of the song to download: ");
  const selection = parseInt(selectionStr) - 1;

  if (isNaN(selection) || selection < 0 || selection >= songResults.length) {
    console.log(" ❌ Invalid selection. Exiting...");
    await context.close();
    await browser.close();
    process.exit(0);
  }

  console.log(" 📥 Downloading selected song...");

  // Step 6: Download the FLAC file for selected song
  const selectedSong = songResults[selection];
  
  // Click the download button for the selected song (4th button in the flex container)
  const downloadButton = selectedSong.locator(".flex.items-center.gap-2 > button:nth-child(4)");
  
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click({ timeout: 60000 }),
  ]);

  const filename = download.suggestedFilename();
  console.log(" 💾 Saving: " + filename);
  await download.saveAs(`./songs/${filename}`);

  console.log(" ✅ Download complete!");
  await context.close();
  await browser.close();
})();
