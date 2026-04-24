/* novedad-publica.js - Formulario público de novedades */

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcXN1cnh4eGF1ZG51dHN5ZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjExMDUsImV4cCI6MjA5MTI5NzEwNX0.yKcRgTad3cb2otQ7wtjkRETj3P-3THB9v8csluebALg';

const INSUMOS_OPCIONES = ['ETIQUETA','PLACA','PLASTIFLECHA','TRAZABILIDAD','ELASTICO','ARGOLLA','TENSOR','FRAMILON','TRANSFER','MARQUILLA','CIERRE','CORDON','HILADILLA','HERRAJE','HEBILLA','ABROCHADURA','APLIQUE','BOTON','GANCHO','PUNTERAS','COPA','ENCAJE','VARILLA','ENTRETELA','VELCRO','OJALES','REMACHES','OTROS'];
const CORTE_OPCIONES = ['PIEZAS', 'SESGO', 'ENTRETELA'];
const TELAS_OPCIONES = ['ROTOS', 'MANCHAS', 'HIDOS', 'MAREADA', 'TONO', 'SE DESTIÑE', 'SE ROMPE', 'OTROS'];

const FormState = {
    currentStep: 1,
    opData: null,
    selectedFile: null,
    isSubmitting: false
};

const ValidationRules = {
    op: { pattern: /^[0-9]+$/, message: 'El número de OP solo debe contener números' },
    descripcion: { minLength: 10, maxLength: 1000, message: 'La descripción debe tener entre 10 y 1000 caracteres' },
    imagen: { maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif'], message: 'El archivo debe ser una imagen JPG, PNG o GIF menor a 5MB' }
};

let CURVAS_CACHE = {};

document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    attachEventListeners();
});

function initializeForm() {
    updateStepIndicator(1);
    document.getElementById('opInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btnBuscarOP').click();
        }
    });
}

function attachEventListeners() {
    document.getElementById('btnBuscarOP').addEventListener('click', buscarOP);
    document.getElementById('area').addEventListener('change', handleAreaChange);
    document.getElementById('opInput').addEventListener('input', validateOPInput);
    document.getElementById('descripcion').addEventListener('input', validateDescripcion);
    document.getElementById('imagen').addEventListener('change', handleFileSelect);
    
    const fileLabel = document.querySelector('.file-upload-label');
    fileLabel.addEventListener('dragover', handleDragOver);
    fileLabel.addEventListener('dragleave', handleDragLeave);
    fileLabel.addEventListener('drop', handleFileDrop);
    
    document.getElementById('btnVolver').addEventListener('click', volverBusqueda);
    document.getElementById('btnContinuar').addEventListener('click', continuarAdicional);
    document.getElementById('btnVolverDetalles').addEventListener('click', volverDetalles);
    document.getElementById('novedadForm').addEventListener('submit', handleSubmit);
}

