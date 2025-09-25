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

// Load data files simultaneously
Promise.all([
  d3.csv("https://paco-stack-crimson.github.io/torreon-incidents/incidentes.csv"),
  d3.json("https://paco-stack-crimson.github.io/torreon-incidents/datos.json")
]).then(function(files) {

  const trafficData = files[0];
  const intersectionsData = files[1].intersections;

  // Debug: log first few rows to check data structure
  console.log("Sample traffic data:", trafficData.slice(0,3));

  // Convert total_incidentes to number and check for validity
  trafficData.forEach(d => {
    if (d.total_incidentes) {
      d.total_incidentes = +d.total_incidentes;
      if (isNaN(d.total_incidentes)) {
        console.warn("Invalid total_incidentes value for entry:", d);
        d.total_incidentes = 0; // fallback
      }
    } else {
      console.warn("Missing total_incidentes for entry:", d);
      d.total_incidentes = 0; // fallback
    }
  });

  // X axis: scale for intersections (Crucero)
  const x = d3.scaleBand()
    .domain(trafficData.map(d => d.Crucero))
    .range([0, width])
    .padding(0.1);

  // Y axis: scale for total incidents
  const y = d3.scaleLinear()
    .domain([0, d3.max(trafficData, d => d.total_incidentes)])
    .range([height, 0])
    .nice();

  // Add X axis to SVG and rotate labels for readability
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-65)")
      .style("text-anchor", "end");

  // Add Y axis to SVG
  svg.append("g")
    .call(d3.axisLeft(y));

  // Draw bars
  svg.selectAll("rect")
    .data(trafficData)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Crucero))
      .attr("y", d => y(d.total_incidentes))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.total_incidentes))
      .attr("fill", "#69b3a2")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  // Add text labels on top of each bar showing total incidents
  svg.selectAll(".label")
    .data(trafficData)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.Crucero) + x.bandwidth() / 2)
      .attr("y", d => y(d.total_incidentes) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.total_incidentes);

  // Mouseover event: show intersection info and street view
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

  // Mouseout event: clear info box (optional)
  function handleMouseOut(event, d) {
    // Uncomment below lines if you want to clear info on mouse out
    // d3.select("#intersection-name").text("");
    // d3.select("#total-incidents").text("");
    // d3.select("#semaforizado-status").text("");
    // d3.select("#street-view").html("");
  }

}).catch(function(error) {
  console.error("Error loading one or both data files:", error);
});
