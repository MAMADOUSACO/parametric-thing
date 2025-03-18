/**
 * main.js - Script principal pour le site Équations Paramétriques
 * Initialise l'application et charge les modules nécessaires
 */

// Importation des modules nécessaires
import { initRouter } from './router.js';
import { initThemeManager } from './theme-manager.js';
import { initProgressTracker } from './progress-tracker.js';
import { initNavigation } from './navigation.js';
import { initMathComponents } from './components/formula-editor.js';
import { initSearch } from './search.js';

// Initialiser MathJax avec la configuration adaptée
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
    },
    svg: {
        fontCache: 'global'
    },
    options: {
        enableMenu: false,
        renderActions: {
            addMenu: []
        }
    }
};

// Configuration des visualisations D3.js
const D3Config = {
    axisColor: getComputedStyle(document.documentElement).getPropertyValue('--axis-color').trim(),
    gridColor: getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color').trim(),
    primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
    secondaryColor: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim(),
    accentColor: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
    parameterColor: getComputedStyle(document.documentElement).getPropertyValue('--color-parameter-t').trim(),
    coordinateXColor: getComputedStyle(document.documentElement).getPropertyValue('--color-coordinate-x').trim(),
    coordinateYColor: getComputedStyle(document.documentElement).getPropertyValue('--color-coordinate-y').trim(),
    coordinateZColor: getComputedStyle(document.documentElement).getPropertyValue('--color-coordinate-z').trim()
};

// Configuration des sons de l'interface
const soundConfig = {
    click: {
        src: ['assets/audio/ui-sounds/click.mp3'],
        volume: 0.5
    },
    success: {
        src: ['assets/audio/ui-sounds/success.mp3'],
        volume: 0.5
    },
    error: {
        src: ['assets/audio/ui-sounds/error.mp3'],
        volume: 0.5
    },
    notification: {
        src: ['assets/audio/ui-sounds/notification.mp3'],
        volume: 0.5
    }
};

// Initialisation de tous les modules
async function initApp() {
    try {
        console.log('Initialisation de l\'application Équations Paramétriques');
        
        // Chargement de la structure des cours à partir du fichier JSON
        const coursesData = await fetchCoursesStructure();
        
        // Initialisation du gestionnaire de thèmes
        initThemeManager();
        
        // Initialisation du routeur pour la navigation SPA
        initRouter(coursesData);
        
        // Initialisation du tracker de progression
        initProgressTracker();
        
        // Initialisation de la navigation
        initNavigation(coursesData);
        
        // Initialisation des composants mathématiques
        initMathComponents();
        
        // Initialisation de la recherche
        initSearch(coursesData);
        
        // Configuration des sons de l'interface
        setupSounds();
        
        // Configurer les événements du panneau de personnalisation
        setupCustomizationPanel();
        
        // Masquer l'overlay de chargement
        hideLoadingOverlay();
        
        console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        displayErrorMessage('Une erreur s\'est produite lors du chargement du site. Veuillez rafraîchir la page.');
    }
}

// Fonction pour récupérer la structure des cours
async function fetchCoursesStructure() {
    try {
        const response = await fetch('data/courses-structure.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement de la structure des cours:', error);
        throw error;
    }
}

// Configuration des sons de l'interface
function setupSounds() {
    window.UISounds = {};
    
    Object.keys(soundConfig).forEach(sound => {
        window.UISounds[sound] = new Howl(soundConfig[sound]);
    });
    
    // Fonction pour jouer un son
    window.playSound = (soundName) => {
        const sound = window.UISounds[soundName];
        if (sound && !document.body.classList.contains('sounds-disabled')) {
            sound.play();
        }
    };
}

