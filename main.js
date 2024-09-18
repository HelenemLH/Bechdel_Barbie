// TMDb API settings
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';

// Store all fetched 3-star movies to apply filters on them
let threeStarMovies = [];

// function to reformat movie titles like "Last Duel, The" to "The Last Duel"
function reformatTitle(title) {
    const match = title.match(/^(.*?), (The|A|An)$/i); // match titles that end with ", The", ", A", ", An"
    return match ? `${match[2]} ${match[1]}` : title; // reformat title if a match is found
}

// once the page is fully loaded, add all necessary event listeners
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

    // listen for the filter form submission
    document.getElementById("filter-form").addEventListener("submit", function(event) {
        event.preventDefault(); // prevent form from submitting normally
        const year = parseInt(document.getElementById("year").value, 10); // get the year from the input
        applyFilter(year); // apply the filter to the 3-star movies
    });

    // initialize the 3-star movie suggestions carousel
    fetchThreeStarMovies();
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
    const response = await fetch(`https://api.themoviedb.org/3/find/tt${imdbid}?external_source=imdb_id`, options);
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

        // reformat the title to avoid issues like "Last Duel, The"
        const formattedTitle = reformatTitle(movie.title);

        // build the movie details with poster, title, year, and rating
        movieElement.innerHTML = `
            <h3 class="title">${formattedTitle || "Unknown Title"}</h3>
            <p class="year">${movie.year || "Unknown Year"}</p>
            <p class="rating">${generateStars(movie.rating || 0)}</p>
            ${posterUrl ? `<a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank"><img src="${posterUrl}" alt="${formattedTitle} poster" class="movie-poster"></a>` : `<p>No Poster Available</p>`}
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
        const filteredMovies = data.filter(movie => movie.rating === 3 && movie.year >= 1874 && movie.year <= 2025); // filter 3-star movies

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

// function to fetch 3-star movies for the suggestions carousel
// function to fetch 3-star movies for the suggestions carousel
async function fetchThreeStarMovies() {
    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getAllMovies`;

    try {
        const response = await fetch(url); // fetch all movies from the API
        const data = await response.json(); // parse the JSON response
        
        // filter for 3-star movies and sort them by year in descending order
        threeStarMovies = data
            .filter(movie => movie.rating === 3 && movie.year >= 1874 && movie.year <= 2025)
            .sort((a, b) => b.year - a.year); // sort from most recent to oldest

        if (threeStarMovies.length === 0) {
            alert("No 3-star movies available for suggestions.");
            return;
        }

        // display the 3-star movie suggestions in a carousel
        displayCarousel(threeStarMovies.slice(0, 10)); // limit to 10 movies for the carousel
    } catch (error) {
        console.error('Error fetching 3-star movies:', error); // log any errors
    }
}


// function to display the 3-star movie carousel
function displayCarousel(movies) {
    const carouselContainer = document.getElementById("suggestions-list"); // get the suggestions container
    carouselContainer.innerHTML = ""; // clear previous carousel content

    // loop through each movie and create a carousel item
    movies.forEach(async movie => {
        const posterUrl = await fetchPoster(movie.imdbid); // fetch the movie poster

        // reformat the title to avoid issues like "Last Duel, The"
        const formattedTitle = reformatTitle(movie.title);

        // create the HTML for the movie suggestion (only the poster is clickable)
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.innerHTML = `
            <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank">
                ${posterUrl ? `<img src="${posterUrl}" alt="${formattedTitle} poster" class="suggestion-poster">` : `<p>No Poster Available</p>`}
            </a>
            <div class="title">${formattedTitle}</div> <!-- title is not clickable -->
            <div class="year">${movie.year}</div> <!-- year is not clickable -->
            <div class="rating">${generateStars(movie.rating)}</div> <!-- rating is not clickable -->
        `;
        carouselContainer.appendChild(suggestionItem); // add the suggestion to the carousel
    });
}

// function to apply the year filter to the 3-star movies
function applyFilter(year) {
    if (!year) {
        displayCarousel(threeStarMovies.slice(0, 10)); // if no year filter, display the original list
        return;
    }

    // filter the 3-star movies by the selected year
    const filteredMovies = threeStarMovies.filter(movie => movie.year === year);
    displayCarousel(filteredMovies.slice(0, 10)); // display the filtered movies (limit to 10)
}
