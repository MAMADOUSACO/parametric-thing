/**
 * quiz-engine.js - Moteur pour les quiz et exercices interactifs
 * Gère la logique et le feedback des exercices dans les cours
 */

// Configuration par défaut
const DEFAULT_CONFIG = {
    showFeedback: true,
    showProgress: true,
    showResults: true,
    showExplanations: true,
    showResetButton: true,
    randomizeOptions: false,
    progressThreshold: 0.7, // Considéré comme réussi si le score est supérieur à 70%
    successMessage: "Félicitations ! Vous avez réussi ce quiz.",
    failureMessage: "Vous n'avez pas atteint le score minimum. Réessayez !",
    completionCallback: null
};

/**
 * Initialise les exercices individuels sur la page courante
 */
export function initExercises() {
    console.log('Initialisation des exercices...');
    
    // Sélectionner tous les exercices de la page
    const exercises = document.querySelectorAll('.exercise');
    
    exercises.forEach((exercise, index) => {
        const exerciseId = exercise.id || `exercise-${index}`;
        exercise.id = exerciseId;
        
        // Vérifie si l'exercice est déjà initialisé pour éviter la duplication
        if (exercise.dataset.initialized === 'true') {
            return;
        }
        
        // Récupérer les éléments de l'exercice
        const options = exercise.querySelectorAll('.exercise-option');
        const checkButton = exercise.querySelector('.check-answer-btn');
        const solutionButton = exercise.querySelector('.show-solution-btn');
        const answerFeedback = exercise.querySelector('.exercise-answer');
        
        // Type d'exercice (par défaut, considérer comme QCM)
        const isMultipleChoice = options.length > 0;
        const isInput = exercise.querySelector('.exercise-input') !== null;
        const isDragDrop = exercise.querySelector('.drag-drop-container') !== null;
        
        // Initialiser selon le type d'exercice
        if (isMultipleChoice) {
            initMultipleChoiceExercise(exercise, options, checkButton, solutionButton, answerFeedback);
        } else if (isInput) {
            initInputExercise(exercise, checkButton, solutionButton, answerFeedback);
        } else if (isDragDrop) {
            initDragDropExercise(exercise, checkButton, solutionButton, answerFeedback);
        }
        
        // Marquer comme initialisé
        exercise.dataset.initialized = 'true';
    });
}

/**
 * Initialise un exercice à choix multiples
 * @param {HTMLElement} exercise - L'élément d'exercice
 * @param {NodeList} options - Les options de réponse
 * @param {HTMLElement} checkButton - Le bouton de vérification
 * @param {HTMLElement} solutionButton - Le bouton pour voir la solution
 * @param {HTMLElement} answerFeedback - L'élément de feedback
 */
function initMultipleChoiceExercise(exercise, options, checkButton, solutionButton, answerFeedback) {
    // Déterminer s'il s'agit d'un choix unique ou multiple
    const radioInputs = exercise.querySelectorAll('input[type="radio"]');
    const checkboxInputs = exercise.querySelectorAll('input[type="checkbox"]');
    const isRadio = radioInputs.length > 0;
    const isCheckbox = checkboxInputs.length > 0;
    
    // Ajouter les écouteurs d'événements pour les options
    options.forEach(option => {
        option.addEventListener('click', () => {
            // Pour les radios, désélectionner les autres options
            if (isRadio) {
                options.forEach(opt => {
                    opt.classList.remove('selected');
                    const radio = opt.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = false;
                    }
                });
            }
            
            // Sélectionner ou désélectionner l'option cliquée
            option.classList.toggle('selected');
            
            // Mettre à jour l'entrée radio/checkbox si présente
            const input = option.querySelector('input');
            if (input) {
                input.checked = option.classList.contains('selected');
            }
            
            // Masquer le feedback si présent
            if (answerFeedback) {
                answerFeedback.classList.remove('visible');
            }
        });
        
        // Si l'option contient un input, synchroniser les états
        const input = option.querySelector('input');
        if (input) {
            input.addEventListener('change', (event) => {
                if (input.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                
                // Pour les radios, désélectionner les autres options
                if (isRadio && input.checked) {
                    options.forEach(opt => {
                        if (opt !== option) {
                            opt.classList.remove('selected');
                            const otherRadio = opt.querySelector('input[type="radio"]');
                            if (otherRadio) {
                                otherRadio.checked = false;
                            }
                        }
                    });
                }
                
                // Masquer le feedback si présent
                if (answerFeedback) {
                    answerFeedback.classList.remove('visible');
                }
                
                // Empêcher la propagation pour éviter de déclencher le click sur l'option
                event.stopPropagation();
            });
        }
    });
    
    // Ajouter l'écouteur pour le bouton de vérification
    if (checkButton) {
        checkButton.addEventListener('click', () => {
            // Vérifier si au moins une option est sélectionnée
            const selectedOptions = exercise.querySelectorAll('.exercise-option.selected');
            
            if (selectedOptions.length === 0) {
                alert('Veuillez sélectionner une réponse.');
                return;
            }
            
            // Vérifier les réponses
            let isCorrect = true;
            let selected = 0;
            let correctAnswers = 0;
            
            options.forEach(option => {
                const isSelected = option.classList.contains('selected');
                const isCorrectOption = option.dataset.correct === 'true';
                
                if (isSelected) {
                    selected++;
                    
                    // Ajouter la classe correct ou incorrect
                    if (isCorrectOption) {
                        option.classList.add('correct');
                    } else {
                        option.classList.add('incorrect');
                        isCorrect = false;
                    }
                } else if (isCorrectOption) {
                    // Option correcte non sélectionnée
                    isCorrect = false;
                }
                
                if (isCorrectOption) {
                    correctAnswers++;
                }
            });
            
            // Pour les checkbox, vérifier si toutes les bonnes réponses sont sélectionnées
            if (isCheckbox && selected !== correctAnswers) {
                isCorrect = false;
            }
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    if (isCorrect) {
                        headerIcon.textContent = '✓';
                        headerIcon.classList.add('correct');
                        headerIcon.classList.remove('incorrect');
                    } else {
                        headerIcon.textContent = '✗';
                        headerIcon.classList.add('incorrect');
                        headerIcon.classList.remove('correct');
                    }
                }
                
                if (headerText) {
                    headerText.textContent = isCorrect ? 'Réponse correcte !' : 'Réponse incorrecte';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Déclencher l'événement de complétion
            triggerExerciseCompletion(exercise, isCorrect);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound(isCorrect ? 'success' : 'error');
            }
        });
    }
    
    // Ajouter l'écouteur pour le bouton de solution
    if (solutionButton) {
        solutionButton.addEventListener('click', () => {
            // Réinitialiser les classes des options
            options.forEach(option => {
                option.classList.remove('selected', 'correct', 'incorrect');
                
                // Mettre en évidence les options correctes
                if (option.dataset.correct === 'true') {
                    option.classList.add('correct');
                }
                
                // Mettre à jour les inputs
                const input = option.querySelector('input');
                if (input) {
                    input.checked = option.dataset.correct === 'true';
                }
            });
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    headerIcon.textContent = 'ℹ️';
                    headerIcon.classList.remove('correct', 'incorrect');
                }
                
                if (headerText) {
                    headerText.textContent = 'Solution';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('notification');
            }
        });
    }
}

