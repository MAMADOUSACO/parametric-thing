/**
 * formula-editor.js - Gestion des formules mathématiques et interactions
 * Utilise MathJax pour le rendu des formules mathématiques
 */

/**
 * Initialise les composants mathématiques de la page
 */
export function initMathComponents() {
    console.log('Initialisation des composants mathématiques');
    
    // Vérifier que MathJax est chargé
    if (typeof MathJax === 'undefined') {
        console.error('MathJax n\'est pas chargé.');
        return;
    }
    
    // Configurer MathJax si ce n'est pas déjà fait
    configureMathJax();
    
    // Initialiser les interactions avec les formules
    initFormulaInteractions();
    
    // Initialiser les boutons d'information
    initInfoButtons();
    
    // Initialiser les formules interactives
    initInteractiveFormulas();
    
    // Traiter toutes les formules
    MathJax.typesetPromise().then(() => {
        console.log('Formules mathématiques rendues');
    }).catch((err) => {
        console.error('Erreur lors du rendu des formules mathématiques:', err);
    });
}

/**
 * Configure MathJax si ce n'est pas déjà fait
 */
function configureMathJax() {
    if (window.MathJax && !window.MathJax.configured) {
        window.MathJax = {
            ...window.MathJax,
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true,
                packages: ['base', 'ams', 'noerrors', 'noundefined', 'color', 'boldsymbol']
            },
            svg: {
                fontCache: 'global',
                scale: 1.05
            },
            options: {
                enableMenu: false,
                renderActions: {
                    addMenu: []
                }
            },
            configured: true
        };
        
        console.log('MathJax configuré');
    }
}

/**
 * Initialise les interactions avec les formules mathématiques
 */
function initFormulaInteractions() {
    // Sélectionner toutes les formules cliquables
    const clickableFormulas = document.querySelectorAll('.formula-clickable, .math-block, .math-inline');
    
    clickableFormulas.forEach(formula => {
        // Éviter de réinitialiser les formules déjà initialisées
        if (formula.dataset.initialized === 'true') {
            return;
        }
        
        // Ajouter une classe pour le style au survol
        formula.classList.add('formula-interactive');
        
        // Ajouter l'écouteur d'événement pour le clic
        formula.addEventListener('click', () => {
            openFormulaModal(formula);
        });
        
        // Marquer comme initialisé
        formula.dataset.initialized = 'true';
    });
}

/**
 * Ouvre une fenêtre modale avec la formule agrandie
 * @param {HTMLElement} formula - L'élément contenant la formule
 */
function openFormulaModal(formula) {
    // Récupérer le contenu de la formule
    const formulaContent = formula.cloneNode(true);
    
    // Récupérer la fenêtre modale
    const modal = document.getElementById('formula-modal');
    
    if (!modal) {
        console.error('La fenêtre modale des formules n\'existe pas.');
        return;
    }
    
    // Récupérer le conteneur du contenu de la formule
    const formulaContainer = modal.querySelector('.formula-container');
    
    if (!formulaContainer) {
        console.error('Conteneur de formule non trouvé dans la modale.');
        return;
    }
    
    // Nettoyer le conteneur
    formulaContainer.innerHTML = '';
    
    // Ajouter la formule au conteneur
    formulaContainer.appendChild(formulaContent);
    
    // Si la formule a un titre ou une description, les ajouter
    const title = formula.dataset.title || 'Formule détaillée';
    const description = formula.dataset.description || '';
    
    const titleElement = modal.querySelector('.modal-header h2');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    if (description) {
        const descriptionElement = document.createElement('p');
        descriptionElement.className = 'formula-description';
        descriptionElement.textContent = description;
        formulaContainer.insertBefore(descriptionElement, formulaContainer.firstChild);
    }
    
    // Ajouter des boutons d'action si nécessaire
    if (formula.dataset.actions === 'true') {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'formula-actions';
        
        // Bouton pour copier la formule en LaTeX
        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-secondary btn-sm';
        copyButton.textContent = 'Copier LaTeX';
        copyButton.addEventListener('click', () => {
            const latexCode = formula.dataset.latex || formula.textContent;
            navigator.clipboard.writeText(latexCode).then(() => {
                copyButton.textContent = 'Copié !';
                setTimeout(() => {
                    copyButton.textContent = 'Copier LaTeX';
                }, 2000);
            });
        });
        
        actionsContainer.appendChild(copyButton);
        formulaContainer.appendChild(actionsContainer);
    }
    
    // Afficher la modale
    modal.classList.remove('hidden');
    
    // Retraiter les formules mathématiques dans la modale
    MathJax.typesetPromise([formulaContainer]).catch(err => {
        console.error('Erreur lors du rendu de la formule dans la modale:', err);
    });
    
    // Ajouter un écouteur pour fermer la modale
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.onclick = () => {
            modal.classList.add('hidden');
        };
    }
    
    // Fermer la modale en cliquant en dehors du contenu
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    };
    
    // Fermer la modale avec la touche Echap
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });
}

