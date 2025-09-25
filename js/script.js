const margin = {top: 20, right: 20, bottom: 200, left: 40};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

Promise.all([
  d3.csv("https://paco-stack-crimson.github.io/torreon-incidents/incidentes.csv"),
  d3.json("https://paco-stack-crimson.github.io/torreon-incidents/datos.json")
]).then(function(files) {

  const csvData = files[0];
  const jsonData = files[1].intersections;

  // Build lookup from JSON by cruce string
  const jsonLookup = {};
  jsonData.forEach(i => {
    jsonLookup[i.cruce] = i;
  });

  // Merge CSV + JSON rows
  const mergedData = csvData.map(d => {
    d.total_incidentes = +d.total_incidentes || 0;
    const extra = jsonLookup[d.Crucero] || {};
    return {
      Crucero: d.Crucero,
      total_incidentes: d.total_incidentes || extra.incidents || 0,
      semaforizado: extra.semaforizado || "",
      latitude: extra.latitude || null,
      longitude: extra.longitude || null,
      streetView: extra.streetView || ""
    };
  });

  // D3 X axis
  const x = d3.scaleBand()
    .domain(mergedData.map(d => d.Crucero))
    .range([0, width])
    .padding(0.1);

  // D3 Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(mergedData, d => d.total_incidentes)])
    .range([height, 0])
    .nice();

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-65)")
      .style("text-anchor", "end");

  svg.append("g").call(d3.axisLeft(y));

  // Bars
  svg.selectAll("rect")
    .data(mergedData)
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

  // Labels
  svg.selectAll(".label")
    .data(mergedData)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.Crucero) + x.bandwidth() / 2)
      .attr("y", d => y(d.total_incidentes) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.total_incidentes);

  // Leaflet map
  const map = L.map('map').setView([25.55, -103.4], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Markers + keep references
  const markers = {};
  mergedData.forEach(d => {
    if (d.latitude && d.longitude) {
      markers[d.Crucero] = L.marker([+d.latitude, +d.longitude])
        .addTo(map)
        .bindPopup(`
          <b>${d.Crucero}</b><br>
          Total de Incidentes: ${d.total_incidentes}<br>
          Semaforizado: ${d.semaforizado}<br>
          ${d.streetView ? `<a href="${d.streetView}" target="_blank">Street View</a>` : ''}
        `);
    }
  });

  // Hover handlers
  function handleMouseOver(event, d) {
    d3.select("#intersection-name").text(d.Crucero);
    d3.select("#total-incidents").text("Total de Incidentes: " + d.total_incidentes);
    d3.select("#semaforizado-status").text("Semaforizado: " + d.semaforizado);

    if (d.streetView) {
      d3.select("#street-view").html(
        `<iframe src="${d.streetView}" width="100%" height="300" style="border:0;" allowfullscreen></iframe>`
      );
    }

    if (markers[d.Crucero]) {
      markers[d.Crucero].openPopup();
      map.setView([+d.latitude, +d.longitude], 14);
    }
  }

  function handleMouseOut(event, d) {
    // optional clear
  }

}).catch(function(error) {
  console.error("Error loading one or both data files:", error);
});
