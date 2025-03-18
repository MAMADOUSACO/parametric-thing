/**
 * progress-tracker.js - Suivi de la progression de l'utilisateur
 * Enregistre et affiche la progression dans les cours et modules
 */

// Structure des données de progression
let progressData = {
    // Progression des cours
    courses: {},
    // Progression des quiz
    quizzes: {},
    // Temps total d'étude
    totalStudyTime: 0,
    // Dernière session d'étude
    lastStudySession: null,
    // Cours terminés
    completedCourses: 0,
    // Badges débloqués
    badges: []
};

// Identifiant du cours actuel
let currentCourse = null;

// Timer pour le temps d'étude
let studyTimer = null;

/**
 * Initialise le suivi de progression
 */
export function initProgressTracker() {
    console.log('Initialisation du suivi de progression');
    
    // Charger les données de progression depuis le localStorage
    loadProgressData();
    
    // Initialiser le temps d'étude
    initStudyTimer();
    
    // Initialiser la barre de progression globale
    updateGlobalProgressBar();
    
    // Ajouter des écouteurs d'événements pour les changements de contenu
    addContentListeners();
    
    // Initialiser le bouton de réinitialisation
    initResetButton();
}

/**
 * Charge les données de progression depuis le localStorage
 */
function loadProgressData() {
    try {
        const savedProgress = localStorage.getItem('progress-data');
        
        if (savedProgress) {
            // Fusionner avec les valeurs existantes
            progressData = { ...progressData, ...JSON.parse(savedProgress) };
            console.log('Données de progression chargées:', progressData);
        } else {
            console.log('Aucune donnée de progression trouvée');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données de progression:', error);
    }
}

/**
 * Sauvegarde les données de progression dans le localStorage
 */
function saveProgressData() {
    try {
        localStorage.setItem('progress-data', JSON.stringify(progressData));
        console.log('Données de progression sauvegardées');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données de progression:', error);
    }
}

/**
 * Initialise le timer pour le temps d'étude
 */
function initStudyTimer() {
    // Arrêter le timer existant si nécessaire
    if (studyTimer) {
        clearInterval(studyTimer);
    }
    
    // Enregistrer la date de début de session
    if (!progressData.lastStudySession) {
        progressData.lastStudySession = new Date().toISOString();
    }
    
    // Démarrer un timer qui s'exécute toutes les minutes
    studyTimer = setInterval(() => {
        // Incrémenter le temps total d'étude
        progressData.totalStudyTime += 1;
        
        // Sauvegarder les données
        saveProgressData();
        
        // Mettre à jour la date de la dernière session
        progressData.lastStudySession = new Date().toISOString();
    }, 60000); // 60000 ms = 1 minute
    
    // Arrêter le timer lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', () => {
        if (studyTimer) {
            clearInterval(studyTimer);
        }
    });
}

/**
 * Ajoute des écouteurs d'événements pour les changements de contenu
 */
function addContentListeners() {
    // Écouter les changements de contenu
    document.addEventListener('contentLoaded', (event) => {
        const routeId = event.detail.routeId;
        
        // Si c'est un cours, enregistrer la progression
        if (routeId && routeId.includes('-') && !routeId.includes('quiz') && !routeId.includes('resources')) {
            // Format attendu: moduleId-courseId
            const [moduleId, courseId] = routeId.split('-');
            
            // Enregistrer le cours comme visité
            markCourseAsVisited(moduleId, courseId);
            
            // Mettre à jour le cours actuel
            currentCourse = { moduleId, courseId };
            
            // Vérifier si des éléments interactifs doivent être suivis
            trackInteractiveElements();
        } else {
            // Réinitialiser le cours actuel
            currentCourse = null;
        }
    });
    
    // Écouter la complétion des exercices
    document.addEventListener('exerciseCompleted', (event) => {
        if (currentCourse) {
            const { moduleId, courseId } = currentCourse;
            const exerciseId = event.detail.exerciseId;
            
            // Marquer l'exercice comme complété
            markExerciseAsCompleted(moduleId, courseId, exerciseId);
        }
    });
    
    // Écouter la complétion des quiz
    document.addEventListener('quizCompleted', (event) => {
        const moduleId = event.detail.moduleId;
        const score = event.detail.score;
        
        // Enregistrer le score du quiz
        saveQuizScore(moduleId, score);
    });
}

