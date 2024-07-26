document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    if (event.key === "Enter") { // si la touche entrée est pressée
        event.preventDefault(); // empêche le comportement par défaut
        findMovie(); // appelle la fonction findMovie
    }
});

const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs'; // clé API
const API_URL = 'https://api.themoviedb.org/3'; // url de l'API
const CORS_PROXY = 'https://corsproxy.io/?'; // proxy pour contourner le problème de CORS

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea'); // crée un élément textarea
    textarea.innerHTML = text; // assigne le texte au textarea
    return textarea.value; // retourne le texte décodé
}

function reformatTitle(title) {
    const match = title.match(/^(.*?), (The|A|An)$/); // cherche les titres avec "The", "A", ou "An" à la fin
    return match ? `${match[2]} ${match[1]}` : title; // reformate le titre
}

async function fetchApiTmdb(imdbid) {
    const options = {
        method: 'GET', // méthode GET
        headers: {
            accept: 'application/json', // accepte le format JSON
            Authorization: `Bearer ${API_KEY}` // ajoute la clé API
        }
    };
    const response = await fetch(`${API_URL}/find/tt${imdbid}?external_source=imdb_id`, options); // fait une requête à l'API TMDB
    const data = await response.json(); // convertit la réponse en JSON
    const movieResult = data.movie_results[0]; // prend le premier résultat

    return movieResult ? { posterUrl: `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` } : null; // retourne l'URL du poster si trouvée
}

const mockyUrl = 'https://run.mocky.io/v3/8523e1bf-9da2-4b7b-93e8-bb82825682e9'; // URL de l'API mocky

async function fetchApi(imdbid, movieElement) {
    const response = await fetch(mockyUrl); // fait une requête à l'API mocky
    const data = await response.json(); // convertit la réponse en JSON
    const film = data.find(film => film.imdbid === imdbid); // trouve le film avec le même imdbid

    if (film) {
        const { title, year, rating } = film; // récupère le titre, l'année et la note du film
        movieElement.querySelector(".title").textContent = reformatTitle(decodeHtmlEntities(title)); // met à jour le titre
        movieElement.querySelector(".year").textContent = year; // met à jour l'année
        movieElement.querySelector(".rating").innerHTML = generateStars(rating); // met à jour la note
    }
}

async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value.trim(); // récupère le texte de la barre de recherche
    if (searchbartext.length === 0) { // si le texte est vide
        return; // quitte la fonction
    }
    
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`; // crée l'URL de la requête
    const response = await fetch(url); // fait une requête à l'API bechdel
    const data = await response.json(); // convertit la réponse en JSON
    const resultsContainer = document.getElementById("results"); // récupère le conteneur de résultats
    resultsContainer.innerHTML = ""; // vide le conteneur

    const fetchPromises = data.map(async movie => { // pour chaque film trouvé
        const movieElement = createMovieElement(); // crée un élément film
        resultsContainer.appendChild(movieElement); // ajoute l'élément film au conteneur
        await fetchApi(movie.imdbid, movieElement); // récupère les infos du film depuis mocky
        const tmdbData = await fetchApiTmdb(movie.imdbid); // récupère les infos du film depuis TMDB
        if (tmdbData) {
            movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl; // met à jour l'URL du poster
            movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${movie.imdbid}`; // met à jour le lien IMDB
        } else {
            movieElement.remove(); // supprime l'élément film s'il n'y a pas de poster
        }
    });

    await Promise.all(fetchPromises); // attend que toutes les requêtes soient terminées
}

function createMovieElement() {
    const movieElement = document.createElement("div"); // crée un élément div
    movieElement.classList.add("movie"); // ajoute la classe movie
    movieElement.innerHTML = `
        <div class="title"></div> <!-- div pour le titre -->
        <div class="year"></div> <!-- div pour l'année -->
        <div class="rating"></div> <!-- div pour la note -->
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a> <!-- lien et image pour le poster -->
    `;
    return movieElement; // retourne l'élément film
}

function generateStars(rating) {
    const fullStar = '⭐'; // caractère étoile pleine
    const emptyStar = '☆'; // caractère étoile vide
    const starColor = '#FFD700'; // couleur des étoiles
    return `<span style="color: ${starColor};">${fullStar.repeat(rating) + emptyStar.repeat(3 - rating)}</span>`; // génère les étoiles
}