/**
 * Initialise les boutons d'information pour les formules
 */
function initInfoButtons() {
    // Sélectionner tous les boutons d'info
    const infoButtons = document.querySelectorAll('.info-button');
    
    infoButtons.forEach(button => {
        // Éviter de réinitialiser les boutons déjà initialisés
        if (button.dataset.initialized === 'true') {
            return;
        }
        
        // Récupérer l'identifiant de la formule cible
        const targetId = button.dataset.target;
        if (!targetId) {
            return;
        }
        
        // Trouver l'élément cible
        const target = document.getElementById(targetId);
        if (!target) {
            return;
        }
        
        // Ajouter l'écouteur d'événement pour le clic
        button.addEventListener('click', () => {
            openFormulaModal(target);
        });
        
        // Marquer comme initialisé
        button.dataset.initialized = 'true';
    });
}

/**
 * Initialise les formules mathématiques interactives
 * avec des paramètres ajustables
 */
function initInteractiveFormulas() {
    // Sélectionner toutes les formules interactives
    const interactiveFormulas = document.querySelectorAll('.interactive-formula');
    
    interactiveFormulas.forEach(formula => {
        // Éviter de réinitialiser les formules déjà initialisées
        if (formula.dataset.initialized === 'true') {
            return;
        }
        
        // Récupérer les paramètres de la formule
        const parameters = {};
        const paramElements = formula.querySelectorAll('.formula-param');
        
        // Initialiser les paramètres avec leurs valeurs par défaut
        paramElements.forEach(param => {
            const name = param.dataset.name;
            const defaultValue = parseFloat(param.dataset.default) || 0;
            parameters[name] = defaultValue;
            
            // Initialiser l'affichage du paramètre
            const valueElement = param.querySelector('.param-value');
            if (valueElement) {
                valueElement.textContent = defaultValue;
            }
            
            // Initialiser le slider ou l'entrée numérique
            const input = param.querySelector('input[type="range"], input[type="number"]');
            if (input) {
                input.value = defaultValue;
                
                // Ajouter l'écouteur d'événement pour la mise à jour
                input.addEventListener('input', () => {
                    const value = parseFloat(input.value);
                    parameters[name] = value;
                    
                    // Mettre à jour l'affichage du paramètre
                    if (valueElement) {
                        valueElement.textContent = value;
                    }
                    
                    // Mettre à jour la formule
                    updateFormula(formula, parameters);
                });
            }
        });
        
        // Récupérer l'élément qui contient la formule
        const formulaOutput = formula.querySelector('.formula-output');
        if (!formulaOutput) {
            return;
        }
        
        // Récupérer le modèle de formule
        const template = formula.dataset.template;
        if (!template) {
            return;
        }
        
        // Générer la formule initiale
        updateFormula(formula, parameters);
        
        // Marquer comme initialisé
        formula.dataset.initialized = 'true';
    });
}

/**
 * Met à jour une formule interactive avec de nouveaux paramètres
 * @param {HTMLElement} formula - L'élément contenant la formule
 * @param {Object} parameters - Les paramètres à utiliser
 */
