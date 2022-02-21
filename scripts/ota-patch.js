const fs = require("fs");
const { argv, exit } = require("process");
const [argvContext] = argv.splice(2);

const contexts = {
  context__ghen_20b() {
    fs.unlinkSync("../data/pl/ghen@latest.900.bin.gz");
    fs.copyFileSync(
      "../config/pl/ghen@2.0b.900.bin.gz",
      "../data/pl/ghen@latest.900.bin.gz"
    );
    fs.unlinkSync("../data/menu.json.gz");
    fs.copyFileSync(
      "../config/pl/ghen@2.0b.900.json.gz",
      "../data/menu.json.gz"
    );
  },
};
const context = {
  "ghen-20b": "context__ghen_20b",
};

if (argvContext !== "") {
  console.log(`Run ${argvContext}`);
  contexts["context__" + argvContext]();
}
