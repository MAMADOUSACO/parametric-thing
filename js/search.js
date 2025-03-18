/**
 * search.js - Moteur de recherche pour le site Équations Paramétriques
 * Indexe le contenu et permet une recherche rapide à travers les cours
 */

// Index de recherche
let searchIndex = {
    courses: [],
    glossary: [],
    content: {}
};

// Paramètres de recherche
const searchConfig = {
    minQueryLength: 2,
    maxResults: 10,
    highlightClass: 'search-highlight',
    debounceTime: 300  // ms
};

/**
 * Initialise le moteur de recherche
 * @param {Object} coursesData - Données structurées des cours
 */
export function initSearch(coursesData) {
    console.log('Initialisation du moteur de recherche');
    
    // Construire l'index de recherche à partir des données des cours
    buildSearchIndex(coursesData);
    
    // Initialiser la recherche dans la barre de navigation
    initSearchBar();
    
    // Initialiser la recherche du glossaire si on est sur cette page
    if (document.querySelector('.glossary-container')) {
        initGlossarySearch();
    }
}

/**
 * Construit l'index de recherche à partir des données des cours
 * @param {Object} coursesData - Données structurées des cours
 */
function buildSearchIndex(coursesData) {
    // Vérifier que les données sont valides
    if (!coursesData || !coursesData.modules) {
        console.error('Données des cours invalides pour l\'indexation');
        return;
    }
    
    // Indexer chaque module et ses cours
    coursesData.modules.forEach(module => {
        if (module.courses) {
            module.courses.forEach(course => {
                // Ajouter le cours à l'index
                searchIndex.courses.push({
                    id: `${module.id}-${course.id}`,
                    title: course.title,
                    description: course.description || '',
                    moduleTitle: module.title,
                    moduleId: module.id,
                    courseId: course.id,
                    keywords: course.keywords || [],
                    path: `/content/${module.id}/${course.id}.html`
                });
                
                // Planifier le chargement et l'indexation du contenu
                scheduleContentIndexing(`${module.id}-${course.id}`, `/content/${module.id}/${course.id}.html`);
            });
        }
    });
    
    console.log(`${searchIndex.courses.length} cours indexés`);
    
    // Indexer le glossaire
    indexGlossary();
}

/**
 * Planifie l'indexation du contenu d'un cours
 * @param {string} id - Identifiant du cours
 * @param {string} path - Chemin vers le fichier de contenu
 */
function scheduleContentIndexing(id, path) {
    // Cette fonction est appelée lorsque le contenu est réellement chargé
    // pour éviter de ralentir le chargement initial
    document.addEventListener('contentLoaded', (event) => {
        if (event.detail.routeId === id) {
            // Indexer le contenu une fois chargé
            indexPageContent(id);
        }
    });
}

/**
 * Indexe le contenu d'une page chargée
 * @param {string} id - Identifiant de la page
 */
function indexPageContent(id) {
    // Récupérer le contenu du conteneur principal
    const contentContainer = document.getElementById('content-container');
    
    if (!contentContainer) {
        return;
    }
    
    // Extraire le texte des éléments pertinents
    const headings = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const paragraphs = Array.from(contentContainer.querySelectorAll('p'));
    const lists = Array.from(contentContainer.querySelectorAll('li'));
    
    // Construire l'index pour cette page
    const pageIndex = {
        headings: headings.map(h => ({
            text: h.textContent.trim(),
            level: parseInt(h.tagName.substring(1)),
            id: h.id || ''
        })),
        paragraphs: paragraphs.map(p => p.textContent.trim()),
        lists: lists.map(li => li.textContent.trim()),
        fullText: contentContainer.textContent.trim()
    };
    
    // Ajouter à l'index global
    searchIndex.content[id] = pageIndex;
    
    console.log(`Contenu de la page ${id} indexé`);
}

/**
 * Indexe le glossaire
 */
function indexGlossary() {
    // Cette fonction sera appelée lorsque le glossaire est chargé
    document.addEventListener('contentLoaded', (event) => {
        if (event.detail.routeId === 'glossary') {
            const glossaryTerms = document.querySelectorAll('.glossary-term');
            
            glossaryTerms.forEach(term => {
                const titleEl = term.querySelector('.term-title');
                const definitionEl = term.querySelector('.term-definition');
                
                if (titleEl && definitionEl) {
                    searchIndex.glossary.push({
                        id: 'glossary-' + titleEl.textContent.trim().toLowerCase().replace(/\s+/g, '-'),
                        title: titleEl.textContent.trim(),
                        category: term.dataset.category || '',
                        definition: definitionEl.textContent.trim(),
                        path: '#glossary'
                    });
                }
            });
            
            console.log(`${searchIndex.glossary.length} termes du glossaire indexés`);
        }
    });
}

