// TMDb API settings
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';

let threeStarMovies = [];
let currentPage = 0;  // Keep track of the current page (set of 5 movies)
let itemsPerPage = 5; // Limit the number of movies shown per page

let startX = 0;
let endX = 0;

// Function to reformat movie titles like "Last Duel, The" to "The Last Duel"
function reformatTitle(title) {
    const match = title.match(/^(.*?), (The|A|An)$/i); // match titles that end with ", The", ", A", ", An"
    return match ? `${match[2]} ${match[1]}` : title; // reformat title if a match is found
}

// Once the page is fully loaded, add all necessary event listeners
document.addEventListener('DOMContentLoaded', () => {

    // Open the description popup when the description button is clicked
    document.getElementById('description-button').onclick = function() {
        document.getElementById('popup-description').style.display = 'block';
    };

    // Open the rating explanation popup when the rating button is clicked
    document.getElementById('rating-button').onclick = function() {
        document.getElementById('popup-rating').style.display = 'block';
    };

    // Add functionality to close the popups when the 'X' button is clicked
    document.querySelectorAll('.close').forEach(function(element) {
        element.onclick = function() {
            element.parentElement.parentElement.style.display = 'none';
        };
    });

    // Close the modal if the user clicks outside of it
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Listen for the 'Enter' key in the search bar to trigger a movie search
    document.getElementById("searchbartext").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Stop form submission or page refresh
            findMovie(); // Trigger the movie search
        }
    });

    // Fetch suggestions as user types in the search bar
    document.getElementById("searchbartext").addEventListener("input", showSuggestions);

    // When the random button is clicked, fetch a random movie
    document.getElementById("random-button").onclick = function() {
        getRandomMovie(); // Trigger the random movie fetch
    };

    // Listen for the filter form submission
    document.getElementById("filter-form").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent form from submitting normally
        const year = parseInt(document.getElementById("year").value, 10); // Get the year from the input
        applyFilter(year); // Apply the filter to the 3-star movies
    });

    // Initialize the 3-star movie suggestions carousel
    fetchThreeStarMovies();

    // Add touch event listeners for swipe functionality
    document.getElementById('suggestions-list').addEventListener('touchstart', handleTouchStart, false);
    document.getElementById('suggestions-list').addEventListener('touchmove', handleTouchMove, false);
    document.getElementById('suggestions-list').addEventListener('touchend', handleTouchEnd, false);
});

// Function to get the poster of a movie from TMDb using the IMDb ID
async function fetchPoster(imdbid) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };

    const response = await fetch(`https://api.themoviedb.org/3/find/tt${imdbid}?external_source=imdb_id`, options);
    const data = await response.json();

    const movieResult = data.movie_results[0];
    if (movieResult) {
        return `https://image.tmdb.org/t/p/w500${movieResult.poster_path}`; // Return the poster URL if available
    } else {
        return null; // If no poster is available
    }
}

// Function to fetch and display movie data based on the search query
async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value.trim(); // Get the search text
    if (searchbartext.length === 0) return; // If no text, do nothing

    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;

    try {
        const response = await fetch(url); // Get movie data from Bechdel API
        const data = await response.json(); // Parse the JSON response
        displayResults(data); // Display the results
    } catch (error) {
        console.error('Error fetching movie data:', error); // Log any errors
    }
}

