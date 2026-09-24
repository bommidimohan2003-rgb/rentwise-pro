/**
 * Client-side image compression utility.
 * Resizes high-resolution mobile camera photos (e.g. 4000x3000 -> 1200px max)
 * and applies JPEG compression to ensure fast uploads and safe database payloads.
 */
export async function compressImage(
  input: File | string,
  maxDimension = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof input === "string" ? input : "");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("[compressImage] Canvas compression failed, using original:", err);
        if (typeof input === "string") {
          resolve(input);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(input);
        }
      }
    };

    img.onerror = () => {
      if (typeof input === "string") {
        resolve(input);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(input);
      }
    };

    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(input);
    }
  });
}
