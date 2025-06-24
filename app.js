const uploadInput = document.getElementById('upload');
const plantList = document.getElementById('plant-list');
const plantModal = document.getElementById('plantModal');
const plantModalContent = document.getElementById('plantModalContent');
const closeBtn = document.querySelector('.close-btn');

// Variable para guardar la imagen cargada
let currentBase64Image = '';

// Cerrar modal al hacer clic en la X
closeBtn.addEventListener('click', () => {
  plantModal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', (event) => {
  if (event.target === plantModal) {
    plantModal.style.display = 'none';
  }
});

uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64Full = reader.result;
    const base64Image = base64Full.split(',')[1];
    
    // Guardar la imagen para uso posterior
    currentBase64Image = base64Image;

    plantList.innerHTML = 
      `<div class="card">
        <div class="card-header">
          <h2>📸 Imagen cargada</h2>
        </div>
        <div class="card-body">
          <img src="${base64Full}" alt="Imagen enviada">
        </div>
      </div>
      <div class="loading">🔍 Analizando tu planta</div>`;

    try {
      const response = await fetch("https://plant.id/api/v3/identification?language=es&details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": "xL9eixRQ4sFKp4bAyslPh3Bmo7qL5xDdjO9hFwpmKabtbt1rYh"
        },
        body: JSON.stringify({
          images: [base64Image],
          similar_images: true,
          classification_level: "species"
        })
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new Error(rawText || "Error en la solicitud");
      }

      const data = JSON.parse(rawText);
      console.log("esta es la data:", data);
      const suggestions = data.result?.classification?.suggestions;

      if (!suggestions || suggestions.length === 0) {
        plantList.innerHTML += '<div class="card"><div class="card-body"><p>No se pudo identificar la planta. Intenta con otra imagen más clara.</p></div></div>';
        return;
      }

      let similarPlantsHTML = 
        `<h2 class="results-title">🌱 Posibles coincidencias</h2>
        <div class="similar-cards" id="similar-list"></div>
        <div class="health-check-container">
          <button id="checkHealthBtn" class="health-btn">🌿 Ver estado de salud de la planta</button>
        </div>`;

      plantList.innerHTML = plantList.innerHTML.replace('<div class="loading">🔍 Analizando tu planta</div>', similarPlantsHTML);

      const similarList = document.getElementById('similar-list');

      suggestions.forEach(suggestion => {
        const confidence = (suggestion.probability * 100).toFixed(1);
        const image = suggestion.similar_images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';

        similarList.innerHTML += 
          `<div class="plant-card" data-plant='${JSON.stringify(suggestion).replace(/'/g, "\\'")}'>
            <img src="${image}" alt="${suggestion.name}">
            <div class="plant-info">
              <h3>${suggestion.name}</h3>
              <span class="confidence">${confidence}% de confianza</span>
            </div>
          </div>`;
      });

      // Agregar event listeners a las tarjetas para mostrar detalles
      document.querySelectorAll('.plant-card').forEach(card => {
        card.addEventListener('click', () => {
          const plantData = JSON.parse(card.getAttribute('data-plant'));
          showPlantDetails(plantData);
        });
      });

      // Agregar event listener al botón de salud
      document.getElementById('checkHealthBtn').addEventListener('click', checkPlantHealth);

    } catch (error) {
      plantList.innerHTML = plantList.innerHTML.replace('<div class="loading">🔍 Analizando tu planta</div>', 
        `<div class="card"><div class="card-body"><p style="color: #d32f2f;">Error: ${error.message}</p></div></div>`);
      console.error("Error:", error);
    }
  };

  reader.readAsDataURL(file);
});

// Función para verificar la salud de la planta
async function checkPlantHealth() {
  if (!currentBase64Image) {
    alert('No hay imagen cargada para analizar');
    return;
  }

  const healthBtn = document.getElementById('checkHealthBtn');
  healthBtn.disabled = true;
  healthBtn.textContent = '🔍 Analizando salud...';

  try {
    const response = await fetch("https://plant.id/api/v3/health_assessment?language=es&details=local_name,description,url,treatment,classification,common_names,cause", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "xL9eixRQ4sFKp4bAyslPh3Bmo7qL5xDdjO9hFwpmKabtbt1rYh"
      },
      body: JSON.stringify({
        images: [currentBase64Image],
        health: "only",
        similar_images: true
      })
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(rawText || "Error en la solicitud de salud");
    }

    const healthData = JSON.parse(rawText);
    console.log("Datos de salud:", healthData);
    displayHealthResults(healthData);

  } catch (error) {
    plantList.innerHTML += `<div class="card"><div class="card-body"><p style="color: #d32f2f;">Error al verificar salud: ${error.message}</p></div></div>`;
    console.error("Error en salud:", error);
  } finally {
    healthBtn.disabled = false;
    healthBtn.textContent = '🌿 Ver estado de salud de la planta';
  }
}

