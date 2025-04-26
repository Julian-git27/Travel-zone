// Importamos las dependencias
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Configuración robusta de variables de entorno
require('dotenv').config({ path: '.env' });

// Verificación estricta de variables requeridas
const requiredEnvVars = ['PORT', 'DATABASE_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`🛑 ERROR FATAL: Falta la variable de entorno ${varName}`);
    process.exit(1);
  }
});
app.use(cors({
  origin: ['http://localhost:3000', 'https://travel-zone.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Para navegadores antiguos
};

app.use(cors(corsOptions));
console.log('✅ Variables de entorno cargadas correctamente');

app.get('/test-css', (req, res) => {
  res.sendFile(path.join(__dirname, 'styles', 'login.css'));
});
// Configuración CORS


app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));



// Middleware para archivos estáticos (¡IMPORTANTE!)
app.use(express.static(path.join(__dirname))); // Esto sirve todo el directorio raíz
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/styles', express.static(path.join(__dirname, 'styles'))); 
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para servir los HTML desde 'views'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html')); // Página principal
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


app.get('/firmar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'firmar.html'));
});

app.get('/confirmacion.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'confirmacion.html'));
});


// Ruta para firmar
app.get('/firmar', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'firmar.html'));
});

// Ruta para index
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta para empleados
app.get('/empleados', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'empleados.html'));
});

// Ruta para confirmación
app.get('/confirmacion', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'confirmacion.html'));
});

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/agencia_viajes', // Usa la URL de la base de datos si está disponible, sino usa la conexión local
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Habilita SSL solo en producción
});

// Ruta para obtener todos los conductores
app.get('/conductores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conductores');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los conductores:', err.message);
    res.status(500).send('Error al obtener los conductores');
  }
});

app.get('/conductores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM conductores where id = $1',[id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los conductores:', err.message);
    res.status(500).send('Error al obtener los conductores');
  }
});

// Ruta para agregar un nuevo conductor
app.post('/conductores', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Cuerpo de solicitud vacío' });
  }
  const data = req.body; // Declaración explícita
  const { nombre, cedula, marca, modelo, color, placa } = data;
  try {
    const result = await pool.query(
      'INSERT INTO conductores (nombre, cedula, marca, modelo, color, placa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, cedula, marca, modelo, color, placa]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar el conductor:', err.message);
    res.status(500).send('Error al agregar el conductor');
  }
});


