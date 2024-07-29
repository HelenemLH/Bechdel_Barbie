// ajouter un ecouteur de evenement pour la touche "entree" sur la barre de recherche
document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    // si la touche appuyee est "entree"
    if (event.key === "Enter") {
        // empêche le comportement par defaut du formulaire
        event.preventDefault();
        // appelle la fonction pour trouver un film
        findMovie();
    }
});

// cle api pour acceder aux données de themoviedb
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iZiI6MTcyMTgyNDI0OS4zODA1NDksInN1YiI6IjY2OTU2NTc4M2NlMDlkZGVjNDRjMjY2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QY0t-k0EQcIz0rEhakWKqpeqzD5rw4-YA9BpcikeoHs';
const API_URL = 'https://api.themoviedb.org/3';
// proxy pour contourner les problemes cors
const CORS_PROXY = 'https://corsproxy.io/?';

// fonction pour decoder les entites html (pour pas voir à la place de &amp; par ex)
function decodeHtmlEntities(text) {
    // creer une textarea pour utiliser le decodage html natif du navigateur
    const textarea = document.createElement('textarea');
    // mettre le texte avec les entites html dans la textarea
    textarea.innerHTML = text;
    // retourner le texte decode
    return textarea.value;
}

// fonction pour reformater le titre d'un film (https://www.paulsblog.dev/manipulate-strings-with-regular-expression-in-javascript/)
function reformatTitle(title) {
    // utiliser regex pour trouver des titres comme "titre, the" et les reformater
    const match = title.match(/^(.*?), (The|A|An)$/);
    // si il y a un match, reformater le titre, sinon retourner le titre original
    return match ? `${match[2]} ${match[1]}` : title;
}

// fonction pour récupérer les données du film de tmdb
async function fetchApiTmdb(imdbid) {
    // options pour la requête fetch
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json', // accepter le format json
            Authorization: `Bearer ${API_KEY}` // inclure la cle api dans l'autorisation
        }
    };
    // faire la requête fetch avec l'id imdb
    const response = await fetch(`${API_URL}/find/tt${imdbid}?external_source=imdb_id`, options);
    // convertir la réponse en json
    const data = await response.json();
    // prendre le premier resultat du film
    const movieResult = data.movie_results[0];

    // si il y a un resultat, retourner l'url du poster, sinon null
    return movieResult ? { posterUrl: `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` } : null;
}

// url de mocky pour récupérer les données des films
const mockyUrl = 'https://run.mocky.io/v3/8523e1bf-9da2-4b7b-93e8-bb82825682e9';

// fonction pour récupérer les données d'un film a partir de mocky
async function fetchApi(imdbid, movieElement) {
    // faire la requête fetch a mocky
    const response = await fetch(mockyUrl);
    // convertir la réponse en json
    const data = await response.json();
    // trouver le film dans les données qui correspond a l'id imdb
    const film = data.find(film => film.imdbid === imdbid);

    if (film) {
        // si le film est trouvé, extraire le titre, l'annee et la note
        const { title, year, rating } = film;
        // mettre a jour les elements html avec les données du film
        movieElement.querySelector(".title").textContent = reformatTitle(decodeHtmlEntities(title));
        movieElement.querySelector(".year").textContent = year;
        movieElement.querySelector(".rating").innerHTML = generateStars(rating);
    }
}

// fonction pour trouver un film
async function findMovie() {
    // recuperer le texte de la barre de recherche
    const searchbartext = document.getElementById("searchbartext").value.trim();
    // si le texte est vide, arrêter la fonction
    if (searchbartext.length === 0) {
        return;
    }
    
    // construire l'url pour la requête fetch
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(searchbartext)}`;
    // faire la requête fetch
    const response = await fetch(url);
    // convertir la réponse en json
    const data = await response.json();
    // vider le conteneur des resultats
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // créer une liste de promesses pour chaque film trouvé
    const fetchPromises = data.map(async movie => {
        // créer un element html pour le film
        const movieElement = createMovieElement();
        // ajouter l'element au conteneur des resultats
        resultsContainer.appendChild(movieElement);
        // récupérer les données du film depuis mocky
        await fetchApi(movie.imdbid, movieElement);
        // récupérer les données du poster depuis tmdb
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        if (tmdbData) {
            // si les données du poster sont disponibles, mettre a jour l'élément html
            movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
            movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${movie.imdbid}`;
        } else {
            // sinon, supprimer l'élément html
            movieElement.remove();
        }
    });

    // attendre que toutes les promesses soient terminées
    await Promise.all(fetchPromises);
}

// fonction pour créer un élément de film
function createMovieElement() {
    // créer une div pour le film
    const movieElement = document.createElement("div");
    // ajouter la classe 'movie' a la div
    movieElement.classList.add("movie");
    // ajouter le contenu html dans la div
    movieElement.innerHTML = `
        <div class="title"></div>
        <div class="year"></div>
        <div class="rating"></div>
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a>
    `;
    // retourner la div
    return movieElement;
}

