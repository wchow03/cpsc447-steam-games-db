let genres = new Set();
let genresCount = {};
let platforms = new Set();
let platformsCount = {};
let tags = new Set();
let tagsCount = {};
let developers = new Set();
let developersCount = {};
let publishers = new Set();
let publishersCount = {};
let voiceovers = new Set();
let voiceoversCount = {};
let languages = new Set();
let languagesCount = {};
let categories = new Set();
let categoriesCount = {};
let difficulty = new Set();
let difficultyCount = {};
const dispatcher = d3.dispatch('onYearUpdate', 'onSliderUpdate', 'onLanguageUpdate');

// Store async data as global variable to be used later
let globalData;
let topX;

// Bar Chart
let barChart;

// selectedBar to ensure only one bar can be highlighted at a time
let selectedBar;

let streamGraph;

let treeMap;

d3.json('data/steamdb_w_rating.json').then(data => {

    // text processing
    data.forEach(d => {
        d.genres = d.genres ? d.genres.split(",") : [];
        d.genres.forEach(g => {
            genres.add(g);
            genresCount[g] = (genresCount[g] || 0) + 1;
        });

        d.platforms = d.platforms ? d.platforms.split(",") : [];
        d.platforms.forEach(g => {
            platforms.add(g)
            platformsCount[g] = (platformsCount[g] || 0) + 1;
        });

        d.tags = d.tags ? d.tags.split(",") : [];
        d.tags.forEach(g => {
            tags.add(g)
            tagsCount[g] = (tagsCount[g] || 0) + 1;
        });

        d.developers = d.developers ? d.developers.toString().split(",") : [];
        d.developers.forEach(g => {
            developers.add(g)
            developersCount[g] = (developersCount[g] || 0) + 1;
        });

        d.publishers = d.publishers ? d.publishers.toString().split(",") : [];
        d.publishers.forEach(g => {
            publishers.add(g)
            publishersCount[g] = (publishersCount[g] || 0) + 1;
        });

        d.voiceovers = d.voiceovers ? d.voiceovers.split(",") : [];
        d.voiceovers.forEach(g => {
            voiceovers.add(g)
            voiceoversCount[g] = (voiceoversCount[g] || 0) + 1;
        });

        d.languages = d.languages ? d.languages.split(",") : [];
        d.languages.forEach(g => {
            languages.add(g)
            languagesCount[g] = (languagesCount[g] || 0) + 1;
        });

        d.categories = d.categories ? d.categories.split(","): [];
        d.categories.forEach(g => {
            categories.add(g)
            categoriesCount[g] = (categoriesCount[g] || 0) + 1;
        });

        d.difficulty = d.gfq_difficulty ? d.gfq_difficulty.split(","): [];
        d.difficulty.forEach(g => {
            difficulty.add(g)
            difficultyCount[g] = (difficultyCount[g] || 0) + 1;
        });

        d.published_store = d.published_store ? new Date(d.published_store) : new Date("");
    })
    // console.log(data)

    // ---------------
    // logs to help debug text processing
    // console.log("# genres: " + genres.size)
    // console.log(genres)
    // console.log(genresCount)
    // console.log("# platforms: " + platforms.size)
    // console.log(platforms)
    // console.log(platformsCount)
    // console.log("# tags: " + tags.size)
    // console.log(tags)
    // console.log(tagsCount)
    // console.log("# developers: " + developers.size)
    // console.log(developers)
    // console.log(developersCount)
    // console.log("# publishers: " + publishers.size)
    // console.log(publishers)
    // console.log(publishersCount)
    // console.log("# voiceovers: " + voiceovers.size)
    // console.log(voiceovers)
    // console.log(voiceoversCount)
    // console.log("# languages: " + languages.size)
    // console.log(languages)
    // console.log(languagesCount)
    // console.log("# categories: " + categories.size)
    // console.log(categories)
    // console.log(categoriesCount)
    // console.log("# difficulty: " + difficulty.size)
    // console.log(difficulty)
    // console.log(difficultyCount)
    // --------------

    globalData = data;

    // Data passed into bar chart will just be the languages and the count for each language
    // let barChart = new BarChart({ parentElement: '#barchart'}, data);
    barChart = new BarChart({ parentElement: '.barchart>.graph'}, data, dispatcher);
    barChart.updateVis();

    streamGraph = new StreamGraph({ parentElement: '.streamgraph>.graph', genreCategories: genres }, data,
        dispatcher);
    streamGraph.updateVis();

    treeMap = new TreeMap({ parentElement: '.treemap .graph'}, data, dispatcher);
    const sorted = [...data].sort((a, b) => b.stsp_owners - a.stsp_owners);
    treeMap.data = sorted.slice(0, 1000);  // default top 1000
    treeMap.filteredData = null;
    treeMap.level = 1;
    treeMap.updateVis();

    document.getElementById("reset-button").addEventListener("click", function() {
        d3.select("#loading-spinner").style('opacity', '100%') // show loading spinner

        // timeout forces the loading spinner to show up first
        setTimeout(() => {
            treeMap.filteredData = null;  // Clear filtered data
            treeMap.level = 1;
            treeMap.updateVis();  // Re-render with full dataset
            this.classList.remove("active");  // Hide reset button again
            this.classList.add("disabled");  // Hide reset button again
            d3.select("#loading-spinner").style('opacity', '0%') // hide loading spinner
        }, 2000)
    });
})


