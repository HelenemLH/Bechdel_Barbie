// TMDb API settings
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs'; 
const TMDB_API_URL = 'https://api.themoviedb.org/3';

// wait for the page to fully load before adding event listeners
document.addEventListener('DOMContentLoaded', () => {

    // open the description popup when the description button is clicked
    document.getElementById('description-button').onclick = function() {
        document.getElementById('popup-description').style.display = 'block';
    };

    // open the rating explanation popup when the rating button is clicked
    document.getElementById('rating-button').onclick = function() {
        document.getElementById('popup-rating').style.display = 'block';
    };

    // add functionality to close the popups when the 'X' button is clicked
    document.querySelectorAll('.close').forEach(function(element) {
        element.onclick = function() {
            element.parentElement.parentElement.style.display = 'none';
        };
    });

    // close the modal if the user clicks outside of it
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // listen for the 'Enter' key in the search bar to trigger a movie search
    document.getElementById("searchbartext").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // stop form submission or page refresh
            findMovie(); // trigger the movie search
        }
    });

    // when the random button is clicked, fetch a random movie
    document.getElementById("random-button").onclick = function() {
        getRandomMovie(); // trigger the random movie fetch
    };

});

// function to get the poster of a movie from TMDb using the IMDb ID
async function fetchPoster(imdbid) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };

    // use TMDb's find API to get movie data by IMDb ID
    const response = await fetch(`${TMDB_API_URL}/find/tt${imdbid}?external_source=imdb_id`, options);
    const data = await response.json();

    const movieResult = data.movie_results[0];
    if (movieResult) {
        return `https://image.tmdb.org/t/p/w500${movieResult.poster_path}`; // return the poster URL if available
    } else {
        return null; // if no poster is available
    }
}

// function to fetch and display movie data based on the search query
async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value.trim(); // get the search text
    if (searchbartext.length === 0) return; // if no text, do nothing

    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;

    try {
        const response = await fetch(url); // get movie data from Bechdel API
        const data = await response.json(); // parse the JSON response
        displayResults(data); // display the results
    } catch (error) {
        console.error('Error fetching movie data:', error); // log any errors
    }
}

// function to display the search results, including posters, titles, years, and ratings
function displayResults(movies) {
    const resultsContainer = document.getElementById('results'); // the container for displaying results
    resultsContainer.innerHTML = ""; // clear any previous results

    // loop through each movie and create its HTML element
    movies.forEach(async movie => {
        const movieElement = document.createElement('div'); // create a new div for each movie
        movieElement.classList.add('movie'); // add the 'movie' class for styling

        // fetch the poster using the movie's IMDb ID
        const posterUrl = await fetchPoster(movie.imdbid);

        // build the movie details with poster, title, year, and rating
        movieElement.innerHTML = `
            <h3>${movie.title || "Unknown Title"}</h3>
            <p>Year: ${movie.year || "Unknown Year"}</p>
            <p>Rating: ${generateStars(movie.rating || 0)}</p>
            ${posterUrl ? `<a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank"><img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster"></a>` : `<p>No Poster Available</p>`}
        `;
        resultsContainer.appendChild(movieElement); // add the movie element to the results container
    });
}

// function to generate star ratings
function generateStars(rating) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(3 - rating); // build the stars based on the rating
}

// function to fetch and display a random movie from the Bechdel API
async function getRandomMovie() {
    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getAllMovies`;

    try {
        const response = await fetch(url); // get all movies from the API
        const data = await response.json(); // parse the JSON response
        const filteredMovies = data.filter(movie => movie.year >= 1995 && movie.year <= 2025); // filter movies by year

        if (filteredMovies.length === 0) {
            alert("No movies available for the selected years.");
            return;
        }

        // pick a random movie from the filtered list
        const randomMovie = filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
        displayResults([randomMovie]); // display the random movie
    } catch (error) {
        console.error('Error fetching random movie:', error); // log any errors
    }
}

// function to show search suggestions as the user types
let debounceTimeout; // for handling debouncing
async function showSuggestions() {
    const query = document.getElementById("searchbartext").value; // get the user's input
    if (query.length < 3) {
        document.getElementById("suggestions-dropdown").innerHTML = ""; // clear suggestions if input is too short
        return;
    }

    // debounce: wait a bit before fetching suggestions to avoid too many requests
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url); // get suggestions from the API
            const data = await response.json(); // parse the JSON response
            const suggestionsDropdown = document.getElementById("suggestions-dropdown"); // find the suggestions container
            suggestionsDropdown.innerHTML = ""; // clear previous suggestions

            // for each suggested movie, create a clickable item
            data.slice(0, 5).forEach(movie => {
                const suggestionItem = document.createElement("div"); // create a new div for each suggestion
                suggestionItem.classList.add("suggestion-item"); // add a class for styling
                suggestionItem.textContent = `${movie.title} (${movie.year})`; // display the title and year
                suggestionItem.onclick = function() {
                    document.getElementById("searchbartext").value = movie.title; // fill the search bar with the selected title
                    suggestionsDropdown.innerHTML = ""; // clear the suggestions
                    findMovie(); // search for the selected movie
                };
                suggestionsDropdown.appendChild(suggestionItem); // add the suggestion to the dropdown
            });
        } catch (error) {
            console.error('Error fetching suggestions:', error); // log any errors
        }
    }, 300); // wait 300ms before fetching suggestions
}