function updateStepIndicator(step) {
    FormState.currentStep = step;
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step${i}`);
        stepElement.classList.remove('active', 'completed');
        if (i < step) stepElement.classList.add('completed');
        else if (i === step) stepElement.classList.add('active');
    }
}

function validateOPInput(e) {
    const input = e.target;
    const value = input.value.trim();
    const errorElement = document.getElementById('opError');
    input.value = value.replace(/[^0-9]/g, '');
    if (value && !ValidationRules.op.pattern.test(value)) {
        showError(input, errorElement, ValidationRules.op.message);
        return false;
    } else {
        hideError(input, errorElement);
        return true;
    }
}

function validateDescripcion(e) {
    const textarea = e.target;
    const value = textarea.value.trim();
    const errorElement = document.getElementById('descripcionError');
    
    // Solo validar si hay contenido
    if (value.length > 0 && value.length < 10) {
        showError(textarea, errorElement, `Faltan ${10 - value.length} caracteres`);
        return false;
    } else if (value.length > ValidationRules.descripcion.maxLength) {
        showError(textarea, errorElement, 'Has excedido el límite de caracteres');
        return false;
    } else {
        hideError(textarea, errorElement);
        return true;
    }
}

function showError(input, errorElement, message) {
    input.classList.add('error');
    input.classList.remove('success');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function hideError(input, errorElement) {
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.remove('show');
}

async function buscarOP() {
    const opInput = document.getElementById('opInput');
    const op = opInput.value.trim();
    const btnBuscar = document.getElementById('btnBuscarOP');
    
    if (!op) {
        showError(opInput, document.getElementById('opError'), 'Por favor ingresa un número de OP');
        opInput.focus();
        return;
    }
    
    if (!ValidationRules.op.pattern.test(op)) {
        showError(opInput, document.getElementById('opError'), ValidationRules.op.message);
        opInput.focus();
        return;
    }
    
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<div class="spinner"></div><span>Buscando...</span>';
    
    try {
        const url = `${CONFIG.FUNCTIONS_URL}/query?table=SISPRO&eq_OP=${encodeURIComponent(op)}`;
        console.log('[novedad-publica] Buscando OP:', op);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            }
        });
        
        if (!response.ok) throw new Error('Error al buscar la OP');
        
        const data = await response.json();
        const records = (data && data.data) ? data.data : data;
        
        console.log('[novedad-publica] Registros encontrados:', records.length);
        
        if (records && records.length > 0) {
            const record = records[0];
            FormState.opData = {
                lote: record.OP || record.LOTE || op,
                referencia: record.Ref || record.REFERENCIA || '',
                color: record.Color || record.COLOR || '',
                cantidad: record.InvPlanta || record.CANTIDAD || 0,
                planta: record.NombrePlanta || record.PLANTA || '',
                salida: record.FSalidaConf || record.SALIDA || '',
                proceso: record.Proceso || record.PROCESO || '',
                prenda: record.Descripcion || record.PRENDA || '',
                linea: record.Cuento || record.LINEA || '',
                genero: record.Genero || record.GENERO || '',
                tejido: record['Tipo Tejido'] || record.TEJIDO || ''
            };
            
            console.log('[novedad-publica] Datos mapeados:', FormState.opData);
            mostrarInformacionProducto(FormState.opData);
            mostrarSeccionDetalles();
            updateStepIndicator(2);
            hideError(opInput, document.getElementById('opError'));
        } else {
            showError(opInput, document.getElementById('opError'), `No se encontró información para la OP: ${op}`);
        }
    } catch (error) {
        console.error('[novedad-publica] Error al buscar OP:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al buscar la OP. Por favor intenta nuevamente.',
            confirmButtonColor: '#673ab7'
        });
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<i class="fas fa-search"></i><span>Buscar OP</span>';
    }
}

function mostrarInformacionProducto(data) {
    document.getElementById('infoOP').textContent = data.lote;
    document.getElementById('infoReferencia').textContent = data.referencia;
    document.getElementById('infoCantidad').textContent = data.cantidad;
    document.getElementById('infoPlanta').textContent = data.planta;
}

function mostrarSeccionDetalles() {
    document.getElementById('seccionBusqueda').classList.add('hidden');
    document.getElementById('seccionDetalles').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverBusqueda() {
    document.getElementById('seccionDetalles').classList.add('hidden');
    document.getElementById('seccionBusqueda').classList.remove('hidden');
    updateStepIndicator(1);
    document.getElementById('area').value = '';
    document.getElementById('tipoNovedad').value = '';
    document.getElementById('tipoNovedadGroup').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function continuarAdicional() {
    // Validar que se haya seleccionado un área
    const area = document.getElementById('area').value;
    if (!area) {
        showError(document.getElementById('area'), document.getElementById('areaError'), 'Por favor selecciona un área');
        return;
    }
    
    // Validar tipo de novedad si es visible
    const tipoGroup = document.getElementById('tipoNovedadGroup');
    if (!tipoGroup.classList.contains('hidden')) {
        const tipo = document.getElementById('tipoNovedad').value;
        if (!tipo) {
            showError(document.getElementById('tipoNovedad'), document.getElementById('tipoError'), 'Por favor selecciona un tipo de novedad');
            return;
        }
    }
    
    // Mostrar sección adicional
    document.getElementById('seccionDetalles').classList.add('hidden');
    document.getElementById('seccionAdicional').classList.remove('hidden');
    updateStepIndicator(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverDetalles() {
    document.getElementById('seccionAdicional').classList.add('hidden');
    document.getElementById('seccionDetalles').classList.remove('hidden');
    updateStepIndicator(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// CAMPOS DINÁMICOS
function _buildOptions(lista) {
    return '<option value="" disabled selected>Seleccione...</option>' + lista.map(o => {
        const displayText = o.charAt(0) + o.slice(1).toLowerCase();
        return `<option value="${o}">${displayText}</option>`;
    }).join('');
}

function _crearFilaDinamica(opciones, listId, removeFn) {
    console.log('[_crearFilaDinamica] Creando fila para:', listId);
    const lista = document.getElementById(listId);
    console.log('[_crearFilaDinamica] Lista encontrada:', !!lista);
    
    if (!lista) {
        console.error('[_crearFilaDinamica] ERROR: No se encontró el elemento con ID:', listId);
        return null;
    }
    
    const fila = document.createElement('div');
    fila.className = 'dynamic-item';
    
    let labelTipo = 'Tipo';
    let iconoTipo = 'fa-tag';
    if (listId.includes('corte')) {
        labelTipo = 'Tipo de Corte';
        iconoTipo = 'fa-cut';
    } else if (listId.includes('tela')) {
        labelTipo = 'Tipo de Imperfección';
        iconoTipo = 'fa-exclamation-triangle';
    } else if (listId.includes('insumo')) {
        labelTipo = 'Tipo de Insumo';
        iconoTipo = 'fa-box';
    }
    
    console.log('[_crearFilaDinamica] Label tipo:', labelTipo);
    
    fila.innerHTML = `
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">${labelTipo} <span class="required">*</span></label>
            <div class="input-wrapper">
                <i class="fas ${iconoTipo} input-icon"></i>
                <select class="form-control item-tipo" required>${_buildOptions(opciones)}</select>
            </div>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Cantidad <span class="required">*</span></label>
            <div class="input-wrapper">
                <i class="fas fa-hashtag input-icon"></i>
                <input type="number" class="form-control item-cantidad" min="1" placeholder="Cantidad" required>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="${removeFn}(this)" title="Eliminar">
            <i class="fas fa-times"></i>
        </button>
    `;
    lista.appendChild(fila);
    console.log('[_crearFilaDinamica] Fila agregada. Total de filas:', lista.children.length);
    _actualizarBotonesEliminar(listId);
    return fila;
}

function _actualizarBotonesEliminar(listId) {
    const lista = document.getElementById(listId);
    const filas = lista.querySelectorAll('.dynamic-item');
    const hayMultiples = filas.length > 1;
    filas.forEach(fila => {
        const btn = fila.querySelector('.btn-remove-item');
        btn.style.display = hayMultiples ? 'flex' : 'none';
    });
}

function agregarFilaInsumo() { 
    console.log('[agregarFilaInsumo] Llamada a agregar fila de insumo');
    _crearFilaDinamica(INSUMOS_OPCIONES, 'insumosList', 'eliminarFilaInsumo'); 
}
function eliminarFilaInsumo(btn) {
    console.log('[eliminarFilaInsumo] Llamada a eliminar fila');
    const lista = document.getElementById('insumosList');
    if (lista.children.length <= 1) return;
    btn.closest('.dynamic-item').remove();
    _actualizarBotonesEliminar('insumosList');
}

function agregarFilaCorte() { 
    console.log('[agregarFilaCorte] Llamada a agregar fila de corte');
    _crearFilaDinamica(CORTE_OPCIONES, 'corteList', 'eliminarFilaCorte'); 
}
function eliminarFilaCorte(btn) {
    console.log('[eliminarFilaCorte] Llamada a eliminar fila');
    const lista = document.getElementById('corteList');
    if (lista.children.length <= 1) return;
    btn.closest('.dynamic-item').remove();
    _actualizarBotonesEliminar('corteList');
}

function agregarFilaTela() { 
    console.log('[agregarFilaTela] Llamada a agregar fila de tela');
    _crearFilaDinamica(TELAS_OPCIONES, 'telasList', 'eliminarFilaTela'); 
}
function eliminarFilaTela(btn) {
    console.log('[eliminarFilaTela] Llamada a eliminar fila');
    const lista = document.getElementById('telasList');
    if (lista.children.length <= 1) return;
    btn.closest('.dynamic-item').remove();
    _actualizarBotonesEliminar('telasList');
}

function handleAreaChange(e) {
    const area = e.target.value;
    console.log('[handleAreaChange] ===== INICIO =====');
    console.log('[handleAreaChange] Área seleccionada:', area);
    
    const tipoGroup = document.getElementById('tipoNovedadGroup');
    const tipoSelect = document.getElementById('tipoNovedad');
    
    console.log('[handleAreaChange] tipoGroup encontrado:', !!tipoGroup);
    console.log('[handleAreaChange] tipoSelect encontrado:', !!tipoSelect);
    
    if (!tipoGroup) {
        console.error('[handleAreaChange] ERROR: No se encontró tipoNovedadGroup');
        return;
    }
    
    // Ocultar todos los grupos
    const insumoGroup = document.getElementById('tipoInsumoGroup');
    const corteGroup = document.getElementById('tipoCorteGroup');
    const telasGroup = document.getElementById('tipoTelasGroup');
    const codigosGroup = document.getElementById('tipoCodigosGroup');
    const cantidadGroup = document.getElementById('cantidadNormalGroup');
    
    console.log('[handleAreaChange] Grupos encontrados:');
    console.log('  - insumoGroup:', !!insumoGroup);
    console.log('  - corteGroup:', !!corteGroup);
    console.log('  - telasGroup:', !!telasGroup);
    console.log('  - codigosGroup:', !!codigosGroup);
    console.log('  - cantidadGroup:', !!cantidadGroup);
    
    if (insumoGroup) insumoGroup.classList.add('hidden');
    if (corteGroup) corteGroup.classList.add('hidden');
    if (telasGroup) telasGroup.classList.add('hidden');
    if (codigosGroup) codigosGroup.classList.add('hidden');
    if (cantidadGroup) cantidadGroup.classList.add('hidden');
    
    if (area === 'DISEÑO') {
        console.log('[handleAreaChange] Procesando área DISEÑO');
        tipoGroup.classList.add('hidden');
        tipoSelect.required = false;
        
    } else if (area === 'TELAS') {
        console.log('[handleAreaChange] Procesando área TELAS');
        tipoGroup.classList.remove('hidden');
        tipoSelect.value = 'IMPERFECTO';
        tipoSelect.required = true;
        tipoSelect.disabled = true;
        if (telasGroup) {
            console.log('[handleAreaChange] Mostrando grupo de telas');
            telasGroup.classList.remove('hidden');
            const telasList = document.getElementById('telasList');
            console.log('[handleAreaChange] telasList encontrado:', !!telasList);
            console.log('[handleAreaChange] telasList.children.length:', telasList?.children.length);
            if (telasList && telasList.children.length === 0) {
                console.log('[handleAreaChange] Agregando primera fila de tela');
                agregarFilaTela();
            }
        }
        
    } else if (area === 'INSUMOS') {
        console.log('[handleAreaChange] Procesando área INSUMOS');
        tipoGroup.classList.remove('hidden');
        tipoSelect.required = true;
        tipoSelect.disabled = false;
        if (insumoGroup) {
            console.log('[handleAreaChange] Mostrando grupo de insumos');
            insumoGroup.classList.remove('hidden');
            const insumosList = document.getElementById('insumosList');
            console.log('[handleAreaChange] insumosList encontrado:', !!insumosList);
            console.log('[handleAreaChange] insumosList.children.length:', insumosList?.children.length);
            if (insumosList && insumosList.children.length === 0) {
                console.log('[handleAreaChange] Agregando primera fila de insumo');
                agregarFilaInsumo();
            }
        }
        
    } else if (area === 'CORTE') {
        console.log('[handleAreaChange] Procesando área CORTE');
        tipoGroup.classList.remove('hidden');
        tipoSelect.required = true;
        tipoSelect.disabled = false;
        if (corteGroup) {
            console.log('[handleAreaChange] Mostrando grupo de corte');
            corteGroup.classList.remove('hidden');
            const corteList = document.getElementById('corteList');
            console.log('[handleAreaChange] corteList encontrado:', !!corteList);
            console.log('[handleAreaChange] corteList.children.length:', corteList?.children.length);
            if (corteList && corteList.children.length === 0) {
                console.log('[handleAreaChange] Agregando primera fila de corte');
                agregarFilaCorte();
            }
        }
        
    } else if (area === 'CODIGOS') {
        console.log('[handleAreaChange] Procesando área CODIGOS');
        tipoGroup.classList.remove('hidden');
        tipoSelect.required = true;
        tipoSelect.disabled = false;
        if (codigosGroup) {
            console.log('[handleAreaChange] Mostrando grupo de códigos');
            codigosGroup.classList.remove('hidden');
            cargarCurvaParaCodigos();
        }
        
    } else if (area !== '') {
        console.log('[handleAreaChange] Procesando área OTROS:', area);
        tipoGroup.classList.remove('hidden');
        tipoSelect.required = true;
        tipoSelect.disabled = false;
        if (cantidadGroup) {
            console.log('[handleAreaChange] Mostrando campo de cantidad normal');
            cantidadGroup.classList.remove('hidden');
        }
    }
    
    if (area) hideError(e.target, document.getElementById('areaError'));
    console.log('[handleAreaChange] ===== FIN =====');
}

async function cargarCurvaParaCodigos() {
    const op = FormState.opData?.lote;
    if (!op) {
        Swal.fire({ title: 'Error', text: 'No se encontró la OP del producto.', icon: 'error', confirmButtonColor: '#673ab7' });
        return;
    }
    try {
        if (CURVAS_CACHE[op]) {
            poblarCodigosDesdeDetalles(CURVAS_CACHE[op].detalles);
            return;
        }
        const url = `${CONFIG.FUNCTIONS_URL}/query?table=CURVA&eq_op=${encodeURIComponent(op)}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
        if (!response.ok) throw new Error('Error al cargar curva');
        const data = await response.json();
        const records = (data && data.data) ? data.data : data;
        const curva = Array.isArray(records) ? records[0] : records;
        if (!curva || !curva.detalles || curva.detalles.length === 0) {
            Swal.fire({ title: 'Sin curva', html: `No se encontró curva para la OP: <strong>${op}</strong>`, icon: 'warning', confirmButtonColor: '#673ab7' });
            return;
        }
        CURVAS_CACHE[op] = curva;
        poblarCodigosDesdeDetalles(curva.detalles);
    } catch (error) {
        console.error('[códigos] Error:', error);
        Swal.fire({ title: 'Error', text: 'No se pudo cargar la curva. Intente nuevamente.', icon: 'error', confirmButtonColor: '#673ab7' });
    }
}

