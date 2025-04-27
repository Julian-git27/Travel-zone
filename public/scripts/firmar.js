const { jsPDF } = window.jspdf;
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const logoPath = '/images/PHOTO-2025-04-22-01-10-00-removebg-preview.png';
const firmaPath = '/images/firma1.png';
const huellaPath = '/images/huella1.png';
const img = new Image();
let contrato = null;
let signaturePad = null;
// Configuración inicial
window.addEventListener('DOMContentLoaded', () => {
  inicializarFirma();
  cargarContrato();
  document.getElementById('btnGenerarPDF').addEventListener('click', generarPDF);
});


// Obtener token de la URL


if (!token) {
  alert("No se encontró el token del contrato en la URL");
  window.location.href = "/";
  throw new Error("Token no encontrado"); // Detener ejecución
}
async function cargarImagenes() {
  try {
    const responses = await Promise.all([
      fetch(logoPath),
      fetch(firmaPath),
      fetch(huellaPath)
    ]);
    
    responses.forEach((response, index) => {
      if (!response.ok) {
        const imageName = [logoPath, firmaPath, huellaPath][index];
        console.error(`No se pudo cargar la imagen: ${imageName}`);
      }
    });
  } catch (error) {
    console.error("Error verificando imágenes:", error);
  }
}
// Configuración inicial
window.addEventListener('DOMContentLoaded', () => {
  inicializarFirma();
  cargarContrato(); // Ahora token es accesible globalmente
  document.getElementById('btnGenerarPDF').addEventListener('click', generarPDF);
});

// Inicializar el canvas de firma
function inicializarFirma() {
  const canvas = document.getElementById("firmaCanvas");
  const container = canvas.parentElement;
  
  // Configuración del tamaño inicial
  canvas.width = container.offsetWidth;
  canvas.height = 200; // Altura fija como tienes en tu HTML
  
  // Manejo de alta densidad de píxeles (retina displays)
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  
  // Ajustar el estilo CSS para mantener el tamaño visual
  canvas.style.width = '100%';
  canvas.style.height = '200px';
  
  // Inicializar SignaturePad con la configuración correcta
  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(248, 249, 250)',
    penColor: 'rgb(0, 0, 0)',
    velocityFilterWeight: 0.7,
    minWidth: 0.5,
    maxWidth: 2.5,
    throttle: 16 // milisegundos
  });

  // Escalar el contexto correctamente
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  
  // Limpiar el canvas inicialmente
  signaturePad.clear();

  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear(); // Opcional: limpiar al redimensionar
  });
}


// Limpiar la firma
function limpiarFirma() {
  signaturePad.clear();
}