/**
 * Initialise un exercice avec entrée texte/numérique
 * @param {HTMLElement} exercise - L'élément d'exercice
 * @param {HTMLElement} checkButton - Le bouton de vérification
 * @param {HTMLElement} solutionButton - Le bouton pour voir la solution
 * @param {HTMLElement} answerFeedback - L'élément de feedback
 */
function initInputExercise(exercise, checkButton, solutionButton, answerFeedback) {
    // Récupérer les champs d'entrée
    const inputs = exercise.querySelectorAll('.exercise-input');
    
    // Fonction pour vérifier les réponses
    const checkAnswers = () => {
        let isCorrect = true;
        
        inputs.forEach(input => {
            const userAnswer = input.value.trim();
            const correctAnswer = input.dataset.correct;
            
            // Vérifier si la réponse est correcte (peut être une expression régulière)
            let answerIsCorrect = false;
            
            if (correctAnswer.startsWith('/') && correctAnswer.endsWith('/')) {
                // C'est une regex
                const regex = new RegExp(correctAnswer.slice(1, -1));
                answerIsCorrect = regex.test(userAnswer);
            } else if (input.dataset.type === 'number') {
                // Comparaison numérique avec tolérance
                const tolerance = parseFloat(input.dataset.tolerance || '0.001');
                const userValue = parseFloat(userAnswer);
                const correctValue = parseFloat(correctAnswer);
                answerIsCorrect = Math.abs(userValue - correctValue) <= tolerance;
            } else {
                // Comparaison de chaînes
                answerIsCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
            }
            
            // Mettre à jour le style
            if (answerIsCorrect) {
                input.classList.add('correct-input');
                input.classList.remove('incorrect-input');
            } else {
                input.classList.add('incorrect-input');
                input.classList.remove('correct-input');
                isCorrect = false;
            }
        });
        
        return isCorrect;
    };
    
    // Ajouter l'écouteur pour le bouton de vérification
    if (checkButton) {
        checkButton.addEventListener('click', () => {
            // Vérifier si tous les champs sont remplis
            let allFilled = true;
            inputs.forEach(input => {
                if (input.value.trim() === '') {
                    allFilled = false;
                }
            });
            
            if (!allFilled) {
                alert('Veuillez remplir tous les champs.');
                return;
            }
            
            // Vérifier les réponses
            const isCorrect = checkAnswers();
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    if (isCorrect) {
                        headerIcon.textContent = '✓';
                        headerIcon.classList.add('correct');
                        headerIcon.classList.remove('incorrect');
                    } else {
                        headerIcon.textContent = '✗';
                        headerIcon.classList.add('incorrect');
                        headerIcon.classList.remove('correct');
                    }
                }
                
                if (headerText) {
                    headerText.textContent = isCorrect ? 'Réponse correcte !' : 'Réponse incorrecte';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Déclencher l'événement de complétion
            triggerExerciseCompletion(exercise, isCorrect);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound(isCorrect ? 'success' : 'error');
            }
        });
    }
    
    // Ajouter l'écouteur pour le bouton de solution
    if (solutionButton) {
        solutionButton.addEventListener('click', () => {
            // Remplir les champs avec les réponses correctes
            inputs.forEach(input => {
                const correctAnswer = input.dataset.correct;
                
                // Extraire la réponse correcte si c'est une regex
                if (correctAnswer.startsWith('/') && correctAnswer.endsWith('/')) {
                    // Afficher la première réponse correcte possible ou un placeholder
                    input.value = input.dataset.example || correctAnswer;
                } else {
                    input.value = correctAnswer;
                }
                
                // Mettre à jour le style
                input.classList.add('correct-input');
                input.classList.remove('incorrect-input');
            });
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    headerIcon.textContent = 'ℹ️';
                    headerIcon.classList.remove('correct', 'incorrect');
                }
                
                if (headerText) {
                    headerText.textContent = 'Solution';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('notification');
            }
        });
    }
    
    // Ajouter la validation sur la touche Enter
    inputs.forEach(input => {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && checkButton) {
                checkButton.click();
            }
        });
    });
}