/**
 * Initialise le bouton de réinitialisation de la progression
 */
function initResetButton() {
    const resetButton = document.getElementById('reset-progress');
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Demander confirmation
            const confirmed = window.confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ? Cette action est irréversible.');
            
            if (confirmed) {
                resetAllProgress();
                
                // Jouer un son si disponible
                if (window.playSound) {
                    window.playSound('notification');
                }
                
                // Afficher un message de confirmation
                alert('Votre progression a été réinitialisée.');
                
                // Recharger la page
                window.location.reload();
            }
        });
    }
}

/**
 * Marque un cours comme visité
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 */
function markCourseAsVisited(moduleId, courseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    // Initialiser l'objet de progression du cours si nécessaire
    if (!progressData.courses[courseKey]) {
        progressData.courses[courseKey] = {
            visited: false,
            completed: false,
            percentCompleted: 0,
            lastVisit: null,
            totalTimeSpent: 0,
            exercisesCompleted: {}
        };
    }
    
    // Marquer comme visité
    progressData.courses[courseKey].visited = true;
    progressData.courses[courseKey].lastVisit = new Date().toISOString();
    
    // Sauvegarder les données
    saveProgressData();
    
    // Mettre à jour la sidebar pour refléter la visite
    updateSidebarProgress();
    
    console.log(`Cours ${courseKey} marqué comme visité`);
}

/**
 * Marque un cours comme complété
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 */
export function markCourseAsCompleted(moduleId, courseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    // Initialiser l'objet de progression du cours si nécessaire
    if (!progressData.courses[courseKey]) {
        markCourseAsVisited(moduleId, courseId);
    }
    
    // Marquer comme complété
    progressData.courses[courseKey].completed = true;
    progressData.courses[courseKey].percentCompleted = 100;
    
    // Incrémenter le compteur de cours complétés
    if (!progressData.courses[courseKey].wasCountedAsCompleted) {
        progressData.completedCourses++;
        progressData.courses[courseKey].wasCountedAsCompleted = true;
    }
    
    // Sauvegarder les données
    saveProgressData();
    
    // Mettre à jour la sidebar pour refléter la complétion
    updateSidebarProgress();
    
    // Mettre à jour la barre de progression globale
    updateGlobalProgressBar();
    
    console.log(`Cours ${courseKey} marqué comme complété`);
    
    // Vérifier si un badge doit être débloqué
    checkBadges();
    
    // Jouer un son si disponible
    if (window.playSound) {
        window.playSound('success');
    }
}

/**
 * Marque un exercice comme complété
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 * @param {string} exerciseId - Identifiant de l'exercice
 */
function markExerciseAsCompleted(moduleId, courseId, exerciseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    // Initialiser l'objet de progression du cours si nécessaire
    if (!progressData.courses[courseKey]) {
        markCourseAsVisited(moduleId, courseId);
    }
    
    // Marquer l'exercice comme complété
    progressData.courses[courseKey].exercisesCompleted[exerciseId] = true;
    
    // Calculer le pourcentage de complétion
    updateCourseCompletionPercentage(moduleId, courseId);
    
    // Sauvegarder les données
    saveProgressData();
    
    console.log(`Exercice ${exerciseId} du cours ${courseKey} marqué comme complété`);
    
    // Jouer un son si disponible
    if (window.playSound) {
        window.playSound('success');
    }
}

/**
 * Met à jour le pourcentage de complétion d'un cours
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 */
function updateCourseCompletionPercentage(moduleId, courseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    // Récupérer le cours dans le DOM
    const courseContent = document.getElementById('content-container');
    
    if (!courseContent) {
        return;
    }
    
    // Compter le nombre total d'exercices dans le cours
    const allExercises = courseContent.querySelectorAll('.exercise');
    const totalExercises = allExercises.length;
    
    if (totalExercises === 0) {
        // S'il n'y a pas d'exercices, considérer que le cours est complété à 100% par la visite
        progressData.courses[courseKey].percentCompleted = 100;
        return;
    }
    
    // Compter le nombre d'exercices complétés
    const exercisesCompleted = Object.keys(progressData.courses[courseKey].exercisesCompleted).length;
    
    // Calculer le pourcentage
    const percentage = Math.round((exercisesCompleted / totalExercises) * 100);
    
    // Mettre à jour le pourcentage
    progressData.courses[courseKey].percentCompleted = percentage;
    
    // Si tous les exercices sont complétés, marquer le cours comme complété
    if (percentage === 100) {
        markCourseAsCompleted(moduleId, courseId);
    }
}

