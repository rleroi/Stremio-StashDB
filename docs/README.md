# What
We are creating an addon that is _does not_ use a db, a simple addon that just passes data from another API.

# Configuration
Each install has a unique config, with the user's Easynews Username, Easynews Password and StashDB API Key. Configuration is required.

# Psuedo code for the scrape code
- Query StashDB grapqhl trending scenes (see ./STASHDB.md)
- Foreach trending video:
- - Query Easynews API (see EASYNEWS.md)
) with query string "{alnum-studio-name}.{YY}.{MM}.{DD}"
- - Filter results by checking if the {YY} {MM} {DD} is in the right order, because easynews also responds with results where the date is in a different order (wrong videos). It is also possible to check the duration string. easynews provides this in the string format "{MM}m:{SS}s", to make sure we get the right video if multiple videos are added on the same day.
- - See EASYNEWS.md for what we need to create the video URL. Do not create the streamUrl yet, only the url without credentials.
- - Sort all filtered results by resolution, highest first.
- - save the filtered results to the stashdb scene object.
- - if no videos found after filtering, skip the scene.
- - else save the stashdb scene to our local in-memory cache. use the stashdb ID as key. for easy lookup by id later.
- scrape on boot
- scrape every 24h

# Pseudo code for response
- always respond according to stremio-addon-sdk-docs response objects. Check that all properties are correct
- respond for the default catalog, StashDB trending scenes with meta objects, posters. See docs for defineCatalogHandler and api/responses/meta.mdd#meta-preview-object
- respond for each catalog item with defineMetaHandler and see api/responses/meta.md
- respond for each stream with defineStreamHandler, see api/responses/stream.md
- - each response needs to be mapped but also we need to create a stream url with the current config's credentials, see getStreamUrl in EASYNEWS.md
- - Make sure the streamUrl with credentials is not updated (by ref) in our in-memory cache (security issue), but only in the response for this request.
