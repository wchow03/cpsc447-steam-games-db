class StreamGraph {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    constructor(_config, data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 700,
        containerHeight: 225,
        margin: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
        },
        genreCategories: _config.genreCategories,
        tooltipPadding: _config.tooltipPadding || 15,
        legendWidth: 400,
        legendHeight: 400,
        legendRadius: 5,
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
        .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', 
          '#7f7f7f', '#bcbd22', '#17becf', '#f7b6d2', '#c49c94', '#ffbb78', '#98df8a', 
          '#ff9896', '#c7c7c7']);
      
      // Create SVG area
      vis.chartArea = vis.svg.append('g')
        .attr('class', 'chart')
        .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

      vis.chart = vis.chartArea.append('g');

      vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSize(-height*0.8)
        .ticks(24)
        .tickFormat(d3.format("d"));

      vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height * 0.9})`);

      vis.stack = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(vis.config.genreCategories)

      vis.legend = d3.select('#streamgraph .legend')
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
      // Group aggregated data by year
      vis.genreCountG = d3.groups(vis.genreCountG, d => d.year);
      // Sort by year
      vis.genreCountG.sort((a, b) => {
        return b[0] - a[0];
      });

      // Stack the data
      vis.stack.value((d, key) => d[1][[...vis.config.genreCategories].indexOf(key)].value);
      vis.stackedData = vis.stack(vis.genreCountG);

      // Set domains
      vis.xScale.domain(d3.extent(vis.data, d => vis.xValue(d)));
      vis.yScale.domain([-300, 300]);
      vis.colour.domain(vis.config.genreCategories);

      vis.renderVis();
    }
  
    renderVis() {
      let vis = this;

      // Area generator
      vis.area = d3.area()
        .x((d, i) => vis.xScale(d.data[0]))
        .y0(d => vis.yScale(d[0]))
        .y1(d => vis.yScale(d[1]))
        .curve(d3.curveMonotoneX)

      // Render chart
      let stream = vis.chart.selectAll(".area")
        .data(vis.stackedData)
        .join('path')
          .attr('class', 'area')
          .style('fill', d => vis.colour(d.key))
          .attr('d', vis.area)

      // Render Legend
      vis.legend.selectAll('.legend-item')
        .data(vis.config.genreCategories)
        .join((enter) => {
          let div = enter.append('div')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
              return `translate(10, ${i * 20})`
            })
          
          div.append('div')
            .attr('class', 'circle')
            .style('width', '15px')
            .style('height', '15px')
            .style('border-radius', '15px')
            .style('background-color', d => vis.colour(d))

          div.append('div')
            .style('font-size', 12)
            .style('color', 'black')
            .text(d => d)
        });

      stream
        .on('mouseover', function (event, d) {
          // Render tooltip
          d3.select('#s_tooltip')
          .style('display', 'block')
          .style('opacity', 1)
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          .html(`
            <div class='tooltip-info'>${d.key}</div>
            `)
        })
        .on('mousemove', function (event) {
          d3.select('#s_tooltip')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        })
        .on('mouseleave', function (event) {
          // remove tooltip
          d3.select('#s_tooltip')
            .style('display', 'none');
        });

      // Render axis
      vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());
    }
  }