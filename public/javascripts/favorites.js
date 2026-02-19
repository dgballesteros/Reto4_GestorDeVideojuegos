// ========================================
// SISTEMA DE FAVORITOS CON LOCALSTORAGE
// ========================================

const FAVORITES_KEY = 'gamecenter-favorites';

// Obtiene la lista de IDs de juegos favoritos del localStorage
function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Guarda la lista de favoritos en localStorage
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// Alterna un juego en favoritos (agrega o quita)
function toggleFavorite(gameId) {
  // Convertir gameId a string para asegurar consistencia
  gameId = String(gameId);
  
  const favorites = getFavorites();
  const index = favorites.findIndex(function(id) {
    return String(id) === gameId;
  });
  
  let isNowFavorite;
  if (index > -1) {
    // Si está en favoritos, lo quitamos
    favorites.splice(index, 1);
    isNowFavorite = false;
  } else {
    // Si no está, lo agregamos
    favorites.push(gameId);
    isNowFavorite = true;
  }
  
  // Guardar los cambios inmediatamente
  saveFavorites(favorites);
  return isNowFavorite;
}

// Verifica si un juego está en favoritos
function isFavorite(gameId) {
  gameId = String(gameId);
  const favorites = getFavorites();
  return favorites.some(function(id) {
    return String(id) === gameId;
  });
}

// Actualiza el estado visual de un botón de favorito
 
function updateFavoriteButton(button, isFav) {
  const icon = button.querySelector('.favorite-icon');
  if (!icon) return;
  
  if (isFav) {
    button.classList.add('favorite-active');
    icon.innerHTML = '★'; // Estrella rellena
    button.title = 'Click to remove from favorites';
  } else {
    button.classList.remove('favorite-active');
    icon.innerHTML = '☆'; // Estrella vacía
    button.title = 'Click to add to favorites';
  }
}

// Inicializa todos los botones de favorito en la página
 
function initFavoriteButtons() {
  const buttons = document.querySelectorAll('.favorite-btn');
  
  buttons.forEach(function(button) {
    const gameId = button.getAttribute('data-game-id');
    if (!gameId) return;
    
    // Establecer estado inicial
    const isFav = isFavorite(gameId);
    updateFavoriteButton(button, isFav);
    
    // Agregar manejador de clic
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // toggleFavorite ya guarda los cambios en localStorage
      const isNowFav = toggleFavorite(gameId);
      updateFavoriteButton(button, isNowFav);
      
      // Refresca el filtro de favoritos si estamos en la página de colección
      applyClientSideFavoritesFilter();
      
      // Enviar petición al servidor (opcional, para logging)
      fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId: gameId })
      }).catch(function(err) {
        console.error('Error toggling favorite:', err);
      });
    });
  });
}

// Filtra una lista de juegos para mostrar solo los favoritos
function filterFavoriteGames(games) {
  const favorites = getFavorites();
  return games.filter(function(game) {
    return favorites.includes(String(game.id));
  });
}

// ========================================
// SISTEMA DE FORMULARIOS CON AJAX
// ========================================

// Configura un formulario para usar AJAX
function setupAjaxForm(form) {
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const action = form.getAttribute('action');
    const method = form.getAttribute('method') || 'POST';
    
    // Deshabilitar el botón de envío
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Loading...';
    }
    
    fetch(action, {
      method: method,
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        // Mostrar mensaje de éxito (opcional)
        if (data.redirect) {
          // Redirigir después de 500ms para que se vea el cambio
          setTimeout(function() {
            window.location.href = data.redirect;
          }, 500);
        }
      } else {
        // Mostrar mensaje de error
        alert(data.message || 'An error occurred');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit';
        }
      }
    })
    .catch(function(error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });
  });
}

// Inicializa todos los formularios AJAX en la página

function initAjaxForms() {
  const ajaxForms = document.querySelectorAll('form[data-ajax="true"]');
  ajaxForms.forEach(function(form) {
    setupAjaxForm(form);
  });
}

// ========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ========================================

/**
 * Inicializa el filtro de favoritos en la página de colección
 */
function initFavoriteFilter() {
  const favoriteSelect = document.getElementById('f-favoritos');
  if (!favoriteSelect) return;
  
  const filterForm = document.getElementById('filters-form');
  if (!filterForm) return;
  
  // Manejador para cambios en el select de favoritos
  favoriteSelect.addEventListener('change', function() {
    // No hacer submit automático, dejar que el form se envíe normalmente
    // El filtrado se hará en el cliente cuando la página ya está cargada
    applyClientSideFavoritesFilter();
  });
  
  // Aplicar filtro inmediatamente al cargar si hay favoritos en localStorage
  applyClientSideFavoritesFilter();
}

/**
 * Aplica el filtro de favoritos en el cliente (oculta/muestra filas)
 */
function applyClientSideFavoritesFilter() {
  const favoriteSelect = document.getElementById('f-favoritos');
  if (!favoriteSelect) return;
  
  const filterValue = favoriteSelect.value;
  const rows = document.querySelectorAll('table tbody tr');
  
  if (filterValue === '') {
    // Mostrar todas las filas
    rows.forEach(function(row) {
      row.style.display = '';
    });
  } else if (filterValue === '1') {
    // Mostrar solo favoritos
    const favorites = getFavorites();
    rows.forEach(function(row) {
      const gameId = row.getAttribute('data-game-id');
      const isFav = gameId && favorites.some(function(id) {
        return String(id) === String(gameId);
      });
      row.style.display = isFav ? '' : 'none';
    });
  } else if (filterValue === '0') {
    // Mostrar solo no favoritos
    const favorites = getFavorites();
    rows.forEach(function(row) {
      const gameId = row.getAttribute('data-game-id');
      const isFav = gameId && favorites.some(function(id) {
        return String(id) === String(gameId);
      });
      row.style.display = !isFav ? '' : 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initFavoriteButtons();
  initAjaxForms();
  initFavoriteFilter();
});
