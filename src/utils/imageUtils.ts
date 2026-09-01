/**
 * Utilitários para processamento e compressão de imagens no navegador.
 * Garante que fotos tiradas por câmeras de celular (que chegam a 10MB+) sejam
 * compactadas de forma nítida e eficiente (~80-150KB) para salvar no IndexedDB e Nuvem.
 */

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<ProcessedImageResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do Canvas'));
          return;
        }

        // Draw and compress to JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate size
        const head = 'data:image/jpeg;base64,';
        const sizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);

        resolve({
          dataUrl,
          width,
          height,
          sizeBytes
        });
      };

      img.onerror = () => {
        reject(new Error('Falha ao decodificar a imagem'));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem'));
    reader.readAsDataURL(file);
  });
};
