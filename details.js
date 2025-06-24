// details.js
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const apiKey = "71hZHh7PIpJ52NnNs3ne8hgsdrOcC2KWQPc8dzSBsyUYBE08nw";

const plantDetailsContainer = document.getElementById("plant-details");

async function fetchDetails() {
  try {
    const response = await fetch(`https://plant.id/api/v3/kb/plants/${token}?details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods&language=es`, {
      headers: {
        "Api-Key": apiKey
      }
    });
    const data = await response.json();
    renderDetails(data);
  } catch (err) {
    plantDetailsContainer.innerHTML = "<p>Error al cargar los detalles de la planta.</p>";
  }
}

function renderDetails(plant) {
  plantDetailsContainer.innerHTML = `
    <h2>${plant.common_names?.[0] || "Nombre no disponible"}</h2>
    <img src="${plant.image?.url || ''}" alt="Imagen de la planta">
    <p><strong>Nombre científico:</strong> ${plant.name}</p>
    <p><strong>Descripción:</strong> ${plant.description || 'No disponible'}</p>
    <p><strong>Taxonomía:</strong> ${plant.taxonomy?.genus || 'No disponible'} - ${plant.taxonomy?.family || ''}</p>
    <p><strong>Rango:</strong> ${plant.rank}</p>
    <p><strong>Sinónimos:</strong> ${plant.synonyms?.join(', ') || 'Ninguno'}</p>
    <p><strong>Partes comestibles:</strong> ${plant.edible_parts?.join(', ') || 'No disponibles'}</p>
    <p><strong>Riego:</strong> ${plant.watering?.min || '?'} - ${plant.watering?.max || '?'} mm</p>
    <p><strong>Propagación:</strong> ${plant.propagation_methods?.join(', ') || 'No disponible'}</p>
    <p><a href="${plant.url}" target="_blank">Más información</a></p>
  `;
}

fetchDetails();

// app.js (modificado)
// ...dentro de renderResults()
function renderResults(suggestions) {
  plantsContainer.innerHTML = "";
  suggestions.forEach((plant) => {
    const card = document.createElement("div");
    card.classList.add("plant-card");
    card.innerHTML = `
      <h2>${plant.name}</h2>
      <p>Probabilidad: ${(plant.probability * 100).toFixed(2)}%</p>
      ${plant.similar_images?.[0] ? `<img src="${plant.similar_images[0].url_small}" alt="Imagen similar">` : ""}
      <br>
      <button class="details-btn" data-id="${plant.details.entity_id}">Ver detalles</button>
    `;
    plantsContainer.appendChild(card);
  });

  document.querySelectorAll(".details-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const token = e.target.getAttribute("data-id");
      window.location.href = `details.html?token=${token}`;
    });
  });
}