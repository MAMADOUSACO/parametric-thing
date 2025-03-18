/**
 * navigation.js - Gestion de la navigation et du menu latéral
 * Initialise le menu de navigation et gère ses interactions
 */

import { navigateTo } from './router.js';
import { getProgressData } from './progress-tracker.js';

// État de la navigation
const navigationState = {
    // Indique si la barre latérale est ouverte (pour mobile)
    sidebarOpen: false,
    // Indique si la barre latérale est réduite
    sidebarCollapsed: false,
    // Liste des modules développés
    expandedModules: [],
    // Données des cours
    coursesData: null
};

/**
 * Initialise la navigation
 * @param {Object} coursesData - Données structurées des cours
 */
export function initNavigation(coursesData) {
    console.log('Initialisation de la navigation');
    
    // Enregistrer les données des cours
    navigationState.coursesData = coursesData;
    
    // Générer le menu de navigation
    generateNavigationMenu(coursesData);
    
    // Initialiser les interactions de la barre latérale
    initSidebarInteractions();
    
    // Initialiser le bouton de menu pour mobile
    initMobileMenuButton();
    
    // Charger l'état de la barre latérale depuis le localStorage
    loadSidebarState();
}

/**
 * Génère le menu de navigation à partir des données des cours
 * @param {Object} coursesData - Données structurées des cours
 */
function generateNavigationMenu(coursesData) {
    if (!coursesData || !coursesData.modules) {
        console.error('Données des cours invalides');
        return;
    }
    
    const modulesList = document.getElementById('modules-list');
    
    if (!modulesList) {
        console.error('Élément #modules-list non trouvé');
        return;
    }
    
    // Vider le contenu existant (sauf l'élément Accueil)
    const homeItem = modulesList.querySelector('[data-module="home"]');
    modulesList.innerHTML = '';
    
    if (homeItem) {
        const homeItemContainer = document.createElement('li');
        homeItemContainer.className = 'module-item';
        homeItemContainer.appendChild(homeItem.cloneNode(true));
        modulesList.appendChild(homeItemContainer);
    } else {
        // Créer l'élément Accueil s'il n'existe pas
        const homeItemContainer = document.createElement('li');
        homeItemContainer.className = 'module-item';
        homeItemContainer.innerHTML = `
            <div class="module-header" data-module="home">
                <span class="module-icon">🏠</span>
                <span class="module-title">Accueil</span>
            </div>
        `;
        modulesList.appendChild(homeItemContainer);
    }
    
    // Créer un élément de séparation
    const separator = document.createElement('div');
    separator.className = 'sidebar-separator';
    modulesList.appendChild(separator);
    
    // Créer un titre pour les cours
    const coursesHeading = document.createElement('div');
    coursesHeading.className = 'sidebar-heading';
    coursesHeading.textContent = 'Cours';
    modulesList.appendChild(coursesHeading);
    
    // Générer les modules et leurs cours
    coursesData.modules.forEach(module => {
        // Créer l'élément de module
        const moduleItem = document.createElement('li');
        moduleItem.className = 'module-item';
        moduleItem.dataset.moduleId = module.id;
        
        // Créer l'en-tête du module
        moduleItem.innerHTML = `
            <div class="module-header" data-module="${module.id}">
                <span class="module-icon">${module.icon || '📚'}</span>
                <span class="module-title">${module.title}</span>
                <span class="toggle-icon">▼</span>
            </div>
            <ul class="module-courses"></ul>
        `;
        
        // Ajouter le module à la liste
        modulesList.appendChild(moduleItem);
        
        // Récupérer la liste des cours du module
        const coursesList = moduleItem.querySelector('.module-courses');
        
        // Générer les cours du module
        if (module.courses && module.courses.length > 0) {
            module.courses.forEach(course => {
                // Créer l'élément de cours
                const courseItem = document.createElement('li');
                courseItem.className = 'course-item';
                courseItem.dataset.course = course.id;
                courseItem.textContent = course.title;
                
                // Ajouter le cours à la liste
                coursesList.appendChild(courseItem);
            });
            
            // Ajouter un lien vers le quiz du module
            const quizItem = document.createElement('li');
            quizItem.className = 'course-item quiz-item';
            quizItem.dataset.course = 'quiz';
            quizItem.dataset.quiz = module.id;
            quizItem.innerHTML = `<span class="quiz-icon">📝</span> Quiz du module`;
            coursesList.appendChild(quizItem);
            
            // Ajouter un lien vers les ressources du module
            const resourcesItem = document.createElement('li');
            resourcesItem.className = 'course-item resources-item';
            resourcesItem.dataset.course = 'resources';
            resourcesItem.innerHTML = `<span class="resources-icon">📚</span> Ressources supplémentaires`;
            coursesList.appendChild(resourcesItem);
        }
    });
    
    // Ajouter un élément de séparation
    const separator2 = document.createElement('div');
    separator2.className = 'sidebar-separator';
    modulesList.appendChild(separator2);
    
    // Ajouter des liens utiles
    const utilsHeading = document.createElement('div');
    utilsHeading.className = 'sidebar-heading';
    utilsHeading.textContent = 'Utilitaires';
    modulesList.appendChild(utilsHeading);
    
    const utilsContainer = document.createElement('li');
    utilsContainer.className = 'module-item';
    utilsContainer.innerHTML = `
        <div class="module-header" data-module="glossary">
            <span class="module-icon">📘</span>
            <span class="module-title">Glossaire</span>
        </div>
    `;
    modulesList.appendChild(utilsContainer);
    
    const aboutContainer = document.createElement('li');
    aboutContainer.className = 'module-item';
    aboutContainer.innerHTML = `
        <div class="module-header" data-module="about">
            <span class="module-icon">ℹ️</span>
            <span class="module-title">À propos</span>
        </div>
    `;
    modulesList.appendChild(aboutContainer);
    
    const helpContainer = document.createElement('li');
    helpContainer.className = 'module-item';
    helpContainer.innerHTML = `
        <div class="module-header" data-module="help">
            <span class="module-icon">❓</span>
            <span class="module-title">Aide</span>
        </div>
    `;
    modulesList.appendChild(helpContainer);
    
    // Ajouter des écouteurs d'événements
    initNavigationEvents();
    
    // Mettre à jour l'état de la navigation avec les données de progression
    updateNavigationWithProgress();
}