// fonction pour générer des etoiles de notation
function generateStars(rating) {
    // etoiles pleines
    const fullStar = '⭐';
    // etoiles vides
    const emptyStar = '☆';
    // definir la couleur des etoiles
    const starColor = '#FFD700';
    // générer les etoiles en fonction de la note
    return `<span style="color: ${starColor};">${fullStar.repeat(rating) + emptyStar.repeat(3 - rating)}</span>`;
}

// fonction pour récupérer tous les films
async function fetchAllMovies() {
    // construire l'url pour la requête fetch
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getAllMovies`;
    // faire la requête fetch
    const response = await fetch(url);
    // retourner la réponse convertie en json
    return response.json();
}

// fonction pour obtenir un element aleatoire d'un tableau
function getRandomItem(array) {
    // retourner un element aleatoire du tableau
    return array[Math.floor(Math.random() * array.length)];
}

// fonction pour obtenir un film aleatoire
async function getRandomMovie() {
    // récupérer tous les films
    const allMovies = await fetchAllMovies();
    // filtrer les films par annee
    const filteredMovies = allMovies.filter(movie => movie.year >= 1995 && movie.year <= 2025);

    // si aucun film n'est disponible, afficher une alerte
    if (filteredMovies.length === 0) {
        alert("no movies available for the selected years");
        return;
    }

    // obtenir un film aleatoire
    const randomMovie = getRandomItem(filteredMovies);

    // vider le conteneur des resultats
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // créer un élément de film
    const movieElement = createMovieElement();
    // ajouter l'élément au conteneur des resultats
    resultsContainer.appendChild(movieElement);

    // récupérer les données du film
    await fetchApi(randomMovie.imdbid, movieElement);
    const tmdbData = await fetchApiTmdb(randomMovie.imdbid);
    if (tmdbData) {
        // si les données du poster sont disponibles, mettre a jour l'élément html
        movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
        movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${randomMovie.imdbid}`;
    } else {
        // sinon, supprimer l'élément html
        movieElement.remove();
    }
}

// tableau pour stocker les films trois etoiles
let threeStarMovies = [];
// variable pour la page actuelle
let currentPage = 1;
// nombre de films par page
const moviesPerPage = 4;

// fonction pour récupérer les films trois etoiles
async function fetchThreeStarMovies() {
    // récupérer tous les films
    const allMovies = await fetchAllMovies();
    // filtrer les films trois etoiles par annee
    threeStarMovies = allMovies.filter(movie => movie.rating === 3 && movie.year >= 1995 && movie.year <= 2024);
    // trier les films par annee
    threeStarMovies.sort((a, b) => b.year - a.year);
    // afficher la premiere page
    displayPage(1);
}

// fonction pour appliquer des filtres sur les films
function applyFilters(movies, filters) {
    // filtrer les films en fonction des filtres
    return movies.filter(movie => {
        // verifier si le film correspond a l'annee du filtre
        const matchesYear = filters.year ? movie.year === filters.year : true;
        return matchesYear;
    });
}

// fonction pour afficher une page de films
function displayPage(page, filters = {}) {
    // mettre a jour la page actuelle
    currentPage = page;
    // appliquer les filtres sur les films
    const filteredMovies = applyFilters(threeStarMovies, filters);
    // calculer les indices de debut et de fin pour la pagination
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    // sélectionner les films a afficher
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex);

    // obtenir le conteneur des suggestions
    const suggestionsContainer = document.getElementById("suggestions-list");
    // vider le conteneur des suggestions
    suggestionsContainer.innerHTML = "";

    // créer une liste de promesses pour chaque film a afficher
    const fetchPromises = moviesToDisplay.map(async movie => {
        // récupérer les données du poster du film depuis tmdb
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        if (tmdbData) {
            // créer un élément de suggestion pour le film
            const suggestionElement = document.createElement("div");
            // ajouter la classe 'suggestion-item' a l'élément
            suggestionElement.classList.add("suggestion-item");
            // ajouter le contenu html dans l'élément
            suggestionElement.innerHTML = `
                <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link">
                    <img src="${tmdbData.posterUrl}" alt="${reformatTitle(decodeHtmlEntities(movie.title))} Poster" class="suggestion-poster"/>
                    <div class="title">${reformatTitle(decodeHtmlEntities(movie.title))}</div>
                    <div class="year">${movie.year}</div>
                    <div class="rating">${generateStars(movie.rating)}</div>
                </a>
            `;
            // ajouter l'élément de suggestion au conteneur des suggestions
            suggestionsContainer.appendChild(suggestionElement);
        }
    });

    // attendre que toutes les promesses soient terminées
    Promise.all(fetchPromises).then(() => {
        // afficher la pagination
        displayPagination(filteredMovies.length, filters);
    });
}