function poblarCodigosDesdeDetalles(detalles) {
    const lista = document.getElementById('codigosList');
    lista.innerHTML = '';
    const tallasUnicas = [...new Set(detalles.map(d => d[3]))].sort();
    const coloresUnicos = [...new Set(detalles.map(d => d[1]))].sort();
    const cantidadTotal = detalles.reduce((sum, d) => sum + Number(d[4]), 0);
    window.CODIGOS_TALLAS = tallasUnicas;
    window.CODIGOS_COLORES = coloresUnicos;
    window.CODIGOS_DETALLES = detalles;
    window.CODIGOS_CANTIDAD_TOTAL = cantidadTotal;
    document.getElementById('codigosCantidadTotal').value = cantidadTotal;
    agregarFilaCodigo();
}

function handleCodigosTipoChange() {
    const tipo = document.getElementById('codigosTipoSolicitud').value;
    const loteCompletoGroup = document.getElementById('codigosLoteCompletoGroup');
    const unidadesGroup = document.getElementById('codigosUnidadesGroup');
    if (tipo === 'LOTE_COMPLETO') {
        loteCompletoGroup.classList.remove('hidden');
        unidadesGroup.classList.add('hidden');
    } else if (tipo === 'UNIDADES') {
        loteCompletoGroup.classList.add('hidden');
        unidadesGroup.classList.remove('hidden');
    } else {
        loteCompletoGroup.classList.add('hidden');
        unidadesGroup.classList.add('hidden');
    }
}

