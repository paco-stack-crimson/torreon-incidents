const margin = { top: 20, right: 20, bottom: 200, left: 40 };
const barWidth = 40;
const height = 500 - margin.top - margin.bottom;

Promise.all([
  d3.csv("https://paco-stack-crimson.github.io/torreon-incidents/incidentes.csv"),
  d3.json("https://paco-stack-crimson.github.io/torreon-incidents/datos.json")
]).then(function(files) {

  const csvData = files[0];
  const jsonData = files[1].intersections;

  const jsonLookup = {};
  jsonData.forEach(i => {
    jsonLookup[i.cruce] = i;
  });

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

  const width = barWidth * mergedData.length;

  const svg = d3.select("#chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(mergedData.map(d => d.Crucero))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(mergedData, d => d.total_incidentes)])
    .range([height, 0])
    .nice();

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-65)")
      .style("text-anchor", "end")
      .style("font-size", "10px");

  svg.append("g").call(d3.axisLeft(y));

  const tooltip = d3.select("#tooltip");

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
      .on("mousemove", handleMouseMove)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  svg.selectAll(".label")
    .data(mergedData)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.Crucero) + x.bandwidth() / 2)
      .attr("y", d => y(d.total_incidentes) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(d => d.total_incidentes);

  // Leaflet map
  const map = L.map('map').setView([25.55, -103.4], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

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

  function handleMouseOver(event, d) {
    tooltip
      .style("opacity", 1)
      .html(`
        <strong>${d.Crucero}</strong><br/>
        Incidentes: ${d.total_incidentes}<br/>
        Semaforizado: ${d.semaforizado || "N/D"}<br/>
        ${d.streetView ? `<a href="${d.streetView}" target="_blank">Street View</a>` : ''}
      `);

    if (markers[d.Crucero]) {
      markers[d.Crucero].openPopup();
      map.setView([+d.latitude, +d.longitude], 14);
    }
  }

  function handleMouseMove(event, d) {
    tooltip
      .style("left", (event.offsetX + 15) + "px")
      .style("top", (event.offsetY - 30) + "px");
  }

  function handleMouseOut(event, d) {
    tooltip.style("opacity", 0);
  }

}).catch(function(error) {
  console.error("Error loading one or both data files:", error);
});