// Ruta para actualizar un conductor
app.put('/conductores/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, marca, modelo, color, placa } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE conductores SET 
        nombre = $1, cedula = $2, marca = $3, 
        modelo = $4, color = $5, placa = $6 
       WHERE id = $7 RETURNING *`,
      [nombre, cedula, marca, modelo, color, placa, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }
    
    res.json({
      success: true,
      conductor: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para eliminar un conductor
app.delete('/conductores/:id', async (req, res) => {
  const { id } = req.params;

  // Validación del ID
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'ID debe ser un número entero' });
  }

  const client = await pool.connect();
  try {
    // Eliminación directa (la cascada se maneja en la DB)
    const result = await client.query(
      'DELETE FROM conductores WHERE id = $1 RETURNING *', 
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    res.json({
      success: true,
      message: 'Conductor eliminado (con eliminación en cascada)',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error en DELETE /conductores:', {
      message: err.message,
      query: err.query,  // PostgreSQL muestra la consulta fallida
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Error al eliminar conductor',
      details: err.message  // Opcional: enviar detalles al cliente en desarrollo
    });
  } finally {
    client.release();
  }
});
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los usuarios:', err.message);
    res.status(500).send('Error al obtener los usuarios');
  }
});

app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
    
    const usuario = result.rows[0];
    
    // Verifica si la contraseña coincide (esto debería ser más seguro con hashing en la base de datos)
    if (usuario.contraseña === contraseña) {
      return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario });
    } else {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('Error al intentar hacer login:', err.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/login/jefe', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND contraseña = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    res.json({ success: true, user: { id: user.id, correo: user.correo, tipo: 'jefe' } });

  } catch (err) {
    console.error('Error al autenticar al jefe:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Ruta para login de empleado (conductor)
app.post('/login/empleado', async (req, res) => {
  try {
    const { cedula, placa } = req.body;
    
    // Asegúrate de seleccionar TODOS los campos necesarios
    const result = await pool.query(
      `SELECT 
        id, 
        nombre, 
        cedula, 
        marca, 
        modelo, 
        color, 
        placa 
       FROM conductores 
       WHERE cedula = $1 AND placa = $2`, 
      [cedula, placa]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales incorrectas' 
      });
    }
    
    // Devuelve todos los campos necesarios
    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        nombre: result.rows[0].nombre,
        cedula: result.rows[0].cedula,
        marca: result.rows[0].marca,
        modelo: result.rows[0].modelo,
        color: result.rows[0].color,
        placa: result.rows[0].placa
      }
    });
    
  } catch (err) {
    console.error('Error en login empleado:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor' 
    });
  }
});

app.post('/contratos', async (req, res) => {
  const {
    nombre_cliente,
    cedula_cliente,
    tipo_contrato,
    cantidad,
    ciudad,
    fecha_firma,
    conductor_id
  } = req.body;

  // Validaciones mejoradas
  const errors = [];
  if (!nombre_cliente) errors.push('nombre_cliente es requerido');
  if (!cedula_cliente) errors.push('cedula_cliente es requerido');
  if (!['horas', 'dias'].includes(tipo_contrato)) errors.push('tipo_contrato debe ser "horas" o "dias"');
  if (!Number.isInteger(cantidad) || cantidad <= 0) errors.push('cantidad debe ser un entero positivo');
  if (!ciudad) errors.push('ciudad es requerida');
  if (!fecha_firma) errors.push('fecha_firma es requerida');
  if (!conductor_id) errors.push('conductor_id es requerido');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  try {
    const token = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO contratos (
        nombre_cliente,
        cedula_cliente,
        tipo_contrato,
        cantidad,
        ciudad,
        fecha_firma,
        conductor_id,
        token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        nombre_cliente,
        cedula_cliente,
        tipo_contrato,
        cantidad,
        ciudad,
        fecha_firma,
        conductor_id,
        token
      ]
    );

    res.status(201).json({
      success: true,
      token: result.rows[0].token,
      contrato: result.rows[0]
    });

  } catch (err) {
    console.error('Error al crear contrato:', err);
    res.status(500).json({
      success: false,
      error: 'Error al crear contrato',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ruta login empleado (MODIFICADA)
app.get('/contratos/:token', async (req, res) => {
  const { token } = req.params;

  if (!token || !/^[a-zA-Z0-9-]{20,}$/.test(token)) {
    return res.status(400).json({
      success: false,
      error: 'Formato de token inválido'
    });
  }

  try {
    const query = `
      SELECT 
        c.id,
        c.token,
        c.nombre_cliente,
        c.cedula_cliente,
        c.tipo_contrato,
        c.cantidad,
        c.ciudad,
        c.fecha_firma,
        c.firma_digital,
        c.pdf_generado,
        c.creado_en,
        d.id as conductor_id,
        d.nombre as nombre_conductor,
        d.cedula as cedula_conductor,
        d.marca,
        d.modelo,
        d.color,
        d.placa
      FROM contratos c
      LEFT JOIN conductores d ON c.conductor_id = d.id
      WHERE c.token = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contrato no encontrado'
      });
    }

    const contrato = result.rows[0];
    
    // Formatear respuesta incluyendo los nuevos campos
    const response = {
      success: true,
      data: {
        ...contrato,
        tipo_contrato: contrato.tipo_contrato,
        cantidad: contrato.cantidad,
        // Para compatibilidad con clientes antiguos
        horas: contrato.tipo_contrato === 'horas' ? contrato.cantidad : null,
        dias: contrato.tipo_contrato === 'dias' ? contrato.cantidad : null,
        fecha_firma: contrato.fecha_firma?.toISOString(),
        creado_en: contrato.creado_en?.toISOString(),
        firmado: !!contrato.firma_digital,
        pdf_disponible: contrato.pdf_generado
      }
    };

    res.json(response);

  } catch (err) {
    console.error(`Error al consultar contrato [Token: ${token}]:`, err);
    res.status(500).json({
      success: false,
      error: 'Error interno al consultar contrato'
    });
  }
});

// Obtener contrato por token
app.get('/contratos/:token', async (req, res) => {
  const { token } = req.params;

  if (!token || token.length < 20) {
    return res.status(400).json({
      success: false,
      error: 'Token inválido (mínimo 20 caracteres)'
    });
  }

  try {
    const query = `
      SELECT 
        c.*,
        d.nombre as nombre_conductor,
        d.cedula as cedula_conductor,
        d.marca,
        d.modelo,
        d.color,
        d.placa
      FROM contratos c
      LEFT JOIN conductores d ON c.conductor_id = d.id
      WHERE c.token = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contrato no encontrado'
      });
    }

    const contrato = result.rows[0];
    const response = {
      success: true,
      data: {
        ...contrato,
        // Info calculada
        duracion: `${contrato.cantidad} ${contrato.tipo_contrato}`,
        firmado: !!contrato.firma_digital
      }
    };

    res.json(response);

  } catch (err) {
    console.error('Error al consultar contrato:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});


// Iniciamos el servidor en el puerto 3000
const port = process.env.PORT 
console.log("👀 Llegando al punto de arrancar el servidor...");

app.listen(port, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${port}`);
});
