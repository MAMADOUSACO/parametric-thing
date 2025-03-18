/**
 * router.js - Gestionnaire de routes pour la navigation SPA
 * Charge le contenu dynamiquement sans rechargement de page
 */

// État actuel du routeur
const routerState = {
    currentRoute: null,
    prevRoute: null,
    routes: {},
    coursesData: null
};

/**
 * Initialise le routeur avec la structure des cours
 * @param {Object} coursesData - Données structurées des cours
 */
export function initRouter(coursesData) {
    // Enregistrer les données des cours
    routerState.coursesData = coursesData;
    
    // Définir les routes principales
    routerState.routes = {
        'home': {
            path: '/content/home.html',
            title: 'Accueil - Équations Paramétriques',
            init: initHomePage
        },
        'about': {
            path: '/content/about.html',
            title: 'À propos - Équations Paramétriques',
            init: null
        },
        'help': {
            path: '/content/help.html',
            title: 'Aide - Équations Paramétriques',
            init: null
        },
        'glossary': {
            path: '/content/glossary.html',
            title: 'Glossaire - Équations Paramétriques',
            init: initGlossaryPage
        },
    };
    
    // Ajouter les routes pour chaque cours
    if (coursesData && coursesData.modules) {
        coursesData.modules.forEach(module => {
            if (module.courses) {
                module.courses.forEach(course => {
                    const courseId = `${module.id}-${course.id}`;
                    routerState.routes[courseId] = {
                        path: `/content/${module.id}/${course.id}.html`,
                        title: `${course.title} - Équations Paramétriques`,
                        module: module.id,
                        courseId: course.id,
                        init: initCoursePage
                    };
                });
            }
            
            // Ajouter la page de quiz du module
            const quizId = `${module.id}-quiz`;
            routerState.routes[quizId] = {
                path: `/content/${module.id}/quiz.html`,
                title: `Quiz: ${module.title} - Équations Paramétriques`,
                module: module.id,
                init: initQuizPage
            };
            
            // Ajouter la page de ressources du module
            const resourcesId = `${module.id}-resources`;
            routerState.routes[resourcesId] = {
                path: `/content/${module.id}/resources.html`,
                title: `Ressources: ${module.title} - Équations Paramétriques`,
                module: module.id,
                init: null
            };
        });
    }
    
    // Gérer la navigation par les liens de type hash (#)
    window.addEventListener('hashchange', handleRouteChange);
    
    // Gérer la navigation initiale
    handleInitialRoute();
}

/**
 * Gère le changement de route
 */
function handleRouteChange() {
    // Récupérer la partie hash de l'URL sans le #
    const hash = window.location.hash.substring(1) || 'home';
    
    // Vérifier si la route existe
    if (routerState.routes[hash]) {
        // Mettre à jour l'état du routeur
        routerState.prevRoute = routerState.currentRoute;
        routerState.currentRoute = hash;
        
        // Charger le contenu de la page
        loadContent(hash);
    } else {
        console.error(`Route non trouvée: ${hash}`);
        navigateTo('home');
    }
}

/**
 * Gère la route initiale lors du chargement de la page
 */
function handleInitialRoute() {
    // Si l'URL contient un hash, utiliser celui-ci comme route initiale
    if (window.location.hash) {
        handleRouteChange();
    } else {
        // Sinon, rediriger vers la page d'accueil
        navigateTo('home');
    }
}

/**
 * Charge le contenu d'une page
 * @param {string} routeId - Identifiant de la route
 */
