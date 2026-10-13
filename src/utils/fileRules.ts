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

export const FINAL_FILE_LIMITS = {
  pdf: { maxBytes: 12 * 1024 * 1024, label: '12 MB' },
  svg: { maxBytes: 10 * 1024 * 1024, label: '10 MB' },
  png: { maxBytes: 5 * 1024 * 1024, label: '5 MB' },
  jpg: { maxBytes: 5 * 1024 * 1024, label: '5 MB' },
  jpeg: { maxBytes: 5 * 1024 * 1024, label: '5 MB' },
} as const;

export const ALLOWED_FINAL_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'svg'] as const;

export function validateFinalFiles(files: File[]) {
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !ALLOWED_FINAL_EXTENSIONS.includes(ext as (typeof ALLOWED_FINAL_EXTENSIONS)[number])) {
      return `Tipo de arquivo não permitido: "${file.name}". Envie apenas PDF, PNG, JPG ou SVG.`;
    }

    const rule = FINAL_FILE_LIMITS[ext as keyof typeof FINAL_FILE_LIMITS];
    if (rule && file.size > rule.maxBytes) {
      return `O arquivo "${file.name}" ultrapassa o limite de ${rule.label}.`;
    }
  }

  return null;
}