/**
 * Initialise la barre de recherche principale
 */
function initSearchBar() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (!searchForm || !searchInput) {
        console.error('Éléments de recherche non trouvés');
        return;
    }
    
    // Variable pour stocker le timeout du debounce
    let debounceTimeout;
    
    // Créer le conteneur des résultats s'il n'existe pas déjà
    let searchResults = document.querySelector('.search-results');
    
    if (!searchResults) {
        searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchForm.appendChild(searchResults);
    }
    
    // Gestionnaire pour la soumission du formulaire
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const query = searchInput.value.trim();
        
        if (query.length >= searchConfig.minQueryLength) {
            performSearch(query, searchResults);
        }
    });
    
    // Gestionnaire pour la saisie en temps réel (avec debounce)
    searchInput.addEventListener('input', () => {
        // Effacer le timeout précédent
        clearTimeout(debounceTimeout);
        
        const query = searchInput.value.trim();
        
        // Masquer les résultats si la requête est trop courte
        if (query.length < searchConfig.minQueryLength) {
            searchResults.classList.remove('active');
            return;
        }
        
        // Définir un nouveau timeout pour le debounce
        debounceTimeout = setTimeout(() => {
            performSearch(query, searchResults);
        }, searchConfig.debounceTime);
    });
    
    // Gestionnaire pour les clics en dehors de la zone de recherche
    document.addEventListener('click', (event) => {
        if (!searchForm.contains(event.target)) {
            searchResults.classList.remove('active');
        }
    });
    
    // Gestionnaire pour la touche Echap
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            searchResults.classList.remove('active');
        }
    });
}

/**
 * Initialise la recherche spécifique au glossaire
 */
function initGlossarySearch() {
    const searchInput = document.getElementById('glossary-search');
    const categoryFilter = document.getElementById('category-filter');
    const glossaryTerms = document.querySelectorAll('.glossary-term');
    const noResults = document.getElementById('no-results');
    
    if (!searchInput || !glossaryTerms.length) {
        return;
    }
    
    // Variable pour stocker le timeout du debounce
    let debounceTimeout;
    
    // Gestionnaire pour la saisie en temps réel (avec debounce)
    searchInput.addEventListener('input', () => {
        // Effacer le timeout précédent
        clearTimeout(debounceTimeout);
        
        // Définir un nouveau timeout pour le debounce
        debounceTimeout = setTimeout(() => {
            filterGlossaryTerms();
        }, searchConfig.debounceTime);
    });
    
    // Gestionnaire pour le filtre par catégorie
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterGlossaryTerms);
    }
    
    // Fonction pour filtrer les termes du glossaire
    function filterGlossaryTerms() {
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter ? categoryFilter.value : 'all';
        
        let hasVisibleTerms = false;
        
        glossaryTerms.forEach(term => {
            const title = term.querySelector('.term-title').textContent.toLowerCase();
            const definition = term.querySelector('.term-definition').textContent.toLowerCase();
            const termCategory = term.dataset.category || '';
            
            const matchesQuery = query.length < searchConfig.minQueryLength || 
                                title.includes(query) || 
                                definition.includes(query);
                                
            const matchesCategory = category === 'all' || termCategory === category;
            
            const isVisible = matchesQuery && matchesCategory;
            
            term.style.display = isVisible ? '' : 'none';
            
            if (isVisible) {
                hasVisibleTerms = true;
            }
            
            // Mettre en évidence les termes correspondants si une requête est saisie
            if (query.length >= searchConfig.minQueryLength && isVisible) {
                highlightText(term, query);
            } else {
                removeHighlights(term);
            }
        });
        
        // Afficher ou masquer le message "Aucun résultat"
        if (noResults) {
            noResults.classList.toggle('hidden', hasVisibleTerms);
        }
    }
    
    // Initialiser l'état initial
    filterGlossaryTerms();
    
    // Initialiser les boutons de tri
    initGlossarySortButtons();
}

/**
 * Initialise les boutons de tri du glossaire
 */
function initGlossarySortButtons() {
    const sortButtons = document.querySelectorAll('.glossary-sort-btn');
    
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            sortButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Trier les termes
            sortGlossaryTerms(button.dataset.sort);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
    });
}

/**
 * Trie les termes du glossaire
 * @param {string} order - Ordre de tri ('asc' ou 'desc')
 */