// fonction pour afficher la pagination
function displayPagination(totalMovies, filters) {
    // obtenir le conteneur de la pagination
    const paginationContainer = document.getElementById("pagination");
    // vider le conteneur de la pagination
    paginationContainer.innerHTML = "";

    // calculer le nombre total de pages
    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    // definir le nombre maximal de pages a afficher
    const maxPagesToShow = 15;
    // calculer la premiere page a afficher
    const startPage = Math.max(Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1), 1);
    // calculer la derniere page a afficher
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    // boucle pour créer les boutons de pagination pour chaque page a afficher
    for (let i = startPage; i <= endPage; i++) {
        // créer un bouton pour chaque page
        const pageButton = document.createElement("button");
        // definir le texte du bouton comme le numero de la page
        pageButton.innerText = i;
        // ajouter la classe 'pagination-button' au bouton
        pageButton.classList.add("pagination-button");
        // si c'est la page actuelle, ajouter la classe 'active'
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        // ajouter un ecouteur d'evenement au bouton pour changer de page quand on clique dessus
        pageButton.addEventListener("click", () => displayPage(i, filters));
        // ajouter le bouton au conteneur de la pagination
        paginationContainer.appendChild(pageButton);
    }

    // si la page actuelle est inferieure au nombre total de pages, ajouter un bouton 'next'
    if (currentPage < totalPages) {
        // créer un bouton 'next'
        const nextButton = document.createElement("button");
        // definir le texte du bouton
        nextButton.innerText = "Next";
        // ajouter la classe 'pagination-button' au bouton
        nextButton.classList.add("pagination-button");
        // ajouter un ecouteur d'evenement au bouton pour aller a la page suivante
        nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters));
        // ajouter le bouton au conteneur de la pagination
        paginationContainer.appendChild(nextButton);
    }

    // si la page actuelle est superieure a 1, ajouter un bouton 'previous'
    if (currentPage > 1) {
        // créer un bouton 'previous'
        const prevButton = document.createElement("button");
        // definir le texte du bouton
        prevButton.innerText = "Previous";
        // ajouter la classe 'pagination-button' au bouton
        prevButton.classList.add("pagination-button");
        // ajouter un ecouteur d'evenement au bouton pour aller a la page précédente
        prevButton.addEventListener("click", () => displayPage(currentPage - 1, filters));
        // ajouter le bouton au debut du conteneur de la pagination
        paginationContainer.prepend(prevButton);
    }
}

// ajouter un ecouteur d'evenement pour le formulaire de filtre
document.getElementById("filter-form").addEventListener("submit", function(event) {
    // empêche le comportement par defaut du formulaire
    event.preventDefault();
    // obtenir l'annee du champ de filtre
    const year = parseInt(document.getElementById("year").value, 10);
    // definir les filtres
    const filters = { year };
    // afficher la premiere page avec les filtres appliques
    displayPage(1, filters);
});

// variable pour le timeout de debounce
let debounceTimeout;
// fonction pour afficher les suggestions de films pendant la saisie
async function showSuggestions() {
    // obtenir le texte de la barre de recherche
    const query = document.getElementById("searchbartext").value;
    // si le texte est trop court, vider les suggestions
    if (query.length < 3) {
        document.getElementById("suggestions-dropdown").innerHTML = "";
        return;
    }

    // utiliser un debounce pour eviter de faire trop de requêtes
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        // construire l'url pour la requête fetch
        const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${encodeURIComponent(query)}`;
        // faire la requête fetch
        const response = await fetch(url);
        // convertir la réponse en json
        const data = await response.json();

        // obtenir le conteneur des suggestions
        const suggestionsDropdown = document.getElementById("suggestions-dropdown");
        // vider le conteneur des suggestions
        suggestionsDropdown.innerHTML = "";

        // ajouter chaque film trouvé aux suggestions
        data.slice(0, 5).forEach(movie => {
            // créer un élément de suggestion
            const suggestionItem = document.createElement("div");
            // ajouter la classe 'suggestion-item' a l'élément
            suggestionItem.classList.add("suggestion-item");
            // definir le texte du suggestionItem avec le titre et l'annee du film
            suggestionItem.textContent = `${reformatTitle(decodeHtmlEntities(movie.title))} (${movie.year})`;
            // ajouter un ecouteur d'evenement au suggestionItem pour remplir la barre de recherche et trouver le film
            suggestionItem.addEventListener("click", () => {
                document.getElementById("searchbartext").value = reformatTitle(decodeHtmlEntities(movie.title));
                suggestionsDropdown.innerHTML = "";
                findMovie();
            });
            // ajouter le suggestionItem au conteneur des suggestions
            suggestionsDropdown.appendChild(suggestionItem);
        });
    }, 300);
}

// initialiser la récupération des films trois etoiles
fetchThreeStarMovies();

// montrer la fenêtre pop-up pour la description quand le bouton est cliqué
document.getElementById('description-button').onclick = function() {
    document.getElementById('popup-description').style.display = 'block';
};

// montrer la fenêtre pop-up pour l'explication des notes quand le bouton est cliqué
document.getElementById('rating-button').onclick = function() {
    document.getElementById('popup-rating').style.display = 'block';
};

// ajouter un ecouteur d'evenement pour fermer les fenêtres pop-up quand le bouton de fermeture est cliqué
document.querySelectorAll('.close').forEach(function(element) {
    element.onclick = function() {
        element.parentElement.parentElement.style.display = 'none';
    };
});

// ajouter un ecouteur d'evenement pour fermer les fenêtres pop-up quand on clique en dehors
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
