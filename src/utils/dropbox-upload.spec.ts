// Mock do token do Dropbox ANTES de importar o utilitário
process.env.DROPBOX_TOKEN = 'fake-token-for-test';

// Mock do módulo dropbox
const filesUpload = jest.fn();
jest.mock('dropbox', () => {
  return {
    Dropbox: jest.fn().mockImplementation(() => ({
      filesUpload,
    })),
    __esModule: true,
  };
});

import { uploadImageToDropbox } from './dropbox-upload';
import * as fs from 'fs';
import { Dropbox } from 'dropbox';

describe('uploadImageToDropbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia buffer para o Dropbox', async () => {
    const buffer = Buffer.from('conteudo de teste');
    filesUpload.mockResolvedValue({ result: 'ok' });
    const result = await uploadImageToDropbox(buffer, 'teste.jpg');
    expect(filesUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/marcas/teste.jpg',
        contents: buffer,
        mode: { '.tag': 'overwrite' },
      })
    );
    expect(result).toEqual({ result: 'ok' });
  });

  it('envia arquivo local para o Dropbox', async () => {
    const fakePath = '/tmp/fake.jpg';
    const fakeBuffer = Buffer.from('imagem fake');
    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(fakeBuffer);
    filesUpload.mockResolvedValue({ result: 'ok' });
    const result = await uploadImageToDropbox(fakePath, fakePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(fakePath);
    expect(filesUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/marcas/fake.jpg',
        contents: fakeBuffer,
        mode: { '.tag': 'overwrite' },
      })
    );
    expect(result).toEqual({ result: 'ok' });
  });
});
