import {
  parse
} from "./chunk-UU3US5Z2.js";
import "./chunk-XTFW5EBP.js";
import "./chunk-6XWKBBWC.js";
import "./chunk-AKZTESLG.js";
import "./chunk-5ZXIYLMV.js";
import "./chunk-BMTHYYMT.js";
import "./chunk-DDZBPCG4.js";
import "./chunk-LTOXM6LK.js";
import "./chunk-XSXQ5NBI.js";
import "./chunk-LM2N6OCS.js";
import "./chunk-5D7DEKJR.js";
import "./chunk-PZY4AN47.js";
import {
  selectSvgElement
} from "./chunk-V2TUSZJX.js";
import {
  configureSvgSize
} from "./chunk-UOZIRJJG.js";
import {
  __name,
  log
} from "./chunk-PIWDDETO.js";
import "./chunk-VFZ7F5ZU.js";
import "./chunk-DC5AMYBS.js";

// node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-5YYISTIA.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.15.0" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-5YYISTIA-UYJIFS52.js.map
