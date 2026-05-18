export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 20;

export function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENTS) {
    return `Envie no máximo ${MAX_ATTACHMENTS} anexos.`;
  }

  const oversized = files.find((file) => file.size > MAX_ATTACHMENT_SIZE);
  if (oversized) {
    return `O arquivo "${oversized.name}" ultrapassa o limite de 5 MB.`;
  }

  return null;
}