// Title and Description
const intro_segment = document.querySelector('.intro-segment')

const desc = intro_segment.querySelector('.description')

desc.innerHTML = `With an ever growing catalogue of games on Steam, each regularly being downloaded and played, it begs the question: 
    what makes the top owned games so popular? Here, you\'ll explore the top 1000 owned games on Steam and analyze game difficulties, playtimes, and explore reach 
    of audiences by comparing trends of popular genres and languages across the years.`;


// TODO move this code later
// for slider, treat default values as index for our custom range
const sliderValues = [10, 25, 50, 100, 500, 1000]

d3.select('#treemap-slider').append('div')
    .attr('class', 'slider-labels')
    .selectAll('text')
    .data(sliderValues)
    .enter()
    .append('text')
    .attr('class', 'slider-tick-label')
    .text(d => d)

const slider = d3.select('#treemap-slider')
    .append('input')
    .attr('type', 'range')
    .attr('min', 0)
    .attr('max', sliderValues.length - 1)
    .attr('class', 'form-range')
    .on('input', (event) => {
        // TODO update onchange later -- currently prints out new value
        // console.log(sliderValues[event.target.value])
        const selectedSliderIndex = +event.target.value;
        topX = sliderValues[selectedSliderIndex];
        dispatcher.call('onSliderUpdate', null, topX);
    })

// general helper tooltips

d3.select("#treemap-question")
    .on('mouseover', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 1)
            .html("<b>Slide</b> to filter to the top X games.<br /><b>Clicking</b> will only show games with the same difficulty.<br /><b>Reset</b> the graph to the main view using the button on the top right.");
    }).on("mousemove", (event) => {
        d3.select("#v_tooltip")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    }).on('mouseout', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 0);
        d3.select(event.target)
    })

d3.select("#streamgraph-question")
    .on('mouseover', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 1)
            .html(`<b>Click</b> on a year to filter the Language Distribution barchart to only consider games released in that year.</br> <b>Click</b> on the chart background to reset.`);
    }).on("mousemove", (event) => {
        d3.select("#v_tooltip")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    }).on('mouseout', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 0);
        d3.select(event.target)
    })

d3.select("#barchart-question")
    .on('mouseover', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 1)
            .html(`<b>Click</b> on a bar to filter the Genres(UPDATE) streamgraph to only consider games available in that language.</br> <b>Click</b> on the bar again or the chart background to reset.`);
    }).on("mousemove", (event) => {
        d3.select("#v_tooltip")
            .style("left", (event.pageX - 257) + "px") // update
            .style("top", (event.pageY - 20) + "px");
    }).on('mouseout', (event, d) => {
        d3.select("#v_tooltip")
            .style("opacity", 0);
        d3.select(event.target)
    })


// Dispatcher events
dispatcher
    .on('onSliderUpdate', () => {
        // handle slider widget event
        const sorted = [...globalData].sort((a, b) => b.stsp_owners - a.stsp_owners);
        const topData = sorted.slice(0, topX);

        treeMap.data = topData;
        treeMap.filteredData = null;     // Clear filtered view
        treeMap.level = 1;        // Reset to level 1
        treeMap.updateVis();             // Re-render
        d3.select("#reset-button").classed("active", false); // set reset button not active
        d3.select("#reset-button").classed("disabled", true); // set reset button disabled
    })
    .on('onYearUpdate', selectedYears => {
        // handle year bidirectional event
        let activeBar = d3.selectAll('.bar.active').data().map(k => k[0]);
        if (selectedYears.length == 0) {
            barChart.data = globalData;
        } else {
            // filter data to only include ones with selected genres
            // generalized for possibility to select multiple genres
            barChart.data = globalData.filter(d => selectedYears.includes(d.published_store.getFullYear()));
        }
        barChart.updateVis();
        // Reactivate active bar
        d3.selectAll('.bar').classed('active', b => b[0] == activeBar);
    })
    .on('onLanguageUpdate', selectedLanguage => {
        // handle language bidirectional event

        // If a language was selected, filter data that contain selected language
        // Otherwise, empty space was clicked so reset all selected data
        if (selectedLanguage) {
            // Filter data to be only the selected language
            let filtered_language_data = globalData.filter(d => d.languages.includes(selectedLanguage));
            console.log("Filtered language data length: ", filtered_language_data.length);
            streamGraph.data = filtered_language_data;
        } else {
            streamGraph.data = globalData;
        }
        
        // Update visualization
        streamGraph.updateVis();
        
    });