function sortGlossaryTerms(order) {
    const sectionsContainer = document.querySelector('.glossary-sections');
    
    if (!sectionsContainer) return;
    
    // Trier chaque section alphabétique
    const sections = Array.from(sectionsContainer.querySelectorAll('.glossary-section'));
    
    sections.forEach(section => {
        const terms = Array.from(section.querySelectorAll('.glossary-term'));
        const termsContainer = section.querySelector('.glossary-terms');
        
        if (!termsContainer) return;
        
        // Trier les termes
        terms.sort((a, b) => {
            const titleA = a.querySelector('.term-title').textContent.toLowerCase();
            const titleB = b.querySelector('.term-title').textContent.toLowerCase();
            
            if (order === 'asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });
        
        // Vider le conteneur
        termsContainer.innerHTML = '';
        
        // Ajouter les termes triés
        terms.forEach(term => {
            termsContainer.appendChild(term);
        });
    });
}

/**
 * Effectue une recherche en fonction d'une requête
 * @param {string} query - La requête de recherche
 * @param {HTMLElement} resultsContainer - Le conteneur pour afficher les résultats
 */
function performSearch(query, resultsContainer) {
    // Vider le conteneur des résultats
    resultsContainer.innerHTML = '';
    
    if (query.length < searchConfig.minQueryLength) {
        resultsContainer.classList.remove('active');
        return;
    }
    
    // Normaliser la requête
    const normalizedQuery = normalizeText(query);
    
    // Rechercher dans les cours
    const courseResults = searchInCourses(normalizedQuery);
    
    // Rechercher dans le glossaire
    const glossaryResults = searchInGlossary(normalizedQuery);
    
    // Rechercher dans le contenu indexé
    const contentResults = searchInContent(normalizedQuery);
    
    // Combiner et trier les résultats
    const allResults = [...courseResults, ...glossaryResults, ...contentResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, searchConfig.maxResults);
    
    // Afficher les résultats
    if (allResults.length > 0) {
        allResults.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            resultItem.innerHTML = `
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-path">${result.path}</div>
                ${result.match ? `<div class="search-result-match">${result.match}</div>` : ''}
            `;
            
            resultItem.addEventListener('click', () => {
                // Naviguer vers le résultat
                window.location.hash = result.id;
                
                // Masquer les résultats
                resultsContainer.classList.remove('active');
                
                // Vider le champ de recherche
                document.getElementById('search-input').value = '';
            });
            
            resultsContainer.appendChild(resultItem);
        });
        
        resultsContainer.classList.add('active');
    } else {
        // Afficher un message si aucun résultat n'est trouvé
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <p>Aucun résultat trouvé pour "${query}"</p>
                <p>Essayez avec d'autres termes ou vérifiez l'orthographe</p>
            </div>
        `;
        
        resultsContainer.classList.add('active');
    }
}

/**
 * Recherche dans l'index des cours
 * @param {string} query - La requête normalisée
 * @returns {Array} Liste des résultats triés par pertinence
 */
function searchInCourses(query) {
    return searchIndex.courses
        .map(course => {
            // Calculer un score de pertinence
            let score = 0;
            
            // Le titre correspond exactement
            if (normalizeText(course.title) === query) {
                score += 10;
            } 
            // Le titre contient la requête
            else if (normalizeText(course.title).includes(query)) {
                score += 5;
            }
            
            // La description contient la requête
            if (normalizeText(course.description).includes(query)) {
                score += 3;
            }
            
            // Les mots-clés contiennent la requête
            if (course.keywords.some(keyword => normalizeText(keyword).includes(query))) {
                score += 4;
            }
            
            // Créer l'extrait pour l'affichage
            let match = '';
            if (course.description.length > 0) {
                const index = normalizeText(course.description).indexOf(query);
                if (index !== -1) {
                    const start = Math.max(0, index - 30);
                    const end = Math.min(course.description.length, index + query.length + 30);
                    match = '...' + course.description.substring(start, end) + '...';
                    match = highlightQueryInText(match, query);
                }
            }
            
            return {
                id: course.id,
                title: course.title,
                path: `${course.moduleTitle} > ${course.title}`,
                score,
                match
            };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);
}

/**
 * Recherche dans l'index du glossaire
 * @param {string} query - La requête normalisée
 * @returns {Array} Liste des résultats triés par pertinence
 */
function searchInGlossary(query) {
    return searchIndex.glossary
        .map(term => {
            // Calculer un score de pertinence
            let score = 0;
            
            // Le titre correspond exactement
            if (normalizeText(term.title) === query) {
                score += 10;
            } 
            // Le titre contient la requête
            else if (normalizeText(term.title).includes(query)) {
                score += 5;
            }
            
            // La définition contient la requête
            if (normalizeText(term.definition).includes(query)) {
                score += 3;
            }
            
            // Créer l'extrait pour l'affichage
            let match = '';
            if (term.definition.length > 0) {
                const index = normalizeText(term.definition).indexOf(query);
                if (index !== -1) {
                    const start = Math.max(0, index - 30);
                    const end = Math.min(term.definition.length, index + query.length + 30);
                    match = '...' + term.definition.substring(start, end) + '...';
                    match = highlightQueryInText(match, query);
                }
            }
            
            return {
                id: term.id,
                title: term.title,
                path: `Glossaire > ${term.category}`,
                score,
                match
            };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);
}

/**
 * Recherche dans le contenu indexé des pages
 * @param {string} query - La requête normalisée
 * @returns {Array} Liste des résultats triés par pertinence
 */
function searchInContent(query) {
    const results = [];
    
    for (const [id, content] of Object.entries(searchIndex.content)) {
        // Rechercher dans les titres
        for (const heading of content.headings) {
            if (normalizeText(heading.text).includes(query)) {
                const courseInfo = searchIndex.courses.find(course => course.id === id);
                
                if (courseInfo) {
                    results.push({
                        id: id + (heading.id ? `#${heading.id}` : ''),
                        title: heading.text,
                        path: `${courseInfo.moduleTitle} > ${courseInfo.title}`,
                        score: 7 - heading.level, // Donner un score plus élevé aux titres de niveau supérieur
                        match: highlightQueryInText(heading.text, query)
                    });
                }
            }
        }
        
        // Rechercher dans les paragraphes
        for (const paragraph of content.paragraphs) {
            const normalizedParagraph = normalizeText(paragraph);
            if (normalizedParagraph.includes(query)) {
                const courseInfo = searchIndex.courses.find(course => course.id === id);
                
                if (courseInfo) {
                    const index = normalizedParagraph.indexOf(query);
                    const start = Math.max(0, index - 30);
                    const end = Math.min(paragraph.length, index + query.length + 30);
                    const match = '...' + paragraph.substring(start, end) + '...';
                    
                    results.push({
                        id: id,
                        title: courseInfo.title,
                        path: `${courseInfo.moduleTitle} > ${courseInfo.title}`,
                        score: 2,
                        match: highlightQueryInText(match, query)
                    });
                }
            }
        }
    }
    
    return results;
}

