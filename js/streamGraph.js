class StreamGraph {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    // Todo: Add or remove parameters from the constructor as needed
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
        // Todo: Add or remove attributes from config as needed
        genreCategories: _config.genreCategories,
      }
      this.data = data;
      this.initVis();
    }
  
    initVis() {
      let vis = this;

      // Todo: Create SVG area, initialize scales and axes
      const width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      const height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.svg = d3.select(vis.config.parentElement)
        .append('svg')
          .attr('class', 'stream-graph-svg')
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight)
        // .append('g')
        //   .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

      // Init axes scales
      vis.xScale = d3.scaleLinear()
        .range([0, width]);

      vis.yScale = d3.scaleLinear()
        .range([height, 0]);
      
      vis.chartArea = vis.svg.append('g')
        .attr('class', 'chart')
        // .attr('transform', `translate(0, ${height*0.8})`);
        .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

      vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSize(-height*0.7)
        .ticks(24)
        // .tickFormat(d3.timeFormat("%Y"))
        // .tickValues([1900, 1925, 1975, 2000]); //placeholder

      // vis.yAxis = d3.axisLeft(vis.yScale)
      //   .tickSizeOuter(0);

      vis.xAxisG = vis.chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height * 0.8})`);
      
      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;
      // Todo: Prepare data and scales

      console.log(vis.data);

      vis.xValue = d => d.published_store;
      vis.yValue = d => d.genres
      console.log(d3.extent(vis.data, vis.xValue));

      // const nYears = d3.extent(vis.data, d => vis.xValue(d).getFullYear());
      // console.log(nYears)
      // // vis.xScale.domain(Array.from(new Array(nYears[1] - nYears[0] + 1), (_, i) => i + nYears[0]))
      // vis.xScale.domain(Array.from({length: nYears[1] - nYears[0] + 1}, (_, i) => i + nYears[0]))
      vis.xScale.domain(d3.extent(vis.data, d => vis.xValue(d).getFullYear()));
      vis.yScale.domain(-100000, 100000)

      vis.renderVis();
    }
  
    renderVis() {
      let vis = this;
      // Todo: Bind data to visual elements, update axes

      // Group by published year
      vis.dataYearG = d3.groups(vis.data, d => d.published_store.getFullYear());
      console.log("Year groups");
      console.log(vis.dataYearG);

      console.log("genre categories");
      console.log(vis.config.genreCategories);

      // vis.genreCountG = {};
      vis.genreCountG = [];
      vis.dataYearG.forEach(yearG => {
        // console.log(yearG);
        let genreYearG = {}
        yearG[1].forEach(d => {
          d.genres.forEach(g => {
            genreYearG[g] = (genreYearG[g] || 0) + 1;
            // vis.genreCountG[yearG[0]][g] = (vis.genreCountG[yearG[0]][g] || 0) + 1;
          })
        })
        // vis.genreCountG[yearG[0]] = genreYearG;
        // vis.genreCountG.push([yearG[0], genreYearG]);
        vis.genreCountG.push({...genreYearG, year: yearG[0]});
      })
      console.log("genre count G");
      console.log(vis.genreCountG);

      // Stack the data
      vis.stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .order(d3.stackOrderNone)
        .keys(vis.config.genreCategories)
        // (vis.data)
        (vis.genreCountG)

      console.log("stacked data");
      console.log(vis.stackedData);

      // Area generator
      vis.area = d3.area()
        // .x(d => console.log(d))
        // .x(d => vis.xScale(vis.xValue(d)))
        .x(d => vis.xScale(d.data.year))
        .y0(d => vis.yScale(d[0]))
        .y1(d => vis.yScale(d[1]));

      vis.svg.selectAll(".genres")
        .data(vis.stackedData)
        .join('path')
          .attr('class', 'area genres')
          .attr('d', vis.area)

      vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());
    }
  }