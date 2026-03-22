let pendingSubmitPhoto: File | null = null;

export function setPendingSubmitPhoto(file: File) {
  pendingSubmitPhoto = file;
}

export function takePendingSubmitPhoto() {
  const nextPhoto = pendingSubmitPhoto;
  pendingSubmitPhoto = null;
  return nextPhoto;
}
