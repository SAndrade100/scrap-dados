import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;

if (!DROPBOX_TOKEN) {
  throw new Error('DROPBOX_TOKEN não definido no .env');
}

const dbx = new Dropbox({ accessToken: DROPBOX_TOKEN });

// Permite enviar buffer ou arquivo local
export async function uploadImageToDropbox(content: Buffer | string, fileNameOrPath: string, dropboxFolder = '/marcas') {
  let fileName = fileNameOrPath;
  let fileContent: Buffer;
  if (typeof content === 'string') {
    // Se for caminho, lê o arquivo
    fileName = path.basename(content);
    fileContent = fs.readFileSync(content);
  } else {
    // Se for buffer, usa o nome informado
    fileContent = content;
  }
  const dropboxPath = `${dropboxFolder}/${fileName}`;
  try {
    const response = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileContent,
      mode: { '.tag': 'overwrite' },
    });
    return response;
  } catch (error) {
    console.error('Erro ao enviar imagem para o Dropbox:', error);
    throw error;
  }
}