/**
 * Initialise un exercice de type glisser-déposer
 * @param {HTMLElement} exercise - L'élément d'exercice
 * @param {HTMLElement} checkButton - Le bouton de vérification
 * @param {HTMLElement} solutionButton - Le bouton pour voir la solution
 * @param {HTMLElement} answerFeedback - L'élément de feedback
 */
function initDragDropExercise(exercise, checkButton, solutionButton, answerFeedback) {
    // Récupérer les éléments drag-drop
    const dragItems = exercise.querySelectorAll('.drag-item');
    const dropZones = exercise.querySelectorAll('.drop-zone');
    
    // Configurer les éléments glissables
    dragItems.forEach(item => {
        item.setAttribute('draggable', 'true');
        
        item.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', item.id);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    // Configurer les zones de dépôt
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (event) => {
            event.preventDefault();
            zone.classList.remove('drag-over');
            
            const itemId = event.dataTransfer.getData('text/plain');
            const dragItem = document.getElementById(itemId);
            
            // Vérifier si la zone contient déjà un élément
            const existingItem = zone.querySelector('.drag-item');
            if (existingItem) {
                // Replacer l'élément existant dans son conteneur d'origine
                const itemContainer = exercise.querySelector('.drag-items-container');
                if (itemContainer) {
                    itemContainer.appendChild(existingItem);
                }
            }
            
            // Placer le nouvel élément dans la zone
            zone.appendChild(dragItem);
            
            // Masquer le feedback si présent
            if (answerFeedback) {
                answerFeedback.classList.remove('visible');
            }
        });
    });
    
    // Ajouter l'écouteur pour le bouton de vérification
    if (checkButton) {
        checkButton.addEventListener('click', () => {
            // Vérifier si toutes les zones ont un élément
            let allFilled = true;
            dropZones.forEach(zone => {
                if (!zone.querySelector('.drag-item')) {
                    allFilled = false;
                }
            });
            
            if (!allFilled) {
                alert('Veuillez remplir toutes les zones de dépôt.');
                return;
            }
            
            // Vérifier les réponses
            let isCorrect = true;
            
            dropZones.forEach(zone => {
                const correctItemId = zone.dataset.correctItem;
                const placedItem = zone.querySelector('.drag-item');
                
                if (placedItem && placedItem.id === correctItemId) {
                    zone.classList.add('correct-zone');
                    zone.classList.remove('incorrect-zone');
                } else {
                    zone.classList.add('incorrect-zone');
                    zone.classList.remove('correct-zone');
                    isCorrect = false;
                }
            });
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    if (isCorrect) {
                        headerIcon.textContent = '✓';
                        headerIcon.classList.add('correct');
                        headerIcon.classList.remove('incorrect');
                    } else {
                        headerIcon.textContent = '✗';
                        headerIcon.classList.add('incorrect');
                        headerIcon.classList.remove('correct');
                    }
                }
                
                if (headerText) {
                    headerText.textContent = isCorrect ? 'Réponse correcte !' : 'Réponse incorrecte';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Déclencher l'événement de complétion
            triggerExerciseCompletion(exercise, isCorrect);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound(isCorrect ? 'success' : 'error');
            }
        });
    }
    
    // Ajouter l'écouteur pour le bouton de solution
    if (solutionButton) {
        solutionButton.addEventListener('click', () => {
            // Placer les éléments dans les bonnes zones
            dropZones.forEach(zone => {
                const correctItemId = zone.dataset.correctItem;
                const correctItem = document.getElementById(correctItemId);
                
                if (correctItem) {
                    // Enlever l'élément de sa position actuelle
                    if (correctItem.parentElement) {
                        correctItem.parentElement.removeChild(correctItem);
                    }
                    
                    // Placer l'élément dans la bonne zone
                    zone.appendChild(correctItem);
                    
                    // Mettre à jour le style
                    zone.classList.add('correct-zone');
                    zone.classList.remove('incorrect-zone');
                }
            });
            
            // Afficher le feedback
            if (answerFeedback) {
                const headerIcon = answerFeedback.querySelector('.exercise-answer-icon');
                const headerText = answerFeedback.querySelector('.exercise-answer-header span:last-child');
                
                if (headerIcon) {
                    headerIcon.textContent = 'ℹ️';
                    headerIcon.classList.remove('correct', 'incorrect');
                }
                
                if (headerText) {
                    headerText.textContent = 'Solution';
                }
                
                answerFeedback.classList.add('visible');
            }
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('notification');
            }
        });
    }
}

/**
 * Déclenche un événement personnalisé pour la complétion d'un exercice
 * @param {HTMLElement} exercise - L'élément d'exercice
 * @param {boolean} isCorrect - Indique si l'exercice a été réussi
 */