async function loadContent(routeId) {
    try {
        const route = routerState.routes[routeId];
        
        if (!route) {
            throw new Error(`Route non trouvée: ${routeId}`);
        }
        
        // Mettre à jour le titre de la page
        document.title = route.title;
        
        // Récupérer le conteneur de contenu
        const contentContainer = document.getElementById('content-container');
        
        // Afficher un indicateur de chargement
        contentContainer.innerHTML = `
            <div class="loading-content">
                <div class="loader"></div>
                <p>Chargement...</p>
            </div>
        `;
        
        // Récupérer le contenu HTML
        const response = await fetch(route.path);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Insérer le contenu dans le conteneur
        contentContainer.innerHTML = html;
        
        // Mettre à jour la navigation (section active)
        updateNavigationHighlight(routeId);
        
        // Exécuter la fonction d'initialisation de la page si elle existe
        if (route.init) {
            route.init(route);
        }
        
        // Traiter les formules mathématiques avec MathJax
        if (window.MathJax) {
            window.MathJax.typeset();
        }
        
        // Faire défiler la page vers le haut
        window.scrollTo(0, 0);
        
        // Déclencher un événement personnalisé pour signaler que le contenu a été chargé
        const event = new CustomEvent('contentLoaded', { detail: { routeId } });
        document.dispatchEvent(event);
        
    } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
        
        // Afficher un message d'erreur
        const contentContainer = document.getElementById('content-container');
        contentContainer.innerHTML = `
            <div class="error-content">
                <h2>Erreur de chargement</h2>
                <p>Impossible de charger le contenu demandé.</p>
                <p>Détails: ${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Réessayer</button>
            </div>
        `;
    }
}

/**
 * Met à jour la mise en évidence de la navigation
 * @param {string} routeId - Identifiant de la route active
 */
function updateNavigationHighlight(routeId) {
    // Réinitialiser tous les éléments actifs
    const activeModules = document.querySelectorAll('.module-header.active');
    const activeCourses = document.querySelectorAll('.course-item.active');
    
    activeModules.forEach(el => el.classList.remove('active'));
    activeCourses.forEach(el => el.classList.remove('active'));
    
    // Déterminer le module et le cours actif
    const route = routerState.routes[routeId];
    
    if (route) {
        if (routeId === 'home') {
            // Mettre en évidence l'accueil
            const homeModule = document.querySelector('.module-header[data-module="home"]');
            if (homeModule) {
                homeModule.classList.add('active');
            }
        } else if (route.module) {
            // Mettre en évidence le module
            const moduleHeader = document.querySelector(`.module-header[data-module="${route.module}"]`);
            if (moduleHeader) {
                moduleHeader.classList.add('active');
                
                // Développer le module si ce n'est pas déjà fait
                const moduleItem = moduleHeader.closest('.module-item');
                if (moduleItem && !moduleItem.classList.contains('expanded')) {
                    moduleItem.classList.add('expanded');
                    moduleItem.classList.remove('collapsed');
                }
            }
            
            // Mettre en évidence le cours si applicable
            if (route.courseId) {
                const courseItem = document.querySelector(`.course-item[data-course="${route.courseId}"]`);
                if (courseItem) {
                    courseItem.classList.add('active');
                }
            }
        }
    }
}

/**
 * Navigue vers une route spécifique
 * @param {string} routeId - Identifiant de la route
 */
export function navigateTo(routeId) {
    window.location.hash = routeId;
}

/**
 * Initialise la page d'accueil
 */
function initHomePage() {
    console.log('Initialisation de la page d\'accueil');
    
    // Initialiser les démonstrations interactives de la page d'accueil
    initHomeVisualizations();
    
    // Initialiser le bouton "Commencer l'apprentissage"
    const startLearningBtn = document.getElementById('start-learning-btn');
    if (startLearningBtn) {
        startLearningBtn.addEventListener('click', () => {
            // Naviguer vers le premier cours du premier module
            if (routerState.coursesData && routerState.coursesData.modules.length > 0) {
                const firstModule = routerState.coursesData.modules[0];
                if (firstModule.courses && firstModule.courses.length > 0) {
                    const firstCourse = firstModule.courses[0];
                    navigateTo(`${firstModule.id}-${firstCourse.id}`);
                }
            }
        });
    }
    
    // Initialiser le bouton "Reprendre"
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        // Vérifier s'il y a un cours en cours dans le localStorage
        const lastCourse = localStorage.getItem('lastCourse');
        if (lastCourse) {
            resumeBtn.addEventListener('click', () => {
                navigateTo(lastCourse);
            });
            
            // Afficher le bouton
            resumeBtn.style.display = 'inline-block';
        } else {
            // Masquer le bouton s'il n'y a pas de cours en cours
            resumeBtn.style.display = 'none';
        }
    }
}

/**
 * Initialise les visualisations de la page d'accueil
 */
