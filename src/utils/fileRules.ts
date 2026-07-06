export const MAX_ATTACHMENTS = 20;

export function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENTS) {
    return `Envie no máximo ${MAX_ATTACHMENTS} anexos.`;
  }

  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const maxLimit = isPdf ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    const limitText = isPdf ? '5 MB' : '2 MB';

    if (file.size > maxLimit) {
      return `O arquivo "${file.name}" ultrapassa o limite de ${limitText}.`;
    }
  }

  return null;
}

