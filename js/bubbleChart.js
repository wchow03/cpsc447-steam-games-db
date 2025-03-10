class BubbleChart {
    constructor(_config, data) {
        this.config = {
            parentElement: _config.parentElement,
            // containerWidth: 1500,
            // containerHeight: 1500,
            containerWidth: 500,
            containerHeight: 500,
            margin: {
                top: 30,
                right: 10,
                bottom: 20,
                left: 30
            }
        };
        this.data = data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Define width and height
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Create SVG container
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Define scales
        vis.sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(vis.data, d => d.stsp_mdntime)])
            // .range([5, 75]); // Bubble radius
            .range([3, 30]); // Bubble radius

        vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Create force simulation
        vis.simulation = d3.forceSimulation(vis.data)
            .force("charge", d3.forceManyBody().strength(5))
            .force("center", d3.forceCenter(vis.width / 2, vis.height / 2))
            .force("collision", d3.forceCollide(d => vis.sizeScale(d.stsp_mdntime) + 2))
            .on("tick", () => vis.renderVis());

        // Select legend container
        vis.legendContainer = d3.select('.bubblechart .legend');

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.legendContainer.selectAll('.legend-item').remove();

        // Extract unique difficulty levels
        let difficultyLevels = [...new Set(vis.data.map(d => d.gfq_difficulty))];

        // Bind difficulty levels to legend
        let legend = vis.legendContainer.selectAll('.legend-item')
            .data(difficultyLevels)
            .join('div')
            .attr('class', 'legend-item');

        // Append color circles
        legend.append('div')
            .style('width', '15px')
            .style('height', '15px')
            .style('border-radius', '50%')
            .style('margin-right', '8px')
            .style('background-color', d => vis.colorScale(d));

        // Append text labels
        legend.append('span')
            .text(d => d ? d : 'Unknown');

        // Filter out invalid data points
        // vis.filteredData = vis.data.filter(d => d.stsp_mdntime > 0 && d.gfq_difficulty);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        let v_tooltip = d3.select("#v_tooltip");

        let dataToUse = vis.filteredData || vis.data;

        // Bind data
        let bubbles = vis.svg.selectAll("circle")
            // .data(vis.filteredData)
            .data(dataToUse)
            .join("circle")
            .attr("r", d => vis.sizeScale(d.stsp_mdntime))
            .attr("fill", d => vis.colorScale(d.gfq_difficulty))
            .attr("opacity", 0.7)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Update positions dynamically
        bubbles.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        // Tooltip on hover
        bubbles.on("mouseover", (event, d) => {
            v_tooltip
                .style("opacity", 1)
                .html(`<strong>${d.name}</strong><br>Difficulty: ${d.gfq_difficulty}<br>Median Playtime: ${d.stsp_mdntime} mins`);
            d3.select(event.target)
                .attr("stroke", "white")
                .attr("stroke-width", 2);

        }).on("mousemove", (event) => {
            v_tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        }).on("mouseout", (event, d) => {
            v_tooltip.style("opacity", 0);
            d3.select(event.target)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        }).on("click", (event, d) => {
            // console.log(`Filtering for difficulty: ${d.gfq_difficulty}`);
            vis.filteredData = vis.data.filter(item => item.gfq_difficulty === d.gfq_difficulty);
            vis.updateVis();
            d3.select("#reset-button").style("display", "block"); // Show reset button
        });
    }
}
