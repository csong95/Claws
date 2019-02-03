import Genre from './genre.js'
import SearchResult from './searchResult.js'

const {h, keyed, reuseNodes} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <div class="movie-layout">
        <div class="movie-backdrop">
            <img #backdropimg class="movie-backdrop-img" />
            <div class="movie-backdrop-shade"></div>
            <img #poster class="movie-poster" width="250px" />
        </div>
        <div class="movie-metadata">
            <h2>#title</h2>
            <h4><i class="material-icons">star</i>#subheader</h4>
            <div #genrelist class="genres-container"></div>
            <p>#description</p>
        </div>
        <div class="movie-similar-list-container">
            <h4>Similar Movies</h4>
            <div #similarlist class="movie-similar-list"></div>
        </div>
    </div>
`
function MovieTitlePage(state, context, action) {
    const root = view

    // Collect references to dynamic parts
    const {backdropimg, title, subheader, genrelist, description, poster, similarlist} = view.collect(root)

    async function update(action) {
        console.log('Rendered MovieTitlePage', action, state)

        // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
        if (action !== 'remove' && state.selectedTitle.id && !state.selectedTitle.similarResults.length) {
            console.log('Fetching similar titles!')
            const response = await new Promise((resolve) => fetchSimilarResults(resolve, state.selectedTitle.id, 1))
            state.selectedTitle.similarResults = response.results
        }

        title.nodeValue = state.selectedTitle.title || state.selectedTitle.name
        subheader.nodeValue = `${state.selectedTitle.vote_average || 0} (${state.selectedTitle.vote_count})${state.selectedTitle.release_date ? ` | ${(new Date(state.selectedTitle.release_date)).getFullYear()}` : ''}`
        description.nodeValue = state.selectedTitle.overview
        if (description.parentNode.clientHeight > 96 && title.parentNode.clientHeight > 76) {
            var words = description.nodeValue.split(/\s+/);
            words.push('...');

            do {
                words.splice(-2, 1);
                description.nodeValue = words.join(' ');
            } while(description.parentNode.clientHeight > 96);
        }
        poster.src = `https://image.tmdb.org/t/p/w300${state.selectedTitle.poster_path}`
        backdropimg.src = `https://image.tmdb.org/t/p/w500${state.selectedTitle.backdrop_path}`

        reuseNodes(
            genrelist,
            state.lastSelectedTitle.genre_ids,
            state.selectedTitle.genre_ids.slice(),
            genreId => Genre(genreId, context),
            (Component, genreId) => {
                return Component.update(genreId)
            }
        )

        keyed(
            'id',
            similarlist,
            state.lastSelectedTitle.similarResults.slice(),
            state.selectedTitle.similarResults.slice(),
            // This assumes similar results are of the same media type (movie, tv)
            result => SearchResult(result, state, {navigate: update}),
            (Component, result) => {
                return Component.update()
            }
        )

        state.lastSelectedTitle = state.selectedTitle
    }
    update()

    root.cleanup = function() {
        state.selectedTitle = {...state.selectedTitle, genre_ids: [], similarResults: []}
        update('remove')
    }

    return root
}

export default MovieTitlePage