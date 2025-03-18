/**
 * interactive-graph.js - Composant de visualisation interactive pour les équations paramétriques
 * Utilise D3.js pour créer des graphiques interactifs
 */

// Configuration par défaut pour les graphiques
const DEFAULT_CONFIG = {
    width: 500,
    height: 400,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    xDomain: [-10, 10],
    yDomain: [-10, 10],
    gridStep: 1,
    axisColor: '#666',
    gridColor: '#ddd',
    curveColor: '#0066cc',
    pointColor: '#ff6b00',
    animationDuration: 1000,
    tRange: [0, 2 * Math.PI],
    tSteps: 200,
    showPoint: true,
    showPath: true,
    showTangent: false,
    showCoordinates: true,
    showControls: true,
    showGrid: true,
    responsive: true
};

// Collection des instances de graphiques
const graphs = new Map();

/**
 * Initialise un graphique paramétrique
 * @param {string} containerId - ID du conteneur HTML
 * @param {Object} options - Options de configuration
 * @returns {Object} Instance du graphique
 */
export function initParametricGraph(containerId, options = {}) {
    console.log(`Initialisation du graphique paramétrique dans #${containerId}`);
    
    // Fusionner les options avec la configuration par défaut
    const config = { ...DEFAULT_CONFIG, ...options };
    
    // Récupérer le conteneur
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Conteneur #${containerId} non trouvé`);
        return null;
    }
    
    // Créer l'instance du graphique
    const graph = createGraph(container, config);
    
    // Enregistrer l'instance
    graphs.set(containerId, graph);
    
    // Renvoyer l'instance
    return graph;
}

/**
 * Crée un graphique paramétrique
 * @param {HTMLElement} container - Conteneur HTML
 * @param {Object} config - Configuration
 * @returns {Object} Instance du graphique
 */
