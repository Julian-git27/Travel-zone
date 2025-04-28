// Función para cargar los conductores en el select
async function cargarConductores() {
  try {
    const response = await fetch('/conductores');
    const conductores = await response.json();

    const select = document.getElementById("conductorSelect");
    select.innerHTML = `<option value="">-- Selecciona --</option>`; // Limpiar el select

    // Iterar sobre los conductores y agregarlos al select
    conductores.forEach(conductor => {
      const option = document.createElement("option");
      option.value = conductor.id; // ID del conductor
      option.textContent = `${conductor.nombre} - ${conductor.marca} ${conductor.modelo}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar los conductores:', error);
  }
}

// Manejar la actualización o eliminación de conductor
document.getElementById("btnActualizarConductor").addEventListener("click", async () => {
  const id = document.getElementById("conductorSelect").value;
  
  const data = {
    nombre: document.getElementById("nombreConductor").value,
    cedula: document.getElementById("cedulaConductor").value,
    marca: document.getElementById("marcaVehiculoConductor").value,
    modelo: document.getElementById("modeloVehiculoConductor").value,
    color: document.getElementById("colorVehiculoConductor").value,
    placa: document.getElementById("placaVehiculoConductor").value,
  };

  const response = await fetch(`/conductores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    alert("Conductor actualizado correctamente.");
    cargarConductores();
    document.getElementById("formAgregarConductor").reset();
    document.getElementById("btnActualizarConductor").classList.add("d-none");
    document.getElementById("btnEliminarConductor").classList.add("d-none");
    document.getElementById("btnAgregarConductor").classList.remove("d-none");
  }
});


// Eliminar conductor
document.getElementById("btnEliminarConductor").addEventListener("click", async () => {
  const id = document.getElementById("conductorSelect").value;
  if (!id) {
    alert("No se ha seleccionado ningún conductor.");
    return;
  }

  if (!confirm("¿Estás seguro de eliminar este conductor? Esta acción no se puede deshacer.")) {
    return;
  }

  try {
    const response = await fetch(`/conductores/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar el conductor");
    }

    // Limpiar la interfaz y recargar
    resetUI();
    await cargarConductores();
    alert("Conductor eliminado correctamente.");

  } catch (error) {
    console.error("Error al eliminar:", error);
    alert(`Error: ${error.message}`);
  }
});


// Cargar datos del conductor al seleccionar uno
document.getElementById("conductorSelect").addEventListener("change", () => {
  const id = document.getElementById("conductorSelect").value;

  const btnEliminar = document.getElementById("btnEliminarConductor");
  const btnActualizar = document.getElementById("btnActualizarConductor");
  const btnAgregar = document.getElementById("btnAgregarConductor");

  if (id) {
    fetch(`/conductores/${id}`)

      .then(res => res.json())
      .then(data => {
        const conductor = data[0];

        // Mostrar datos en tarjetas
        document.getElementById("marca").textContent = conductor.marca;
        document.getElementById("modelo").textContent = conductor.modelo;
        document.getElementById("color").textContent = conductor.color;
        document.getElementById("placa").textContent = conductor.placa;

        // Rellenar formulario para editar
        document.getElementById("nombreConductor").value = conductor.nombre;
        document.getElementById("cedulaConductor").value = conductor.cedula;
        document.getElementById("marcaVehiculoConductor").value = conductor.marca;
        document.getElementById("modeloVehiculoConductor").value = conductor.modelo;
        document.getElementById("colorVehiculoConductor").value = conductor.color;
        document.getElementById("placaVehiculoConductor").value = conductor.placa;

        // Mostrar botones
        btnEliminar.classList.remove("d-none");
        btnActualizar.classList.remove("d-none");
        btnAgregar.classList.add("d-none");
      })
      .catch(err => {
        console.error("Error al cargar datos del conductor:", err);
      });
  } else {
    // Limpiar y ocultar botones si no hay selección
    document.getElementById("marca").textContent = "-";
    document.getElementById("modelo").textContent = "-";
    document.getElementById("color").textContent = "-";
    document.getElementById("placa").textContent = "-";

    btnEliminar.classList.add("d-none");
    btnActualizar.classList.add("d-none");
    btnAgregar.classList.remove("d-none");

    document.getElementById("formAgregarConductor").reset();
  }
});
document.getElementById("btnAgregarConductor").addEventListener("click", async (e) => {
  e.preventDefault(); // Evitar el comportamiento por defecto del formulario

  // Recoger los datos del formulario
  const data = {
    nombre: document.getElementById("nombreConductor").value,
    cedula: document.getElementById("cedulaConductor").value,
    marca: document.getElementById("marcaVehiculoConductor").value,
    modelo: document.getElementById("modeloVehiculoConductor").value,
    color: document.getElementById("colorVehiculoConductor").value,
    placa: document.getElementById("placaVehiculoConductor").value,
  };

  // Enviar solicitud POST al backend para agregar el conductor
  const response = await fetch(`/conductores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    alert("Conductor agregado correctamente.");
    // Limpiar el formulario después de agregar
    document.getElementById("formAgregarConductor").reset();
    cargarConductores(); // Recargar los conductores
  } else {
    alert("Error al agregar conductor.");
  }
});

const placaInput = document.getElementById("placaVehiculoConductor");

if (placaInput) {
  placaInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });
}
// Cargar conductores al cargar la página
window.onload = cargarConductores;