/**
 * Initialise les écouteurs d'événements pour la navigation
 */
function initNavigationEvents() {
    // Écouteurs pour les en-têtes de module
    const moduleHeaders = document.querySelectorAll('.module-header');
    
    moduleHeaders.forEach(header => {
        header.addEventListener('click', (event) => {
            const moduleId = header.getAttribute('data-module');
            
            // Si c'est un module utilitaire, naviguer directement
            if (['home', 'glossary', 'about', 'help'].includes(moduleId)) {
                navigateTo(moduleId);
                
                // Sur mobile, fermer la barre latérale
                if (window.innerWidth <= 768) {
                    toggleSidebar(false);
                }
                
                // Jouer un son si disponible
                if (window.playSound) {
                    window.playSound('click');
                }
                
                return;
            }
            
            // Sinon, développer/réduire le module
            const moduleItem = header.closest('.module-item');
            toggleModule(moduleItem);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
            
            // Empêcher la propagation de l'événement
            event.stopPropagation();
        });
    });
    
    // Écouteurs pour les éléments de cours
    const courseItems = document.querySelectorAll('.course-item');
    
    courseItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const moduleId = item.closest('.module-item').querySelector('.module-header').getAttribute('data-module');
            const courseId = item.getAttribute('data-course');
            
            // Construire l'identifiant de la route
            let routeId;
            
            if (courseId === 'quiz') {
                routeId = `${moduleId}-quiz`;
            } else if (courseId === 'resources') {
                routeId = `${moduleId}-resources`;
            } else {
                routeId = `${moduleId}-${courseId}`;
            }
            
            // Naviguer vers le cours
            navigateTo(routeId);
            
            // Sur mobile, fermer la barre latérale
            if (window.innerWidth <= 768) {
                toggleSidebar(false);
            }
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
            
            // Empêcher la propagation de l'événement
            event.stopPropagation();
        });
    });
}

/**
 * Initialise les interactions de la barre latérale
 */
