class BarChart {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
    // Todo: Add or remove parameters from the constructor as needed
    constructor(_config, data, dispatcher) {
      this.config = {
        parentElement: _config.parentElement,
        // containerWidth: 900,
        // containerHeight: 700,
        containerWidth: 350,
        // containerHeight: 750,
        containerHeight: 550,
        margin: {
        //   top: 10,
        //   right: 250,
        //   bottom: 20,
        //   left: 10
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
        // Todo: Add or remove attributes from config as needed
      }
      this.data = data;
      this.dispatcher = dispatcher;
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
            .range([vis.width / 2, 0]);
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
            .tickPadding(5)
            .tickFormat(d => d)
        
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
        
        // Append group element that will contain actual chart and position according to margins
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left + 10}, ${vis.config.margin.top})`);

        // Append empty x-axis group and move to bottom of chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'bar-axis bar-chart-x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'bar-axis bar-chart-y-axis')
            .attr('transform', `translate(${vis.width / 2}, 0)`);
        
        
    }
  
    updateVis() {
        let vis = this;
        console.log("bar chart data:");
        console.log(vis.data);

        vis.languages = new Set();
        vis.languagesCount = {};

        vis.data.forEach(d => {
            d.languages.forEach(g => {
                vis.languages.add(g)
                vis.languagesCount[g] = (vis.languagesCount[g] + 1) || 1;
            });
        });

        console.log("languages: ", vis.languages);
        console.log("languagesCount: ", vis.languagesCount);

        // Specify x and y data
        
        // xValue is the count
        vis.xValue = d => d[1];

        // yValue is the language
        vis.yValue = d => d[0];

        // Set scale for input domains
        vis.xScale.domain([d3.max(Object.entries(vis.languagesCount), vis.xValue), 0]);
        
        vis.yScale.domain(Object.entries(vis.languagesCount).map(vis.yValue));

        vis.renderVis();
    }
  
    renderVis() {
        let vis = this;

        // Add rectangles
        const bar = vis.chart.selectAll('.bar')
            .data(Object.entries(vis.languagesCount))
            .join('rect')
            .attr('class', 'bar')
            .attr('width', d => Math.ceil(vis.xScale(vis.xValue(d))))
            .attr('height', d => vis.yScale.bandwidth())
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('x', d => vis.width/2 - vis.xScale(vis.xValue(d)))
            .attr('fill', '#66c0f4');
        
        // Add mouseover and mouse out
        bar.on('mouseover', function (e, d) {
            // Add outline on mouse hover
            d3.select(this)
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer');
            
            // Activate tooltip
            d3.select('#v_tooltip')
                .style('opacity', 1)
                .html(`
                    <div style="font-weight: bold;" >${vis.xValue(d)}</div>
                `);
        })
        .on('mousemove', function (e) {
            d3.select('#v_tooltip')
                .style("left", (e.pageX + 10) + "px")
                .style("top", (e.pageY - 20) + "px");
        })
        .on('mouseleave', function () {
            // Remove mouse hover outline
            d3.select(this).attr('stroke', null);

            // Remove tooltip
            d3.select('#v_tooltip')
                .style('opacity', 0);
        });

        // Mouse click on bar chart language
        bar.on('click', function (e, d) {
            // If a bar has been selected, deselect the selected bar since user has clicked a new bar
            if (selectedBar) {
                d3.select(selectedBar)
                    .classed('active', false)
                    .attr('fill', '#66c0f4');
            }

            // Change colour of selected bar
            if (!selectedBar || selectedBar != this) {
                d3.select(this)
                    .classed('active', true)
                    .attr('fill', '#a5d92b');
            }

            // Filter data to only contain selected language
            let selectedLanguage = d[0];
            
            // If the current selected bar is clicked again to be deselected, perform same the function 
            // that clicking on an empty space in bar char does (clears all selected data)
            
            // Otherwise update the selected bar to the new bar and filter on selected language

            if (selectedBar === this) {
                selectedLanguage = null;
                selectedBar = null;

                // Call dispatcher will null to reset all selected data
                vis.dispatcher.call('onLanguageUpdate', e, null);

                // Call update vis again to reset the selected bar
                vis.updateVis();
            } else {
                selectedBar = this;
            }

            // Call dispatcher with selected language
            vis.dispatcher.call('onLanguageUpdate', e, selectedLanguage);

            
        });

        // Create click area for bar chart (used to reset selected language)
        vis.chart.insert('rect', ':first-child')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('opacity', '0%')
            .on('click', function (e) {
                if (!d3.select(e.target).classed('bar')) {
                    selectedBar = null;

                    // Call dispatcher will null to reset all selected data
                    vis.dispatcher.call('onLanguageUpdate', e, null);

                    // Call update vis again to reset the selected bar
                    vis.updateVis();
                }
        });

        // Do not render the x-axis
        vis.yAxisG.call(vis.yAxis);

    }
  }