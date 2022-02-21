const fs = require("fs");
const path = require("path");
const { gzip, ungzip } = require("node-gzip");
/**
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
var copyRecursiveSync = function (src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    if (src.includes("index.html") || src.includes("index-cached.html")) {
      fs.writeFileSync(
        dest,
        fs
          .readFileSync(src, "utf8")
          .replace(
            "<xhost-inject></xhost-inject>",
            `<script>${fs.readFileSync(
              path.resolve(__dirname, "../config/plugins.js"),
              "utf8"
            )}</script>`
          ),
        "utf8"
      );
      return;
    }
    if (
      src.includes("docs/") &&
      !src.includes("node_modules") &&
      !src.includes(".DS_Store") &&
      !src.includes(".gitignore") &&
      !src.includes("package.json") &&
      !src.includes("package-lock.json")
    ) {
      fs.copyFileSync(src, dest);
    }
  }
};

async function compressRecursiveSync(src, dest) {
  dest = dest.replace("docs/", "");
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function (childItemName) {
      compressRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    const buffer = await gzip(fs.readFileSync(src));
    fs.writeFileSync(dest + ".gz", buffer);
  }
}

// TODO unmock this
const source = path.resolve(__dirname, "../../xhost/docs");

const tmp = path.resolve(__dirname, "../frontend-gz");

const target = path.resolve(__dirname, "../data");

if (fs.existsSync(tmp)) {
  fs.rmdirSync(tmp, { recursive: true });
}
if (fs.existsSync(target)) {
  fs.rmdirSync(target, { recursive: true });
}

fs.copyFileSync(
  source + "/js/core.js",
  path.resolve(__dirname, "../src/www/js/core.js")
);
fs.copyFileSync(
  source + "/js/index.js",
  path.resolve(__dirname, "../src/www/js/index.js")
);
fs.copyFileSync(
  source + "/js/plugins.js",
  path.resolve(__dirname, "../src/www/js/plugins.js")
);
fs.copyFileSync(
  source + "/css/styles.css",
  path.resolve(__dirname, "../src/www/css/styles.css")
);
/* CLONE SOURCE TO TMP*/
copyRecursiveSync(source, tmp);

// /* HOOKS */
// fs.copyFileSync(
//   path.resolve(__dirname, "../config/menu.json"),
//   tmp + "/menu.json"
// );

/* COMPRESS */
compressRecursiveSync(tmp, target);

fs.rmdirSync(tmp, { recursive: true });

/* SETUP INLINER */
const inliner = require("html-inline");
var concat = require("concat-stream");
const inline = inliner({
  basedir: __dirname + "/../src/www",
  ignoreImages: true,
});
const r = fs.createReadStream(__dirname + "/../src/www/setup.html");
r.pipe(inline).pipe(
  concat(function (body) {
    fs.writeFileSync(
      __dirname + "/../src/www/index.html",
      body.toString(),
      "utf8"
    );
  })
);