function agregarFilaCodigo() {
    const lista = document.getElementById('codigosList');
    const fila = document.createElement('div');
    fila.className = 'dynamic-item';
    const tallasOpts = (window.CODIGOS_TALLAS || []).map(t => `<option value="${t}">${t}</option>`).join('');
    const coloresOpts = (window.CODIGOS_COLORES || []).map(c => `<option value="${c}">${c}</option>`).join('');
    fila.innerHTML = `
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Talla <span class="required">*</span></label>
            <div class="input-wrapper">
                <i class="fas fa-ruler input-icon"></i>
                <select class="form-control codigo-talla" onchange="actualizarMaximoCodigo(this)" required>
                    <option value="" disabled selected>Seleccione...</option>${tallasOpts}
                </select>
            </div>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Color <span class="required">*</span></label>
            <div class="input-wrapper">
                <i class="fas fa-palette input-icon"></i>
                <select class="form-control codigo-color" onchange="actualizarMaximoCodigo(this)" required>
                    <option value="" disabled selected>Seleccione...</option>${coloresOpts}
                </select>
            </div>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Cantidad <span class="required">*</span></label>
            <div class="input-wrapper">
                <i class="fas fa-hashtag input-icon"></i>
                <input type="number" class="form-control codigo-cantidad" min="1" placeholder="Máx: -" required>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="eliminarFilaCodigo(this)" title="Eliminar">
            <i class="fas fa-times"></i>
        </button>
    `;
    lista.appendChild(fila);
    _actualizarBotonesEliminar('codigosList');
}