function triggerExerciseCompletion(exercise, isCorrect) {
    // Marquer l'exercice comme complété
    if (isCorrect) {
        exercise.classList.add('completed');
    }
    
    // Créer l'événement personnalisé
    const event = new CustomEvent('exerciseCompleted', {
        detail: {
            exerciseId: exercise.id,
            correct: isCorrect
        }
    });
    
    // Déclencher l'événement
    document.dispatchEvent(event);
}

/**
 * Initialise un quiz complet
 * @param {string} containerId - ID du conteneur du quiz
 * @param {Object} quizData - Données du quiz
 * @param {Object} config - Configuration du quiz
 * @returns {Object} Instance du quiz
 */
export function initQuiz(containerId, quizData, config = {}) {
    // Fusionner la configuration avec les valeurs par défaut
    const quizConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Récupérer le conteneur
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Conteneur #${containerId} non trouvé`);
        return null;
    }
    
    // État du quiz
    const quizState = {
        currentQuestion: 0,
        score: 0,
        answers: [],
        questions: quizData.questions || [],
        config: quizConfig
    };
    
    // Générer la structure HTML du quiz
    generateQuizHtml(container, quizState);
    
    // Ajouter les écouteurs d'événements
    addQuizEventListeners(container, quizState);
    
    // Afficher la première question
    showQuestion(container, quizState, 0);
    
    // Renvoyer l'API publique
    return {
        getState: () => ({ ...quizState }),
        goToQuestion: (index) => showQuestion(container, quizState, index),
        reset: () => resetQuiz(container, quizState),
        getScore: () => calculateScore(quizState)
    };
}

/**
 * Génère la structure HTML d'un quiz
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function generateQuizHtml(container, quizState) {
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer la structure du quiz
    const quizHtml = `
        <div class="quiz-container">
            <div class="quiz-header">
                <h2 class="quiz-title">${quizState.title || 'Quiz'}</h2>
                <p class="quiz-description">${quizState.description || 'Testez vos connaissances avec ce quiz.'}</p>
                ${quizState.config.showProgress ? `
                    <div class="quiz-progress">
                        <div class="progress-text">Question <span class="current-question">1</span>/<span class="total-questions">${quizState.questions.length}</span></div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(1 / quizState.questions.length) * 100}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="quiz-content">
                <!-- Les questions seront insérées ici -->
            </div>
            
            <div class="quiz-footer">
                <div class="quiz-controls">
                    <button class="btn btn-secondary prev-question" disabled>Précédente</button>
                    <button class="btn btn-primary next-question">Suivante</button>
                    <button class="btn btn-primary finish-quiz" style="display: none;">Terminer</button>
                </div>
            </div>
            
            <div class="quiz-results" style="display: none;">
                <!-- Les résultats seront insérés ici -->
            </div>
        </div>
    `;
    
    // Insérer le HTML
    container.innerHTML = quizHtml;
}

/**
 * Ajoute les écouteurs d'événements pour un quiz
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function addQuizEventListeners(container, quizState) {
    // Boutons de navigation
    const prevButton = container.querySelector('.prev-question');
    const nextButton = container.querySelector('.next-question');
    const finishButton = container.querySelector('.finish-quiz');
    
    // Écouteur pour le bouton précédent
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (quizState.currentQuestion > 0) {
                showQuestion(container, quizState, quizState.currentQuestion - 1);
            }
        });
    }
    
    // Écouteur pour le bouton suivant
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Enregistrer la réponse si nécessaire
            saveCurrentAnswer(container, quizState);
            
            // Passer à la question suivante
            if (quizState.currentQuestion < quizState.questions.length - 1) {
                showQuestion(container, quizState, quizState.currentQuestion + 1);
            } else {
                // C'est la dernière question, afficher le bouton "Terminer"
                if (nextButton) nextButton.style.display = 'none';
                if (finishButton) finishButton.style.display = 'block';
            }
        });
    }
    
    // Écouteur pour le bouton terminer
    if (finishButton) {
        finishButton.addEventListener('click', () => {
            // Enregistrer la dernière réponse
            saveCurrentAnswer(container, quizState);
            
            // Calculer le score final
            const score = calculateScore(quizState);
            
            // Afficher les résultats
            showResults(container, quizState, score);
            
            // Appeler le callback de complétion si défini
            if (quizState.config.completionCallback) {
                quizState.config.completionCallback(score);
            }
        });
    }
}

/**
 * Affiche une question du quiz
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 * @param {number} index - Index de la question à afficher
 */
