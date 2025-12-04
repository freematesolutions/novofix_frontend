import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen para optimizar el tamaño de subida
 * @param {File} imageFile - Archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<File>} - Imagen comprimida
 */
export async function compressImage(imageFile, options = {}) {
  // Si el archivo ya es pequeño (< 500KB), no comprimir
  if (imageFile.size < 500 * 1024) {
    return imageFile;
  }

  const defaultOptions = {
    maxSizeMB: 2, // Tamaño máximo en MB
    maxWidthOrHeight: 1920, // Máxima dimensión
    useWebWorker: true, // Usar Web Workers para no bloquear UI
    fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
    initialQuality: 0.85 // Calidad inicial (85%)
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    console.log(`🗜️ Compressing image: ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(imageFile, compressionOptions);
    
    const originalSizeMB = (imageFile.size / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    const reduction = (((imageFile.size - compressedFile.size) / imageFile.size) * 100).toFixed(1);
    
    console.log(`✅ Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reduction}% reduction)`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    // Si falla la compresión, devolver archivo original
    return imageFile;
  }
}

/**
 * Comprime múltiples imágenes en paralelo
 * @param {FileList|Array} imageFiles - Lista de archivos de imagen
 * @param {Object} options - Opciones de compresión
 * @param {Function} onProgress - Callback de progreso (opcional)
 * @returns {Promise<Array>} - Array de imágenes comprimidas
 */
export async function compressImages(imageFiles, options = {}, onProgress = null) {
  const files = Array.from(imageFiles);
  const compressed = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Solo comprimir imágenes
    if (file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file, options);
      compressed.push(compressedFile);
    } else {
      compressed.push(file);
    }
    
    // Notificar progreso
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        percentage: Math.round(((i + 1) / files.length) * 100)
      });
    }
  }
  
  return compressed;
}

/**
 * Valida el tamaño de un archivo
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {Object} - { valid: boolean, error: string|null, sizeMB: number }
 */
export function validateFileSize(file, maxSizeMB = 200) {
  const sizeMB = file.size / (1024 * 1024);
  
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB (tamaño: ${sizeMB.toFixed(2)}MB)`,
      sizeMB
    };
  }
  
  return { valid: true, error: null, sizeMB };
}

/**
 * Valida el tipo de archivo
 * @param {File} file - Archivo a validar
 * @param {Array<string>} allowedTypes - Tipos MIME permitidos
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export function validateFileType(file, allowedTypes = []) {
  if (allowedTypes.length === 0) {
    return { valid: true, error: null };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: "${file.type}". Tipos permitidos: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Valida múltiples archivos
 * @param {FileList|Array} files - Archivos a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} - Objeto con valid, errors y validFiles
 */
export function validateFiles(files, options = {}) {
  const {
    maxFiles = 10,
    maxSizeMB = 200,
    allowedTypes = []
  } = options;
  
  const fileArray = Array.from(files);
  const errors = [];
  const validFiles = [];
  
  // Validar cantidad
  if (fileArray.length > maxFiles) {
    errors.push(`Máximo ${maxFiles} archivos permitidos (seleccionados: ${fileArray.length})`);
    return { valid: false, errors, validFiles };
  }
  
  // Validar cada archivo
  for (const file of fileArray) {
    // Validar tamaño
    const sizeValidation = validateFileSize(file, maxSizeMB);
    if (!sizeValidation.valid) {
      errors.push(sizeValidation.error);
      continue;
    }
    
    // Validar tipo
    const typeValidation = validateFileType(file, allowedTypes);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
      continue;
    }
    
    validFiles.push(file);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}

/**
 * Genera URL de vista previa para un archivo
 * @param {File} file - Archivo
 * @returns {string} - URL de objeto para vista previa
 */
export function generatePreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * Libera URLs de vista previa
 * @param {Array} urls - URLs a liberar
 */
export function revokePreviewUrls(urls) {
  urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      console.warn('Failed to revoke URL:', url);
    }
  });
}

/**
 * Formatea bytes a formato legible
 * @param {number} bytes - Bytes
 * @param {number} decimals - Decimales
 * @returns {string} - Tamaño formateado
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