/**
 * Met en évidence le texte correspondant à la requête dans un élément
 * @param {HTMLElement} element - L'élément contenant le texte
 * @param {string} query - La requête à mettre en évidence
 */
function highlightText(element, query) {
    // Normaliser la requête
    const normalizedQuery = query.toLowerCase();
    
    // Parcourir tous les nœuds de texte dans l'élément
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    
    let node;
    while (node = walker.nextNode()) {
        const content = node.textContent;
        const normalizedContent = content.toLowerCase();
        
        // Vérifier si le contenu contient la requête
        if (normalizedContent.includes(normalizedQuery)) {
            // Créer un élément de mise en évidence
            const fragment = document.createDocumentFragment();
            
            let lastIndex = 0;
            let index;
            
            // Trouver toutes les occurrences de la requête
            while ((index = normalizedContent.indexOf(normalizedQuery, lastIndex)) !== -1) {
                // Ajouter le texte avant la requête
                fragment.appendChild(document.createTextNode(content.substring(lastIndex, index)));
                
                // Ajouter la requête mise en évidence
                const highlight = document.createElement('span');
                highlight.className = searchConfig.highlightClass;
                highlight.textContent = content.substring(index, index + normalizedQuery.length);
                fragment.appendChild(highlight);
                
                lastIndex = index + normalizedQuery.length;
            }
            
            // Ajouter le texte restant
            if (lastIndex < content.length) {
                fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
            }
            
            // Remplacer le nœud de texte par le fragment
            node.parentNode.replaceChild(fragment, node);
        }
    }
}

/**
 * Supprime les mises en évidence dans un élément
 * @param {HTMLElement} element - L'élément contenant les mises en évidence
 */
function removeHighlights(element) {
    // Récupérer toutes les mises en évidence
    const highlights = element.querySelectorAll('.' + searchConfig.highlightClass);
    
    highlights.forEach(highlight => {
        // Remplacer l'élément par son contenu texte
        highlight.parentNode.replaceChild(document.createTextNode(highlight.textContent), highlight);
    });
    
    // Normaliser le texte (fusionner les nœuds de texte adjacents)
    element.normalize();
}

/**
 * Met en évidence la requête dans un texte (version HTML)
 * @param {string} text - Le texte à traiter
 * @param {string} query - La requête à mettre en évidence
 * @returns {string} Le texte avec la requête mise en évidence
 */

/**
 * Normalise un texte pour la recherche (minuscules, sans accents)
 * @param {string} text - Le texte à normaliser
 * @returns {string} Le texte normalisé
 */
function normalizeText(text) {
    if (!text) return '';
    
    return text.toLowerCase()
        // Supprimer les accents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}