function showQuestion(container, quizState, index) {
    // Vérifier que l'index est valide
    if (index < 0 || index >= quizState.questions.length) {
        console.error(`Index de question invalide: ${index}`);
        return;
    }
    
    // Mettre à jour l'index courant
    quizState.currentQuestion = index;
    
    // Récupérer la question
    const question = quizState.questions[index];
    
    // Mettre à jour le contenu
    const quizContent = container.querySelector('.quiz-content');
    
    if (!quizContent) {
        console.error('Élément .quiz-content non trouvé');
        return;
    }
    
    // Déterminer le type de question
    const questionType = question.type || 'multiple-choice';
    
    // Générer le HTML selon le type
    let questionHtml = '';
    
    if (questionType === 'multiple-choice') {
        questionHtml = generateMultipleChoiceHtml(question, quizState);
    } else if (questionType === 'true-false') {
        questionHtml = generateTrueFalseHtml(question, quizState);
    } else if (questionType === 'text-input') {
        questionHtml = generateTextInputHtml(question, quizState);
    } else if (questionType === 'matching') {
        questionHtml = generateMatchingHtml(question, quizState);
    } else {
        console.error(`Type de question non supporté: ${questionType}`);
        questionHtml = '<p>Type de question non supporté.</p>';
    }
    
    // Insérer le HTML
    quizContent.innerHTML = questionHtml;
    
    // Initialiser les événements spécifiques au type de question
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
        initMultipleChoiceEvents(quizContent, quizState);
    } else if (questionType === 'matching') {
        initMatchingEvents(quizContent, quizState);
    }
    
    // Mettre à jour les boutons de navigation
    updateNavigationButtons(container, quizState);
    
    // Mettre à jour la barre de progression
    updateProgressBar(container, quizState);
    
    // Précharger les réponses précédentes si disponibles
    loadPreviousAnswer(container, quizState);
}

/**
 * Génère le HTML pour une question à choix multiples
 * @param {Object} question - Données de la question
 * @param {Object} quizState - État du quiz
 * @returns {string} HTML de la question
 */
