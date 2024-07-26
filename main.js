// ajoute un écouteur d'événement pour la touche "entrée" dans le champ de recherche
document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    // si la touche pressée est "Enter"
    if (event.key === "Enter") {
        // empêche le comportement par défaut de la touche entrée
        event.preventDefault();
        // appelle la fonction findMovie quand la touche entree est pressée
        findMovie();
    }
});

// clé API pour accéder à l'API de The Movie Database
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';

const API_URL = 'https://api.themoviedb.org/3'; // url de base de l'api de The Movie Database
const CORS_PROXY = 'https://corsproxy.io/?'; // proxy pour contourner les restrictions CORS

// fonction pour decoder les entités HTML
function decodeHtmlEntities(text) {
    // crée un élément textarea temporaire pour décoder le texte
    const textarea = document.createElement('textarea');
    // assigne le texte encodé en html à l'intérieur du textarea
    textarea.innerHTML = text;
    // retourne le texte décodé
    return textarea.value;
}

// fonction pour reformater le titre
function reformatTitle(title) {
    // cherche des correspondances avec des articles en fin de titre (ex: "Matrix, The")
    const match = title.match(/^(.*?), (The|A|An)$/);
    // si une correspondance est trouvée, reformate le titre, sinon retourne le titre original
    return match ? `${match[2]} ${match[1]}` : title;
}

// fonction pour récupérer les données du film depuis TMDB
async function fetchApiTmdb(imdbid) {
    // options de la requête avec la méthode GET et les en-têtes
    const options = {
        method: 'GET', // méthode HTTP GET
        headers: {
            accept: 'application/json', // accepte la réponse en JSON
            Authorization: `Bearer ${API_KEY}` // ajoute la clé API dans l'en-tête d'autorisation
        }
    };
    // fait une requête à l'API pour trouver un film par son identifiant IMDb
    const response = await fetch(`${API_URL}/find/tt${imdbid}?external_source=imdb_id`, options);
    // convertit la réponse en format JSON
    const data = await response.json();
    // récupère le premier résultat de la recherche de film
    const movieResult = data.movie_results[0];

    // retourne l'URL de l'affiche du film si disponible, sinon retourne null
    return movieResult ? { posterUrl: `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` } : null;
}

// url de l'API Mocky pour récupérer des données de films fictifs
const mockyUrl = 'https://run.mocky.io/v3/8523e1bf-9da2-4b7b-93e8-bb82825682e9';

// fonction pour récupérer les données du film depuis Mocky
async function fetchApi(imdbid, movieElement) {
    // fait une requête à l'API Mocky
    const response = await fetch(mockyUrl);
    // convertit la réponse en format JSON
    const data = await response.json();
    // trouve le film correspondant à l'identifiant IMDb
    const film = data.find(film => film.imdbid === imdbid);

    // si le film est trouvé
    if (film) {
        // extrait le titre, l'année et la note du film
        const { title, year, rating } = film;
        // met à jour le titre de l'élément film
        movieElement.querySelector(".title").textContent = reformatTitle(decodeHtmlEntities(title));
        // met à jour l'année de l'élément film
        movieElement.querySelector(".year").textContent = year;
        // met à jour la note de l'élément film avec des étoiles
        movieElement.querySelector(".rating").innerHTML = generateStars(rating);
    }
}