function actualizarMaximoCodigo(selectElement) {
    const fila = selectElement.closest('.dynamic-item');
    const talla = fila.querySelector('.codigo-talla').value;
    const color = fila.querySelector('.codigo-color').value;
    const inputCantidad = fila.querySelector('.codigo-cantidad');
    if (!talla || !color) {
        inputCantidad.placeholder = 'Máx: -';
        inputCantidad.max = '';
        return;
    }
    const detalle = (window.CODIGOS_DETALLES || []).find(d => d[3] === talla && d[1] === color);
    if (detalle) {
        const maximo = detalle[4];
        inputCantidad.max = maximo;
        inputCantidad.placeholder = `Máx: ${maximo}`;
    } else {
        inputCantidad.placeholder = 'Máx: -';
        inputCantidad.max = '';
    }
}

function eliminarFilaCodigo(btn) {
    const lista = document.getElementById('codigosList');
    if (lista.children.length <= 1) return;
    btn.closest('.dynamic-item').remove();
    _actualizarBotonesEliminar('codigosList');
}

function _recolectarFilas(listId) {
    const filas = document.querySelectorAll(`#${listId} .dynamic-item`);
    const datos = [];
    let valido = true;
    filas.forEach(fila => {
        const tipo = fila.querySelector('.item-tipo').value;
        const cant = fila.querySelector('.item-cantidad').value;
        if (!tipo || !cant) { valido = false; return; }
        datos.push({ tipo, cantidad: cant });
    });
    return valido ? datos : null;
}

