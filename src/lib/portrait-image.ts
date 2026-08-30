/**
 * Client-side portrait processing for the personal info editor.  Photos are
 * downscaled and re-encoded so the resulting data URL stays small enough for
 * localStorage persistence and JSON exports.
 */

import { MAX_PORTRAIT_IMAGE_LENGTH } from "@/features/resume-workspace/model"

/** Longest allowed edge after downscaling, in CSS pixels. */
export const PORTRAIT_MAX_DIMENSION = 512

const ACCEPTED_TYPES = /^image\/(?:png|jpeg|jpg|webp)$/

export class PortraitImageError extends Error {}

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new PortraitImageError("The image could not be read."));
        });
        reader.addEventListener("error", () =>
            reject(new PortraitImageError("The image could not be read."))
        );
        reader.readAsDataURL(file);
    });

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", () =>
            reject(new PortraitImageError("That file is not a readable image."))
        );
        image.src = src;
    });

const renderToDataUrl = (
    image: HTMLImageElement,
    width: number,
    height: number,
    flatten: boolean
): string => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
        throw new PortraitImageError("Your browser could not process the image.");
    }
    if (flatten) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(flatten ? "image/jpeg" : "image/png", 0.85);
};

/**
 * Convert a picked file into a validated portrait data URL: PNG input keeps
 * transparency, everything else is flattened to JPEG.  Oversized PNGs fall
 * back to JPEG so the result always fits the document size cap.
 */
export const fileToPortraitDataUrl = async (file: File): Promise<string> => {
    if (!ACCEPTED_TYPES.test(file.type)) {
        throw new PortraitImageError("Choose a PNG, JPEG, or WebP image.");
    }
    if (file.size > 20 * 1024 * 1024) {
        throw new PortraitImageError("That image is too large. Pick one under 20 MB.");
    }
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const natural = Math.max(image.naturalWidth, image.naturalHeight);
    if (!natural) {
        throw new PortraitImageError("That file is not a readable image.");
    }
    const scale = Math.min(1, PORTRAIT_MAX_DIMENSION / natural);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    if (file.type === "image/png") {
        const png = renderToDataUrl(image, width, height, false);
        if (png.length <= MAX_PORTRAIT_IMAGE_LENGTH) return png;
    }
    const jpeg = renderToDataUrl(image, width, height, true);
    if (jpeg.length > MAX_PORTRAIT_IMAGE_LENGTH) {
        throw new PortraitImageError("That image is too large even after resizing.");
    }
    return jpeg;
};
