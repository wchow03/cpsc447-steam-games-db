import pandas as pd

# read, filter columns and write to json file top 1000 games (ordered by stsp_owners)

originalData = pd.read_json("../data/steamdb.json")
# print(originalData.head())


fieldsToKeep = ['sid', 'store_uscore', 'published_store', 'name', 'description', 'platforms',
    'developers', 'publishers', 'languages', 'voiceovers', 'categories', 'genres', 'tags', 'gfq_difficulty',
    'gfq_rating', 'gfq_length', 'stsp_owners', 'stsp_mdntime', 'hltb_single', 'hltb_complete', 'meta_score',
    'meta_uscore', 'igdb_single', 'igdb_complete', 'igdb_score', 'igdb_uscore'
]

# filter unwanted attributes
originalData = originalData[fieldsToKeep]

# use top 1000 games (defined by stsp_owners)
originalData['stsp_owners'] = originalData['stsp_owners'].fillna(0).astype(int)
originalData = originalData.sort_values(by="stsp_owners", ascending=False)
originalData = originalData[:1000]

originalData.to_json('../data/steamdb_preprocessed.json', orient="records", indent=4)