function createGraph(container, config) {
    // Dimensions utiles
    const width = config.width - config.margin.left - config.margin.right;
    const height = config.height - config.margin.top - config.margin.bottom;
    
    // Fonctions paramétriques par défaut
    let xFunction = (t) => 5 * Math.cos(t);
    let yFunction = (t) => 5 * Math.sin(t);
    
    // État actuel du graphique
    const state = {
        t: config.tRange[0],
        equation: { x: 'cos(t)', y: 'sin(t)' },
        paused: true,
        xFunction,
        yFunction,
        data: [],
        config
    };
    
    // Supprimer tout contenu existant
    container.innerHTML = '';
    
    // Créer le SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('class', 'parametric-svg');
    
    // Créer le groupe principal avec marge
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    // Créer les échelles
    const xScale = d3.scaleLinear()
        .domain(config.xDomain)
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain(config.yDomain)
        .range([height, 0]);
    
    // Créer les axes
    if (config.showGrid) {
        // Grille horizontale
        g.append('g')
            .attr('class', 'grid-lines')
            .selectAll('line.grid-line-horizontal')
            .data(d3.range(config.xDomain[0], config.xDomain[1] + config.gridStep, config.gridStep))
            .enter()
            .append('line')
            .attr('class', 'grid-line-horizontal')
            .attr('x1', d => xScale(config.xDomain[0]))
            .attr('x2', d => xScale(config.xDomain[1]))
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .style('stroke', config.gridColor)
            .style('stroke-width', d => d === 0 ? 2 : 1) // Axe X plus épais
            .style('stroke-opacity', d => d === 0 ? 0.8 : 0.3); // Axe X plus opaque
        
        // Grille verticale
        g.append('g')
            .attr('class', 'grid-lines')
            .selectAll('line.grid-line-vertical')
            .data(d3.range(config.yDomain[0], config.yDomain[1] + config.gridStep, config.gridStep))
            .enter()
            .append('line')
            .attr('class', 'grid-line-vertical')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', d => yScale(config.yDomain[0]))
            .attr('y2', d => yScale(config.yDomain[1]))
            .style('stroke', config.gridColor)
            .style('stroke-width', d => d === 0 ? 2 : 1) // Axe Y plus épais
            .style('stroke-opacity', d => d === 0 ? 0.8 : 0.3); // Axe Y plus opaque
    }
    
    // Axe X
    const xAxis = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${yScale(0)})`)
        .call(d3.axisBottom(xScale));
    
    // Axe Y
    const yAxis = g.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${xScale(0)},0)`)
        .call(d3.axisLeft(yScale));
    
    // Étiquette de l'axe X
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .style('text-anchor', 'middle')
        .text('x');
    
    // Étiquette de l'axe Y
    g.append('text')
        .attr('class', 'y-axis-label')
        .attr('x', -30)
        .attr('y', height / 2)
        .attr('transform', `rotate(-90,${-30},${height / 2})`)
        .style('text-anchor', 'middle')
        .text('y');
    
    // Ligne pour la courbe paramétrique
    const path = g.append('path')
        .attr('class', 'parametric-path')
        .style('fill', 'none')
        .style('stroke', config.curveColor)
        .style('stroke-width', 2);
    
    // Point mobile sur la courbe
    const point = g.append('circle')
        .attr('class', 'parametric-point')
        .attr('r', 6)
        .style('fill', config.pointColor)
        .style('display', config.showPoint ? 'block' : 'none');
    
    // Ligne pour la tangente
    const tangent = g.append('line')
        .attr('class', 'tangent-line')
        .style('stroke', config.pointColor)
        .style('stroke-width', 1.5)
        .style('stroke-dasharray', '4 2')
        .style('display', config.showTangent ? 'block' : 'none');
    
    // Étiquette de coordonnées
    const coordinates = g.append('text')
        .attr('class', 'coordinates-label')
        .style('font-size', '12px')
        .style('display', config.showCoordinates ? 'block' : 'none');
    
    // Groupe pour les contrôles (créé en dehors du SVG)
    let controlsContainer = null;
    
    if (config.showControls) {
        // Créer le conteneur de contrôles
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'parametric-controls';
        controlsContainer.style.marginTop = '10px';
        container.appendChild(controlsContainer);
        
        // Ajouter les contrôles
        createControls(controlsContainer, state, updateGraph);
    }
    
    // Générer les données initiales
    updateFunctions(state.equation.x, state.equation.y);
    
    // Mettre à jour le chemin avec les données
    updatePath();
    
    // Animation
    let animationId = null;
    
    function animate() {
        if (state.paused) return;
        
        // Incrémenter t
        state.t += 0.02;
        
        // Boucler si nécessaire
        if (state.t > config.tRange[1]) {
            state.t = config.tRange[0];
        }
        
        // Mettre à jour le point
        updatePoint();
        
        // Continuer l'animation
        animationId = requestAnimationFrame(animate);
    }
    
    // Démarrer/arrêter l'animation
    function toggleAnimation() {
        state.paused = !state.paused;
        
        if (!state.paused) {
            animate();
        } else if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        // Mettre à jour le bouton dans les contrôles
        if (controlsContainer) {
            const playButton = controlsContainer.querySelector('.play-pause-btn');
            if (playButton) {
                playButton.textContent = state.paused ? '▶ Lecture' : '⏸ Pause';
            }
        }
    }
    
    // Mettre à jour les fonctions paramétriques
    function updateFunctions(xExpr, yExpr) {
        try {
            // Sauvegarder les expressions
            state.equation.x = xExpr;
            state.equation.y = yExpr;
            
            // Convertir les expressions en fonctions
            state.xFunction = createParametricFunction(xExpr);
            state.yFunction = createParametricFunction(yExpr);
            
            // Générer les nouvelles données
            generateData();
            
            // Mettre à jour le graphique
            updateGraph();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des fonctions:', error);
            return false;
        }
    }
    
    // Mettre à jour le chemin
    function updatePath() {
        // Créer le générateur de ligne
        const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));
        
        // Mettre à jour le chemin
        path.datum(state.data)
            .attr('d', line)
            .style('display', config.showPath ? 'block' : 'none');
    }
    
    // Mettre à jour le point
    function updatePoint() {
        // Calculer les coordonnées
        const x = state.xFunction(state.t);
        const y = state.yFunction(state.t);
        
        // Mettre à jour la position du point
        point
            .attr('cx', xScale(x))
            .attr('cy', yScale(y));
        
        // Mettre à jour les coordonnées affichées
        if (config.showCoordinates) {
            coordinates
                .attr('x', xScale(x) + 10)
                .attr('y', yScale(y) - 10)
                .text(`(${x.toFixed(2)}, ${y.toFixed(2)})`);
        }
        
        // Mettre à jour la tangente si nécessaire
        if (config.showTangent) {
            // Calculer la dérivée (approximation numérique)
            const dt = 0.001;
            const x2 = state.xFunction(state.t + dt);
            const y2 = state.yFunction(state.t + dt);
            const dx = (x2 - x) / dt;
            const dy = (y2 - y) / dt;
            
            // Normaliser la longueur
            const length = 2;
            const norm = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / norm * length;
            const ny = dy / norm * length;
            
            // Mettre à jour la tangente
            tangent
                .attr('x1', xScale(x - nx))
                .attr('y1', yScale(y - ny))
                .attr('x2', xScale(x + nx))
                .attr('y2', yScale(y + ny));
        }
    }
    
    // Générer les données pour le chemin
    function generateData() {
        // Réinitialiser les données
        state.data = [];
        
        // Nombre de points
        const n = config.tSteps;
        
        // Intervalle
        const [tMin, tMax] = config.tRange;
        const tStep = (tMax - tMin) / n;
        
        // Générer les points
        for (let i = 0; i <= n; i++) {
            const t = tMin + i * tStep;
            const x = state.xFunction(t);
            const y = state.yFunction(t);
            
            // Vérifier que les valeurs sont valides
            if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
                state.data.push({ t, x, y });
            }
        }
    }
    
    // Mettre à jour le graphique
    function updateGraph() {
        updatePath();
        updatePoint();
    }
    
    // Si responsive, ajouter un écouteur de redimensionnement
    if (config.responsive) {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === container) {
                    // Récupérer la nouvelle largeur du conteneur
                    const containerWidth = entry.contentRect.width;
                    
                    // Calculer les nouvelles dimensions
                    const newWidth = containerWidth;
                    const newHeight = containerWidth * (config.height / config.width);
                    
                    // Mettre à jour les dimensions du SVG
                    svg.attr('width', newWidth)
                       .attr('height', newHeight);
                    
                    // Mettre à jour les échelles
                    xScale.range([0, newWidth - config.margin.left - config.margin.right]);
                    yScale.range([newHeight - config.margin.top - config.margin.bottom, 0]);
                    
                    // Mettre à jour les axes
                    g.select('.x-axis').call(d3.axisBottom(xScale));
                    g.select('.y-axis').call(d3.axisLeft(yScale));
                    
                    // Mettre à jour la position de l'étiquette X
                    g.select('.x-axis-label')
                        .attr('x', (newWidth - config.margin.left - config.margin.right) / 2)
                        .attr('y', newHeight - config.margin.top - config.margin.bottom + 35);
                    
                    // Mettre à jour la position de l'étiquette Y
                    g.select('.y-axis-label')
                        .attr('y', (newHeight - config.margin.top - config.margin.bottom) / 2);
                    
                    // Mettre à jour le graphique
                    updateGraph();
                }
            }
        });
        
        // Observer le conteneur
        resizeObserver.observe(container);
    }
    
    // Renvoi de l'API publique
    return {
        toggleAnimation,
        updateFunctions,
        setParameter: (t) => {
            state.t = t;
            updatePoint();
        },
        setEquation: (xExpr, yExpr) => updateFunctions(xExpr, yExpr),
        getState: () => ({ ...state }),
        reset: () => {
            state.t = config.tRange[0];
            state.paused = true;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            updatePoint();
        },
        destroy: () => {
            // Nettoyer
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            container.innerHTML = '';
            graphs.delete(container.id);
        }
    };
}

