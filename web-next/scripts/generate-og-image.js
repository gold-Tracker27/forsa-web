const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "og-image.svg");
const dest = path.join(__dirname, "..", "public", "og-image.png");

sharp(src, { density: 288 })
  .resize(1200, 630)
  .png()
  .toFile(dest)
  .then((info) => {
    console.log("wrote", dest, info.width, "x", info.height);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