async function fetchAllMovies() {
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getAllMovies`; // crée l'URL de la requête
    const response = await fetch(url); // fait une requête à l'API bechdel
    return response.json(); // retourne les données JSON
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)]; // retourne un élément aléatoire de l'array
}

async function getRandomMovie() {
    const allMovies = await fetchAllMovies(); // récupère tous les films
    const filteredMovies = allMovies.filter(movie => movie.year >= 1995 && movie.year <= 2025); // filtre les films par année

    if (filteredMovies.length === 0) { // si aucun film trouvé
        alert("No movies available for the selected years"); // affiche une alerte
        return; // quitte la fonction
    }

    const randomMovie = getRandomItem(filteredMovies); // choisit un film aléatoire

    const resultsContainer = document.getElementById("results"); // récupère le conteneur de résultats
    resultsContainer.innerHTML = ""; // vide le conteneur

    const movieElement = createMovieElement(); // crée un élément film
    resultsContainer.appendChild(movieElement); // ajoute l'élément film au conteneur

    await fetchApi(randomMovie.imdbid, movieElement); // récupère les infos du film depuis mocky
    const tmdbData = await fetchApiTmdb(randomMovie.imdbid); // récupère les infos du film depuis TMDB
    if (tmdbData) {
        movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl; // met à jour l'URL du poster
        movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${randomMovie.imdbid}`; // met à jour le lien IMDB
    } else {
        movieElement.remove(); // supprime l'élément film s'il n'y a pas de poster
    }
}

let threeStarMovies = []; // tableau pour les films 3 étoiles
let currentPage = 1; // page actuelle
const moviesPerPage = 4; // nombre de films par page

async function fetchThreeStarMovies() {
    const allMovies = await fetchAllMovies(); // récupère tous les films
    threeStarMovies = allMovies.filter(movie => movie.rating === 3 && movie.year >= 1995 && movie.year <= 2024); // filtre les films 3 étoiles par année
    threeStarMovies.sort((a, b) => b.year - a.year); // trie les films par année décroissante
    displayPage(1); // affiche la première page
}

function applyFilters(movies, filters) {
    return movies.filter(movie => { // applique les filtres
        const matchesYear = filters.year ? movie.year === filters.year : true; // filtre par année
        return matchesYear;
    });
}

function displayPage(page, filters = {}) {
    currentPage = page; // met à jour la page actuelle
    const filteredMovies = applyFilters(threeStarMovies, filters); // applique les filtres
    const startIndex = (page - 1) * moviesPerPage; // calcule l'index de départ
    const endIndex = startIndex + moviesPerPage; // calcule l'index de fin
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex); // extrait les films à afficher

    const suggestionsContainer = document.getElementById("suggestions-list"); // récupère le conteneur de suggestions
    suggestionsContainer.innerHTML = ""; // vide le conteneur

    const fetchPromises = moviesToDisplay.map(async movie => { // pour chaque film à afficher
        const tmdbData = await fetchApiTmdb(movie.imdbid); // récupère les infos du film depuis TMDB
        if (tmdbData) {
            const suggestionElement = document.createElement("div"); // crée un élément div
            suggestionElement.classList.add("suggestion-item"); // ajoute la classe suggestion-item
            suggestionElement.innerHTML = `
                <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link"> <!-- lien vers IMDB -->
                    <img src="${tmdbData.posterUrl}" alt="${reformatTitle(decodeHtmlEntities(movie.title))} Poster" class="suggestion-poster"/> <!-- image du poster -->
                    <div class="title">${reformatTitle(decodeHtmlEntities(movie.title))}</div> <!-- titre du film -->
                    <div class="year">${movie.year}</div> <!-- année du film -->
                    <div class="rating">${generateStars(movie.rating)}</div> <!-- note du film -->
                </a>
            `;
            suggestionsContainer.appendChild(suggestionElement); // ajoute l'élément suggestion au conteneur
        }
    });

    Promise.all(fetchPromises).then(() => { // attend que toutes les requêtes soient terminées
        displayPagination(filteredMovies.length, filters); // affiche la pagination
    });
}

