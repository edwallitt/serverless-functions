const { URL } = require('url')
const fetch = require('node-fetch')
const { query } = require('./util/hasura')

exports.handler = async () => {
    const { movies } = await query({
        query: `
      query {
        movies {
          id
          title
          tagline
          poster
        }
      }
    `
    })
    const api = new URL('http://www.omdbapi.com/')

    // add the secret api key
    api.searchParams.set('apikey', process.env.OMDB_API_KEY)

    const promises = movies.map((movie) => {
        // use the movie IMDB ID to look up details
        api.searchParams.set('i', movie.id)

        return fetch(api)
            .then((response) => response.json())
            .then((data) => {
                const scores = data.Ratings

                return {
                    ...movie,
                    scores
                }
            })
    })

    const moviesWithRatings = await Promise.all(promises)
    return {
        statusCode: 200,
        body: JSON.stringify(moviesWithRatings)
    };
};
