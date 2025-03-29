class TreeMap {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    // Todo: Add or remove parameters from the constructor as needed
    constructor(_config, data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 500,
            containerHeight: 500,
            margin: {
                top: 30,
                right: 5,
                bottom: 20,
                left: 30
            }
            // Todo: Add or remove attributes from config as needed
        }
        this.data = data;
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

        let dataToUse = vis.filteredData || vis.data;

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
            .attr('fill', d => vis.colorScale(d.data.gfq_difficulty)) // Color by difficulty
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                v_tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.data.name}</strong><br>Difficulty: ${d.data.gfq_difficulty}<br>Median Playtime: ${d.data.stsp_mdntime} mins`);
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
                console.log(`Filtering for difficulty: ${d.data.gfq_difficulty}`);
                vis.filteredData = vis.data.filter(item => item.gfq_difficulty === d.data.gfq_difficulty);
                vis.updateVis();
                d3.select("#reset-button").style("display", "block"); // Show reset button
            });
    }
}