// fonction pour trouver un film basé sur le texte dans la barre de recherche
async function findMovie() {
    // récupère le texte de la barre de recherche et enlève les espaces inutiles
    const searchbartext = document.getElementById("searchbartext").value.trim();
    // si le champ de recherche est vide, on quitte la fonction
    if (searchbartext.length === 0) {
        return;
    }
    
    // construit l'URL de l'API Bechdel Test pour trouver des films par titre
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;
    // fait une requête à l'API
    const response = await fetch(url);
    // convertit la réponse en format JSON
    const data = await response.json();
    // vide le conteneur de résultats
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // crée un nouvel élément pour chaque film
    const fetchPromises = data.map(async movie => {
        const movieElement = createMovieElement();
        // ajoute l'élément au conteneur de résultats
        resultsContainer.appendChild(movieElement);
        // récupère les données du film à partir de Mocky et les affiche
        await fetchApi(movie.imdbid, movieElement);
        // récupère les données du film à partir de TMDB
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        // si les données TMDB sont disponibles, met à jour l'affiche et le lien du film
        if (tmdbData) {
            movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
            movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${movie.imdbid}`;
        } else {
            // enlève l'élément si les données TMDB ne sont pas disponibles
            movieElement.remove();
        }
    });

    // attend que toutes les promesses soient résolues
    await Promise.all(fetchPromises);
}

// fonction pour créer un nouvel élément de film
function createMovieElement() {
    // crée un élément div et lui ajoute la classe "movie"
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie");
    // structure HTML de l'élément film
    movieElement.innerHTML = `
        <div class="title"></div>
        <div class="year"></div>
        <div class="rating"></div>
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a>
    `;
    // retourne l'élément film
    return movieElement;
}

// fonction pour générer des étoiles en fonction de la note
function generateStars(rating) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    const starColor = '#FFD700';
    // génère une chaîne de caractères avec les étoiles en fonction de la note
    return `<span style="color: ${starColor};">${fullStar.repeat(rating) + emptyStar.repeat(3 - rating)}</span>`;
}

// fonction pour récupérer tous les films depuis l'API Bechdel Test
async function fetchAllMovies() {
    // construit l'URL de l'API Bechdel Test pour récupérer tous les films
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getAllMovies`;
    // fait une requête à l'API
    const response = await fetch(url);
    // convertit la réponse en format JSON et la retourne
    return response.json();
}

// fonction pour obtenir un élément aléatoire d'un tableau
function getRandomItem(array) {
    // retourne un élément aléatoire du tableau
    return array[Math.floor(Math.random() * array.length)];
}

// fonction pour obtenir un film aléatoire
async function getRandomMovie() {
    // récupère tous les films
    const allMovies = await fetchAllMovies();
    // filtre les films par année
    const filteredMovies = allMovies.filter(movie => movie.year >= 1995 && movie.year <= 2025);

    // si aucun film n'est disponible pour les années sélectionnées, affiche un message d'alerte
    if (filteredMovies.length === 0) {
        alert("no movies available for the selected years");
        return;
    }

    // sélectionne un film aléatoire parmi les films filtrés
    const randomMovie = getRandomItem(filteredMovies);

    // vide le conteneur de résultats
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // crée un nouvel élément de film
    const movieElement = createMovieElement();
    // ajoute l'élément au conteneur de résultats
    resultsContainer.appendChild(movieElement);

    // récupère les données du film à partir de Mocky et les affiche
    await fetchApi(randomMovie.imdbid, movieElement);
    // récupère les données du film à partir de TMDB
    const tmdbData = await fetchApiTmdb(randomMovie.imdbid);
    // si les données TMDB sont disponibles, met à jour l'affiche et le lien du film
    if (tmdbData) {
        movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
        movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${randomMovie.imdbid}`;
    } else {
        // enlève l'élément si les données TMDB ne sont pas disponibles
        movieElement.remove();
    }
}

let threeStarMovies = []; // tableau pour stocker les films 3 étoiles
let currentPage = 1; // page courante pour la pagination
const moviesPerPage = 4; // nombre de films à afficher par page

// fonction pour récupérer les films 3 étoiles
async function fetchThreeStarMovies() {
    // récupère tous les films
    const allMovies = await fetchAllMovies();
    // filtre les films pour ceux qui ont 3 étoiles et sont entre 1995 et 2024
    threeStarMovies = allMovies.filter(movie => movie.rating === 3 && movie.year >= 1995 && movie.year <= 2024);
    // trie les films par année, du plus récent au moins récent
    threeStarMovies.sort((a, b) => b.year - a.year);
    // affiche la première page
    displayPage(1);
}

// applique les filtres aux films
function applyFilters(movies, filters) {
    // filtre les films en fonction des critères
    return movies.filter(movie => {
        const matchesYear = filters.year ? movie.year === filters.year : true;
        return matchesYear;
    });
}

// affiche une page de films
function displayPage(page, filters = {}) {
    // met à jour la page courante
    currentPage = page;
    // applique les filtres aux films 3 étoiles
    const filteredMovies = applyFilters(threeStarMovies, filters);
    // calcule les indices de début et de fin pour les films à afficher
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    // sélectionne les films à afficher pour la page actuelle
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex);

    // récupère le conteneur des suggestions
    const suggestionsContainer = document.getElementById("suggestions-list");
    // vide le conteneur
    suggestionsContainer.innerHTML = "";

    // crée un élément pour chaque film à afficher
    const fetchPromises = moviesToDisplay.map(async movie => {
        // récupère les données du film depuis TMDB
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        // si les données TMDB sont disponibles
        if (tmdbData) {
            // crée un élément div pour la suggestion de film
            const suggestionElement = document.createElement("div");
            suggestionElement.classList.add("suggestion-item");
            // structure HTML de la suggestion de film
            suggestionElement.innerHTML = `
                <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link">
                    <img src="${tmdbData.posterUrl}" alt="${reformatTitle(decodeHtmlEntities(movie.title))} Poster" class="suggestion-poster"/>
                    <div class="title">${reformatTitle(decodeHtmlEntities(movie.title))}</div>
                    <div class="year">${movie.year}</div>
                    <div class="rating">${generateStars(movie.rating)}</div>
                </a>
            `;
            // ajoute l'élément de suggestion au conteneur
            suggestionsContainer.appendChild(suggestionElement);
        }
    });

    // attend que toutes les promesses soient résolues
    Promise.all(fetchPromises).then(() => {
        // affiche la pagination
        displayPagination(filteredMovies.length, filters);
    });
}

// affiche la pagination
function displayPagination(totalMovies, filters) {
    // récupère le conteneur de pagination
    const paginationContainer = document.getElementById("pagination");
    // vide le conteneur de pagination
    paginationContainer.innerHTML = "";

    // calcule le nombre total de pages
    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    // nombre maximum de pages à afficher
    const maxPagesToShow = 15;
    // calcule la première page à afficher
    const startPage = Math.max(Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1), 1);
    // calcule la dernière page à afficher
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    // crée un bouton pour chaque page à afficher
    for (let i = startPage; i <= endPage; i++) {
        // crée un bouton pour la page
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pagination-button");
        // si la page est la page courante, ajoute la classe "active"
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        // ajoute un écouteur d'événement pour afficher la page lorsque le bouton est cliqué
        pageButton.addEventListener("click", () => displayPage(i, filters));
        // ajoute le bouton au conteneur de pagination
        paginationContainer.appendChild(pageButton);
    }

    // si la page courante est inférieure au nombre total de pages, affiche le bouton "Next"
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.innerText = "Next";
        nextButton.classList.add("pagination-button");
        nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters));
        paginationContainer.appendChild(nextButton);
    }

    // si la page courante est supérieure à 1, affiche le bouton "Previous"
    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.innerText = "Previous";
        prevButton.classList.add("pagination-button");
        prevButton.addEventListener("click", () => displayPage(currentPage - 1, filters));
        paginationContainer.prepend(prevButton);
    }
}

// ajoute un écouteur d'événement pour soumettre le formulaire de filtre
document.getElementById("filter-form").addEventListener("submit", function(event) {
    event.preventDefault(); // empêche le comportement par défaut du formulaire
    const year = parseInt(document.getElementById("year").value, 10); // récupère l'année du champ de saisie et la convertit en entier
    const filters = { year }; // crée un objet de filtre avec l'année
    displayPage(1, filters); // affiche la première page avec les filtres appliqués
});

let debounceTimeout; // variable pour stocker le délai d'attente

// fonction pour afficher les suggestions de recherche
async function showSuggestions() {
    const query = document.getElementById("searchbartext").value; // récupère la valeur du champ de saisie de recherche
    if (query.length < 3) { // si la requête est trop courte
        document.getElementById("suggestions-dropdown").innerHTML = ""; // vide le conteneur de suggestions
        return; // quitte la fonction
    }

    clearTimeout(debounceTimeout); // annule le délai d'attente précédent
    debounceTimeout = setTimeout(async () => {
        const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(query)}`; // construit l'URL de l'API Bechdel Test pour trouver des films par titre
        const response = await fetch(url); // fait une requête à l'API
        const data = await response.json(); // convertit la réponse en format JSON

        const suggestionsDropdown = document.getElementById("suggestions-dropdown"); // récupère le conteneur de suggestions
        suggestionsDropdown.innerHTML = ""; // vide le conteneur de suggestions

        data.slice(0, 5).forEach(movie => { // pour chaque film trouvé (limite à 5)
            const suggestionItem = document.createElement("div"); // crée un élément de suggestion
            suggestionItem.classList.add("suggestion-item"); // ajoute la classe "suggestion-item"
            suggestionItem.textContent = `${reformatTitle(decodeHtmlEntities(movie.title))} (${movie.year})`; // met à jour le texte de l'élément de suggestion
            suggestionItem.addEventListener("click", () => { // ajoute un écouteur d'événement pour le clic
                document.getElementById("searchbartext").value = reformatTitle(decodeHtmlEntities(movie.title)); // met à jour le champ de saisie de recherche avec le titre du film
                suggestionsDropdown.innerHTML = ""; // vide le conteneur de suggestions
                findMovie(); // lance la recherche du film
            });
            suggestionsDropdown.appendChild(suggestionItem); // ajoute l'élément de suggestion au conteneur
        });
    }, 300); // délai d'attente de 300 millisecondes avant d'afficher les suggestions
}

// récupère et affiche les films 3 étoiles à l'initialisation de la page
fetchThreeStarMovies();
