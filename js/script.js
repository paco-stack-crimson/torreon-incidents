// Set up the dimensions and margins of the chart
const margin = { top: 20, right: 20, bottom: 200, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append the SVG object to the #chart div in your HTML
const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load CSV and JSON using Promise.all
Promise.all([
  // ✅ NOTE: lowercase filename to match your GitHub repo
  d3.csv("incidentes.csv", d => {
    return {
      crucero: d["Crucero"].trim(),
      semaforizado: d["SEMAFORIZADOS"].trim(),
      total_incidentes: +d["TOTAL DE INCIDENTES"],
      lat: +d["LATITUDE"],
      lng: +d["LONGITUDE"],
      street_view: d["STREET VIEW URL"]
    };
  }),
  d3.json("datos.json") // Make sure this path is correct too
]).then(function([trafficData, jsonData]) {

  const intersectionsData = jsonData.intersections;

  // Aggregate data by 'crucero' (in case there are duplicates)
  const aggregatedData = Array.from(
    d3.rollup(
      trafficData,
      v => ({
        total_incidentes: d3.sum(v, d => d.total_incidentes),
        semaforizado: v[0].semaforizado,
        street_view: v[0].street_view,
        crucero: v[0].crucero
      }),
      d => d.crucero
    ).values()
  );

  // X scale (Intersections)
  const x = d3.scaleBand()
    .domain(aggregatedData.map(d => d.crucero))
    .range([0, width])
    .padding(0.1);

  // Y scale (Incident Count)
  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregatedData, d => d.total_incidentes)])
    .range([height, 0]);

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-65)")
      .style("text-anchor", "end");

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add bars
  svg.selectAll("rect.bar")
    .data(aggregatedData)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.crucero))
      .attr("y", d => y(d.total_incidentes))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.total_incidentes))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  // Interactivity: Mouseover
  function handleMouseOver(event, d) {
    const infoBox = d3.select(".intersection-info");

    // Match intersection from JSON
    const matchingIntersection = intersectionsData.find(i =>
      i.cruce.trim().toLowerCase() === d.crucero.trim().toLowerCase()
    );

    if (matchingIntersection) {
      d3.select("#intersection-name").text(matchingIntersection.cruce);
      d3.select("#total-incidents").text("Total de Incidentes: " + matchingIntersection.incidents);
      d3.select("#semaforizado-status").text("Semaforizado: " + matchingIntersection.semaforizado);

      const streetViewUrl = matchingIntersection.streetView;
      if (streetViewUrl) {
        d3.select("#street-view").html(`<img src="${streetViewUrl}" alt="Street View" style="width:100%; height:auto;">`);
      }
    }
  }

  // Interactivity: Mouseout
  function handleMouseOut(event, d) {
    // Optional: clear the info box when the mouse leaves the bar
    // d3.select("#intersection-name").text("");
    // d3.select("#total-incidents").text("");
    // d3.select("#semaforizado-status").text("");
    // d3.select("#street-view").html("");
  }

}).catch(function(error) {
  console.error("Error loading one or both data files:", error);
});
