class StreamGraph {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    constructor(_config, data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 750,
        containerHeight: 260,
        margin: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        },
        genreCategories: _config.genreCategories,
      }
      this.data = data;
      this.initVis();
    }
  
    initVis() {
      let vis = this;

      const width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      const height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.svg = d3.select(vis.config.parentElement)
        .append('svg')
          .attr('class', 'stream-graph-svg')
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight)

      // Init axes scales
      vis.xScale = d3.scaleLinear()
        .range([0, width]);

      vis.yScale = d3.scaleLinear()
        .range([height, 0]);
      
      // Colour
      vis.colour = d3.scaleOrdinal()
        .range(['#4ECE91', '#56E39F', '#58D6A2', '#59C9A5', '#5A9B81', '#5B6C5D', '#4B4C49', '#3B2C35', '#332631', '#2A1F2D'])
      
      // Create SVG area
      vis.chartArea = vis.svg.append('g')
        .attr('class', 'chart')
        .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

      vis.chart = vis.chartArea.append('g');

      vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSize(-height*0.7)
        .ticks(24)
        .tickFormat(d3.format("d"));

      vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height * 0.8})`);

      vis.stack = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(vis.config.genreCategories)
    }
  
    updateVis() {
      let vis = this;
      // Todo: Prepare data and scales

      vis.xValue = d => d.published_store.getFullYear();
      vis.yValue = d => d.genres

      // Group by published year
      vis.dataYearG = d3.groups(vis.data, d => d.published_store.getFullYear());

      // Remove games with no publish date
      vis.dataYearG = vis.dataYearG.filter(d => Boolean(d[0]));

      // Aggregate to count genres by year
      vis.genreCountG = [];
      let genreGList = [];
      vis.dataYearG.forEach(yearG => {
        let genreYearG = {};
        vis.config.genreCategories.forEach(g => genreYearG[g] = 0);
        yearG[1].forEach(d => {
          d.genres.forEach(g => {
            genreYearG[g] = (genreYearG[g] || 0) + 1;
          })
        })
        vis.genreCountG.push({...genreYearG, year: yearG[0]});
        vis.config.genreCategories.forEach(g => {
          let genreG = {
            year: yearG[0],
            genre: g,
            value: genreYearG[g]
          }
          genreGList.push(genreG)
        })
      })
      vis.genreCountG = genreGList;

      // Stack the data
      vis.stack.value((d, key) => {return d.value})
      vis.stackedData = vis.stack(vis.genreCountG);

      // Set domains
      vis.xScale.domain(d3.extent(vis.data, d => vis.xValue(d)));
      vis.yScale.domain([-1000, 1000]);
      vis.colour.domain(vis.config.genreCategories);

      vis.renderVis();
    }
  
    renderVis() {
      let vis = this;

      // Area generator
      vis.area = d3.area()
        .x((d, i) => vis.xScale(d.data.year))
        .y0(d => vis.yScale(d[0]))
        .y1(d => vis.yScale(d[1]))
        .curve(d3.curveMonotoneX)

      // Render chart
      vis.chart.selectAll(".area")
        .data(vis.stackedData)
        .join('path')
          .attr('class', 'area')
          .style('fill', d => vis.colour(d.key))
          .attr('d', vis.area)
          .on("mousemove", vis.mousemove)

      // Render axis
      vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());
    }
  }