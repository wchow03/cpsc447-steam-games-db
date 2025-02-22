let genres = new Set();
let platforms = new Set();
let tags = new Set();
let developers = new Set();
let publishers = new Set();
let voiceovers = new Set();
let categories = new Set();


d3.json('data/steamdb.json').then(data => {
    data.forEach(d => {
        // console.log(d)
        d.genres = d.genres ? d.genres.split(",") : [];
        d.genres.forEach(g => genres.add(g));

        d.platforms = d.platforms ? d.platforms.split(",") : [];
        d.platforms.forEach(g => platforms.add(g));

        d.tags = d.tags ? d.tags.split(",") : [];
        d.tags.forEach(g => tags.add(g));

        // console.log(d.developers)
        d.developers = d.developers ? d.developers.toString().split(",") : [];
        d.developers.forEach(g => developers.add(g));

        d.publishers = d.publishers ? d.publishers.toString().split(",") : [];
        d.publishers.forEach(g => publishers.add(g));

        d.voiceovers = d.voiceovers ? d.voiceovers.split(",") : [];
        d.voiceovers.forEach(g => voiceovers.add(g));

        d.categories = d.categories ? d.categories.split(","): [];
        d.categories.forEach(g => categories.add(g));
    })
    
    console.log("# genres: " + genres.size)
    console.log(genres)
    console.log("# platforms: " + platforms.size)
    console.log(platforms)
    console.log("# tags: " + tags.size)
    console.log(tags)
    console.log("# developers: " + developers.size)
    console.log(developers)
    console.log("# publishers: " + publishers.size)
    console.log(publishers)
    console.log("# voiceovers: " + voiceovers.size)
    console.log(voiceovers)
    console.log("# categories: " + categories.size)
    console.log(categories)

    // console.log(data);
})