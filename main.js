document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        findMovie();
    }
});

const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';  
const API_URL = 'https://api.themoviedb.org/3';
const CORS_PROXY = 'https://corsproxy.io/?';

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
        movieElement.querySelector(".title").textContent = title;
        movieElement.querySelector(".year").textContent = year;
        movieElement.querySelector(".rating").innerHTML = generateStars(rating);
    }
}

async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value;
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${searchbartext}`;
    const response = await fetch(url);
    const data = await response.json();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";
    for (const movie of data) {
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
    }
}

function createMovieElement() {
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie");
    movieElement.innerHTML = `
        <div class="title"></div>
        <div class="year"></div>
        <div class="rating"></div>
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a>
        <div class="imdb-link"></div>
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
    const threeStarMovies = allMovies.filter(movie => movie.rating === 3);

    if (threeStarMovies.length === 0) {
        alert("No movies with a 3 star rating");
        return;
    }

    const randomMovie = getRandomItem(threeStarMovies);

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
    let filteredMovies = applyFilters(threeStarMovies, filters);
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex);

    const suggestionsContainer = document.getElementById("suggestions-list");
    suggestionsContainer.innerHTML = "";

    for (const movie of moviesToDisplay) {
        fetchApiTmdb(movie.imdbid).then(tmdbData => {
            if (tmdbData) {
                const suggestionElement = document.createElement("div");
                suggestionElement.classList.add("suggestion-item");
                suggestionElement.innerHTML = `
                    <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link">
                        <img src="${tmdbData.posterUrl}" alt="${movie.title} Poster" class="suggestion-poster"/>
                        <div class="title">${movie.title}</div>
                        <div class="year">${movie.year}</div>
                        <div class="rating">${generateStars(movie.rating)}</div>
                    </a>
                `;
                suggestionsContainer.appendChild(suggestionElement);
            }
        });
    }

    displayPagination(filteredMovies.length, filters);
}

function displayPagination(totalMovies, filters) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    const maxPagesToShow = 20;
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
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

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.classList.add("pagination-button");
    if (currentPage === totalPages) {
        nextButton.disabled = true;
    }
    nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters));
    paginationContainer.appendChild(nextButton);

    if (endPage < totalPages) {
        const lastButton = document.createElement("button");
        lastButton.innerText = "Last";
        lastButton.classList.add("pagination-button");
        lastButton.addEventListener("click", () => displayPage(totalPages, filters));
        paginationContainer.appendChild(lastButton);
    }
}

document.getElementById("filter-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const year = parseInt(document.getElementById("year").value, 10);
    const filters = { year };
    displayPage(1, filters);
});

fetchThreeStarMovies();