function _recolectarCodigos() {
    const filas = document.querySelectorAll('#codigosList .dynamic-item');
    const datos = [];
    let valido = true;
    filas.forEach(fila => {
        const talla = fila.querySelector('.codigo-talla').value;
        const color = fila.querySelector('.codigo-color').value;
        const cant = fila.querySelector('.codigo-cantidad').value;
        if (!talla || !color || !cant) { valido = false; return; }
        datos.push({ talla, color, cantidad: cant });
    });
    return valido ? datos : null;
}

window.agregarFilaInsumo = agregarFilaInsumo;
window.eliminarFilaInsumo = eliminarFilaInsumo;
window.agregarFilaCorte = agregarFilaCorte;
window.eliminarFilaCorte = eliminarFilaCorte;
window.agregarFilaTela = agregarFilaTela;
window.eliminarFilaTela = eliminarFilaTela;
window.agregarFilaCodigo = agregarFilaCodigo;
window.eliminarFilaCodigo = eliminarFilaCodigo;
window.actualizarMaximoCodigo = actualizarMaximoCodigo;
window.handleCodigosTipoChange = handleCodigosTipoChange;


// MANEJO DE ARCHIVOS
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) validateAndPreviewFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#673ab7';
    e.currentTarget.style.background = '#f8f9fa';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#dadce0';
    e.currentTarget.style.background = '#fff';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#dadce0';
    e.currentTarget.style.background = '#fff';
    const file = e.dataTransfer.files[0];
    if (file) {
        const input = document.getElementById('imagen');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        validateAndPreviewFile(file);
    }
}

function validateAndPreviewFile(file) {
    const errorElement = document.getElementById('imagenError');
    const input = document.getElementById('imagen');
    if (!ValidationRules.imagen.allowedTypes.includes(file.type)) {
        showError(input, errorElement, 'Solo se permiten imágenes JPG, PNG o GIF');
        input.value = '';
        return;
    }
    if (file.size > ValidationRules.imagen.maxSize) {
        showError(input, errorElement, 'La imagen no debe superar los 5MB');
        input.value = '';
        return;
    }
    FormState.selectedFile = file;
    hideError(input, errorElement);
    showFilePreview(file);
}