function updateFormula(formula, parameters) {
    // Récupérer l'élément qui contient la formule
    const formulaOutput = formula.querySelector('.formula-output');
    if (!formulaOutput) {
        return;
    }
    
    // Récupérer le modèle de formule
    const template = formula.dataset.template;
    if (!template) {
        return;
    }
    
    // Remplacer les paramètres dans le modèle
    let latex = template;
    for (const [name, value] of Object.entries(parameters)) {
        const placeholder = `{${name}}`;
        latex = latex.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // Mettre à jour le contenu de l'élément
    formulaOutput.textContent = latex;
    
    // Retraiter la formule mathématique
    MathJax.typesetPromise([formulaOutput]).catch(err => {
        console.error('Erreur lors de la mise à jour de la formule:', err);
    });
}

/**
 * Initialise les visualisations des formules avec D3.js
 */
function initFormulaVisualizations() {
    // Sélectionner toutes les visualisations de formules
    const formulaVisualizations = document.querySelectorAll('.formula-visualization');
    
    formulaVisualizations.forEach(visualization => {
        // Éviter de réinitialiser les visualisations déjà initialisées
        if (visualization.dataset.initialized === 'true') {
            return;
        }
        
        // Récupérer le type de visualisation
        const type = visualization.dataset.type || 'function';
        
        // Initialiser la visualisation selon son type
        if (type === 'function') {
            initFunctionVisualization(visualization);
        } else if (type === 'vector') {
            initVectorVisualization(visualization);
        } else if (type === 'parametric') {
            initParametricVisualization(visualization);
        }
        
        // Marquer comme initialisé
        visualization.dataset.initialized = 'true';
    });
}

/**
 * Initialise une visualisation de fonction avec D3.js
 * @param {HTMLElement} container - Conteneur de la visualisation
 */
function initFunctionVisualization(container) {
    // Cette fonction serait à développer avec D3.js pour 
    // visualiser des fonctions mathématiques
    console.log('Visualisation de fonction non implémentée');
}

/**
 * Initialise une visualisation de vecteur avec D3.js
 * @param {HTMLElement} container - Conteneur de la visualisation
 */
function initVectorVisualization(container) {
    // Cette fonction serait à développer avec D3.js pour 
    // visualiser des vecteurs
    console.log('Visualisation de vecteur non implémentée');
}

/**
 * Initialise une visualisation paramétrique avec D3.js
 * @param {HTMLElement} container - Conteneur de la visualisation
 */
function initParametricVisualization(container) {
    // Cette fonction utiliserait le module interactive-graph.js
    // pour visualiser des courbes paramétriques
    console.log('Visualisation paramétrique à développer avec interactive-graph.js');
}

/**
 * Convertit une formule LaTex en MathML
 * @param {string} latex - Formule en format LaTeX
 * @returns {Promise<string>} Formule en format MathML
 */
export async function latexToMathML(latex) {
    // Cette fonction nécessiterait une bibliothèque supplémentaire
    // ou une API pour convertir LaTeX en MathML
    console.log('Conversion LaTeX vers MathML non implémentée');
    return "";
}

/**
 * Convertit une formule MathML en LaTeX
 * @param {string} mathml - Formule en format MathML
 * @returns {Promise<string>} Formule en format LaTeX
 */
export async function mathMLToLatex(mathml) {
    // Cette fonction nécessiterait une bibliothèque supplémentaire
    // ou une API pour convertir MathML en LaTeX
    console.log('Conversion MathML vers LaTeX non implémentée');
    return "";
}

/**
 * Génère un rendu visuel d'une formule LaTeX
 * @param {string} latex - Formule en format LaTeX
 * @returns {Promise<string>} URL de l'image générée (SVG ou PNG)
 */
export async function renderLatexFormula(latex) {
    // Cette fonction nécessiterait MathJax pour générer un SVG
    // à partir d'une formule LaTeX
    console.log('Rendu de formule non implémenté');
    return "";
}

// Exposer les fonctions qui pourraient être utilisées ailleurs
export {
    initFormulaVisualizations,
    updateFormula,
    openFormulaModal
};