function initSidebarInteractions() {
    // Ajouter le bouton pour réduire/agrandir la barre latérale
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebar) {
        // Créer le bouton de bascule
        const toggleButton = document.createElement('div');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.innerHTML = `<span class="toggle-icon">◀</span>`;
        sidebar.appendChild(toggleButton);
        
        // Ajouter l'écouteur d'événement
        toggleButton.addEventListener('click', () => {
            toggleSidebarCollapse();
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
    }
}

/**
 * Initialise le bouton de menu pour mobile
 */
function initMobileMenuButton() {
    // Ajouter le bouton de menu pour mobile dans l'en-tête
    const header = document.querySelector('.main-header');
    
    if (header) {
        // Vérifier si le bouton existe déjà
        let menuButton = header.querySelector('#mobile-menu-button');
        
        if (!menuButton) {
            // Créer le bouton de menu
            menuButton = document.createElement('button');
            menuButton.id = 'mobile-menu-button';
            menuButton.className = 'icon-button';
            menuButton.title = 'Menu';
            menuButton.innerHTML = `
                <svg class="menu-icon" viewBox="0 0 24 24">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            `;
            
            // Insérer le bouton au début de l'en-tête
            header.insertBefore(menuButton, header.firstChild);
        }
        
        // Ajouter l'écouteur d'événement
        menuButton.addEventListener('click', () => {
            toggleSidebar();
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
        
        // Créer un overlay pour fermer la barre latérale sur mobile
        let overlay = document.querySelector('.sidebar-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        // Ajouter l'écouteur d'événement
        overlay.addEventListener('click', () => {
            toggleSidebar(false);
        });
    }
}

/**
 * Bascule l'état d'ouverture de la barre latérale (pour mobile)
 * @param {boolean|null} force - Force l'état à ouvert (true) ou fermé (false)
 */
function toggleSidebar(force = null) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!sidebar) return;
    
    // Déterminer le nouvel état
    navigationState.sidebarOpen = force !== null ? force : !navigationState.sidebarOpen;
    
    // Appliquer l'état
    if (navigationState.sidebarOpen) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    } else {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
}

/**
 * Bascule l'état de réduction de la barre latérale
 * @param {boolean|null} force - Force l'état à réduit (true) ou développé (false)
 */
function toggleSidebarCollapse(force = null) {
    const sidebar = document.querySelector('.sidebar');
    const contentContainer = document.getElementById('content-container');
    
    if (!sidebar || !contentContainer) return;
    
    // Déterminer le nouvel état
    navigationState.sidebarCollapsed = force !== null ? force : !navigationState.sidebarCollapsed;
    
    // Appliquer l'état
    if (navigationState.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        contentContainer.style.marginLeft = 'var(--sidebar-collapsed-width)';
        contentContainer.style.maxWidth = 'calc(100% - var(--sidebar-collapsed-width))';
        document.body.classList.add('sidebar-collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        contentContainer.style.marginLeft = 'var(--sidebar-width)';
        contentContainer.style.maxWidth = 'calc(100% - var(--sidebar-width))';
        document.body.classList.remove('sidebar-collapsed');
    }
    
    // Sauvegarder l'état
    saveSidebarState();
}

/**
 * Développe ou réduit un module
 * @param {HTMLElement} moduleItem - Élément du module
 * @param {boolean|null} force - Force l'état à développé (true) ou réduit (false)
 */
function toggleModule(moduleItem, force = null) {
    if (!moduleItem) return;
    
    // Récupérer l'identifiant du module
    const moduleId = moduleItem.querySelector('.module-header').getAttribute('data-module');
    
    // Déterminer si le module doit être développé ou réduit
    const isExpanded = moduleItem.classList.contains('expanded');
    const shouldExpand = force !== null ? force : !isExpanded;
    
    // Appliquer l'état
    if (shouldExpand) {
        moduleItem.classList.add('expanded');
        moduleItem.classList.remove('collapsed');
        
        // Ajouter le module à la liste des modules développés
        if (!navigationState.expandedModules.includes(moduleId)) {
            navigationState.expandedModules.push(moduleId);
        }
    } else {
        moduleItem.classList.remove('expanded');
        moduleItem.classList.add('collapsed');
        
        // Retirer le module de la liste des modules développés
        const index = navigationState.expandedModules.indexOf(moduleId);
        if (index !== -1) {
            navigationState.expandedModules.splice(index, 1);
        }
    }
    
    // Sauvegarder l'état
    saveSidebarState();
}

/**
 * Sauvegarde l'état de la barre latérale dans le localStorage
 */
function saveSidebarState() {
    try {
        const state = {
            collapsed: navigationState.sidebarCollapsed,
            expandedModules: navigationState.expandedModules
        };
        
        localStorage.setItem('sidebar-state', JSON.stringify(state));
        console.log('État de la barre latérale sauvegardé');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état de la barre latérale:', error);
    }
}

/**
 * Charge l'état de la barre latérale depuis le localStorage
 */
function loadSidebarState() {
    try {
        const savedState = localStorage.getItem('sidebar-state');
        
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Appliquer l'état de réduction
            if (state.collapsed !== undefined) {
                toggleSidebarCollapse(state.collapsed);
            }
            
            // Appliquer l'état des modules développés
            if (state.expandedModules && Array.isArray(state.expandedModules)) {
                navigationState.expandedModules = state.expandedModules;
                
                // Développer les modules sauvegardés
                state.expandedModules.forEach(moduleId => {
                    const moduleItem = document.querySelector(`.module-item[data-module-id="${moduleId}"]`);
                    if (moduleItem) {
                        toggleModule(moduleItem, true);
                    }
                });
            }
            
            console.log('État de la barre latérale chargé');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état de la barre latérale:', error);
    }
}

/**
 * Met à jour la navigation avec les données de progression
 */
function updateNavigationWithProgress() {
    const progressData = getProgressData();
    
    if (!progressData || !progressData.courses) {
        return;
    }
    
    // Mettre à jour les éléments de cours avec les données de progression
    for (const courseKey in progressData.courses) {
        // Format attendu: moduleId-courseId
        const [moduleId, courseId] = courseKey.split('-');
        
        // Trouver l'élément de cours
        const courseItem = document.querySelector(`.module-item[data-module-id="${moduleId}"] .course-item[data-course="${courseId}"]`);
        
        if (courseItem) {
            const courseData = progressData.courses[courseKey];
            
            // Marquer comme visité si nécessaire
            if (courseData.visited) {
                courseItem.classList.add('visited');
            }
            
            // Marquer comme complété si nécessaire
            if (courseData.completed) {
                courseItem.classList.add('completed');
            }
            
            // Ajouter une barre de progression
            let progressBar = courseItem.querySelector('.course-progress');
            
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'course-progress';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'course-progress-fill';
                progressFill.style.width = `${courseData.percentCompleted}%`;
                
                progressBar.appendChild(progressFill);
                courseItem.appendChild(progressBar);
            } else {
                // Mettre à jour la barre existante
                progressBar.querySelector('.course-progress-fill').style.width = `${courseData.percentCompleted}%`;
            }
        }
    }
    
    // Mettre à jour les quiz avec les données de progression
    if (progressData.quizzes) {
        for (const moduleId in progressData.quizzes) {
            // Trouver l'élément de quiz
            const quizItem = document.querySelector(`.course-item.quiz-item[data-quiz="${moduleId}"]`);
            
            if (quizItem) {
                const quizData = progressData.quizzes[moduleId];
                
                // Marquer comme complété si nécessaire
                if (quizData.completed) {
                    quizItem.classList.add('completed');
                }
                
                // Afficher le score
                if (quizData.bestScore > 0) {
                    let scoreDisplay = quizItem.querySelector('.quiz-score');
                    
                    if (!scoreDisplay) {
                        scoreDisplay = document.createElement('span');
                        scoreDisplay.className = 'quiz-score';
                        quizItem.appendChild(scoreDisplay);
                    }
                    
                    scoreDisplay.textContent = `${quizData.bestScore}%`;
                }
            }
        }
    }
}

/**
 * Développe un module spécifique
 * @param {string} moduleId - Identifiant du module
 */
export function expandModule(moduleId) {
    const moduleItem = document.querySelector(`.module-item[data-module-id="${moduleId}"]`);
    
    if (moduleItem) {
        toggleModule(moduleItem, true);
    }
}

/**
 * Réduit un module spécifique
 * @param {string} moduleId - Identifiant du module
 */
export function collapseModule(moduleId) {
    const moduleItem = document.querySelector(`.module-item[data-module-id="${moduleId}"]`);
    
    if (moduleItem) {
        toggleModule(moduleItem, false);
    }
}

/**
 * Met à jour l'affichage de la progression d'un cours
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 * @param {number} percentage - Pourcentage de complétion
 */
export function updateCourseProgressDisplay(moduleId, courseId, percentage) {
    const courseItem = document.querySelector(`.module-item[data-module-id="${moduleId}"] .course-item[data-course="${courseId}"]`);
    
    if (courseItem) {
        // Ajouter une barre de progression
        let progressBar = courseItem.querySelector('.course-progress');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'course-progress';
            
            const progressFill = document.createElement('div');
            progressFill.className = 'course-progress-fill';
            
            progressBar.appendChild(progressFill);
            courseItem.appendChild(progressBar);
        }
        
        // Mettre à jour la barre
        const progressFill = progressBar.querySelector('.course-progress-fill');
        progressFill.style.width = `${percentage}%`;
        
        // Marquer comme complété si 100%
        if (percentage === 100) {
            courseItem.classList.add('completed');
        }
    }
}

/**
 * Met à jour l'ensemble de la navigation avec les dernières données de progression
 */
export function refreshNavigation() {
    updateNavigationWithProgress();
}