function generateMultipleChoiceHtml(question, quizState) {
    // Créer le HTML pour les options
    let optionsHtml = '';
    
    // Randomiser les options si nécessaire
    let options = [...question.options];
    if (quizState.config.randomizeOptions) {
        options = shuffleArray(options);
    }
    
    // Déterminer si c'est un choix unique ou multiple
    const isMultiple = question.multiple === true;
    const inputType = isMultiple ? 'checkbox' : 'radio';
    
    options.forEach((option, index) => {
        optionsHtml += `
            <div class="quiz-option" data-index="${index}">
                <input type="${inputType}" id="option-${question.id}-${index}" name="question-${question.id}" class="quiz-input">
                <label for="option-${question.id}-${index}" class="quiz-label">${option.text}</label>
            </div>
        `;
    });
    
    // Construire le HTML complet
    return `
        <div class="quiz-question" data-id="${question.id}" data-type="multiple-choice" data-multiple="${isMultiple}">
            <h3 class="question-text">${question.text}</h3>
            <div class="question-options">
                ${optionsHtml}
            </div>
            ${quizState.config.showFeedback ? `
                <div class="question-feedback" style="display: none;">
                    <div class="feedback-icon"></div>
                    <div class="feedback-text"></div>
                    ${quizState.config.showExplanations && question.explanation ? `
                        <div class="feedback-explanation">${question.explanation}</div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Génère le HTML pour une question vrai/faux
 * @param {Object} question - Données de la question
 * @param {Object} quizState - État du quiz
 * @returns {string} HTML de la question
 */
function generateTrueFalseHtml(question, quizState) {
    return `
        <div class="quiz-question" data-id="${question.id}" data-type="true-false">
            <h3 class="question-text">${question.text}</h3>
            <div class="question-options">
                <div class="quiz-option" data-index="0">
                    <input type="radio" id="option-${question.id}-true" name="question-${question.id}" class="quiz-input" value="true">
                    <label for="option-${question.id}-true" class="quiz-label">Vrai</label>
                </div>
                <div class="quiz-option" data-index="1">
                    <input type="radio" id="option-${question.id}-false" name="question-${question.id}" class="quiz-input" value="false">
                    <label for="option-${question.id}-false" class="quiz-label">Faux</label>
                </div>
            </div>
            ${quizState.config.showFeedback ? `
                <div class="question-feedback" style="display: none;">
                    <div class="feedback-icon"></div>
                    <div class="feedback-text"></div>
                    ${quizState.config.showExplanations && question.explanation ? `
                        <div class="feedback-explanation">${question.explanation}</div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Génère le HTML pour une question à réponse textuelle
 * @param {Object} question - Données de la question
 * @param {Object} quizState - État du quiz
 * @returns {string} HTML de la question
 */
function generateTextInputHtml(question, quizState) {
    return `
        <div class="quiz-question" data-id="${question.id}" data-type="text-input">
            <h3 class="question-text">${question.text}</h3>
            <div class="question-input-container">
                <input type="text" class="quiz-text-input" placeholder="${question.placeholder || 'Votre réponse...'}" data-correct="${question.correctAnswer}">
            </div>
            ${quizState.config.showFeedback ? `
                <div class="question-feedback" style="display: none;">
                    <div class="feedback-icon"></div>
                    <div class="feedback-text"></div>
                    ${quizState.config.showExplanations && question.explanation ? `
                        <div class="feedback-explanation">${question.explanation}</div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Génère le HTML pour une question d'association
 * @param {Object} question - Données de la question
 * @param {Object} quizState - État du quiz
 * @returns {string} HTML de la question
 */
function generateMatchingHtml(question, quizState) {
    // Créer les éléments à faire correspondre
    let leftItemsHtml = '';
    let rightItemsHtml = '';
    
    question.matches.forEach((match, index) => {
        leftItemsHtml += `
            <div class="matching-item left-item" data-id="${match.id || index}" data-index="${index}">
                ${match.left}
            </div>
        `;
        
        rightItemsHtml += `
            <div class="matching-item right-item" data-id="${match.id || index}" data-index="${index}">
                ${match.right}
            </div>
        `;
    });
    
    // Randomiser l'ordre des éléments de droite si nécessaire
    if (quizState.config.randomizeOptions) {
        rightItemsHtml = shuffleHtmlItems(rightItemsHtml);
    }
    
    return `
        <div class="quiz-question" data-id="${question.id}" data-type="matching">
            <h3 class="question-text">${question.text}</h3>
            <div class="matching-container">
                <div class="matching-column left-column">
                    ${leftItemsHtml}
                </div>
                <div class="matching-connections">
                    <!-- Les connexions seront dessinées ici -->
                </div>
                <div class="matching-column right-column">
                    ${rightItemsHtml}
                </div>
            </div>
            ${quizState.config.showFeedback ? `
                <div class="question-feedback" style="display: none;">
                    <div class="feedback-icon"></div>
                    <div class="feedback-text"></div>
                    ${quizState.config.showExplanations && question.explanation ? `
                        <div class="feedback-explanation">${question.explanation}</div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Initialise les événements pour les questions à choix multiples
 * @param {HTMLElement} container - Conteneur de la question
 * @param {Object} quizState - État du quiz
 */
function initMultipleChoiceEvents(container, quizState) {
    // Récupérer les options
    const options = container.querySelectorAll('.quiz-option');
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            const input = option.querySelector('.quiz-input');
            
            if (input) {
                // Inverser l'état pour les checkbox
                if (input.type === 'checkbox') {
                    input.checked = !input.checked;
                } 
                // Pour les radios, sélectionner celui-ci et désélectionner les autres
                else if (input.type === 'radio') {
                    input.checked = true;
                }
            }
        });
    });
}

/**
 * Initialise les événements pour les questions d'association
 * @param {HTMLElement} container - Conteneur de la question
 * @param {Object} quizState - État du quiz
 */
function initMatchingEvents(container, quizState) {
    // Récupérer les éléments d'association
    const leftItems = container.querySelectorAll('.left-item');
    const rightItems = container.querySelectorAll('.right-item');
    
    // État des connexions
    const connections = [];
    
    // Élément sélectionné actuellement
    let selectedElement = null;
    
    // Fonction pour dessiner les connexions
    const drawConnections = () => {
        const connectionsContainer = container.querySelector('.matching-connections');
        connectionsContainer.innerHTML = '';
        
        connections.forEach(conn => {
            // Créer une ligne SVG entre les deux éléments
            const leftRect = conn.left.getBoundingClientRect();
            const rightRect = conn.right.getBoundingClientRect();
            const containerRect = connectionsContainer.getBoundingClientRect();
            
            // Calculer les positions relatives
            const x1 = 0;
            const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
            const x2 = containerRect.width;
            const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
            
            // Créer la ligne
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            line.setAttribute('width', '100%');
            line.setAttribute('height', '100%');
            line.setAttribute('class', 'connection-line');
            line.style.position = 'absolute';
            line.style.top = '0';
            line.style.left = '0';
            line.innerHTML = `
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--color-primary)" stroke-width="2" />
            `;
            
            connectionsContainer.appendChild(line);
        });
    };
    
    // Ajouter les écouteurs pour les éléments de gauche
    leftItems.forEach(item => {
        item.addEventListener('click', () => {
            // Si un élément est déjà sélectionné, le désélectionner
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
            
            // Sélectionner cet élément
            item.classList.add('selected');
            selectedElement = item;
        });
    });
    
    // Ajouter les écouteurs pour les éléments de droite
    rightItems.forEach(item => {
        item.addEventListener('click', () => {
            // Vérifier si un élément de gauche est sélectionné
            if (selectedElement && selectedElement.classList.contains('left-item')) {
                // Créer une nouvelle connexion
                const leftIndex = selectedElement.dataset.index;
                const rightIndex = item.dataset.index;
                
                // Supprimer les connexions existantes pour ces éléments
                for (let i = connections.length - 1; i >= 0; i--) {
                    if (connections[i].left === selectedElement || connections[i].right === item) {
                        connections.splice(i, 1);
                    }
                }
                
                // Ajouter la nouvelle connexion
                connections.push({
                    left: selectedElement,
                    right: item,
                    leftIndex,
                    rightIndex
                });
                
                // Désélectionner l'élément
                selectedElement.classList.remove('selected');
                selectedElement = null;
                
                // Redessiner les connexions
                drawConnections();
            }
        });
    });
}

/**
 * Met à jour les boutons de navigation
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function updateNavigationButtons(container, quizState) {
    const prevButton = container.querySelector('.prev-question');
    const nextButton = container.querySelector('.next-question');
    const finishButton = container.querySelector('.finish-quiz');
    
    if (prevButton) {
        prevButton.disabled = quizState.currentQuestion === 0;
    }
    
    if (nextButton && finishButton) {
        if (quizState.currentQuestion === quizState.questions.length - 1) {
            nextButton.style.display = 'none';
            finishButton.style.display = 'block';
        } else {
            nextButton.style.display = 'block';
            finishButton.style.display = 'none';
        }
    }
}

/**
 * Met à jour la barre de progression
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function updateProgressBar(container, quizState) {
    const currentQuestionEl = container.querySelector('.current-question');
    const progressFill = container.querySelector('.progress-fill');
    
    if (currentQuestionEl) {
        currentQuestionEl.textContent = quizState.currentQuestion + 1;
    }
    
    if (progressFill) {
        const progress = (quizState.currentQuestion + 1) / quizState.questions.length;
        progressFill.style.width = `${progress * 100}%`;
    }
}

/**
 * Sauvegarde la réponse à la question courante
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function saveCurrentAnswer(container, quizState) {
    const questionEl = container.querySelector('.quiz-question');
    
    if (!questionEl) {
        return;
    }
    
    const questionId = questionEl.dataset.id;
    const questionType = questionEl.dataset.type;
    
    let answer = null;
    
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
        // Récupérer les options sélectionnées
        const selectedInputs = questionEl.querySelectorAll('.quiz-input:checked');
        const isMultiple = questionEl.dataset.multiple === 'true';
        
        if (isMultiple) {
            // Pour les questions à choix multiples
            answer = Array.from(selectedInputs).map(input => {
                const option = input.closest('.quiz-option');
                return option ? parseInt(option.dataset.index) : -1;
            });
        } else {
            // Pour les questions à choix unique
            const selectedInput = selectedInputs[0];
            if (selectedInput) {
                const option = selectedInput.closest('.quiz-option');
                answer = option ? parseInt(option.dataset.index) : -1;
            }
        }
    } else if (questionType === 'text-input') {
        // Récupérer la valeur de l'entrée texte
        const textInput = questionEl.querySelector('.quiz-text-input');
        if (textInput) {
            answer = textInput.value.trim();
        }
    } else if (questionType === 'matching') {
        // Récupérer les connexions
        const leftItems = questionEl.querySelectorAll('.left-item');
        const connections = [];
        
        leftItems.forEach(item => {
            const leftIndex = parseInt(item.dataset.index);
            
            // Trouver la connexion pour cet élément
            const connection = Array.from(questionEl.querySelectorAll('.connection-line')).find(conn => {
                return conn.dataset.leftIndex === leftIndex.toString();
            });
            
            if (connection) {
                connections.push({
                    left: leftIndex,
                    right: parseInt(connection.dataset.rightIndex)
                });
            }
        });
        
        answer = connections;
    }
    
    // Sauvegarder la réponse
    quizState.answers[quizState.currentQuestion] = {
        questionId,
        answer
    };
}

/**
 * Charge une réponse précédemment sauvegardée
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function loadPreviousAnswer(container, quizState) {
    const questionEl = container.querySelector('.quiz-question');
    
    if (!questionEl || !quizState.answers[quizState.currentQuestion]) {
        return;
    }
    
    const previousAnswer = quizState.answers[quizState.currentQuestion].answer;
    const questionType = questionEl.dataset.type;
    
    if (!previousAnswer) {
        return;
    }
    
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
        const isMultiple = questionEl.dataset.multiple === 'true';
        
        if (isMultiple && Array.isArray(previousAnswer)) {
            // Pour les questions à choix multiples
            previousAnswer.forEach(index => {
                const option = questionEl.querySelector(`.quiz-option[data-index="${index}"]`);
                if (option) {
                    const input = option.querySelector('.quiz-input');
                    if (input) {
                        input.checked = true;
                    }
                }
            });
        } else if (!isMultiple && typeof previousAnswer === 'number') {
            // Pour les questions à choix unique
            const option = questionEl.querySelector(`.quiz-option[data-index="${previousAnswer}"]`);
            if (option) {
                const input = option.querySelector('.quiz-input');
                if (input) {
                    input.checked = true;
                }
            }
        }
    } else if (questionType === 'text-input' && typeof previousAnswer === 'string') {
        // Pour les questions à réponse textuelle
        const textInput = questionEl.querySelector('.quiz-text-input');
        if (textInput) {
            textInput.value = previousAnswer;
        }
    } else if (questionType === 'matching' && Array.isArray(previousAnswer)) {
        // Pour les questions d'association
        // Ceci nécessiterait de redessiner les connexions
        // À implémenter si nécessaire
    }
}

/**
 * Calcule le score final du quiz
 * @param {Object} quizState - État du quiz
 * @returns {Object} Score et statistiques
 */
function calculateScore(quizState) {
    let correctAnswers = 0;
    let totalQuestions = quizState.questions.length;
    let answeredQuestions = 0;
    
    // Vérifier chaque réponse
    quizState.answers.forEach((answerData, index) => {
        if (!answerData || !answerData.answer) {
            return;
        }
        
        answeredQuestions++;
        const question = quizState.questions[index];
        const answer = answerData.answer;
        
        if (question.type === 'multiple-choice') {
            if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
                // Vérifier si les tableaux ont la même longueur et contiennent les mêmes valeurs
                const isCorrect = answer.length === question.correctAnswer.length && 
                                 answer.every(val => question.correctAnswer.includes(val));
                if (isCorrect) {
                    correctAnswers++;
                }
            } else if (!Array.isArray(answer) && !Array.isArray(question.correctAnswer)) {
                // Vérifier si les valeurs sont égales
                if (answer === question.correctAnswer) {
                    correctAnswers++;
                }
            }
        } else if (question.type === 'true-false') {
            if (answer === question.correctAnswer) {
                correctAnswers++;
            }
        } else if (question.type === 'text-input') {
            // Vérifier si la réponse correspond (peut être une regex)
            const correctAnswer = question.correctAnswer;
            
            if (correctAnswer.startsWith('/') && correctAnswer.endsWith('/')) {
                // C'est une regex
                const regex = new RegExp(correctAnswer.slice(1, -1));
                if (regex.test(answer)) {
                    correctAnswers++;
                }
            } else if (question.caseSensitive) {
                // Comparaison sensible à la casse
                if (answer === correctAnswer) {
                    correctAnswers++;
                }
            } else {
                // Comparaison insensible à la casse
                if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
                    correctAnswers++;
                }
            }
        } else if (question.type === 'matching') {
            // Vérifier si toutes les associations sont correctes
            let allCorrect = true;
            
            if (Array.isArray(answer) && answer.length === question.matches.length) {
                answer.forEach(conn => {
                    if (conn.right !== question.matches[conn.left].correctIndex) {
                        allCorrect = false;
                    }
                });
                
                if (allCorrect) {
                    correctAnswers++;
                }
            }
        }
    });
    
    // Calculer le score en pourcentage
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
        correctAnswers,
        totalQuestions,
        answeredQuestions,
        percentage,
        passed: percentage >= quizState.config.progressThreshold * 100
    };
}

