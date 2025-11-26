import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import _ from "https://cdn.jsdelivr.net/npm/lodash/+esm";
import twinnings from "./twinnings.json" with { type: "json" };

class Flavour {
  from = (...all) => new Flavour(...all);
  constructor(id, color, children) {
    this.id = id;
    const label = _.startCase(id);
    Object.assign(this, { id, label });
    this.title = `title: ${label}`;
    this.children = children;
  }
}
const deTwin = (o) =>
  Object.entries(o).map(([k, v]) =>
    v === null ? new Flavour(k) : new Flavour(k, undefined, deTwin(v)),
  );
const twinningsData = {
  name: "TODO",
  children: deTwin(twinnings),
};
console.log(twinningsData.children);
class FlavourWheel extends HTMLElement {
  constructor() {
    super();
  }
  constructChart = ({
    data,
    link, // given a node d, its link (if any)
    linkTarget = "_blank", // the target attribute for links (if any)
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    margin = 1, // shorthand for margins
    marginTop = margin, // top margin, in pixels
    marginRight = margin, // right margin, in pixels
    marginBottom = margin, // bottom margin, in pixels
    marginLeft = margin, // left margin, in pixels
    padding = 1, // separation between arcs
    startAngle = 0, // the starting angle for the sunburst
    endAngle = 2 * Math.PI, // the ending angle for the sunburst
    radius = Math.min(
      width - marginLeft - marginRight,
      height - marginTop - marginBottom,
    ) / 2, // outer radius
    color = d3.interpolateRainbow, // color scheme, if any
    fill = "#ccc", // fill for arcs (if no color encoding)
    fillOpacity = 0.6, // fill opacity for arcs
  }) => {
    const root = d3.hierarchy(data, (d) => d.children);

    // Compute the values of internal nodes by aggregating from the leaves.
    root.count();

    // // Sort the leaves (typically by descending value for a pleasing layout).
    // if (sort != null) root.sort(sort);

    // Compute the partition layout. Note polar coordinates: x is angle and y is radius.
    d3.partition().size([endAngle - startAngle, radius])(root);

    // Construct a color scale.
    if (color != null) {
      color = d3
        .scaleSequential([0, root.children.length], color)
        .unknown(fill);
      root.children.forEach((child, i) => (child.index = i));
    }

    // Construct an arc generator.
    const arc = d3
      .arc()
      .startAngle((d) => d.x0 + startAngle)
      .endAngle((d) => d.x1 + startAngle)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, (2 * padding) / radius))
      .padRadius(radius / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1 - padding);

    const svg = d3
      .create("svg")
      .attr("viewBox", [
        marginRight - marginLeft - width / 2,
        marginBottom - marginTop - height / 2,
        width,
        height,
      ])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle");

    const cell = svg
      .selectAll("a")
      .data(root.descendants())
      .join("a")
      .attr("xlink:href", link == null ? null : (d) => link(d.data, d))
      .attr("target", link == null ? null : linkTarget);

    cell
      .append("path")
      .attr("d", arc)
      .attr(
        "fill",
        color ? (d) => color(d.ancestors().reverse()[1]?.index) : fill,
      )
      .attr("fill-opacity", fillOpacity);

    cell
      .filter((d) => ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 10)
      .append("text")
      .attr("transform", (d) => {
        if (!d.depth) return;
        const x = (((d.x0 + d.x1) / 2 + startAngle) * 180) / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.32em")
      .text((d) => d.data.label);

    cell.append("title").text((d) => d.data.title);

    return svg;
  };
  childFlavourNodes = (e) =>
    e.childNodes.values().filter((e) => e.tagName === "FLAVOUR");
  childFlavours = (e) =>
    this.childFlavourNodes(e).map(
      (e) => new Flavour(e.id, undefined, this.childFlavours(e)),
    );
  get flavours() {
    return this.childFlavours(this);
  }
  connectedCallback() {
    const {
      parentElement: { offsetHeight, offsetWidth },
    } = this;
    const chart = this.constructChart({
      data: twinningsData,
      height: offsetHeight,
      width: offsetWidth,
    });
    const chartElement = chart.node();
      chartElement.setAttribute('preserveAspectRation', 'xMidYMid meet')
    this.prepend(chartElement);
    // window.addEventListener('resize', this.handleResize)
  }
  // disconnectedCallback() {
  //     // this.chart?.dispose()
  //     // window.removeEventListener('resize', this,handleResize)
  // }
}
customElements.define("flavour-wheel", FlavourWheel);