// Función para mostrar los resultados de salud
function displayHealthResults(healthData) {
  const suggestions = healthData.result?.disease?.suggestions;
  
  if (!suggestions || suggestions.length === 0) {
    plantList.innerHTML += '<div class="card"><div class="card-body"><p>No se detectaron problemas de salud en la planta.</p></div></div>';
    return;
  }

const healthScore = healthData.result.is_healthy.probability * 100; 
const healthPercentage = healthScore.toFixed(1);
// Cambiar esta línea para no usar el threshold y usar un valor fijo en su lugar
const isHealthy = healthScore > 50; // 50% como punto de corte

// El resto del código se mantiene igual
const healthScoreClass = isHealthy ? 'healthy' : 'unhealthy';
const healthIcon = isHealthy ? '✅' : '⚠️';
const healthStatus = isHealthy ? 'Saludable' : 'Con problemas';

// Texto descriptivo ajustado
function getHealthStatusNote(score) {
  if (score > 80) return 'Tu planta está en excelente estado de salud.';
  if (score > 60) return 'Tu planta está saludable con pequeños aspectos a vigilar.';
  if (score > 40) return 'Tu planta muestra algunos problemas de salud.';
  return 'Tu planta tiene problemas serios de salud que requieren atención.';
}

  let healthHTML = `
    <div class="card health-results">
      <div class="card-header">
        <h2>🩺 Estado de salud de la planta</h2>
      </div>
      <div class="card-body">
        <div class="health-probability">
  <span class="health-score ${healthScoreClass}">
    ${healthIcon} ${healthStatus}: ${healthPercentage}%
  </span>
  <div class="health-meter">
    <div class="health-meter-fill" style="width: ${healthScore}%"></div>
  </div>
  <p class="health-status-note">${getHealthStatusNote(healthScore)}</p>
</div>
        <div class="disease-list" id="disease-list"></div>
      </div>
    </div>`;

  // Insertar después del contenedor de salud
  const healthContainer = document.querySelector('.health-check-container');
  healthContainer.insertAdjacentHTML('afterend', healthHTML);

  const diseaseList = document.getElementById('disease-list');

  suggestions.forEach((disease, index) => {
    const probability = (disease.probability * 100).toFixed(1);
    const similarImage = disease.similar_images?.[0]?.url || 'https://via.placeholder.com/150?text=No+image';
    
    diseaseList.innerHTML += `
      <div class="disease-card ${index === 0 ? 'primary' : ''}">
        <div class="disease-image">
          <img src="${similarImage}" alt="${disease.name}">
        </div>
        <div class="disease-info">
          <h3>${disease.details?.local_name || disease.name}</h3>
          <span class="probability">${probability}% de probabilidad</span>
          <p class="description">${disease.details?.description || 'Descripción no disponible'}</p>
          
          ${disease.details?.treatment ? `
            <div class="treatment">
              <h4>Tratamiento:</h4>
              ${disease.details.treatment.chemical ? `
                <div class="treatment-type">
                  <h5>Químico:</h5>
                  <ul>${disease.details.treatment.chemical.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>
              ` : ''}
              
              ${disease.details.treatment.biological ? `
                <div class="treatment-type">
                  <h5>Biológico:</h5>
                  <ul>${disease.details.treatment.biological.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>
              ` : ''}
              
              ${disease.details.treatment.prevention ? `
                <div class="treatment-type">
                  <h5>Prevención:</h5>
                  <ul>${disease.details.treatment.prevention.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>`;
  });

  // Desplazarse a los resultados de salud
  document.querySelector('.health-results').scrollIntoView({ behavior: 'smooth' });
}

// Función para mostrar los detalles de la planta en el modal
function showPlantDetails(plant) {
  const traducciones = {
    class: "Clase",
    genus: "Género",
    order: "Orden",
    family: "Familia",
    phylum: "Filo",
    kingdom: "Reino",
  };
  
  let taxonomyHTML = '';
  if (plant.details?.taxonomy) {
    for (const [key, value] of Object.entries(plant.details.taxonomy)) {
      if (value) {
        const keyTraducido = traducciones[key] || key;
        taxonomyHTML += `<span class="taxonomy-badge">${keyTraducido}: ${value}</span>`;
      }
    }
  }

  // Formatear sinónimos
  let synonymsHTML = '';
  if (plant.details?.synonyms) {
    plant.details.synonyms.forEach(synonym => {
      synonymsHTML += `<span class="synonym-item">${synonym}</span>`;
    });
  }

  // Construir el contenido del modal
  plantModalContent.innerHTML = `
    <h2>${plant.name}</h2>
    <p><span class="confidence">${(plant.probability * 100).toFixed(1)}% de confianza</span></p>
    
    <div class="plant-details">
      ${plant.details?.image?.value ? 
        `<div class="detail-row">
          <img src="${plant.details.image.value}" alt="${plant.name}" style="max-width: 100%; border-radius: 8px; margin: 0 auto; display: block;">
        </div>`
       : ''}
      
      ${taxonomyHTML ? 
        `<div class="detail-row">
          <div class="detail-label">Taxonomía:</div>
          <div class="detail-value">${taxonomyHTML}</div>
        </div>`
       : ''}
      
      ${synonymsHTML ? 
        `<div class="detail-row">
          <div class="detail-label">Sinónimos:</div>
          <div class="detail-value">${synonymsHTML}</div>
        </div>`
       : ''}
      
      ${plant.details?.url ? 
        `<div class="detail-row">
          <div class="detail-label">Más información:</div>
          <div class="detail-value">
            <a href="${plant.details.url}" target="_blank" rel="noopener">Ver en Wikipedia</a>
          </div>
        </div>`
       : ''}
      
      ${plant.details?.gbif_id ? 
        `<div class="detail-row">
          <div class="detail-label">GBIF ID:</div>
          <div class="detail-value">${plant.details.gbif_id}</div>
        </div>`
       : ''}
      
      ${plant.details?.inaturalist_id ? 
        `<div class="detail-row">
          <div class="detail-label">iNaturalist ID:</div>
          <div class="detail-value">${plant.details.inaturalist_id}</div>
        </div>`
       : ''}
    </div>`;

  // Mostrar el modal
  plantModal.style.display = 'block';
}