/**
 * Affiche les résultats du quiz
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 * @param {Object} score - Score et statistiques
 */
function showResults(container, quizState, score) {
    // Masquer le contenu du quiz
    const quizContent = container.querySelector('.quiz-content');
    const quizFooter = container.querySelector('.quiz-footer');
    const quizResults = container.querySelector('.quiz-results');
    
    if (quizContent) {
        quizContent.style.display = 'none';
    }
    
    if (quizFooter) {
        quizFooter.style.display = 'none';
    }
    
    if (!quizResults) {
        return;
    }
    
    // Générer le contenu des résultats
    const message = score.passed ? quizState.config.successMessage : quizState.config.failureMessage;
    const resultsHtml = `
        <div class="results-header">
            <h2 class="results-title">Résultats du quiz</h2>
            <p class="results-message">${message}</p>
        </div>
        
        <div class="results-score">
            <div class="score-circle ${score.passed ? 'passed' : 'failed'}">
                <span class="score-percentage">${Math.round(score.percentage)}%</span>
            </div>
            <div class="score-details">
                <p>Questions correctes: <strong>${score.correctAnswers} / ${score.totalQuestions}</strong></p>
                <p>Questions répondues: <strong>${score.answeredQuestions} / ${score.totalQuestions}</strong></p>
            </div>
        </div>
        
        ${quizState.config.showResetButton ? `
            <div class="results-actions">
                <button class="btn btn-primary restart-quiz">Recommencer le quiz</button>
                <button class="btn btn-secondary review-answers">Revoir les réponses</button>
            </div>
        ` : ''}
    `;
    
    // Afficher les résultats
    quizResults.innerHTML = resultsHtml;
    quizResults.style.display = 'block';
    
    // Ajouter les écouteurs pour les boutons des résultats
    const restartButton = quizResults.querySelector('.restart-quiz');
    const reviewButton = quizResults.querySelector('.review-answers');
    
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            resetQuiz(container, quizState);
        });
    }
    
    if (reviewButton) {
        reviewButton.addEventListener('click', () => {
            showReview(container, quizState);
        });
    }
}