// Configuration du panneau de personnalisation
function setupCustomizationPanel() {
    const settingsButton = document.getElementById('settings-button');
    const closeCustomization = document.getElementById('close-customization');
    const customizationPanel = document.getElementById('customization-panel');
    const themeOptions = document.querySelectorAll('.theme-option');
    const textSizeSlider = document.getElementById('text-size-slider');
    const contrastSlider = document.getElementById('contrast-slider');
    const decreaseTextBtn = document.getElementById('decrease-text');
    const increaseTextBtn = document.getElementById('increase-text');
    const animationToggle = document.getElementById('animation-toggle');
    
    // Ouvrir le panneau de personnalisation
    settingsButton.addEventListener('click', () => {
        customizationPanel.classList.remove('hidden');
        playSound('click');
        
        // Animation d'ouverture
        setTimeout(() => {
            customizationPanel.querySelector('.modal-content').classList.add('zoom-in');
        }, 10);
    });
    
    // Fermer le panneau de personnalisation
    closeCustomization.addEventListener('click', () => {
        customizationPanel.querySelector('.modal-content').classList.remove('zoom-in');
        customizationPanel.querySelector('.modal-content').classList.add('zoom-out');
        
        playSound('click');
        
        setTimeout(() => {
            customizationPanel.classList.add('hidden');
            customizationPanel.querySelector('.modal-content').classList.remove('zoom-out');
        }, 300);
    });
    
    // Changer de thème
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            document.querySelector('html').setAttribute('data-theme', theme);
            
            // Mettre à jour le fichier CSS du thème
            const themeStylesheet = document.getElementById('theme-stylesheet');
            themeStylesheet.href = `css/themes/${theme}.css`;
            
            // Enregistrer la préférence
            localStorage.setItem('theme-preference', theme);
            
            // Mettre à jour l'aspect visuel des boutons
            themeOptions.forEach(btn => btn.classList.remove('active'));
            option.classList.add('active');
            
            playSound('click');
        });
    });
    
    // Changer la taille du texte
    textSizeSlider.addEventListener('input', () => {
        const value = textSizeSlider.value;
        document.documentElement.style.setProperty('--text-size-factor', `${value}%`);
        localStorage.setItem('text-size', value);
    });
    
    decreaseTextBtn.addEventListener('click', () => {
        const currentValue = parseInt(textSizeSlider.value);
        const newValue = Math.max(currentValue - 5, 80);
        textSizeSlider.value = newValue;
        document.documentElement.style.setProperty('--text-size-factor', `${newValue}%`);
        localStorage.setItem('text-size', newValue);
        playSound('click');
    });
    
    increaseTextBtn.addEventListener('click', () => {
        const currentValue = parseInt(textSizeSlider.value);
        const newValue = Math.min(currentValue + 5, 120);
        textSizeSlider.value = newValue;
        document.documentElement.style.setProperty('--text-size-factor', `${newValue}%`);
        localStorage.setItem('text-size', newValue);
        playSound('click');
    });
    
    // Changer le contraste
    contrastSlider.addEventListener('input', () => {
        const value = contrastSlider.value;
        document.documentElement.style.setProperty('--contrast-factor', `${value}%`);
        localStorage.setItem('contrast', value);
    });
    
    // Activer/désactiver les animations
    animationToggle.addEventListener('change', () => {
        if (animationToggle.checked) {
            document.body.classList.remove('animations-disabled');
            localStorage.setItem('animations', 'enabled');
        } else {
            document.body.classList.add('animations-disabled');
            localStorage.setItem('animations', 'disabled');
        }
        playSound('click');
    });
    
    // Charger les préférences enregistrées
    loadUserPreferences();
}

// Charger les préférences utilisateur
function loadUserPreferences() {
    // Thème
    const savedTheme = localStorage.getItem('theme-preference') || 'light';
    document.querySelector('html').setAttribute('data-theme', savedTheme);
    document.getElementById('theme-stylesheet').href = `css/themes/${savedTheme}.css`;
    document.querySelector(`.theme-option[data-theme="${savedTheme}"]`)?.classList.add('active');
    
    // Taille du texte
    const savedTextSize = localStorage.getItem('text-size') || '100';
    document.getElementById('text-size-slider').value = savedTextSize;
    document.documentElement.style.setProperty('--text-size-factor', `${savedTextSize}%`);
    
    // Contraste
    const savedContrast = localStorage.getItem('contrast') || '100';
    document.getElementById('contrast-slider').value = savedContrast;
    document.documentElement.style.setProperty('--contrast-factor', `${savedContrast}%`);
    
    // Animations
    const savedAnimations = localStorage.getItem('animations') || 'enabled';
    document.getElementById('animation-toggle').checked = savedAnimations === 'enabled';
    if (savedAnimations === 'disabled') {
        document.body.classList.add('animations-disabled');
    }
}

// Masquer l'overlay de chargement avec une animation
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 500);
}

// Afficher un message d'erreur
function displayErrorMessage(message) {
    const contentPlaceholder = document.getElementById('content-placeholder');
    
    contentPlaceholder.innerHTML = `
        <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2>Oups, une erreur s'est produite</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Réessayer</button>
        </div>
    `;
    
    // Masquer l'overlay de chargement
    hideLoadingOverlay();
}

// Attendre que le DOM soit complètement chargé avant d'initialiser l'application
document.addEventListener('DOMContentLoaded', initApp);

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    // Ne pas afficher de message pour les erreurs mineures ou provenant de bibliothèques externes
    if (event.error && event.error.message && !event.filename.includes('cdn')) {
        displayErrorMessage('Une erreur s\'est produite. Détails techniques: ' + event.error.message);
    }
});