function showFilePreview(file) {
    const preview = document.getElementById('filePreview');
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    preview.innerHTML = `
        <div class="file-preview-info">
            <div class="file-preview-icon"><i class="fas fa-image"></i></div>
            <div>
                <div class="file-preview-name">${file.name}</div>
                <div style="font-size: 0.75rem; color: #5f6368; margin-top: 4px;">${sizeInMB} MB</div>
            </div>
        </div>
        <button type="button" class="file-preview-remove" onclick="removeFile()">
            <i class="fas fa-times"></i>
        </button>
    `;
    preview.classList.remove('hidden');
}

function removeFile() {
    FormState.selectedFile = null;
    document.getElementById('imagen').value = '';
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('filePreview').innerHTML = '';
}

// VALIDACIÓN Y ENVÍO
function validateForm() {
    let isValid = true;
    const errors = [];
    const area = document.getElementById('area').value;
    if (!area) {
        showError(document.getElementById('area'), document.getElementById('areaError'), 'Por favor selecciona un área');
        errors.push('Área es requerida');
        isValid = false;
    }
    const tipoGroup = document.getElementById('tipoNovedadGroup');
    if (!tipoGroup.classList.contains('hidden')) {
        const tipo = document.getElementById('tipoNovedad').value;
        if (!tipo) {
            showError(document.getElementById('tipoNovedad'), document.getElementById('tipoError'), 'Por favor selecciona un tipo de novedad');
            errors.push('Tipo de novedad es requerido');
            isValid = false;
        }
    }
    // Descripción es opcional, solo validar si tiene contenido
    const descripcion = document.getElementById('descripcion').value.trim();
    if (descripcion.length > 0 && descripcion.length < 10) {
        showError(document.getElementById('descripcion'), document.getElementById('descripcionError'), 'La descripción debe tener al menos 10 caracteres');
        errors.push('Descripción muy corta');
        isValid = false;
    }
    return { isValid, errors };
}

