// DISABLED: metadataHandler.js - No longer needed

// import axios from "axios";
// import fs from "fs";
// import path, { dirname } from "node:path";
// import { fileURLToPath } from "url";
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
//
// const metadataLink = "https://api.deezer.com/search?q=";
// let songMetaData;
//
// const searchSong = async (recievedSong, recievedArtist) => {
//   try {
//     const response = await axios.get(
//       metadataLink +
//         "artist:" +
//         '"' +
//         recievedArtist +
//         '"' +
//         " " +
//         "track:" +
//         '"' +
//         recievedSong +
//         '"'
//     );
//     songMetaData = response.data.data;
//     if (songMetaData && songMetaData.length > 0) {
//       let cover_art_url = songMetaData[0].album.cover_big;
//       await downloadCoverArt(cover_art_url, recievedArtist, recievedSong);
//     }
//   } catch (error) {
//     console.error("An error occured fetching metadata: " + error);
//   }
// };
//
// const downloadCoverArt = async (url, artist, song) => {
//   return new Promise((resolve, reject) => {
//     axios
//       .get(String(url), { method: "get", responseType: "stream" })
//       .then((response) => {
//         // Ensure art directory exists
//         const artDir = path.join(__dirname, "art");
//         if (!fs.existsSync(artDir)) {
//           fs.mkdirSync(artDir, { recursive: true });
//         }
//
//         const writer = fs.createWriteStream(
//           path.join(artDir, artist + " - " + song + ".jpg")
//         );
//
//         response.data.pipe(writer);
//
//         writer.on("finish", () => {
//           console.log("Cover art saved successfully");
//           resolve();
//         });
//
//         writer.on("error", (error) => {
//           console.log("Error occured saving the cover image: " + error);
//           reject(error);
//         });
//       })
//       .catch((error) => {
//         console.error("Error downloading cover art: " + error);
//         reject(error);
//       });
//   });
// };
//
// export default searchSong;
