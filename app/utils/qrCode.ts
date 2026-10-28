/*
 * QR-коды коротких ссылок: SVG (для типографии) и PNG (для печати), по желанию —
 * со знаком НОМБ в центре. Знак закрывает часть кода, поэтому с ним уровень
 * коррекции H (до 30% повреждений). Проверено декодером: знак на 22% ширины
 * считывается уверенно, в том числе с картинки 300 px.
 */
import QRCode from 'qrcode';
import logoSvg from '~/assets/qr-logo.svg?raw';

/** Доля ширины кода под знак */
const LOGO_RATIO = 0.22;

export const buildQrSvg = async (text: string, withLogo: boolean) => {
  const svg = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: withLogo ? 'H' : 'M',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
  if (!withLogo) return svg;

  const size = Number(svg.match(/viewBox="0 0 (\d+) \d+"/)?.[1]);
  if (!size) return svg;
  const logoSize = size * LOGO_RATIO;
  const pad = size * 0.02;
  const pos = (size - logoSize) / 2;
  // Белая подложка отделяет знак от модулей кода
  const plate = `<rect x="${pos - pad}" y="${pos - pad}" width="${logoSize + 2 * pad}" height="${logoSize + 2 * pad}" rx="${pad * 2}" fill="#ffffff"/>`;
  const logo = logoSvg.replace('<svg', `<svg x="${pos}" y="${pos}" width="${logoSize}" height="${logoSize}"`);
  return svg.replace('</svg>', `${plate}${logo}</svg>`);
};

/** Растрирует SVG в PNG нужной ширины (data URL) */
export const svgToPng = async (svg: string, width: number) => {
  const sized = svg.replace('<svg', `<svg width="${width}" height="${width}"`);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, width);
  context.drawImage(image, 0, 0, width, width);
  return canvas.toDataURL('image/png');
};
