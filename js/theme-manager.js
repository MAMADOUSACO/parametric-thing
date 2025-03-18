/**
 * theme-manager.js - Gestionnaire de thèmes pour le site Équations Paramétriques
 * Permet de changer l'apparence du site et de sauvegarder les préférences
 */

// Thèmes disponibles
const AVAILABLE_THEMES = ['light', 'dark', 'blackboard', 'grid'];

// Thème par défaut
const DEFAULT_THEME = 'light';

// Préférences utilisateur
let userPreferences = {
    theme: DEFAULT_THEME,
    fontSize: 100,
    contrast: 100,
    animations: true
};

/**
 * Initialise le gestionnaire de thèmes
 */
export function initThemeManager() {
    console.log('Initialisation du gestionnaire de thèmes');
    
    // Charger les préférences utilisateur depuis le localStorage
    loadPreferences();
    
    // Appliquer les préférences
    applyTheme(userPreferences.theme);
    applyFontSize(userPreferences.fontSize);
    applyContrast(userPreferences.contrast);
    applyAnimationSettings(userPreferences.animations);
    
    // Initialiser les contrôles de thème
    initThemeControls();
    
    // Ajouter un écouteur pour le mode sombre du système
    initSystemThemeListener();
}

/**
 * Charge les préférences utilisateur depuis le localStorage
 */