// Cargar datos del contrato
async function cargarContrato() { // Elimina el parámetro token
  try {
    console.log(`Cargando contrato con token: ${token}`);
    const response = await fetch(`/contratos/${token}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Error al cargar el contrato");
    }
    
    // Asignamos el contrato a la variable global
    contrato = data.data;
    mostrarDatosContrato(contrato);
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cargar el contrato: " + error.message);
    window.location.href = "/"; // Redirigir en caso de error
  }
}


// Mostrar datos del contrato en la página
function mostrarDatosContrato(contrato) {
  // Actualizar los campos existentes
  document.getElementById("nombreCliente").textContent = contrato.nombre_cliente;
  document.getElementById("cedulaCliente").textContent = contrato.cedula_cliente;
  document.getElementById("ciudadFirma").textContent = contrato.ciudad;
  document.getElementById("fechaFirma").textContent = contrato.fecha_firma ? new Date(contrato.fecha_firma).toLocaleDateString() : 'No especificada';
  document.getElementById("nombreConductor").textContent = contrato.nombre_conductor;
  document.getElementById("placaVehiculo").textContent = contrato.placa;
  document.getElementById("marcaModelo").textContent = `${contrato.marca} / ${contrato.modelo}`;
  
  // Verificar si ya existen los elementos de duración y número de contrato
  let duracionElement = document.getElementById("duracionContrato");
  let idElement = document.getElementById("numeroContrato");
  
  // Si no existen, crearlos
  if (!duracionElement) {
    duracionElement = document.createElement('p');
    duracionElement.id = "duracionContrato";
    document.getElementById("datosContrato").appendChild(duracionElement);
  }
  duracionElement.innerHTML = `<strong>Duración:</strong> ${contrato.cantidad} ${contrato.tipo_contrato}`;
  
  // Solo mostrar ID si está disponible
  if (contrato.id) {
    if (!idElement) {
      idElement = document.createElement('p');
      idElement.id = "numeroContrato";
      document.getElementById("datosContrato").appendChild(idElement);
    }
    idElement.innerHTML = `<strong>Número de contrato:</strong> ${contrato.id}`;
  } else if (idElement) {
    // Si no hay ID pero el elemento existe, eliminarlo
    idElement.remove();
  }
}

// Función para texto compacto
function addCompactText(doc, text, y, maxWidth, margin, options = {}) {
  const currentFontSize = doc.getFontSize();
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y, options);
  return y + (lines.length * (currentFontSize * 0.4));
}

// Generar PDF con el diseño original y marca de agua
async function generarPDF() {
  if (signaturePad.isEmpty()) {
      alert("Por favor, proporcione su firma antes de continuar");
      return;
  }

  try {
      const firmaDataURL = signaturePad.toDataURL('image/png');
      const doc = new jsPDF();
      
      const img = new Image();
      img.src = logoPath;
      
      await new Promise((resolve) => {
          if (img.complete) {
              resolve();
          } else {
              img.onload = resolve;
              img.onerror = resolve;
          }
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pageWidth - (margin * 2);
      let y = 30;

      // Marca de agua
      const addWatermark = () => {
          const imgWidth = 150;
          const imgHeight = 150;
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          doc.addImage({
              imageData: img,
              x: x,
              y: y,
              width: imgWidth,
              height: imgHeight,
              opacity: 0.3
          });
          
          doc.setFillColor(255, 255, 255);
          doc.setGState(new doc.GState({ opacity: 0.85 }));
          doc.rect(x, y, imgWidth, imgHeight, 'F');
          doc.setGState(new doc.GState({ opacity: 1.0 }));
      };
      
      // Logo
      doc.addImage({
          imageData: img,
          x: pageWidth - 200,
          y: 10,
          width: 25,
          height: 25,
          opacity: 1.0
      });
      
      addWatermark();

      const fechaFirma = contrato.fecha_firma ? new Date(contrato.fecha_firma) : new Date();
      const dia = fechaFirma.getDate();
      const mes = fechaFirma.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
      const anio = fechaFirma.getFullYear();

      // Título con número de contrato
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const titleText = "CONTRATO DE ARRENDAMIENTO VEHÍCULO AUTOMOTOR";
      const titleWidth = doc.getStringUnitWidth(titleText) * 11 / doc.internal.scaleFactor;
      doc.text(titleText, (pageWidth - titleWidth) / 2, y);
      
      // Número de contrato debajo del título
      doc.setFontSize(9);
      doc.text(`No. ${contrato.id || 'N/A'}`, pageWidth - margin - 10, y);
      y += 10;

      // Contenido del contrato
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      y = addCompactText(doc, "Entre los suscritos, EDWIN ADRIAN ALZATE RAMIREZ, identificada con NIT. 3.481.992, persona natural legalmente constituida, ubicada en la Calle 40 # 81A - 168 de la Ciudad de Medellín, la cual cuenta con con RNT No. 166158 para la modalidad de ARRENDADORES DE VEHÍCULOS PARA TURISMO NACIONAL E INTERNACIONAL y RNT No. 166137 para la modalidad de AGENCIAS DE VIAJES", y, maxWidth, margin);
      y = addCompactText(doc, "Representada legalmente por EDWIN ADRIAN ALZATE RAMIREZ, mayor de edad, identificado con cédula de ciudadanía No.3.481.992 de Envigado, quien en adelante se llama EL ARRENDADOR y EL ARRENDATARIO identificado como aparece al pie de la firma, hemos convenido en celebrar el presente contrato de ARRENDAMIENTO de vehículo automotor, que se regirá por las siguientes cláusulas:", y, maxWidth, margin);
      y += 4;

      // Clausulas
      const clausulas = [
          "CLÁUSULA PRIMERA. OBJETO DEL CONTRATO. EL ARRENDADOR entrega al ARRENDATARIO en titulo de arrendamiento la tenencia de EL VEHICULO CON CONDUCTOR, para que este lo use y disfrute con fines de desplazamiento acorde a sus necesidades. ",
          "",
          "CLÁUSULA SEGUNDA. ENTREGA. El vehículo objeto de este contrato se entrega al ARRENDATARIO por intermedio del conductor asignado quien lo conducirá durante el tiempo del contrato. El vehículo se entrega con póliza integral de transportes terrestres y SOAT. EL ARRENDATARIO acepta recibirlo en perfecto estado y a su entera satisfacción.",
          "",
          `CLAUSULA TERCERA DURACION DEL CONTRATO. La duración del arrendamiento es por HORAS O DIAS. En caso que el ARRENDATARIO una vez vencido o antes de vencer el plazo señalado, exprese su intención de arrendar por más tiempo el vehículo, las partes podrán indicar el tiempo adicional para lo cual se elaborará un nuevo contrato. EL ARRENDADOR hará la entrega del vehículo objeto del presente contrato a la firma del mismo, dejando constancia del estado en que esta el vehículo y el que lo recibe EL ARRENDATARIO. `,
          "",
          `CLAUSULA CUARTA CANON. Durante el plazo de este contrato, EL ARRENDATARIO reconocerá como canon el valor establecido en la cotización enviada previamente ya sea por HORAS O DÍAS`,
          "",
          "CLÁUSULA QUINTÀ. DESTINACIÓN DEL VEHÍCULO. EL ARRENDATARIO destinará el vehículo al transporte personal con el ánimo de desplazarse a los diferentes destinos, en forma exclusiva, sin fines de lucro y dentro de la capacidad normal del vehículo. EL ARRENDATARIO no podrá destinar el vehículo automóvil arrendado para un uso diferente al señalado en el presente contrato, ni para el transporte de carga, ni para el transporte de pasajeros como servicio público, ni para ser conducido a lugares o por rutas que no estén habilitadas o sean conocidas como de alta peligrosidad, etc.; que pongan en riesgo la integridad del vehículo, al igual que la vida de su conductor o de las personas que se encuentre en él.",
          "",
          "CLAUSULA SEXTA. COLISIÓN. Cualquier daño o colisión que sufra el vehículo mientras esté vigente este contrato, será asumido en su totalidad por EL ARRENDADOR, quien deberá mantener una póliza de seguro de todo riesgo para el vehículo.",
          "",
          "CLÁUSULA SÉPTIMA DEVOLUCIÓN. EL vehículo deberá ser devuelto a EL ARRENDADOR por el ARRENDATARIO a través del conductor designado. ",
          "",
          "CLÁUSULA OCTAVA. Toda diferencia y/o reclamación derivado del presente contrato, podrá ser sometido la conciliación. Para tal efecto, se establece como domicilio contractual la ciudad de Medellín.",
          "",
          "CLÁUSULA NOVENA CAUSALES DE TERMINACIÓN. El presente contrato se entenderá terminado sin necesidad de  requerimiento alguno, a lo cual renuncian las partes en forma recíproca, en los siguientes eventos: A). Cuando el vehículo sea devuelto al conductor. B). Cuando ocurra un siniestro con el vehículo. C). Por terminación unilateral del ARRENDATARIO. D). Por detención del vehiculo por una autoridad competente evento en el cual EL ARRENDADOR exime de cualquier responsabilidad al ARRENDATARIO y enviará un nuevo vehículo para terminar el contrato de arrendamiento.",
          "",
          "CLÁUSULA DÉCIMA. RELACIÓN LABORAL. La prestación de servicio ejercida por el conductor no genera relación laboral con EL ARRENDATARIO, y en consecuencia tampoco el pago de prestaciones sociales y de ningún tipo de emolumentos. Cualquier reclamación laboral será asumida en su integridad por EL ARRENDADOR. ",
          "",
          "CLÁUSULA DÉCIMA PRIMERA. MÉRITO DE TÍTULO EJECUTIVO. El presente contrato presta mérito de Título Ejecutivo, para la exigencia judicial del cumplimiento de todas, alguna o algunas de las obligaciones de dar, hacer o no hacer que se deriven del mismo."
      ];

      doc.setFontSize(8);
      
      clausulas.forEach(clausula => {
          if (y > 280) {
              doc.addPage();
              y = 20;
              doc.setFontSize(8);
              addWatermark();
          }
          
          if (clausula === "") {
              y += 2;
          } else {
              y = addCompactText(doc, clausula, y, maxWidth, margin);
              y += 2;
          }
      });

      doc.setFontSize(9);

      // Datos compactos
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("VEHÍCULO", margin, y);
      doc.text("CONDUCTOR", margin + 60, y);
      doc.text("CONTRATO", margin + 120, y);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${contrato.marca} ${contrato.modelo}`, margin, y + 6);
      doc.text(contrato.nombre_conductor, margin + 60, y + 6);
      doc.text(`${contrato.tipo_contrato === 'horas' ? 'Horas:' : 'Días:'} ${contrato.cantidad}`, margin + 120, y + 6);
      
      doc.text(`Color: ${contrato.color}`, margin, y + 12);
      doc.text(`C.C: ${contrato.cedula_conductor}`, margin + 60, y + 12);
      
      doc.text(`Placa: ${contrato.placa}`, margin, y + 18);

      // Firmas
      y += 25;
      doc.setFontSize(8);
      doc.text(`Se firma en ${contrato.ciudad} a los ${dia} días de ${mes} de ${anio}.`, pageWidth / 2, y, { align: "center" });
      
      // Número de contrato en esquina inferior derecha
      doc.text(`Contrato No. ${contrato.id || 'N/A'}`, pageWidth - margin, y + 40, { align: "right" });

      doc.setFontSize(9);
      doc.text("___________________", margin, y + 25);
      doc.text("ARRENDADOR", margin, y + 29);
      doc.text("E.A. Alzate Ramirez", margin, y + 33);
      doc.text("C.C 3481992", margin, y + 36);
      
      doc.text("___________________", margin + 100, y + 25);
      doc.text("ARRENDATARIO", margin + 100, y + 29);
      doc.text(contrato.cedula_cliente.substring(0, 20), margin + 100, y + 37);
      doc.text(contrato.nombre_cliente.substring(0, 20), margin + 100, y + 33);

      // Firma digital
      const firmaX = margin + 100;
      const firmaY = y + 10;
      const firmaArrendadorY = y + 10;
      const huellaY = y + 37;

      doc.addImage(firmaDataURL, 'PNG', firmaX, firmaY, 30, 12);

      const firmaArrendadorImg = new Image();
      firmaArrendadorImg.src = firmaPath;

      const huellaImg = new Image();
      huellaImg.src = huellaPath;

      await Promise.all([
          new Promise(resolve => firmaArrendadorImg.onload = resolve),
          new Promise(resolve => huellaImg.onload = resolve)
      ]);

      doc.addImage(firmaArrendadorImg, 'JPEG', margin, firmaArrendadorY, 30, 15);
      doc.addImage(huellaImg, 'PNG', margin, huellaY, 18, 24);

      // Guardar PDF
      const nombreArchivo = `Contrato_${contrato.id || 'N/A'}_${contrato.nombre_cliente.replace(/ /g, "_")}_${dia}-${mes}-${anio}.pdf`;
      doc.save(nombreArchivo);

      // Enviar firma al servidor
      const guardadoExitoso = await guardarFirmaEnServidor(firmaDataURL);
      
      if (guardadoExitoso) {
          const mensajeExito = document.createElement('div');
          mensajeExito.className = 'alert alert-success mt-3';
          mensajeExito.innerHTML = `
              <h5>Contrato completado exitosamente</h5>
              <p>PDF "${nombreArchivo}" generado y firma almacenada.</p>
              <p>Duración: ${contrato.cantidad} ${contrato.tipo_contrato}</p>
              <p>Número de contrato: ${contrato.id || 'N/A'}</p>
          `;
          document.querySelector('.container').appendChild(mensajeExito);
          
          document.getElementById('btnGenerarPDF').disabled = true;
      }
  } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF: " + error.message);
  }
}
async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Enviar firma al servidor
async function guardarFirmaEnServidor(firmaDataURL) {
  try {
    const response = await fetch('/guardar-firma', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              token: token,
              firma: firmaDataURL,
              tipo_contrato: contrato.tipo_contrato,
              cantidad: contrato.cantidad,
              contrato_id: contrato.id // Asegurarnos de enviar el ID del contrato
          })
      });
      
      const result = await response.json();
      
      if (!result.success) {
          throw new Error(result.error || "Error al guardar la firma");
      }
      
      console.log("Firma guardada exitosamente en el servidor");
      return true;
  } catch (error) {
      console.error("Error al guardar firma:", error);
      return false;
  }
}


