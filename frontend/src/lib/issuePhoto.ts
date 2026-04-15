import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const buildIssuePhotoPath = (uid: string, caseId: string) =>
  `issuePhotos/${uid}/${caseId}/report.jpg`;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image file."));
    };

    img.src = url;
  });

export const compressImage = async (file: File): Promise<Blob> => {
  const img = await loadImage(file);

  const maxSize = 600;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to process image.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.65)
  );

  if (!blob) {
    throw new Error("Unable to compress image.");
  }

  return blob;
};

export const uploadIssuePhoto = async (file: File, uid: string, caseId: string) => {
  const compressed = await compressImage(file);
  const path = buildIssuePhotoPath(uid, caseId);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressed, {
    contentType: "image/jpeg",
  });
};

export const getIssuePhotoUrl = async (caseId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/issues/${caseId}/photo-url`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load issue photo.");
  }

  return data.url as string;
};