// Function to display the search results, including posters, titles, years, and ratings
function displayResults(movies) {
    const resultsContainer = document.getElementById('results'); // The container for displaying results
    resultsContainer.innerHTML = ""; // Clear any previous results

    movies.forEach(async movie => {
        const movieElement = document.createElement('div'); // Create a new div for each movie
        movieElement.classList.add('movie'); // Add the 'movie' class for styling

        const posterUrl = await fetchPoster(movie.imdbid);
        const formattedTitle = reformatTitle(movie.title);

        movieElement.innerHTML = `
            <h3 class="title">${formattedTitle || "Unknown Title"}</h3>
            <p class="year">${movie.year || "Unknown Year"}</p>
            <p class="rating">${generateStars(movie.rating || 0)}</p>
            ${posterUrl ? `<a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank"><img src="${posterUrl}" alt="${formattedTitle} poster" class="movie-poster"></a>` : `<p>No Poster Available</p>`}
        `;
        resultsContainer.appendChild(movieElement); // Add the movie element to the results container
    });
}

// Function to generate star ratings
function generateStars(rating) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(3 - rating); // Build the stars based on the rating
}

// Function to fetch and display a random movie from the Bechdel API
async function getRandomMovie() {
    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getAllMovies`;

    try {
        const response = await fetch(url); // Get all movies from the API
        const data = await response.json();
        const filteredMovies = data.filter(movie => movie.rating === 3 && movie.year >= 1874 && movie.year <= 2025); // Filter 3-star movies

        if (filteredMovies.length === 0) {
            alert("No movies available for the selected years.");
            return;
        }

        const randomMovie = filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
        displayResults([randomMovie]); // Display the random movie
    } catch (error) {
        console.error('Error fetching random movie:', error);
    }
}

// Function to fetch 3-star movies for the suggestions carousel
async function fetchThreeStarMovies() {
    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getAllMovies`;

    try {
        const response = await fetch(url); // Fetch all movies from the API
        const data = await response.json();
        threeStarMovies = data.filter(movie => movie.rating === 3 && movie.year >= 1874 && movie.year <= 2025)
            .sort((a, b) => b.year - a.year); // Sort by year descending

        if (threeStarMovies.length === 0) {
            alert("No 3-star movies available for suggestions.");
            return;
        }

        displayCarousel(threeStarMovies.slice(0, itemsPerPage)); // Initially display the first 5 movies
    } catch (error) {
        console.error('Error fetching 3-star movies:', error);
    }
}

// Function to display the 3-star movie carousel
function displayCarousel(movies) {
    const carouselContainer = document.getElementById("suggestions-list");
    carouselContainer.innerHTML = ""; // Clear previous carousel content

    movies.forEach(async movie => {
        const posterUrl = await fetchPoster(movie.imdbid);
        const formattedTitle = reformatTitle(movie.title);

        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.innerHTML = `
            <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank">
                ${posterUrl ? `<img src="${posterUrl}" alt="${formattedTitle} poster" class="suggestion-poster">` : `<p>No Poster Available</p>`}
            </a>
            <div class="title">${formattedTitle}</div>
            <div class="year">${movie.year}</div>
            <div class="rating">${generateStars(movie.rating)}</div>
        `;
        carouselContainer.appendChild(suggestionItem); // Add the suggestion to the carousel
    });
}

// Function to paginate the carousel when clicking next/previous buttons
function scrollCarousel(direction) {
    const totalMovies = threeStarMovies.length; // Get the total number of 3-star movies

    if (direction === 'next') {
        // Move to the next page, if it's within range
        if ((currentPage + 1) * itemsPerPage < totalMovies) {
            currentPage++;
        }
    } else if (direction === 'prev') {
        // Move to the previous page, if not already at the first page
        if (currentPage > 0) {
            currentPage--;
        }
    }

    // Calculate the slice indices for the current page
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;

    // Display the movies for the current page
    displayCarousel(threeStarMovies.slice(start, end));
}

// Function to apply the year filter to the 3-star movies
function applyFilter(year) {
    currentPage = 0; // Reset the page when applying a new filter
    if (!year) {
        displayCarousel(threeStarMovies.slice(0, itemsPerPage)); // If no year filter, display the original list
        return;
    }

    // Filter the 3-star movies by the selected year
    const filteredMovies = threeStarMovies.filter(movie => movie.year === year);

    if (filteredMovies.length === 0) {
        alert("No movies available for the selected year.");
    } else {
        threeStarMovies = filteredMovies; // Update the global variable to hold only filtered movies
        displayCarousel(filteredMovies.slice(0, itemsPerPage)); // Display the first page of filtered movies
    }
}

// Swipe functionality using touch events
function handleTouchStart(event) {
    startX = event.touches[0].clientX; // Capture the initial X position when the touch starts
}

function handleTouchMove(event) {
    endX = event.touches[0].clientX; // Capture the X position as the touch moves
}

function handleTouchEnd() {
    const deltaX = startX - endX; // Calculate the difference between start and end positions

    if (Math.abs(deltaX) > 50) { // Only consider it a swipe if the movement is significant
        if (deltaX > 0) {
            // Swipe left, show next page
            scrollCarousel('next');
        } else {
            // Swipe right, show previous page
            scrollCarousel('prev');
        }
    }

    // Reset values
    startX = 0;
    endX = 0;
}

// Function to show movie suggestions dropdown as user types in the search bar
async function showSuggestions() {
    const searchbartext = document.getElementById("searchbartext").value.trim(); // Get the search text
    if (searchbartext.length === 0) {
        document.getElementById("suggestions-dropdown").innerHTML = ""; // Clear suggestions if no input
        return;
    }

    const url = `https://corsproxy.io/?https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const suggestionsDropdown = document.getElementById("suggestions-dropdown");
        suggestionsDropdown.innerHTML = ""; // Clear previous suggestions

        data.forEach(movie => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = reformatTitle(movie.title); // Display reformatted movie title

            // Add click event to fill search bar with selected movie title and search
            suggestionItem.addEventListener('click', () => {
                document.getElementById("searchbartext").value = reformatTitle(movie.title);
                suggestionsDropdown.innerHTML = ""; // Clear dropdown
                findMovie(); // Trigger movie search
            });

            // Append suggestion to dropdown
            suggestionsDropdown.appendChild(suggestionItem);
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}
