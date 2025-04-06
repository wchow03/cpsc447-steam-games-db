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

        // Define Colour scale for difficulty
        vis.ColourScale = vis.getColourScale();

        // Select legend container
        vis.legendContainer = d3.select('.treemap .legend');

        vis.updateVis();

    }

    updateVis() {
        let vis = this;
        //Todo: Prepare data and scales
        // Convert data to hierarchical structure

        let dataToUse = vis.filteredData || vis.data;



        // colour scheme based on level
        if (vis.level === 1) {
            vis.ColourScale = vis.getColourScale();
        } else {
            vis.ColourScale = d3.scaleSequential()
                .interpolator(d3.interpolateBlues)
                .domain([0, 100]); // assuming avg_rating is on a 0–100 scale
        }

        // title based on level
        const titleElement = document.getElementById("treemap-title");

        if (titleElement) {
            titleElement.textContent = vis.level === 1
                ? "DIFFICULTIES AND PLAYTIMES"
                : "AVERAGE RATINGS";
        }

        vis.legendContainer.selectAll('*').remove();

        let difficultyLevelsOrder = ["Simple", "Simple-Easy", "Easy", "Easy-Just Right", "Just Right",
            "Just Right-Tough", "Tough", "Tough-Unforgiving", "Unforgiving", null]


        // legend content based on level
        if (vis.level === 1) {
            let difficultyLevels = [...new Set(vis.data.map(d => d.gfq_difficulty))];
            difficultyLevels = difficultyLevelsOrder.filter(x => x ? difficultyLevels.includes(x) : true);

            let legend = vis.legendContainer.selectAll('.legend-item')
                .data(difficultyLevels)
                .join('div')
                .attr('class', 'legend-item');

            legend.append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('border-radius', '50%')
                .style('background-color', d => vis.ColourScale(d));

            legend.append('span')
                .text(d => d ? d : 'Unknown');

        } else {
            // Continuous Colour legend for avg_rating
            const gradientId = "legend-gradient";

            // Remove old SVG if any
            vis.legendContainer.selectAll('svg').remove();

            const svg = vis.legendContainer.append("svg")
                .attr("class", "average-rating-legend")
                .attr("width", 300)
                .attr("height", 60);

            const defs = svg.append("defs");
            const linearGradient = defs.append("linearGradient")
                .attr("id", gradientId);

            linearGradient.selectAll("stop")
                .data([
                    { offset: "0%", Colour: vis.ColourScale(0) },
                    { offset: "100%", Colour: vis.ColourScale(100) }
                ])
                .join("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.Colour);

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
                .attr("y", 50) // below the axis
                .attr("text-anchor", "middle")
                .style("fill", "#c7d5e0")
                .style("font-size", "14px")
                .style("font-family", "'Motiva Sans', Arial, Helvetica, sans-serif")
                .text("Average Rating");
        }



        // data structure based on level
        let rootNode;
        let groupedData;

        if (vis.level === 1) {
            // Group data by difficulty
            groupedData = d3.groups(dataToUse, d => d.gfq_difficulty || 'Unknown');

            // Convert to hierarchical structure
            rootNode = d3.hierarchy({
                children: groupedData.map(([difficulty, games]) => ({
                    name: difficulty,
                    children: games
                }))
            }).sum(d => d.stsp_mdntime || 1); // Size of the cell based on median playtime
        } else {
            rootNode = d3.hierarchy({ children: dataToUse })
                .sum(d => d.stsp_mdntime)
                .sort((a, b) => b.value - a.value);
        }

        // Compute Voronoi Treemap
        let voronoiTreemap = d3.voronoiTreemap().clip(vis.clipPolygon);
        voronoiTreemap(rootNode);

        vis.renderVis(rootNode);
    }

    renderVis(rootNode) {
        let vis = this;
        // Todo: Bind data to visual elements, update axes

        // Flatten hierarchy into nodes
        let nodes = rootNode.leaves();

        //Select tooltip
        let v_tooltip = d3.select("#v_tooltip");

        // Bind data to paths
        let cells = vis.svg.selectAll('path')
            .data(nodes)
            .join('path')
            .attr('d', d => d3.line()(d.polygon) + 'z') // Convert polygon data to path
            .attr('fill', d =>
                vis.level === 1
                    ? vis.ColourScale(d.data.gfq_difficulty)
                    : vis.ColourScale(typeof d.data.avg_rating === "number" ? d.data.avg_rating : 0)
            )
            .attr('stroke', '#171a21')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                v_tooltip
                    .style("opacity", 1)
                    .html(`
                            <strong>${d.data.name}</strong><br>
                            Difficulty: ${d.data.gfq_difficulty || 'N/A'}<br>
                            Median Playtime: ${d.data.stsp_mdntime || 'N/A'} mins<br>
                            Average Rating: ${d.data.avg_rating ? d.data.avg_rating.toFixed(1) : 'N/A'}<br>
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
                    .attr('stroke', '#171a21')
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

    getColourScale() {
        const diffs = [
            "Unforgiving",
            "Tough-Unforgiving",
            "Tough",
            "Just Right-Tough",
            "Just Right",
            "Easy-Just Right",
            "Easy",
            "Simple-Easy",
            "Simple"
        ];

        const templateColours = d3.schemeSpectral[9]; //diverging colour scheme option
        const diffColours = {};

        diffs.forEach((label, i) => {
            diffColours[label] = templateColours[i];
        });

        diffColours["N/A"] = "#999999";
        diffColours[null] = "#999999";
        diffColours[undefined] = "#999999";

        return d => diffColours[d] || "#cccccc";
    }
}