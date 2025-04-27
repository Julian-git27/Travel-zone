document.addEventListener('DOMContentLoaded', function() {
  // 1. Obtener elementos del formulario
  const userTypeSelect = document.getElementById('userType');
  const jefeFields = document.getElementById('jefeFields');
  const empleadoFields = document.getElementById('empleadoFields');
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('error-message');
  const submitBtn = document.querySelector('#loginForm button[type="submit"]');
  const placaInput = document.getElementById('placa'); // 👈 Agregado

  // 1.1. Convertir automáticamente la placa a mayúsculas
  placaInput.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });

  // 2. Función para mostrar/ocultar campos según tipo de usuario
  function updateFieldsVisibility() {
    const isEmpleado = userTypeSelect.value === 'empleado';
    
    jefeFields.classList.toggle('hidden', isEmpleado);
    empleadoFields.classList.toggle('hidden', !isEmpleado);
    
    // Aquí dentro debes actualizar los campos requeridos
    document.getElementById('email').required = !isEmpleado;
    document.getElementById('password').required = !isEmpleado;
    document.getElementById('cedula').required = isEmpleado;
    document.getElementById('placa').required = isEmpleado;
    
    // También puedes limpiar errores si quieres
    errorMessage.classList.add('hidden');
  }

  // 3. Función para mostrar errores
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  // 4. Configurar eventos
  userTypeSelect.addEventListener('change', updateFieldsVisibility);
  updateFieldsVisibility(); // Inicializar al cargar la página

  // 5. Manejar el envío del formulario
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorMessage.classList.add('hidden');
    
    // Validar selección de tipo de usuario
    if (!userTypeSelect.value) {
      showError('Por favor selecciona un tipo de usuario');
      return;
    }

    const isEmpleado = userTypeSelect.value === 'empleado';
    let endpoint, body;

    // Preparar datos según tipo de usuario
    if (isEmpleado) {
      const cedula = document.getElementById('cedula').value.trim();
      const placa = document.getElementById('placa').value.trim();
      
      if (!cedula || !placa) {
        showError('Por favor completa cédula y placa');
        return;
      }
      
      endpoint = '/login/empleado';
      body = { cedula, placa };
    } else {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      
      if (!email || !password) {
        showError('Por favor completa email y contraseña');
        return;
      }
      
      endpoint = '/login/jefe';
      body = { email, password };
    }

    try {
      // Mostrar estado de carga
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Verificando...
      `;

      // Hacer petición al servidor con timeout de 10s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const BASE_URL = 'https://travel-zone.onrender.com';
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body) // ✅ AQUÍ usamos la variable body correcta
      });
      
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error interno del servidor. Por favor intenta más tarde.');
      }
      
      clearTimeout(timeoutId);
      
      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`El servidor respondió con HTML en lugar de JSON: ${text.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      
      // Verificar si hubo error en el servidor
      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      // Guardar datos en localStorage y redirigir
      if (isEmpleado) {
        // Verificar estructura de datos del empleado
        if (!data.user || !data.user.id) {
          throw new Error('Datos del empleado incompletos');
        }

        const empleadoData = {
          id: data.user.id,
          nombre: data.user.nombre || 'No disponible',
          cedula: data.user.cedula || 'No disponible',
          marca: data.user.marca || 'No disponible',
          modelo: data.user.modelo || 'No disponible',
          color: data.user.color || 'No disponible',
          placa: data.user.placa || 'No disponible',
          tipo: 'empleado'
        };
        
        console.log('Guardando datos del empleado:', empleadoData);
        localStorage.setItem('empleado', JSON.stringify(empleadoData));
        
        window.location.href = '../empleados';
      } else {
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          tipo: 'jefe'
        }));
        window.location.href = '../index';

      }

    } catch (error) {
      console.error('Detalles del error:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        endpoint,
        body
      });
      
      let errorMsg = 'Error durante el login';
      if (error.name === 'AbortError') {
        errorMsg = 'El servidor no respondió a tiempo (timeout)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Error de conexión: ';
        errorMsg += '1. Verifica tu conexión a internet\n';
        errorMsg += '2. El servidor podría estar caído';
      } else if (error.message.includes('internal')) {
        errorMsg = 'Error del servidor: ' + error.message;
      } else {
        errorMsg = error.message;
      }
      
      showError(errorMsg);
    }finally {
      // Restaurar botón
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar sesión';
    }
  });
});