function displayPagination(totalMovies, filters) {
    const paginationContainer = document.getElementById("pagination"); // récupère le conteneur de pagination
    paginationContainer.innerHTML = ""; // vide le conteneur

    const totalPages = Math.ceil(totalMovies / moviesPerPage); // calcule le nombre total de pages
    const maxPagesToShow = 15;  // affiche seulement 15 pages
    const startPage = Math.max(Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1), 1); // calcule la première page à afficher
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages); // calcule la dernière page à afficher

    for (let i = startPage; i <= endPage; i++) { // boucle pour créer les boutons de pagination
        const pageButton = document.createElement("button"); // crée un élément bouton
        pageButton.innerText = i; // assigne le numéro de page au bouton
        pageButton.classList.add("pagination-button"); // ajoute la classe pagination-button
        if (i === currentPage) {
            pageButton.classList.add("active"); // ajoute la classe active pour la page actuelle
        }
        pageButton.addEventListener("click", () => displayPage(i, filters)); // ajoute un événement click pour afficher la page
        paginationContainer.appendChild(pageButton); // ajoute le bouton de pagination au conteneur
    }

    if (currentPage < totalPages) { // si la page actuelle n'est pas la dernière
        const nextButton = document.createElement("button"); // crée un bouton next
        nextButton.innerText = "Next"; // texte du bouton
        nextButton.classList.add("pagination-button"); // ajoute la classe pagination-button
        nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters)); // événement click pour afficher la page suivante
        paginationContainer.appendChild(nextButton); // ajoute le bouton next au conteneur
    }

    if (currentPage > 1) { // si la page actuelle n'est pas la première
        const prevButton = document.createElement("button"); // crée un bouton previous
        prevButton.innerText = "Previous"; // texte du bouton
        prevButton.classList.add("pagination-button"); // ajoute la classe pagination-button
        prevButton.addEventListener("click", () => displayPage(currentPage - 1, filters)); // événement click pour afficher la page précédente
        paginationContainer.prepend(prevButton); // ajoute le bouton previous au début du conteneur
    }
}

document.getElementById("filter-form").addEventListener("submit", function(event) { // événement submit pour le formulaire de filtre
    event.preventDefault(); // empêche le comportement par défaut
    const year = parseInt(document.getElementById("year").value, 10); // récupère l'année du filtre
    const filters = { year }; // crée l'objet filtre
    displayPage(1, filters); // affiche la première page avec le filtre
});

let debounceTimeout;
async function showSuggestions() {
    const query = document.getElementById("searchbartext").value; // récupère la valeur de la barre de recherche
    if (query.length < 3) { // si la requête est trop courte
        document.getElementById("suggestions-dropdown").innerHTML = ""; // vide les suggestions
        return; // quitte la fonction
    }

    clearTimeout(debounceTimeout); // annule le dernier timeout
    debounceTimeout = setTimeout(async () => { // définit un nouveau timeout
        const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(query)}`; // crée l'URL de la requête
        const response = await fetch(url); // fait une requête à l'API bechdel
        const data = await response.json(); // convertit la réponse en JSON

        const suggestionsDropdown = document.getElementById("suggestions-dropdown"); // récupère le conteneur de suggestions
        suggestionsDropdown.innerHTML = ""; // vide le conteneur

        data.slice(0, 5).forEach(movie => { // pour les 5 premiers films trouvés
            const suggestionItem = document.createElement("div"); // crée un élément div
            suggestionItem.classList.add("suggestion-item"); // ajoute la classe suggestion-item
            suggestionItem.textContent = `${reformatTitle(decodeHtmlEntities(movie.title))} (${movie.year})`; // assigne le texte de suggestion
            suggestionItem.addEventListener("click", () => { // événement click pour choisir une suggestion
                document.getElementById("searchbartext").value = reformatTitle(decodeHtmlEntities(movie.title)); // met à jour la barre de recherche
                suggestionsDropdown.innerHTML = ""; // vide les suggestions
                findMovie(); // appelle la fonction findMovie
            });
            suggestionsDropdown.appendChild(suggestionItem); // ajoute la suggestion au conteneur
        });
    }, 300); // délai de 300ms pour le debounce
}

fetchThreeStarMovies(); // appelle la fonction fetchThreeStarMovies au chargement
