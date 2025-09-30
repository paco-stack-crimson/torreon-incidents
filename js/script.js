// Load data
d3.csv("Incidentes.csv").then(function(data) {
  data.forEach(d => {
    d.total_incidentes = +d.total_incidentes;
  });

  // Dimensions
  const margin = { top: 30, right: 20, bottom: 40, left: 50 },
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // SVG
  const svg = d3.select("#chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (index only)
  const x = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([0, width]);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total_incidentes)])
    .range([height, 0]);

  // Line
  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d.total_incidentes));

  // Draw line
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Circles
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", (d, i) => x(i))
      .attr("cy", d => y(d.total_incidentes))
      .attr("r", 5)
      .attr("fill", "orange")
      .on("mouseover", function(event, d) {
        // Update info panel
        d3.select("#info-totales").text(d.total_incidentes);
        d3.select("#info-semaforo").text(d.semaforizado);

        // Update Street View iframe
        if (d.street_view) {
          d3.select("#street-view-frame")
            .attr("src", d.street_view);
        } else {
          d3.select("#street-view-frame").attr("src", "");
        }

        d3.select(this).attr("fill", "red");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "orange");
      });

  // Y axis
  svg.append("g").call(d3.axisLeft(y));

  // X axis (no labels)
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(0));
}).catch(function(error) {
  console.error("Error loading data:", error);
});