function loadPreferences() {
    try {
        // Tenter de récupérer les préférences du localStorage
        const storedPrefs = localStorage.getItem('user-preferences');
        
        if (storedPrefs) {
            const parsedPrefs = JSON.parse(storedPrefs);
            
            // Fusionner avec les valeurs par défaut (pour les nouvelles propriétés)
            userPreferences = { ...userPreferences, ...parsedPrefs };
            
            console.log('Préférences utilisateur chargées:', userPreferences);
        } else {
            console.log('Aucune préférence utilisateur enregistrée, utilisation des valeurs par défaut');
            
            // Détecter et appliquer le thème du système si aucune préférence
            detectSystemTheme();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
    }
}

/**
 * Sauvegarde les préférences utilisateur dans le localStorage
 */
function savePreferences() {
    try {
        localStorage.setItem('user-preferences', JSON.stringify(userPreferences));
        console.log('Préférences utilisateur sauvegardées');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
}

/**
 * Applique le thème spécifié
 * @param {string} theme - Nom du thème à appliquer
 */
function applyTheme(theme) {
    // Vérifier que le thème est valide
    if (!AVAILABLE_THEMES.includes(theme)) {
        console.error(`Thème non valide: ${theme}`);
        theme = DEFAULT_THEME;
    }
    
    // Mettre à jour l'attribut data-theme sur l'élément html
    document.documentElement.setAttribute('data-theme', theme);
    
    // Mettre à jour la feuille de style du thème
    const themeStylesheet = document.getElementById('theme-stylesheet');
    if (themeStylesheet) {
        themeStylesheet.href = `css/themes/${theme}.css`;
    }
    
    // Mettre à jour la préférence utilisateur
    userPreferences.theme = theme;
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Mettre à jour l'apparence des boutons de thème
    updateThemeButtons(theme);
    
    console.log(`Thème appliqué: ${theme}`);
    
    // Déclencher un événement personnalisé pour signaler le changement de thème
    const event = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(event);
}

/**
 * Applique la taille de police spécifiée
 * @param {number} fontSize - Taille de police en pourcentage (100 = normale)
 */
function applyFontSize(fontSize) {
    // Vérifier que la taille est valide
    if (fontSize < 80 || fontSize > 120) {
        console.error(`Taille de police non valide: ${fontSize}`);
        fontSize = 100;
    }
    
    // Appliquer la taille de police via une variable CSS
    document.documentElement.style.setProperty('--text-size-factor', `${fontSize}%`);
    
    // Mettre à jour la préférence utilisateur
    userPreferences.fontSize = fontSize;
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Mettre à jour l'affichage du slider de taille
    updateFontSizeSlider(fontSize);
    
    console.log(`Taille de police appliquée: ${fontSize}%`);
}

/**
 * Applique le niveau de contraste spécifié
 * @param {number} contrast - Niveau de contraste en pourcentage (100 = normal)
 */
function applyContrast(contrast) {
    // Vérifier que le contraste est valide
    if (contrast < 90 || contrast > 110) {
        console.error(`Contraste non valide: ${contrast}`);
        contrast = 100;
    }
    
    // Appliquer le contraste via une variable CSS
    document.documentElement.style.setProperty('--contrast-factor', `${contrast}%`);
    
    // Mettre à jour la préférence utilisateur
    userPreferences.contrast = contrast;
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Mettre à jour l'affichage du slider de contraste
    updateContrastSlider(contrast);
    
    console.log(`Contraste appliqué: ${contrast}%`);
}

/**
 * Applique les paramètres d'animation
 * @param {boolean} enabled - État d'activation des animations
 */
function applyAnimationSettings(enabled) {
    if (enabled) {
        document.body.classList.remove('animations-disabled');
    } else {
        document.body.classList.add('animations-disabled');
    }
    
    // Mettre à jour la préférence utilisateur
    userPreferences.animations = enabled;
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Mettre à jour l'affichage du toggle d'animation
    updateAnimationToggle(enabled);
    
    console.log(`Animations ${enabled ? 'activées' : 'désactivées'}`);
}

/**
 * Initialise les contrôles de thème
 */
function initThemeControls() {
    // Bouton de basculement de thème dans l'en-tête
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Options de thème dans le panneau de personnalisation
    const themeOptions = document.querySelectorAll('.theme-option');
    if (themeOptions.length > 0) {
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                applyTheme(theme);
                
                // Jouer un son si disponible
                if (window.playSound) {
                    window.playSound('click');
                }
            });
        });
    }
    
    // Contrôles de taille de texte
    const textSizeSlider = document.getElementById('text-size-slider');
    if (textSizeSlider) {
        textSizeSlider.addEventListener('input', () => {
            applyFontSize(parseInt(textSizeSlider.value));
        });
    }
    
    const decreaseTextBtn = document.getElementById('decrease-text');
    if (decreaseTextBtn) {
        decreaseTextBtn.addEventListener('click', () => {
            const newSize = Math.max(userPreferences.fontSize - 5, 80);
            applyFontSize(newSize);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
    }
    
    const increaseTextBtn = document.getElementById('increase-text');
    if (increaseTextBtn) {
        increaseTextBtn.addEventListener('click', () => {
            const newSize = Math.min(userPreferences.fontSize + 5, 120);
            applyFontSize(newSize);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
    }
    
    // Contrôle de contraste
    const contrastSlider = document.getElementById('contrast-slider');
    if (contrastSlider) {
        contrastSlider.addEventListener('input', () => {
            applyContrast(parseInt(contrastSlider.value));
        });
    }
    
    // Contrôle d'animation
    const animationToggle = document.getElementById('animation-toggle');
    if (animationToggle) {
        animationToggle.addEventListener('change', () => {
            applyAnimationSettings(animationToggle.checked);
            
            // Jouer un son si disponible
            if (window.playSound) {
                window.playSound('click');
            }
        });
    }
    
    // Mettre à jour l'état initial des contrôles
    updateThemeButtons(userPreferences.theme);
    updateFontSizeSlider(userPreferences.fontSize);
    updateContrastSlider(userPreferences.contrast);
    updateAnimationToggle(userPreferences.animations);
}

/**
 * Bascule entre les thèmes clair et sombre
 */
function toggleTheme() {
    const currentTheme = userPreferences.theme;
    
    // Basculer entre clair et sombre
    if (currentTheme === 'light' || currentTheme === 'grid') {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
    
    // Jouer un son si disponible
    if (window.playSound) {
        window.playSound('click');
    }
}

/**
 * Détecte et applique le thème du système
 */
function detectSystemTheme() {
    // Vérifier si le navigateur prend en charge la détection du mode sombre
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        userPreferences.theme = 'dark';
    } else {
        userPreferences.theme = 'light';
    }
    
    console.log(`Thème système détecté: ${userPreferences.theme}`);
}

/**
 * Initialise l'écouteur pour le mode sombre du système
 */
function initSystemThemeListener() {
    // Vérifier si le navigateur prend en charge la détection du mode sombre
    if (window.matchMedia) {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Écouter les changements du thème système
        try {
            // Nouvelle méthode (plus récente)
            darkModeMediaQuery.addEventListener('change', (e) => {
                // Ne changer le thème que si l'utilisateur n'a pas déjà choisi manuellement
                if (!localStorage.getItem('user-preferences')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        } catch (error) {
            // Ancienne méthode (compatible avec les anciens navigateurs)
            darkModeMediaQuery.addListener((e) => {
                // Ne changer le thème que si l'utilisateur n'a pas déjà choisi manuellement
                if (!localStorage.getItem('user-preferences')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
}

/**
 * Met à jour l'apparence des boutons de thème
 * @param {string} currentTheme - Thème actuel
 */
function updateThemeButtons(currentTheme) {
    // Mettre à jour l'apparence des boutons dans le panneau de personnalisation
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (themeOptions.length > 0) {
        themeOptions.forEach(option => {
            const theme = option.getAttribute('data-theme');
            
            if (theme === currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // Mettre à jour l'icône du bouton de basculement dans l'en-tête
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('.theme-icon');
        
        if (themeIcon) {
            // Modifier le SVG en fonction du thème actuel
            if (currentTheme === 'dark' || currentTheme === 'blackboard') {
                themeIcon.innerHTML = `
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>
                `;
            } else {
                themeIcon.innerHTML = `
                    <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zm-2 5.79V18h-3.52L12 20.48 9.52 18H6v-3.52L3.52 12 6 9.52V6h3.52L12 3.52 14.48 6H18v3.52L20.48 12 18 14.48z"/>
                `;
            }
        }
    }
}

/**
 * Met à jour l'affichage du slider de taille de police
 * @param {number} fontSize - Taille de police actuelle
 */
function updateFontSizeSlider(fontSize) {
    const textSizeSlider = document.getElementById('text-size-slider');
    if (textSizeSlider) {
        textSizeSlider.value = fontSize;
    }
}

/**
 * Met à jour l'affichage du slider de contraste
 * @param {number} contrast - Niveau de contraste actuel
 */
function updateContrastSlider(contrast) {
    const contrastSlider = document.getElementById('contrast-slider');
    if (contrastSlider) {
        contrastSlider.value = contrast;
    }
}

/**
 * Met à jour l'affichage du toggle d'animation
 * @param {boolean} enabled - État d'activation des animations
 */
function updateAnimationToggle(enabled) {
    const animationToggle = document.getElementById('animation-toggle');
    if (animationToggle) {
        animationToggle.checked = enabled;
    }
}

/**
 * Change le thème actuel
 * @param {string} theme - Nom du thème à appliquer
 */
export function changeTheme(theme) {
    applyTheme(theme);
}

/**
 * Change la taille de police
 * @param {number} size - Taille de police en pourcentage
 */
export function changeFontSize(size) {
    applyFontSize(size);
}

/**
 * Change le niveau de contraste
 * @param {number} level - Niveau de contraste en pourcentage
 */
export function changeContrast(level) {
    applyContrast(level);
}

/**
 * Active ou désactive les animations
 * @param {boolean} enabled - État d'activation des animations
 */
export function toggleAnimations(enabled) {
    applyAnimationSettings(enabled);
}

/**
 * Récupère les préférences utilisateur actuelles
 * @returns {Object} Préférences utilisateur
 */
export function getUserPreferences() {
    return { ...userPreferences };
}

/**
 * Réinitialise toutes les préférences utilisateur
 */
export function resetPreferences() {
    userPreferences = {
        theme: DEFAULT_THEME,
        fontSize: 100,
        contrast: 100,
        animations: true
    };
    
    applyTheme(userPreferences.theme);
    applyFontSize(userPreferences.fontSize);
    applyContrast(userPreferences.contrast);
    applyAnimationSettings(userPreferences.animations);
    
    savePreferences();
    
    console.log('Préférences utilisateur réinitialisées');
}