/**
 * Enregistre le score d'un quiz
 * @param {string} moduleId - Identifiant du module
 * @param {number} score - Score obtenu (pourcentage)
 */
function saveQuizScore(moduleId, score) {
    // Initialiser l'objet de progression du quiz si nécessaire
    if (!progressData.quizzes[moduleId]) {
        progressData.quizzes[moduleId] = {
            bestScore: 0,
            lastScore: 0,
            attempts: 0,
            completed: false,
            lastAttempt: null
        };
    }
    
    // Mettre à jour les données du quiz
    progressData.quizzes[moduleId].lastScore = score;
    progressData.quizzes[moduleId].attempts++;
    progressData.quizzes[moduleId].lastAttempt = new Date().toISOString();
    
    // Mettre à jour le meilleur score si nécessaire
    if (score > progressData.quizzes[moduleId].bestScore) {
        progressData.quizzes[moduleId].bestScore = score;
    }
    
    // Marquer comme complété si le score est suffisant
    if (score >= 70) {
        progressData.quizzes[moduleId].completed = true;
    }
    
    // Sauvegarder les données
    saveProgressData();
    
    // Mettre à jour la sidebar pour refléter la complétion du quiz
    updateSidebarProgress();
    
    console.log(`Quiz du module ${moduleId} complété avec un score de ${score}%`);
    
    // Vérifier si un badge doit être débloqué
    checkBadges();
}

/**
 * Met à jour la barre de progression dans la sidebar
 */
function updateSidebarProgress() {
    // Mettre à jour les cours dans la sidebar
    const courseItems = document.querySelectorAll('.course-item');
    
    courseItems.forEach(item => {
        const moduleId = item.closest('.module-item').querySelector('.module-header').getAttribute('data-module');
        const courseId = item.getAttribute('data-course');
        const courseKey = `${moduleId}-${courseId}`;
        
        if (progressData.courses[courseKey]) {
            // Indiquer si le cours a été visité
            if (progressData.courses[courseKey].visited) {
                item.classList.add('visited');
            }
            
            // Indiquer si le cours a été complété
            if (progressData.courses[courseKey].completed) {
                item.classList.add('completed');
            }
            
            // Ajouter une barre de progression si elle n'existe pas déjà
            let progressBar = item.querySelector('.course-progress');
            
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'course-progress';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'course-progress-fill';
                
                progressBar.appendChild(progressFill);
                item.appendChild(progressBar);
            }
            
            // Mettre à jour la barre de progression
            const progressFill = progressBar.querySelector('.course-progress-fill');
            progressFill.style.width = `${progressData.courses[courseKey].percentCompleted}%`;
        }
    });
    
    // Mettre à jour les quiz dans la sidebar
    const quizItems = document.querySelectorAll('.course-item[data-quiz]');
    
    quizItems.forEach(item => {
        const moduleId = item.getAttribute('data-quiz');
        
        if (progressData.quizzes[moduleId]) {
            // Indiquer si le quiz a été complété
            if (progressData.quizzes[moduleId].completed) {
                item.classList.add('completed');
            }
            
            // Afficher le score si disponible
            const bestScore = progressData.quizzes[moduleId].bestScore;
            if (bestScore > 0) {
                let scoreDisplay = item.querySelector('.quiz-score');
                
                if (!scoreDisplay) {
                    scoreDisplay = document.createElement('span');
                    scoreDisplay.className = 'quiz-score';
                    item.appendChild(scoreDisplay);
                }
                
                scoreDisplay.textContent = `${bestScore}%`;
            }
        }
    });
}

/**
 * Met à jour la barre de progression globale
 */
function updateGlobalProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (!progressFill || !progressPercentage) {
        return;
    }
    
    // Calculer le pourcentage de progression globale
    let totalCourses = 0;
    let completedCourses = 0;
    
    // Compter les cours complétés
    for (const courseKey in progressData.courses) {
        if (progressData.courses[courseKey].completed) {
            completedCourses++;
        }
        totalCourses++;
    }
    
    // Éviter la division par zéro
    if (totalCourses === 0) {
        progressFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        return;
    }
    
    // Calculer le pourcentage
    const percentage = Math.round((completedCourses / totalCourses) * 100);
    
    // Mettre à jour la barre de progression
    progressFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
    
    console.log(`Progression globale: ${percentage}% (${completedCourses}/${totalCourses} cours complétés)`);
}

/**
 * Suit les éléments interactifs de la page
 */
function trackInteractiveElements() {
    if (!currentCourse) {
        return;
    }
    
    // Attendre que le contenu soit complètement chargé
    setTimeout(() => {
        // Récupérer tous les exercices de la page
        const exercises = document.querySelectorAll('.exercise');
        
        // Pour chaque exercice, ajouter un écouteur d'événement pour la validation
        exercises.forEach((exercise, index) => {
            const exerciseId = exercise.id || `exercise-${index + 1}`;
            
            // Vérifier si l'exercice a déjà été complété
            const { moduleId, courseId } = currentCourse;
            const courseKey = `${moduleId}-${courseId}`;
            
            if (progressData.courses[courseKey] && 
                progressData.courses[courseKey].exercisesCompleted && 
                progressData.courses[courseKey].exercisesCompleted[exerciseId]) {
                // Marquer visuellement l'exercice comme complété
                exercise.classList.add('completed');
            }
            
            // Ajouter un écouteur pour la validation de l'exercice
            const validateButton = exercise.querySelector('.validate-btn');
            
            if (validateButton) {
                validateButton.addEventListener('click', () => {
                    // La logique de validation est gérée ailleurs
                    // Cet écouteur est juste pour le suivi de progression
                    console.log(`Exercice ${exerciseId} validé`);
                });
            }
        });
        
        // Chercher le bouton "Marquer comme terminé"
        const completeButton = document.querySelector('.mark-completed-btn');
        
        if (completeButton) {
            completeButton.addEventListener('click', () => {
                const { moduleId, courseId } = currentCourse;
                markCourseAsCompleted(moduleId, courseId);
            });
        }
    }, 500);
}

/**
 * Vérifie si des badges doivent être débloqués
 */
function checkBadges() {
    // Exemple de badges à débloquer
    
    // Badge "Premier cours terminé"
    if (progressData.completedCourses >= 1 && !hasBadge('first_course')) {
        addBadge('first_course', 'Premier cours terminé', 'Vous avez terminé votre premier cours !');
    }
    
    // Badge "5 cours terminés"
    if (progressData.completedCourses >= 5 && !hasBadge('five_courses')) {
        addBadge('five_courses', '5 cours terminés', 'Vous avez terminé 5 cours !');
    }
    
    // Badge "Tous les cours terminés"
    const totalCoursesInCurriculum = Object.keys(progressData.courses).length;
    if (progressData.completedCourses >= totalCoursesInCurriculum && totalCoursesInCurriculum > 0 && !hasBadge('all_courses')) {
        addBadge('all_courses', 'Tous les cours terminés', 'Félicitations ! Vous avez terminé tous les cours !');
    }
    
    // Badge "1 heure d'étude"
    if (progressData.totalStudyTime >= 60 && !hasBadge('one_hour_study')) {
        addBadge('one_hour_study', '1 heure d\'étude', 'Vous avez étudié pendant 1 heure !');
    }
}

/**
 * Vérifie si un badge a déjà été débloqué
 * @param {string} badgeId - Identifiant du badge
 * @returns {boolean} Vrai si le badge a déjà été débloqué
 */
function hasBadge(badgeId) {
    return progressData.badges.some(badge => badge.id === badgeId);
}

/**
 * Ajoute un nouveau badge
 * @param {string} badgeId - Identifiant du badge
 * @param {string} title - Titre du badge
 * @param {string} description - Description du badge
 */
