// Set up the dimensions and margins of the chart
const margin = {top: 20, right: 20, bottom: 200, left: 40};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append the SVG object to the #chart div in your HTML
const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Use Promise.all to load both data files at the same time
Promise.all([
  d3.csv("https://paco-stack-crimson.github.io/torreon-incidents/incidentes.csv"),
  d3.json("https://paco-stack-crimson.github.io/torreon-incidents/datos.json")
]).then(function(files) {

  const trafficData = files[0];
  const intersectionsData = files[1].intersections;

  // Format the data: convert "TOTAL DE INCIDENTES" to a number
  trafficData.forEach(d => {
    d["TOTAL DE INCIDENTES"] = +d["TOTAL DE INCIDENTES"];
  });

  // Debugging: Check for NaN or invalid values after conversion
  trafficData.forEach(d => {
    if (isNaN(d["TOTAL DE INCIDENTES"])) {
      console.warn("Invalid TOTAL DE INCIDENTES detected:", d);
      d["TOTAL DE INCIDENTES"] = 0; // fallback to 0 to avoid NaN errors
    }
  });
  console.log("Cleaned trafficData:", trafficData);

  // Set up the X axis scale (Intersections)
  const x = d3.scaleBand()
    .domain(trafficData.map(d => d.Crucero))
    .range([0, width])
    .padding(0.1);

  // Set up the Y axis scale (Incident Count)
  const y = d3.scaleLinear()
    .domain([0, d3.max(trafficData, d => d["TOTAL DE INCIDENTES"])])
    .range([height, 0]);

  // Add the X axis to the SVG
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-65)")
      .style("text-anchor", "end");

  // Add the Y axis to the SVG
  svg.append("g")
    .call(d3.axisLeft(y));

  // Create the bars for the bar chart with debugging
  svg.selectAll("rect")
    .data(trafficData)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Crucero))
      .attr("y", d => {
        const val = d["TOTAL DE INCIDENTES"];
        const yVal = y(val);
        if (isNaN(val) || isNaN(yVal)) {
          console.error(`Invalid value or scale for TOTAL DE INCIDENTES: val=${val}, yVal=${yVal}`, d);
        }
        return yVal;
      })
      .attr("width", x.bandwidth())
      .attr("height", d => {
        const val = d["TOTAL DE INCIDENTES"];
        const yVal = y(val);
        const barHeight = height - yVal;
        if (isNaN(barHeight)) {
          console.error(`Invalid barHeight: height=${height}, yVal=${yVal}, barHeight=${barHeight}`, d);
          return 0;  // Prevent NaN height error
        }
        return barHeight;
      })
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  // Event handlers for interactivity
  function handleMouseOver(event, d) {
    const infoBox = d3.select(".intersection-info");
    const matchingIntersection = intersectionsData.find(i => i.cruce === d.Crucero);

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

  function handleMouseOut(event, d) {
    // Optional: Clear the info box when not hovering
    // d3.select("#intersection-name").text("");
    // d3.select("#total-incidents").text("");
    // d3.select("#semaforizado-status").text("");
    // d3.select("#street-view").html("");
  }

}).catch(function(error) {
  console.log("Error loading one or both data files:", error);
});
