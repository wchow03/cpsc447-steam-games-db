class BarChart {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    // Todo: Add or remove parameters from the constructor as needed
    constructor(_config, data) {
      this.config = {
        parentElement: _config.parentElement,
        // containerWidth: 900,
        // containerHeight: 700,
        containerWidth: 600,
        containerHeight: 750,
        margin: {
          top: 30,
          right: 300,
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

        // Calculate inner chart size using margin
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize scales
        // Have x-values go from 0 and increasing to the left
        vis.xScale = d3.scaleLinear()
            .range([vis.width, 0]);
            // .range([0, vis.width]);
    
        vis.yScale = d3.scaleBand()
            .range([0, vis.height])
            .paddingInner(0.1);
    
        // Initialze axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0);
        
        // Put y axis on right for each language
        vis.yAxis = d3.axisRight(vis.yScale)
            .ticks(Object.keys(this.data).length)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .tickFormat(d => d)
        
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            // .attr('transform', `translate(${vis.config.containerWidth}, 0)`);
            // .attr('transform', `translate(${window.innerWidth - vis.config.containerWidth}, 0)`);
        
        // Append group element that will contain actual chart and position according to margins
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Append empty x-axis group and move to bottom of chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'bar-axis bar-chart-x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'bar-axis bar-chart-y-axis')
            .attr('transform', `translate(${vis.width}, 0)`);
        
        
    }
  
    updateVis() {
        let vis = this;
        console.log(vis.data);
        // console.log(Object.entries(vis.data)[0][0]);
        // console.log(Object.entries(vis.data)[0][1]);
        
        // console.log(Object.keys(vis.data));
        // console.log(Object.values(vis.data));

        // Specify x and y data
        vis.xValue = d => d[1];
        vis.yValue = d => d[0];

        // Set scale for input domains
        vis.xScale.domain([d3.max(Object.entries(vis.data), vis.xValue), 0]);
        
        vis.yScale.domain(Object.entries(vis.data).map(vis.yValue));

        vis.renderVis();
    }
  
    renderVis() {
        let vis = this;
        // Todo: Bind data to visual elements, update axes

        // Add rectangles
        vis.chart.selectAll('.bar')
            .data(Object.entries(vis.data))
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('width', d => Math.ceil(vis.xScale(vis.xValue(d))))
            .attr('height', d => vis.yScale.bandwidth())
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('x', d => vis.width - vis.xScale(vis.xValue(d)));
        
        // Update axes because scales may have changed

        // Do not render the x-axis
        // vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);

    }
  }