function addBadge(badgeId, title, description) {
    // Créer le badge
    const badge = {
        id: badgeId,
        title,
        description,
        earnedDate: new Date().toISOString()
    };
    
    // Ajouter le badge à la liste
    progressData.badges.push(badge);
    
    // Sauvegarder les données
    saveProgressData();
    
    console.log(`Badge débloqué: ${title}`);
    
    // Afficher une notification
    showBadgeNotification(badge);
    
    // Jouer un son si disponible
    if (window.playSound) {
        window.playSound('notification');
    }
}

/**
 * Affiche une notification pour un badge débloqué
 * @param {Object} badge - Données du badge
 */
function showBadgeNotification(badge) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-icon">🏅</div>
        <div class="badge-content">
            <h3>Badge débloqué !</h3>
            <h4>${badge.title}</h4>
            <p>${badge.description}</p>
        </div>
        <button class="close-notification">&times;</button>
    `;
    
    // Ajouter la notification au corps du document
    document.body.appendChild(notification);
    
    // Afficher la notification avec une animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Fermer la notification après un délai
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Supprimer la notification après l'animation de fermeture
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
    
    // Fermer la notification en cliquant sur le bouton
    const closeButton = notification.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        
        // Supprimer la notification après l'animation de fermeture
        setTimeout(() => {
            notification.remove();
        }, 500);
    });
}

/**
 * Réinitialise toutes les données de progression
 */
function resetAllProgress() {
    // Réinitialiser les données
    progressData = {
        courses: {},
        quizzes: {},
        totalStudyTime: 0,
        lastStudySession: null,
        completedCourses: 0,
        badges: []
    };
    
    // Sauvegarder les données
    saveProgressData();
    
    // Réinitialiser l'affichage de la sidebar
    const courseItems = document.querySelectorAll('.course-item');
    courseItems.forEach(item => {
        item.classList.remove('visited', 'completed');
        
        const progressBar = item.querySelector('.course-progress');
        if (progressBar) {
            progressBar.remove();
        }
        
        const scoreDisplay = item.querySelector('.quiz-score');
        if (scoreDisplay) {
            scoreDisplay.remove();
        }
    });
    
    // Réinitialiser la barre de progression globale
    updateGlobalProgressBar();
    
    console.log('Progression réinitialisée');
}

/**
 * Obtient le pourcentage de complétion d'un cours
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 * @returns {number} Pourcentage de complétion
 */
export function getCourseCompletion(moduleId, courseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    if (progressData.courses[courseKey]) {
        return progressData.courses[courseKey].percentCompleted;
    }
    
    return 0;
}

/**
 * Vérifie si un cours a été complété
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 * @returns {boolean} Vrai si le cours a été complété
 */
export function isCourseCompleted(moduleId, courseId) {
    const courseKey = `${moduleId}-${courseId}`;
    
    if (progressData.courses[courseKey]) {
        return progressData.courses[courseKey].completed;
    }
    
    return false;
}

/**
 * Obtient toutes les données de progression
 * @returns {Object} Données de progression
 */
export function getProgressData() {
    return { ...progressData };
}

/**
 * Met à jour la progression d'un cours manuellement
 * @param {string} moduleId - Identifiant du module
 * @param {string} courseId - Identifiant du cours
 * @param {number} percentage - Pourcentage de complétion
 */
export function updateCourseProgress(moduleId, courseId, percentage) {
    const courseKey = `${moduleId}-${courseId}`;
    
    // Initialiser l'objet de progression du cours si nécessaire
    if (!progressData.courses[courseKey]) {
        markCourseAsVisited(moduleId, courseId);
    }
    
    // Mettre à jour le pourcentage
    progressData.courses[courseKey].percentCompleted = percentage;
    
    // Marquer comme complété si 100%
    if (percentage === 100) {
        markCourseAsCompleted(moduleId, courseId);
    }
    
    // Sauvegarder les données
    saveProgressData();
    
    // Mettre à jour la sidebar
    updateSidebarProgress();
    
    console.log(`Progression du cours ${courseKey} mise à jour: ${percentage}%`);
}