function initHomeVisualizations() {
    // Cette fonction sera implémentée plus tard
    // Elle initialisera les démonstrations interactives sur la page d'accueil
    console.log('Initialisation des visualisations de la page d\'accueil');
}

/**
 * Initialise une page de cours
 * @param {Object} route - Informations sur la route
 */
function initCoursePage(route) {
    console.log(`Initialisation de la page de cours: ${route.courseId} dans le module ${route.module}`);
    
    // Enregistrer le dernier cours visité
    localStorage.setItem('lastCourse', `${route.module}-${route.courseId}`);
    
    // Initialiser les visualisations et les éléments interactifs
    initCourseVisualizations();
    
    // Initialiser les boutons de navigation entre cours
    initCourseNavigation(route);
    
    // Initialiser le suivi de progression du cours
    updateCourseProgress(route);
}

/**
 * Initialise une page de quiz
 * @param {Object} route - Informations sur la route
 */
function initQuizPage(route) {
    console.log(`Initialisation de la page de quiz pour le module: ${route.module}`);
    
    // Charger les données du quiz
    loadQuizData(route.module);
}

/**
 * Charge les données d'un quiz
 * @param {string} moduleId - Identifiant du module
 */
async function loadQuizData(moduleId) {
    try {
        const response = await fetch(`/data/exercises/${moduleId}/quiz.json`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const quizData = await response.json();
        
        // Initialiser l'interface du quiz avec les données
        initQuizInterface(quizData);
        
    } catch (error) {
        console.error('Erreur lors du chargement des données du quiz:', error);
        
        // Afficher un message d'erreur
        const quizContainer = document.querySelector('.quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = `
                <div class="error-content">
                    <h2>Erreur de chargement</h2>
                    <p>Impossible de charger les données du quiz.</p>
                    <p>Détails: ${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">Réessayer</button>
                </div>
            `;
        }
    }
}

/**
 * Initialise l'interface d'un quiz
 * @param {Object} quizData - Données du quiz
 */
function initQuizInterface(quizData) {
    // Cette fonction sera implémentée plus tard
    // Elle créera l'interface du quiz à partir des données
    console.log('Initialisation de l\'interface du quiz');
}

/**
 * Initialise la page du glossaire
 */
function initGlossaryPage() {
    console.log('Initialisation de la page du glossaire');
    
    // Recherche dans le glossaire
    const searchInput = document.getElementById('glossary-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterGlossaryTerms);
    }
    
    // Tri alphabétique
    const sortButtons = document.querySelectorAll('.glossary-sort-btn');
    if (sortButtons) {
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sortGlossaryTerms(btn.getAttribute('data-sort'));
            });
        });
    }
}

/**
 * Filtre les termes du glossaire en fonction de la recherche
 */
function filterGlossaryTerms() {
    const searchInput = document.getElementById('glossary-search');
    const terms = document.querySelectorAll('.glossary-term');
    
    const searchText = searchInput.value.toLowerCase();
    
    terms.forEach(term => {
        const titleEl = term.querySelector('.term-title');
        const title = titleEl.textContent.toLowerCase();
        const definition = term.querySelector('.term-definition').textContent.toLowerCase();
        
        if (title.includes(searchText) || definition.includes(searchText)) {
            term.style.display = '';
        } else {
            term.style.display = 'none';
        }
    });
}

/**
 * Trie les termes du glossaire
 * @param {string} sortOrder - Ordre de tri ('asc' ou 'desc')
 */
function sortGlossaryTerms(sortOrder) {
    const termsContainer = document.querySelector('.glossary-terms');
    const terms = Array.from(document.querySelectorAll('.glossary-term'));
    
    terms.sort((a, b) => {
        const titleA = a.querySelector('.term-title').textContent.toLowerCase();
        const titleB = b.querySelector('.term-title').textContent.toLowerCase();
        
        if (sortOrder === 'asc') {
            return titleA.localeCompare(titleB, 'fr');
        } else {
            return titleB.localeCompare(titleA, 'fr');
        }
    });
    
    // Vider le conteneur
    termsContainer.innerHTML = '';
    
    // Réinsérer les termes dans le nouvel ordre
    terms.forEach(term => {
        termsContainer.appendChild(term);
    });
}

/**
 * Initialise la navigation entre les cours
 * @param {Object} route - Informations sur la route
 */
function initCourseNavigation(route) {
    // Récupérer les informations sur le module et le cours actuels
    const moduleId = route.module;
    const courseId = route.courseId;
    
    // Trouver le module dans les données des cours
    const module = routerState.coursesData.modules.find(m => m.id === moduleId);
    
    if (!module || !module.courses) {
        console.error('Module ou cours non trouvé');
        return;
    }
    
    // Trouver l'index du cours actuel
    const courseIndex = module.courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
        console.error('Cours non trouvé dans le module');
        return;
    }
    
    // Déterminer le cours précédent et le cours suivant
    let prevCourse = null;
    let nextCourse = null;
    
    if (courseIndex > 0) {
        prevCourse = module.courses[courseIndex - 1];
    } else {
        // Si c'est le premier cours du module, vérifier s'il y a un module précédent
        const moduleIndex = routerState.coursesData.modules.findIndex(m => m.id === moduleId);
        
        if (moduleIndex > 0) {
            const prevModule = routerState.coursesData.modules[moduleIndex - 1];
            if (prevModule.courses && prevModule.courses.length > 0) {
                prevCourse = prevModule.courses[prevModule.courses.length - 1];
                prevCourse.module = prevModule.id;
            }
        }
    }
    
    if (courseIndex < module.courses.length - 1) {
        nextCourse = module.courses[courseIndex + 1];
    } else {
        // Si c'est le dernier cours du module, vérifier s'il y a un module suivant
        const moduleIndex = routerState.coursesData.modules.findIndex(m => m.id === moduleId);
        
        if (moduleIndex < routerState.coursesData.modules.length - 1) {
            const nextModule = routerState.coursesData.modules[moduleIndex + 1];
            if (nextModule.courses && nextModule.courses.length > 0) {
                nextCourse = nextModule.courses[0];
                nextCourse.module = nextModule.id;
            }
        }
    }
    
    // Mettre à jour les boutons de navigation
    const prevButton = document.querySelector('.course-nav-prev');
    const nextButton = document.querySelector('.course-nav-next');
    
    if (prevButton) {
        if (prevCourse) {
            prevButton.addEventListener('click', () => {
                const prevModuleId = prevCourse.module || moduleId;
                navigateTo(`${prevModuleId}-${prevCourse.id}`);
            });
            
            // Mettre à jour le texte du bouton
            prevButton.querySelector('.nav-text').textContent = prevCourse.title;
            
            // Afficher le bouton
            prevButton.style.display = 'flex';
        } else {
            // Masquer le bouton s'il n'y a pas de cours précédent
            prevButton.style.display = 'none';
        }
    }
    
    if (nextButton) {
        if (nextCourse) {
            nextButton.addEventListener('click', () => {
                const nextModuleId = nextCourse.module || moduleId;
                navigateTo(`${nextModuleId}-${nextCourse.id}`);
            });
            
            // Mettre à jour le texte du bouton
            nextButton.querySelector('.nav-text').textContent = nextCourse.title;
            
            // Afficher le bouton
            nextButton.style.display = 'flex';
        } else {
            // Masquer le bouton s'il n'y a pas de cours suivant
            nextButton.style.display = 'none';
        }
    }
}

/**
 * Initialise les visualisations d'un cours
 */
function initCourseVisualizations() {
    // Cette fonction sera implémentée plus tard
    // Elle initialisera les visualisations interactives de la page de cours
    console.log('Initialisation des visualisations du cours');
    
    // Trouver tous les graphiques paramétriques et les initialiser
    const parametricGraphs = document.querySelectorAll('.parametric-graph');
    parametricGraphs.forEach(graph => {
        // Les graphiques seront initialisés par un module dédié
        // Cette partie sera développée plus tard
    });
}

/**
 * Met à jour la progression d'un cours
 * @param {Object} route - Informations sur la route
 */
function updateCourseProgress(route) {
    // Cette fonction sera implémentée dans le module progress-tracker.js
    console.log('Mise à jour de la progression du cours');
}

// Fonction pour vérifier si une URL est valide
function isValidUrl(url) {
    try {
        new URL(url, window.location.origin);
        return true;
    } catch (e) {
        return false;
    }
}