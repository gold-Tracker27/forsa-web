const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "email-logo.svg");
const dest = path.join(__dirname, "..", "public", "email-logo.png");

// بيتعرض في الإيميل بعرض 160px×40px، بنولّده أكبر (800×200 = مضاعف 5x) عشان يبان حاد
// وواضح على شاشات retina بدل ما يبان مفرود (blurry) زي أي صورة عادية بتتصغّر بس.
sharp(src, { density: 288 })
  .resize(800, 200)
  .png()
  .toFile(dest)
  .then((info) => {
    console.log("wrote", dest, info.width, "x", info.height);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
