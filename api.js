const plantDetails = document.getElementById('plant-details');
const token = localStorage.getItem('plant_token');

if (!token) {
  plantDetails.innerHTML = '<p>No se ha seleccionado ninguna planta.</p>';
} else {
  const fetchDetails = async () => {
    const response = await fetch(`https://plant.id/api/v3/kb/plants/?details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods&language=es`, {
      headers: {
        "Api-Key": "71hZHh7PIpJ52NnNs3ne8hgsdrOcC2KWQPc8dzSBsyUYBE08nw"
      }
    });

    const data = await response.json();

    plantDetails.innerHTML = `
      <h2>${data.common_names?.[0] || 'Nombre común no disponible'}</h2>
      <h3><i>${data.name || 'Nombre científico no disponible'}</i></h3>

      ${data.image?.value ? `<img src="${data.image.value}" alt="Planta" style="max-width:300px;">` : ''}

      <p><strong>Descripción:</strong> ${data.description?.value || 'No disponible'}</p>

      ${data.url ? `<p><strong>Más información:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>` : ''}

      <p><strong>Riego:</strong> ${data.watering ? `${data.watering.min} - ${data.watering.max}` : 'No especificado'}</p>
      <p><strong>Partes comestibles:</strong> ${data.edible_parts?.join(', ') || 'No especificadas'}</p>
      <p><strong>Propagación:</strong> ${data.propagation_methods?.join(', ') || 'No especificada'}</p>

      <h4>📚 Taxonomía:</h4>
      <ul>
        <li><strong>Reino:</strong> ${data.taxonomy?.kingdom || '-'}</li>
        <li><strong>Filo:</strong> ${data.taxonomy?.phylum || '-'}</li>
        <li><strong>Clase:</strong> ${data.taxonomy?.class || '-'}</li>
        <li><strong>Orden:</strong> ${data.taxonomy?.order || '-'}</li>
        <li><strong>Familia:</strong> ${data.taxonomy?.family || '-'}</li>
        <li><strong>Género:</strong> ${data.taxonomy?.genus || '-'}</li>
        <li><strong>Rango:</strong> ${data.rank || '-'}</li>
      </ul>

      <h4>📝 Sinónimos:</h4>
      <p>${data.synonyms?.join(', ') || 'Ninguno registrado'}</p>
    `;
  };

  fetchDetails();
}