/**
 * Crée les contrôles pour le graphique
 * @param {HTMLElement} container - Conteneur pour les contrôles
 * @param {Object} state - État du graphique
 * @param {Function} updateGraph - Fonction de mise à jour
 */
function createControls(container, state, updateGraph) {
    // Créer le HTML des contrôles
    container.innerHTML = `
        <div class="parametric-controls-container">
            <div class="parametric-equations">
                <div class="equation-row">
                    <label>x(t) = </label>
                    <input type="text" class="equation-input x-equation" value="${state.equation.x}">
                </div>
                <div class="equation-row">
                    <label>y(t) = </label>
                    <input type="text" class="equation-input y-equation" value="${state.equation.y}">
                </div>
                <button class="update-equation-btn btn btn-primary btn-sm">Mettre à jour</button>
            </div>
            <div class="parametric-controls-row">
                <button class="play-pause-btn btn btn-secondary btn-sm">▶ Lecture</button>
                <input type="range" class="t-slider" min="${state.config.tRange[0]}" max="${state.config.tRange[1]}" step="0.01" value="${state.t}">
                <span class="t-value">t = ${state.t.toFixed(2)}</span>
            </div>
            <div class="parametric-controls-row visualization-options">
                <label><input type="checkbox" class="show-path" ${state.config.showPath ? 'checked' : ''}> Courbe</label>
                <label><input type="checkbox" class="show-point" ${state.config.showPoint ? 'checked' : ''}> Point</label>
                <label><input type="checkbox" class="show-tangent" ${state.config.showTangent ? 'checked' : ''}> Tangente</label>
                <label><input type="checkbox" class="show-coordinates" ${state.config.showCoordinates ? 'checked' : ''}> Coordonnées</label>
            </div>
        </div>
    `;
    
    // Appliquer des styles
    const style = document.createElement('style');
    style.textContent = `
        .parametric-controls-container {
            padding: 10px;
            background-color: var(--color-surface-variant);
            border-radius: var(--border-radius-md);
            font-size: 14px;
        }
        .parametric-equations {
            margin-bottom: 10px;
        }
        .equation-row {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .equation-row label {
            font-family: var(--font-mono);
            margin-right: 5px;
            font-weight: 500;
        }
        .equation-input {
            flex: 1;
            font-family: var(--font-mono);
            padding: 4px 8px;
        }
        .parametric-controls-row {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }
        .t-slider {
            flex: 1;
            margin: 0 10px;
        }
        .t-value {
            font-family: var(--font-mono);
            min-width: 60px;
        }
        .visualization-options {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        .visualization-options label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .visualization-options input {
            margin-right: 5px;
        }
    `;
    container.appendChild(style);
    
    // Récupérer les éléments
    const xEquationInput = container.querySelector('.x-equation');
    const yEquationInput = container.querySelector('.y-equation');
    const updateButton = container.querySelector('.update-equation-btn');
    const playPauseButton = container.querySelector('.play-pause-btn');
    const tSlider = container.querySelector('.t-slider');
    const tValue = container.querySelector('.t-value');
    const showPathCheckbox = container.querySelector('.show-path');
    const showPointCheckbox = container.querySelector('.show-point');
    const showTangentCheckbox = container.querySelector('.show-tangent');
    const showCoordinatesCheckbox = container.querySelector('.show-coordinates');
    
    // Ajouter les écouteurs d'événements
    updateButton.addEventListener('click', () => {
        const xExpr = xEquationInput.value.trim();
        const yExpr = yEquationInput.value.trim();
        if (xExpr && yExpr) {
            state.updateFunctions(xExpr, yExpr);
        }
    });
    
    // Permettre la mise à jour en appuyant sur Enter
    xEquationInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            updateButton.click();
        }
    });
    
    yEquationInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            updateButton.click();
        }
    });
    
    // Lecture/Pause
    playPauseButton.addEventListener('click', () => {
        state.toggleAnimation();
    });
    
    // Slider pour t
    tSlider.addEventListener('input', () => {
        state.t = parseFloat(tSlider.value);
        tValue.textContent = `t = ${state.t.toFixed(2)}`;
        state.updatePoint();
    });
    
    // Options de visualisation
    showPathCheckbox.addEventListener('change', () => {
        state.config.showPath = showPathCheckbox.checked;
        updateGraph();
    });
    
    showPointCheckbox.addEventListener('change', () => {
        state.config.showPoint = showPointCheckbox.checked;
        updateGraph();
    });
    
    showTangentCheckbox.addEventListener('change', () => {
        state.config.showTangent = showTangentCheckbox.checked;
        updateGraph();
    });
    
    showCoordinatesCheckbox.addEventListener('change', () => {
        state.config.showCoordinates = showCoordinatesCheckbox.checked;
        updateGraph();
    });
}