// Cargar los datos del conductor al seleccionar uno
document.getElementById("formularioContrato").addEventListener("submit", async function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

  try {
    const conductorId = document.getElementById("conductorSelect").value;
    if (!conductorId) {
      throw new Error("Debe seleccionar un conductor");
    }

    // Obtener valores del formulario
    const tipoContrato = document.getElementById("tipoContrato").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    
    const fechaInput = document.getElementById("fechaFirma").value;
    const fechaFinal = convertirFechaParaBackend(fechaInput);
    
    function convertirFechaParaBackend(fechaStr) {
      // Solo verifica que tenga el formato correcto
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        throw new Error("Formato de fecha inválido. Use YYYY-MM-DD");
      }
      return fechaStr; // Devuelve la fecha tal cual
    }
    const contratoData = {
      nombre_cliente: document.getElementById("nombreCliente").value.trim(),
      cedula_cliente: document.getElementById("cedulaCliente").value.trim(),
      tipo_contrato: tipoContrato,
      cantidad: cantidad,
      ciudad: document.getElementById("ciudadFirma").value.trim(),
      fecha_firma: fechaFinal, // Aquí envías la fecha corregida
      conductor_id: conductorId
    };

    // Validaciones
    const errores = [];
    if (!contratoData.nombre_cliente) errores.push("Nombre del cliente");
    if (!contratoData.cedula_cliente) errores.push("Cédula del cliente");
    if (!contratoData.ciudad) errores.push("Ciudad");
    if (!contratoData.fecha_firma) errores.push("Fecha");
    if (!contratoData.tipo_contrato) errores.push("Tipo de contrato");
    if (isNaN(contratoData.cantidad) || contratoData.cantidad <= 0) errores.push("Cantidad debe ser mayor a 0");

    if (errores.length > 0) {
      throw new Error(`Faltan campos requeridos: ${errores.join(', ')}`);
    }

    // Enviar datos al servidor
    const response = await fetch(`/contratos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contratoData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al crear el contrato");
    }

    if (!data.token) {
      throw new Error("El servidor no devolvió un token.");
    }

    // Mostrar resultado exitoso
    mostrarResultadoExitoso(data, contratoData);

  } catch (error) {
    console.error("Error:", error);
    mostrarError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generar Contrato';
  }
});

function mostrarResultadoExitoso(data, contratoData) {
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/');
  const firmaUrl = `${baseUrl}/firmar.html?token=${encodeURIComponent(data.token)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(firmaUrl)}`;
  
  // Crear sección de resultados si no existe
  let resultadoDiv = document.getElementById('resultado-contrato');
  if (!resultadoDiv) {
    resultadoDiv = document.createElement('div');
    resultadoDiv.id = 'resultado-contrato';
    document.querySelector('.container').appendChild(resultadoDiv);
  }
  
  resultadoDiv.className = 'card mt-4 p-3';
  resultadoDiv.innerHTML = `
    <h5 class="text-success">¡Contrato creado exitosamente!</h5>
    <div class="row mt-3">
      <div class="col-md-6">
        <h6>Enlace para firma digital:</h6>
        <div class="input-group mb-3">
          <input type="text" id="enlaceFirma" class="form-control" value="${firmaUrl}" readonly>
          <button class="btn btn-outline-secondary" onclick="copiarEnlace()">Copiar</button>
        </div>
      </div>
      <div class="col-md-6 text-center">
        <img src="${qrUrl}" alt="QR para firma" class="img-fluid" style="max-width: 200px;">
      </div>
    </div>
    <div class="alert alert-info mt-3">
      <strong>Resumen del contrato:</strong><br>
      <strong>Cliente:</strong> ${contratoData.nombre_cliente}<br>
      <strong>Cédula:</strong> ${contratoData.cedula_cliente}<br>
      <strong>Duración:</strong> ${contratoData.cantidad} ${contratoData.tipo_contrato}<br>
      <strong>Fecha:</strong> ${contratoData.fecha_firma.split('-').reverse().join('/')}
    </div>
  `;

  // Limpiar formulario
  document.getElementById("formularioContrato").reset();
}

function mostrarError(mensaje) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${mensaje}
    <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const container = document.querySelector('.container');
  container.insertBefore(errorDiv, container.firstChild);
  
  setTimeout(() => errorDiv.remove(), 5000);
}

function resetUI() {
  document.getElementById("marca").textContent = "-";
  document.getElementById("modelo").textContent = "-";
  document.getElementById("color").textContent = "-";
  document.getElementById("placa").textContent = "-";

  document.getElementById("btnEliminarConductor").classList.add("d-none");
  document.getElementById("btnActualizarConductor").classList.add("d-none");
  document.getElementById("btnAgregarConductor").classList.remove("d-none");

  document.getElementById("formAgregarConductor").reset();
}

// Función global para copiar enlace
window.copiarEnlace = function() {
  const enlace = document.getElementById("enlaceFirma");
  enlace.select();
  document.execCommand("copy");
  
  const feedback = document.createElement('div');
  feedback.className = 'alert alert-success mt-2';
  feedback.textContent = 'Enlace copiado al portapapeles';
  document.getElementById('resultado-contrato').appendChild(feedback);
  setTimeout(() => feedback.remove(), 3000);
};

// Cargar conductores al iniciar
document.addEventListener('DOMContentLoaded', cargarConductores);