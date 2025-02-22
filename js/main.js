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


d3.json('data/steamdb.json').then(data => {
    data.forEach(d => {
        // console.log(d)
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
    })
    
    console.log("# genres: " + genres.size)
    // console.log(genres)
    console.log(genresCount)
    console.log("# platforms: " + platforms.size)
    // console.log(platforms)
    console.log(platformsCount)
    console.log("# tags: " + tags.size)
    // console.log(tags)
    console.log(tagsCount)
    console.log("# developers: " + developers.size)
    // console.log(developers)
    console.log(developersCount)
    console.log("# publishers: " + publishers.size)
    // console.log(publishers)
    console.log(publishersCount)
    console.log("# voiceovers: " + voiceovers.size)
    // console.log(voiceovers)
    console.log(voiceoversCount)
    console.log("# languages: " + languages.size)
    // console.log(languages)
    console.log(languagesCount)
    console.log("# categories: " + categories.size)
    // console.log(categories)
    console.log(categoriesCount)
    console.log("# difficulty: " + difficulty.size)
    // console.log(difficulty)
    console.log(difficultyCount)

    // console.log(data);
})