/**
 * Affiche la revue des réponses
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function showReview(container, quizState) {
    // À implémenter si nécessaire
    console.log('Revue des réponses non implémentée');
}

/**
 * Réinitialise le quiz
 * @param {HTMLElement} container - Conteneur du quiz
 * @param {Object} quizState - État du quiz
 */
function resetQuiz(container, quizState) {
    // Réinitialiser l'état
    quizState.currentQuestion = 0;
    quizState.score = 0;
    quizState.answers = [];
    
    // Régénérer le HTML
    generateQuizHtml(container, quizState);
    
    // Ajouter les écouteurs d'événements
    addQuizEventListeners(container, quizState);
    
    // Afficher la première question
    showQuestion(container, quizState, 0);
}

/**
 * Mélange un tableau de façon aléatoire
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} Tableau mélangé
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Mélange les éléments HTML dans une chaîne
 * @param {string} html - HTML contenant les éléments
 * @returns {string} HTML avec les éléments mélangés
 */
function shuffleHtmlItems(html) {
    // Extraire les éléments
    const items = [];
    let start = 0;
    let itemStart = html.indexOf('<div class="matching-item', start);
    
    while (itemStart !== -1) {
        let itemEnd = html.indexOf('</div>', itemStart);
        itemEnd = html.indexOf('>', itemEnd) + 1;
        
        items.push(html.substring(itemStart, itemEnd));
        start = itemEnd;
        itemStart = html.indexOf('<div class="matching-item', start);
    }
    
    // Mélanger les éléments
    const shuffledItems = shuffleArray(items);
    
    // Reconstruire le HTML
    return shuffledItems.join('');
}

/**
 * Initialise tous les exercices et quizzes de la page
 */
export function initAllExercises() {
    // Initialiser les exercices individuels
    initExercises();
    
    // Initialiser les quizzes
    const quizContainers = document.querySelectorAll('[data-quiz]');
    
    quizContainers.forEach(async container => {
        const quizUrl = container.dataset.quiz;
        
        if (quizUrl) {
            try {
                const response = await fetch(quizUrl);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const quizData = await response.json();
                initQuiz(container.id, quizData);
                
            } catch (error) {
                console.error(`Erreur lors du chargement du quiz ${quizUrl}:`, error);
                container.innerHTML = `
                    <div class="error-content">
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger le quiz. Veuillez réessayer.</p>
                    </div>
                `;
            }
        }
    });
}