async function handleSubmit(e) {
    e.preventDefault();
    if (FormState.isSubmitting) return;
    const validation = validateForm();
    if (!validation.isValid) {
        Swal.fire({ icon: 'warning', title: 'Formulario incompleto', text: 'Por favor completa todos los campos requeridos', confirmButtonColor: '#673ab7' });
        return;
    }
    const result = await Swal.fire({
        icon: 'question', title: '¿Enviar reporte?', text: 'Verifica que toda la información sea correcta',
        showCancelButton: true, confirmButtonColor: '#673ab7', cancelButtonColor: '#5f6368',
        confirmButtonText: 'Sí, enviar', cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    FormState.isSubmitting = true;
    updateStepIndicator(3);
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner"></div><span>Enviando...</span>';
    try {
        const formData = prepareFormData();
        const response = await enviarNovedad(formData);
        if (response.success) {
            await Swal.fire({
                icon: 'success', title: '¡Reporte enviado!',
                html: `Tu novedad ha sido registrada exitosamente.<br><strong>ID: ${response.id || response.ID_NOVEDAD}</strong>`,
                confirmButtonColor: '#673ab7'
            });
            if (FormState.selectedFile && response.id) uploadImagenAsync(FormState.selectedFile, response.id);
            resetForm();
        } else {
            throw new Error(response.message || 'Error al enviar el reporte');
        }
    } catch (error) {
        console.error('[novedad-publica] Error al enviar novedad:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Ocurrió un error al enviar el reporte. Por favor intenta nuevamente.', confirmButtonColor: '#673ab7' });
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar Reporte</span>';
        updateStepIndicator(2);
    } finally {
        FormState.isSubmitting = false;
    }
}

function prepareFormData() {
    const area = document.getElementById('area').value;
    const tipoNovedad = document.getElementById('tipoNovedad').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const descripcionSanitizada = sanitizeInput(descripcion);
    let cantidadSolicitada = 0;
    let tipoDetalle = null;
    
    if (area === 'TELAS') {
        const datos = _recolectarFilas('telasList');
        if (datos) {
            tipoDetalle = { items: datos.map(i => ({ tipo: i.tipo, cantidad: Number(i.cantidad) })) };
            cantidadSolicitada = datos.reduce((s, i) => s + Number(i.cantidad), 0);
        }
    } else if (area === 'INSUMOS') {
        const datos = _recolectarFilas('insumosList');
        if (datos) {
            tipoDetalle = { items: datos.map(i => ({ tipo: i.tipo, cantidad: Number(i.cantidad) })) };
            cantidadSolicitada = datos.reduce((s, i) => s + Number(i.cantidad), 0);
        }
    } else if (area === 'CORTE') {
        const datos = _recolectarFilas('corteList');
        if (datos) {
            tipoDetalle = { items: datos.map(i => ({ tipo: i.tipo, cantidad: Number(i.cantidad) })) };
            cantidadSolicitada = datos.reduce((s, i) => s + Number(i.cantidad), 0);
        }
    } else if (area === 'CODIGOS') {
        const tipoSolicitud = document.getElementById('codigosTipoSolicitud').value;
        if (tipoSolicitud === 'LOTE_COMPLETO') {
            const cantidadInput = document.getElementById('codigosCantidadTotal');
            cantidadSolicitada = Number(cantidadInput.value) || 0;
            tipoDetalle = { tipo_solicitud: 'LOTE_COMPLETO', cantidad_total: cantidadSolicitada };
        } else if (tipoSolicitud === 'UNIDADES') {
            const datos = _recolectarCodigos();
            if (datos) {
                tipoDetalle = { tipo_solicitud: 'UNIDADES', items: datos.map(i => ({ talla: i.talla, color: i.color, cantidad: Number(i.cantidad) })) };
                cantidadSolicitada = datos.reduce((s, i) => s + Number(i.cantidad), 0);
            }
        }
    } else if (area !== 'DISEÑO' && area !== '') {
        const cantidadInput = document.getElementById('cantidadNormal');
        cantidadSolicitada = Number(cantidadInput.value) || 0;
    }
    
    return {
        hoja: 'NOVEDADES', fecha: new Date().toISOString().split('T')[0],
        lote: FormState.opData.lote, referencia: FormState.opData.referencia, cantidad: FormState.opData.cantidad,
        planta: FormState.opData.planta, salida: FormState.opData.salida, linea: FormState.opData.linea,
        proceso: FormState.opData.proceso, prenda: FormState.opData.prenda, genero: FormState.opData.genero,
        tejido: FormState.opData.tejido, area: area, tipoNovedad: tipoNovedad || null, tipoDetalle: tipoDetalle,
        descripcion: descripcionSanitizada, cantidadSolicitada: cantidadSolicitada, imagen: ''
    };
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

async function enviarNovedad(data) {
    console.log('[novedad-publica] Enviando datos:', data);
    const response = await fetch(`${CONFIG.FUNCTIONS_URL}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error en el servidor'}`);
    }
    return await response.json();
}

async function uploadImagenAsync(file, idNovedad) {
    console.log('[novedad-publica] Subiendo imagen para ID:', idNovedad);
    try {
        const fileData = await fileToBase64(file);
        const payload = { accion: 'SUBIR_DRIVE', idNovedad: idNovedad, hoja: 'NOVEDADES', base64: fileData.base64, mimeType: fileData.mimeType, fileName: fileData.fileName };
        const response = await fetch(GAS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('Error al subir imagen');
        const result = await response.json();
        console.log('[novedad-publica] Imagen subida:', result.url);
    } catch (error) {
        console.error('[novedad-publica] Error al subir imagen:', error);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            try {
                const MAX_W = 1280;
                let w = img.width, h = img.height;
                if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                const quality = w > 800 ? 0.7 : 0.8;
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, mimeType: 'image/jpeg', fileName: file.name.replace(/\.[^.]+$/, '.jpg') });
            } catch (e) { reject(e); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar la imagen')); };
        img.src = url;
    });
}

function resetForm() {
    FormState.currentStep = 1;
    FormState.opData = null;
    FormState.selectedFile = null;
    FormState.isSubmitting = false;
    document.getElementById('novedadForm').reset();
    document.getElementById('seccionDetalles').classList.add('hidden');
    document.getElementById('seccionAdicional').classList.add('hidden');
    document.getElementById('seccionBusqueda').classList.remove('hidden');
    document.getElementById('tipoNovedadGroup').classList.add('hidden');
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('descripcion').value = '';
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar Reporte</span>';
    updateStepIndicator(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.removeFile = removeFile;