/**
 * Crée une fonction paramétrique à partir d'une expression
 * @param {string} expr - Expression mathématique avec t comme variable
 * @returns {Function} Fonction paramétrique
 */
function createParametricFunction(expr) {
    // Remplacer les fonctions mathématiques par leurs équivalents JavaScript
    const jsExpr = expr
        .replace(/sin\s*\(/g, 'Math.sin(')
        .replace(/cos\s*\(/g, 'Math.cos(')
        .replace(/tan\s*\(/g, 'Math.tan(')
        .replace(/sqrt\s*\(/g, 'Math.sqrt(')
        .replace(/abs\s*\(/g, 'Math.abs(')
        .replace(/exp\s*\(/g, 'Math.exp(')
        .replace(/log\s*\(/g, 'Math.log(')
        .replace(/pow\s*\(/g, 'Math.pow(')
        .replace(/PI/g, 'Math.PI')
        .replace(/E/g, 'Math.E');
    
    try {
        // Créer une fonction en utilisant un constructeur de fonction
        return new Function('t', `return ${jsExpr};`);
    } catch (error) {
        console.error('Erreur lors de la création de la fonction:', error);
        // Renvoyer une fonction par défaut en cas d'erreur
        return (t) => 0;
    }
}

/**
 * Obtient une instance de graphique existante
 * @param {string} containerId - ID du conteneur HTML
 * @returns {Object|null} Instance du graphique
 */
export function getGraph(containerId) {
    return graphs.get(containerId) || null;
}

/**
 * Détruit une instance de graphique existante
 * @param {string} containerId - ID du conteneur HTML
 */
export function destroyGraph(containerId) {
    const graph = graphs.get(containerId);
    
    if (graph) {
        graph.destroy();
        graphs.delete(containerId);
    }
}

/**
 * Crée un graphique paramétrique pour une animation d'arrière-plan
 * @param {string} containerId - ID du conteneur HTML
 * @param {Object} options - Options de configuration
 * @returns {Object} Instance du graphique
 */
export function createBackgroundAnimation(containerId, options = {}) {
    const defaultOptions = {
        width: 800,
        height: 600,
        xDomain: [-12, 12],
        yDomain: [-12, 12],
        gridStep: 2,
        showGrid: false,
        showControls: false,
        showPoint: false,
        showPath: true,
        showCoordinates: false,
        curveColor: 'rgba(255, 255, 255, 0.3)',
        tSteps: 300,
        responsive: true
    };
    
    // Fusionner les options
    const config = { ...defaultOptions, ...options };
    
    // Initialiser le graphique
    const graph = initParametricGraph(containerId, config);
    
    if (graph) {
        // Définir des équations plus complexes pour l'arrière-plan
        graph.setEquation(
            '8 * Math.sin(t) * Math.cos(t)',
            '8 * Math.sin(t * 2)'
        );
        
        // Démarrer l'animation
        graph.toggleAnimation();
    }
    
    return graph;
}

/**
 * Initialise un démonstrateur simple pour la page d'accueil
 * @param {string} containerId - ID du conteneur HTML
 * @returns {Object} Instance du graphique
 */
export function initHomeDemonstration(containerId) {
    const options = {
        width: 500,
        height: 400,
        xDomain: [-6, 6],
        yDomain: [-6, 6],
        gridStep: 1,
        curveColor: '#7b68ee',
        pointColor: '#ff9e00',
        showTangent: true,
        responsive: true
    };
    
    // Initialiser le graphique
    const graph = initParametricGraph(containerId, options);
    
    if (graph) {
        // Définir des équations intéressantes
        graph.setEquation(
            '3 * Math.sin(2 * t)',
            '3 * Math.sin(3 * t)'
        );
        
        // Démarrer l'animation
        graph.toggleAnimation();
    }
    
    return graph;
}

/**
 * Initialise tous les graphiques paramétriques de la page
 */
export function initAllGraphs() {
    // Récupérer tous les conteneurs de graphiques
    const containers = document.querySelectorAll('.parametric-graph');
    
    containers.forEach(container => {
        // Récupérer les options depuis les attributs data-*
        const options = {
            width: parseInt(container.dataset.width || 500),
            height: parseInt(container.dataset.height || 400),
            xDomain: parseJsonArray(container.dataset.xDomain || '[-10, 10]'),
            yDomain: parseJsonArray(container.dataset.yDomain || '[-10, 10]'),
            tRange: parseJsonArray(container.dataset.tRange || '[0, 2 * Math.PI]'),
            showControls: container.dataset.showControls !== 'false',
            responsive: container.dataset.responsive !== 'false'
        };
        
        // Initialiser le graphique
        const graph = initParametricGraph(container.id, options);
        
        // Définir les équations si spécifiées
        if (container.dataset.xEquation && container.dataset.yEquation) {
            graph.setEquation(
                container.dataset.xEquation,
                container.dataset.yEquation
            );
        }
        
        // Démarrer l'animation si spécifié
        if (container.dataset.autoplay === 'true') {
            graph.toggleAnimation();
        }
    });
}

/**
 * Parse un tableau JSON à partir d'une chaîne
 * @param {string} str - Chaîne JSON
 * @returns {Array} Tableau parsé
 */
function parseJsonArray(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('Erreur lors du parsing JSON:', error);
        return null;
    }
}