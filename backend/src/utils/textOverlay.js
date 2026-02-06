/**
 * Generador de overlays de texto elegantes usando Canvas
 * Fallback para cuando FFmpeg no tiene drawtext disponible
 */
const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Generar imagen PNG con texto del precio
 */
async function generatePriceOverlay(price, productName) {
    const width = 1080;
    const height = 1920;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo transparente
    ctx.clearRect(0, 0, width, height);

    // Configuración del overlay de precio (esquina inferior derecha)
    // Ajustado para video 9:16
    const priceBoxWidth = 500; // Más ancho para asegurar visibilidad
    const priceBoxHeight = 140;
    const priceBoxX = width - priceBoxWidth - 40;
    const priceBoxY = height - priceBoxHeight - 200; // Subir un poco por el footer de TikTok

    // Fondo del precio con gradiente
    const gradient = ctx.createLinearGradient(
        priceBoxX,
        priceBoxY,
        priceBoxX + priceBoxWidth,
        priceBoxY + priceBoxHeight
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(1, 'rgba(30, 30, 30, 0.85)');

    // Dibujar rectángulo redondeado
    ctx.fillStyle = gradient;
    roundRect(ctx, priceBoxX, priceBoxY, priceBoxWidth, priceBoxHeight, 20);
    ctx.fill();

    // Borde brillante
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; // Dorado
    ctx.lineWidth = 3;
    roundRect(ctx, priceBoxX, priceBoxY, priceBoxWidth, priceBoxHeight, 20);
    ctx.stroke();

    // Texto del precio
    ctx.fillStyle = '#FFD700'; // Dorado
    ctx.font = 'bold 80px Arial'; // Letra más grande
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Formatear precio (asegurar que es numérico)
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    const priceText = `$${numericPrice.toLocaleString('es-MX')} MXN`;

    ctx.fillText(
        priceText,
        priceBoxX + priceBoxWidth / 2,
        priceBoxY + priceBoxHeight / 2
    );

    // Sombra para el texto (legibilidad)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Guardar como PNG temporal
    const tempPath = path.join(os.tmpdir(), `price_overlay_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(tempPath, buffer);

    return tempPath;
}

/**
 * Generar overlay con el nombre del producto (parte superior)
 */
async function generateProductNameOverlay(productName) {
    const width = 1080;
    const height = 1920;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    // Configuración del overlay de nombre
    const nameBoxWidth = 960;
    const nameBoxHeight = 200; // Un poco más alto para texto envuelto
    const nameBoxX = (width - nameBoxWidth) / 2;
    const nameBoxY = 150; // Margen superior seguro

    // Fondo semi-transparente
    const gradient = ctx.createLinearGradient(
        nameBoxX,
        nameBoxY,
        nameBoxX + nameBoxWidth,
        nameBoxY + nameBoxHeight
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(20, 20, 20, 0.7)');

    ctx.fillStyle = gradient;
    roundRect(ctx, nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight, 20);
    ctx.fill();

    // Texto del producto (truncado si es muy largo)
    const truncatedName = productName.length > 80
        ? productName.substring(0, 77) + '...'
        : productName;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 45px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Dibujar texto en múltiples líneas
    wrapText(
        ctx,
        truncatedName,
        nameBoxX + nameBoxWidth / 2,
        nameBoxY + nameBoxHeight / 2,
        nameBoxWidth - 40,
        55
    );

    // Guardar
    const tempPath = path.join(os.tmpdir(), `name_overlay_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(tempPath, buffer);

    return tempPath;
}

/**
 * Helper: Dibujar rectángulo redondeado
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Helper: Texto con line wrapping
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Dibujar líneas centradas
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
        ctx.fillText(line, x, startY + (i * lineHeight));
    });
}

module.exports = {
    generatePriceOverlay,
    generateProductNameOverlay,
};
