document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        findMovie();
    }
});

const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';
const API_URL = 'https://api.themoviedb.org/3';
const CORS_PROXY = 'https://corsproxy.io/?';

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function reformatTitle(title) {
    const match = title.match(/^(.*?), (The|A|An)$/);
    return match ? `${match[2]} ${match[1]}` : title;
}

async function fetchApiTmdb(imdbid) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    };
    const response = await fetch(`${API_URL}/find/tt${imdbid}?external_source=imdb_id`, options);
    const data = await response.json();
    const movieResult = data.movie_results[0];

    return movieResult ? { posterUrl: `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` } : null;
}

const mockyUrl = 'https://run.mocky.io/v3/8523e1bf-9da2-4b7b-93e8-bb82825682e9';

async function fetchApi(imdbid, movieElement) {
    const response = await fetch(mockyUrl);
    const data = await response.json();
    const film = data.find(film => film.imdbid === imdbid);

    if (film) {
        const { title, year, rating } = film;
        movieElement.querySelector(".title").textContent = reformatTitle(decodeHtmlEntities(title));
        movieElement.querySelector(".year").textContent = year;
        movieElement.querySelector(".rating").innerHTML = generateStars(rating);
    }
}

async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value.trim();
    if (searchbartext.length === 0) {
        return;
    }
    
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;
    const response = await fetch(url);
    const data = await response.json();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const fetchPromises = data.map(async movie => {
        const movieElement = createMovieElement();
        resultsContainer.appendChild(movieElement);
        await fetchApi(movie.imdbid, movieElement);
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        if (tmdbData) {
            movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
            movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${movie.imdbid}`;
        } else {
            movieElement.remove();
        }
    });

    await Promise.all(fetchPromises);
}

function createMovieElement() {
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie");
    movieElement.innerHTML = `
        <div class="title"></div>
        <div class="year"></div>
        <div class="rating"></div>
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a>
    `;
    return movieElement;
}

function generateStars(rating) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    const starColor = '#FFD700';
    return `<span style="color: ${starColor};">${fullStar.repeat(rating) + emptyStar.repeat(3 - rating)}</span>`;
}

async function fetchAllMovies() {
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getAllMovies`;
    const response = await fetch(url);
    return response.json();
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function getRandomMovie() {
    const allMovies = await fetchAllMovies();
    const filteredMovies = allMovies.filter(movie => movie.year >= 1995 && movie.year <= 2025);

    if (filteredMovies.length === 0) {
        alert("No movies available for the selected years");
        return;
    }

    const randomMovie = getRandomItem(filteredMovies);

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const movieElement = createMovieElement();
    resultsContainer.appendChild(movieElement);

    await fetchApi(randomMovie.imdbid, movieElement);
    const tmdbData = await fetchApiTmdb(randomMovie.imdbid);
    if (tmdbData) {
        movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
        movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${randomMovie.imdbid}`;
    } else {
        movieElement.remove();
    }
}

let threeStarMovies = [];
let currentPage = 1;
const moviesPerPage = 4;

async function fetchThreeStarMovies() {
    const allMovies = await fetchAllMovies();
    threeStarMovies = allMovies.filter(movie => movie.rating === 3 && movie.year >= 1995 && movie.year <= 2024);
    threeStarMovies.sort((a, b) => b.year - a.year);
    displayPage(1);
}

function applyFilters(movies, filters) {
    return movies.filter(movie => {
        const matchesYear = filters.year ? movie.year === filters.year : true;
        return matchesYear;
    });
}

function displayPage(page, filters = {}) {
    currentPage = page;
    const filteredMovies = applyFilters(threeStarMovies, filters);
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex);

    const suggestionsContainer = document.getElementById("suggestions-list");
    suggestionsContainer.innerHTML = "";

    const fetchPromises = moviesToDisplay.map(async movie => {
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        if (tmdbData) {
            const suggestionElement = document.createElement("div");
            suggestionElement.classList.add("suggestion-item");
            suggestionElement.innerHTML = `
                <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link">
                    <img src="${tmdbData.posterUrl}" alt="${reformatTitle(decodeHtmlEntities(movie.title))} Poster" class="suggestion-poster"/>
                    <div class="title">${reformatTitle(decodeHtmlEntities(movie.title))}</div>
                    <div class="year">${movie.year}</div>
                    <div class="rating">${generateStars(movie.rating)}</div>
                </a>
            `;
            suggestionsContainer.appendChild(suggestionElement);
        }
    });

    Promise.all(fetchPromises).then(() => {
        displayPagination(filteredMovies.length, filters);
    });
}

function displayPagination(totalMovies, filters) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    const maxPagesToShow = 15;
    const startPage = Math.max(Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1), 1);
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pagination-button");
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => displayPage(i, filters));
        paginationContainer.appendChild(pageButton);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.innerText = "Next";
        nextButton.classList.add("pagination-button");
        nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters));
        paginationContainer.appendChild(nextButton);
    }

    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.innerText = "Previous";
        prevButton.classList.add("pagination-button");
        prevButton.addEventListener("click", () => displayPage(currentPage - 1, filters));
        paginationContainer.prepend(prevButton);
    }
}

document.getElementById("filter-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const year = parseInt(document.getElementById("year").value, 10);
    const filters = { year };
    displayPage(1, filters);
});

let debounceTimeout;
async function showSuggestions() {
    const query = document.getElementById("searchbartext").value;
    if (query.length < 3) {
        document.getElementById("suggestions-dropdown").innerHTML = "";
        return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        const suggestionsDropdown = document.getElementById("suggestions-dropdown");
        suggestionsDropdown.innerHTML = "";

        data.slice(0, 5).forEach(movie => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = `${reformatTitle(decodeHtmlEntities(movie.title))} (${movie.year})`;
            suggestionItem.addEventListener("click", () => {
                document.getElementById("searchbartext").value = reformatTitle(decodeHtmlEntities(movie.title));
                suggestionsDropdown.innerHTML = "";
                findMovie();
            });
            suggestionsDropdown.appendChild(suggestionItem);
        });
    }, 300);
}

fetchThreeStarMovies();

document.getElementById('description-button').onclick = function() {
    document.getElementById('popup-description').style.display = 'block';
};

document.getElementById('rating-button').onclick = function() {
    document.getElementById('popup-rating').style.display = 'block';
};

document.querySelectorAll('.close').forEach(function(element) {
    element.onclick = function() {
        element.parentElement.parentElement.style.display = 'none';
    };
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
