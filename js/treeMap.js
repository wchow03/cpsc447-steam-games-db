class TreeMap {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    // Todo: Add or remove parameters from the constructor as needed
    constructor(_config, data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 700,
            containerHeight: 300,
            margin: {
                top: 5,
                right: 5,
                bottom: 5,
                left: 5
            }
            // Todo: Add or remove attributes from config as needed
        }
        this.data = data;
        this.level = 1; // 1 = difficulty level, 2 = rating level
        this.initVis();
    }

    initVis() {
        let vis = this;
        // Todo: Create SVG area, initialize scales and axes
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

        // Define clipping boundary
        vis.clipPolygon = [
            [0, 0],
            [0, vis.height],
            [vis.width, vis.height],
            [vis.width, 0]
        ];

        // Define color scale for difficulty
        vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Select legend container
        vis.legendContainer = d3.select('.treemap .legend');

        vis.updateVis();

    }

    updateVis() {
        let vis = this;
        //Todo: Prepare data and scales
        // Convert data to hierarchical structure

        let dataToUse = vis.filteredData || vis.data;

        if (vis.level === 1) {
            vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        } else {
            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateBlues)
                .domain([0, 100]); // assuming avg_rating is on a 0–100 scale
        }

        vis.legendContainer.selectAll('*').remove();

        if (vis.level === 1) {
            let difficultyLevels = [...new Set(vis.data.map(d => d.gfq_difficulty))];

            let legend = vis.legendContainer.selectAll('.legend-item')
                .data(difficultyLevels)
                .join('div')
                .attr('class', 'legend-item');

            legend.append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('border-radius', '50%')
                .style('margin-right', '8px')
                .style('background-color', d => vis.colorScale(d));

            legend.append('span')
                .text(d => d ? d : 'Unknown');

        } else {
            // Continuous color legend for avg_rating
            const gradientId = "legend-gradient";

            // Remove old SVG if any
            vis.legendContainer.selectAll('svg').remove();

            const svg = vis.legendContainer.append("svg")
                .attr("width", 300)
                .attr("height", 50);

            const defs = svg.append("defs");
            const linearGradient = defs.append("linearGradient")
                .attr("id", gradientId);

            linearGradient.selectAll("stop")
                .data([
                    { offset: "0%", color: vis.colorScale(0) },
                    { offset: "100%", color: vis.colorScale(100) }
                ])
                .join("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            svg.append("rect")
                .attr("x", 10)
                .attr("y", 0)
                .attr("width", 280)
                .attr("height", 10)
                .style("fill", `url(#${gradientId})`);

            const legendScale = d3.scaleLinear()
                .domain([0, 100])
                .range([10, 280]);

            const axis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickSize(4)
                .tickFormat(d => d);

            svg.append("g")
                .attr("transform", "translate(0, 12)")
                .call(axis)
                .call(g => g.select(".domain").remove()) // optional: remove axis line
                .selectAll("text")
                .style("text-anchor", "middle"); // center align tick labels

            svg.append("text")
                .attr("x", 150) // center (half of 300 width)
                .attr("y", 40) // below the axis
                .attr("text-anchor", "middle")
                .style("fill", "#c7d5e0")
                .style("font-size", "14px")
                .style("font-family", "'Motiva Sans', Arial, Helvetica, sans-serif")
                .text("Average Rating");
        }



        let rootNode = d3.hierarchy({ children: dataToUse })
            .sum(d => d.stsp_mdntime) // Size of the cell based on median playtime
            .sort((a, b) => b.value - a.value);

        // Compute Voronoi Treemap
        let voronoiTreemap = d3.voronoiTreemap().clip(vis.clipPolygon);
        voronoiTreemap(rootNode);

        vis.renderVis(rootNode);
    }

    renderVis(rootNode) {
        let vis = this;
        // Todo: Bind data to visual elements, update axes

        // Flatten hierarchy into nodes
        let nodes = rootNode.descendants();

        //Select tooltip
        let v_tooltip = d3.select("#v_tooltip");

        // Bind data to paths
        let cells = vis.svg.selectAll('path')
            .data(nodes)
            .join('path')
            .attr('d', d => d3.line()(d.polygon) + 'z') // Convert polygon data to path
            .attr('fill', d =>
                vis.level === 1
                    ? vis.colorScale(d.data.gfq_difficulty)
                    : vis.colorScale(typeof d.data.avg_rating === "number" ? d.data.avg_rating : 0)
            )
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                v_tooltip
                    .style("opacity", 1)
                    .html(`
                            <strong>${d.data.name}</strong><br>
                            Difficulty: ${d.data.gfq_difficulty || 'N/A'}<br>
                            Median Playtime: ${d.data.stsp_mdntime || 'N/A'} mins<br>
                            Average Rating: ${d.data.avg_rating !== undefined ? d.data.avg_rating.toFixed(1) : 'N/A'}<br>
                            Number of Owners: ${d.data.stsp_owners || 'N/A'}
                    `)
                d3.select(event.target)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);
            }).on("mousemove", (event) => {
                v_tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            }).on('mouseout', (event, d) => {
                v_tooltip.style("opacity", 0);
                d3.select(event.target)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);
            }).on("click", (event, d) => {
                if (vis.level === 1) {
                    //console.log(`Filtering for difficulty: ${d.data.gfq_difficulty}`);
                    vis.filteredData = vis.data.filter(item => item.gfq_difficulty === d.data.gfq_difficulty);
                    vis.level = 2;
                    vis.updateVis();
                    d3.select("#reset-button").classed("active", true); // set reset button active
                    d3.select("#reset-button").classed("disabled", false); // set reset button not disabled
                }
            });
    }
}