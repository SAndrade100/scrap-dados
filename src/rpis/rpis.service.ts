import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import * as path from 'path';
import * as fs from 'fs';

import puppeteer, { executablePath, Page } from 'puppeteer';
import axios from 'axios';
import * as admzip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { LogsDownloadsRpisWeeklyService } from 'src/logs-downloads-rpis-weekly/logs-downloads-rpis-weekly.service';
import * as moment from 'moment';
import { PrismaService } from 'src/database/prisma.service';
import { RPIsRepository } from './rpis.repository';
import { uploadImageToDropbox } from '../utils/dropbox-upload';

@Injectable()
export class RpisService {
  private URL_INPI: string;
  private URL_MARCAS_INPI: string;
  constructor(
    private readonly rpisRepository: RPIsRepository,
    private readonly logsDownloadsRPIsWeeklyService: LogsDownloadsRpisWeeklyService,
    private readonly prisma: PrismaService,
  ) {
    this.URL_INPI = process.env.URL_INPI || 'https://revistas.inpi.gov.br/rpi/';
    this.URL_MARCAS_INPI = process.env.URL_MARCAS_INPI || 
      'https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_num_processo.jsp';
  }

  async findAllRPis(rpiNumber: string) {
    return await this.rpisRepository.findAllRPIs(rpiNumber);
  }

  // Esse método vai servir para buscar as RPIs antigas
  // É preciso buscar os dados do XML das revistas semanais
  // E na própria página de marcas do INPI
  async fetchOldRPIsData(
    rpiNumber: string,
    totalDownloads: number = 1,
    extractFullINPIData: string = 'nao',
  ) {
    let trRPINumber = rpiNumber;
    try {
      const downloadPath = path.join(
        process.cwd(),
        `${process.env.UPLOADS_PATH}/rpis/marcas`,
      );
      console.log('process.cwd():', process.cwd());
      console.log('UPLOADS_PATH:', process.env.UPLOADS_PATH);
      console.log('downloadPath:', downloadPath);

      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
      }
      const browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.ENV === 'homolog' ? process.env.CHROMIUM_PATH : undefined,
      });

      const page = await browser.newPage();
      for (let i = 0; i < totalDownloads; i++) {
        console.log('Carregou a página de processos do INPI');

        // const inputProcesso = await pageMarcasINPI.$eval(
        //   'input[name="NumPedido"]',
        //   (el) => el.getAttribute('name'),
        // );

        // const inputs = await pageMarcasINPI.$$('input');

        await page.goto(this.URL_INPI, { waitUntil: 'networkidle0', timeout: 60000 });

        // Pegando a tabela tfoot com o link de buscar mais revistas de marcas

        const table = await page.$('tfoot');

        // Pegando todas as linhas da tabela
        const contentTfoot = await table.$$('tr td');

        // Linha que tem o link para buscar mais marcas
        const rowBrands = contentTfoot[6];

        // Pegando o link da tag <a> que serve para buscar mais revistas de marcas
        const linkFetchBrands = await rowBrands.$('div > a');

        // Agora, clicando no link de buscar marcas

        await linkFetchBrands.click();

        // Esperando aparecer o container de busca das RPIs

        const searchContainer =
          await page.waitForSelector('#containerPesquisa', { timeout: 60000 });

        // Pegando o input radio de pesquisa por número da RPI

        const inputRadioSearchRPINumber = await searchContainer.$(
          '.showTipoPesquisaNumero',
        );

        // Clicando no input de pesquisa por número

        await inputRadioSearchRPINumber.click();

        // Esperando o formulário de busca por número aparecer na página

        const formSearchRPINumber = await page.$('#buscaPorNumero');

        // Pegando o input de busca pelo número da RPI

        const inputFormNumberRPI = await formSearchRPINumber.$('input');

        // Pegando o botão de busca do formulário por número da RPI

        const buttonFormNumberRPI = await formSearchRPINumber.$('button');

        /* 
        Agora, a lógica de busca pelas RPIs vamos buscar em um loop as RPIs passadas
        a partir do número da RPI passado por parâmetro e ir decrementando, conforme
        o número de total de downloads passado por parâmetro
        */
        // Verificando se a revista já foi baixada
        let pathRPI = path.join(
          process.cwd(),
          `${process.env.UPLOADS_PATH}/rpis/marcas/marcas${trRPINumber}.xml`,
        );
        const isLastRPIDownloaded = fs.existsSync(pathRPI);

        // if (isLastRPIDownloaded) {
        //   console.log(`A revista ${trRPINumber} já foi baixada!`);
        //   trRPINumber = String(Number(trRPINumber) - 1);
        //   continue;
        // }

        // Vai colocar o número da RPI a ser buscada no input
        await inputFormNumberRPI.type(String(trRPINumber));

        // Vai clicar no botão de busca
        await buttonFormNumberRPI.click();

        // Agora, vai esperar a tabela de resultado das buscas aparecer

        const resultTable = await page.waitForSelector('table#result', {
          timeout: 60000,
        });

        // Espera pela execução da função que mostra a revista
        await page.waitForFunction(
          () => {
            const el = document.querySelector('#resultado');
            return el && el.innerHTML.trim().length > 0;
          },
          { timeout: 60000 },
        );

        // Vai pegar o tbody com o link de download do xml

        const tbodyResult = await resultTable.waitForSelector('#resultado', {
          timeout: 60000,
        });

        // Pegando o primeiro <td>
        const rowTdLinkXMLRPI = await tbodyResult.$('tr > td');
        // Pegando o link de download do XML (o segundo <a> do <td>)
        const linksDownloadRPI = await rowTdLinkXMLRPI.$$('a');
        let linkXMLDownloadRPI = '';
        if (linksDownloadRPI.length > 0) {
          linkXMLDownloadRPI = await linksDownloadRPI[1].evaluate(
            (el) => el.href,
          );
        }

        // Fazendo o download do .zip do INPI que vem com a RPI em XML dentro
        let response = null;

        const downloadZip = async () => {
          response = await axios({
            url: linkXMLDownloadRPI,
            method: 'GET',
            responseType: 'stream',
          });
        };

        await downloadZip().then(() =>
          console.log(`Zip da revista ${trRPINumber} baixado!`),
        );

        const filePath = path.join(
          process.cwd(),
          `${process.env.UPLOADS_PATH}/rpis/marcas/marcas${trRPINumber}.zip`,
        );

        await new Promise<void>((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Instanciando a biblioteca para extrair o XML da RPI do .zip baixado
        console.log(`File path: ${filePath}`);
        const zip = new admzip(filePath);
        const zipEntries = zip.getEntries(); // Ele pega todos os arquivos dentro do .zip assim

        // Agora, o arquivo .zip será deletado para ficar somente o .xml

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(
              `Ocorreu um erro ao tentar excluir o arquivo .zip da RPI: ${err}`,
            );
            return;
          }

          console.log(`O arquivo .zip ${filePath} da RPI foi excluído!`);
        });

        // O arquivo da RPI XML dentro do ZIP vai ser extraído e salvo como XML
        let extractedXMLPath = '';

        zipEntries.forEach((entry) => {
          if (entry.entryName.endsWith('.xml')) {
            extractedXMLPath = path.join(
              downloadPath,
              `marcas${trRPINumber}.xml`,
            );
            zip.extractEntryTo(entry, downloadPath, false, true);
            fs.renameSync(
              path.join(downloadPath, entry.entryName),
              extractedXMLPath,
            );
          }
        });

        if (!extractedXMLPath) {
          throw new Error('Nenhum arquivo XML encontrado dentro do ZIP.');
        }

        // Lendo o XML da RPI e salvando no banco de dados
        await this.readParseXMLRPIToObject(
          pathRPI,
          trRPINumber,
          extractFullINPIData,
        );

        // Incrementando o número da revista
        trRPINumber = String(Number(trRPINumber) + 1);
        console.log(
          i < totalDownloads
            ? `Vai baixar a revista ${trRPINumber} agora!`
            : 'Todas as revistas foram baixadas!',
        );
      }

      await browser.close();

      return {
        status: 200,
        message: `Revista ${rpiNumber} foi baixada até a revista ${trRPINumber} - total de downloads feitos: ${totalDownloads}`,
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Já esse, servirá para buscar, de maneira agenda, toda as terça-feiras
  // As revistas RPIs novas
  @Cron('0 0/3 * * 2', {
    name: 'busca_semanal_rpi',
  })
  async fetchWeeklyRPI() {
    let trRPINumber = null;
    try {
      const downloadPath = path.join(
        process.cwd(),
        `${process.env.UPLOADS_PATH}/rpis/marcas`,
      );

      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
      }

      const browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.ENV === 'homolog' ? process.env.CHROMIUM_PATH : undefined,
      });
      const page = await browser.newPage();

      await page.goto(this.URL_INPI, { waitUntil: 'networkidle0' });

      // Aqui todas as tabelas da página do INPI são pegas
      const tables = await page.$$('.table');

      // É a primeira tabela da página que tem as revistas
      const tableRPIs = tables[0];

      // Pegando a linha que contém a RPI mais recente
      // Sempre é o <tr> com classe .warning

      const trRPI = tableRPIs.$('tr.warning');

      // O primeiro elemento (um td) é o número da revista
      trRPINumber = await (
        await trRPI
      ).evaluate((el) => el.firstElementChild.textContent);

      // A tabela das revistas tem um <tr>, e vários elementos <td> com as informações
      // Da RPI lançada
      const tdsRPI = await (await trRPI).$$('td');

      // Pegando o link de download do PDF de marcas

      const links = await tdsRPI[6].$$('div > a');
      // Esse é o <a> que tem o arquivo XML
      const secondLink = links[1];

      if (!secondLink) {
        throw new Error('Link de download não encontrado.');
      }

      // Verificando se a revista já foi baixada antes de fazer o download
      let pathRPI = path.join(
        process.cwd(),
        `${process.env.UPLOADS_PATH}/rpis/marcas/marcas${trRPINumber}.xml`,
      );
      const isLastRPIDownloaded = fs.existsSync(pathRPI);
      if (isLastRPIDownloaded) {
        throw new HttpException(
          'A revista já foi baixada',
          HttpStatus.CONFLICT,
        );
      }

      const downloadLink = await secondLink.evaluate((el) => el.href);

      // Fazendo o download do .zip do INPI que vem com a RPI em XML dentro
      const response = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'stream',
      });

      const filePath = path.join(
        process.cwd(),
        `${process.env.UPLOADS_PATH}/rpis/marcas/marcas${trRPINumber}.zip`,
      );

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      // Retorno da API dependendo de como o processo andou
      let statusCodeDownloadRPI = null;
      let messageDownloadRPI = '';

      // Montagem do objeto de log
      let downloadRPIObjectLogs = {
        number: trRPINumber,
        message: '',
        status: '',
        date: null,
      };

      await new Promise((join, reject) => {
        writer.on('finish', async () => {
          statusCodeDownloadRPI = 200;
          messageDownloadRPI = `Revista de marcas número ${trRPINumber} baixada com sucesso!`;
          downloadRPIObjectLogs = {
            ...downloadRPIObjectLogs,
            message: messageDownloadRPI,
            status: 'sucesso',
            date: moment.utc(),
          };
          // Salvando log do download da revista RPI no banco de dados
          await this.logsDownloadsRPIsWeeklyService.createLog(
            downloadRPIObjectLogs,
          );
          join(messageDownloadRPI);
        });
        writer.on('error', async () => {
          statusCodeDownloadRPI = 400;
          messageDownloadRPI = `Ocorreu um erro ao baixar a revista de marcas número ${trRPINumber}!`;
          downloadRPIObjectLogs = {
            ...downloadRPIObjectLogs,
            message: messageDownloadRPI,
            status: 'erro',
            date: moment.utc(),
          };
          // Salvando log do download da revista RPI no banco de dados
          await this.logsDownloadsRPIsWeeklyService.createLog(
            downloadRPIObjectLogs,
          );
          reject(messageDownloadRPI);
        });
      });

      // Instanciando a biblioteca para extrair o XML da RPI do .zip baixado
      const zip = new admzip(filePath);
      const zipEntries = zip.getEntries(); // Ele pega todos os arquivos dentro do .zip assim

      // O arquivo da RPI XML dentro do ZIP vai ser extraído e salvo como XML
      let extractedXMLPath = '';

      zipEntries.forEach((entry) => {
        if (entry.entryName.endsWith('.xml')) {
          extractedXMLPath = path.join(
            downloadPath,
            `marcas${trRPINumber}.xml`,
          );
          zip.extractEntryTo(entry, downloadPath, false, true);
          fs.renameSync(
            path.join(downloadPath, entry.entryName),
            extractedXMLPath,
          );
        }
      });

      if (!extractedXMLPath) {
        throw new Error('Nenhum arquivo XML encontrado dentro do ZIP.');
      }

      // Agora, o arquivo .zip será deletado para ficar somente o .xml

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(
            `Ocorreu um erro ao tentar excluir o arquivo .zip da RPI: ${err}`,
          );
          return;
        }

        console.log(`O arquivo .zip ${filePath} da RPI foi excluído!`);
      });

      await browser.close();

      // Agora os dados do xml vão ser extraídos e inseridos no banco de dados:

      await this.readParseXMLRPIToObject(pathRPI, trRPINumber, 'sim');

      return {
        status: statusCodeDownloadRPI,
        message: messageDownloadRPI,
        info: 'O processamento dos dados está em execução em segundo plano!',
      };
    } catch (error) {
      console.log(error);

      const errorLogObject = {
        number: trRPINumber,
        message:
          error.message ??
          'Ocorreu um erro ao processar a busca pela RPI semanal!',
        details: error?.message,
        status: 'erro',
        date: new Date(),
      };

      await this.logsDownloadsRPIsWeeklyService.createLog(errorLogObject);

      throw new HttpException(
        error.message ??
          'Ocorreu um erro ao processar a busca pela RPI semanal!',
        error.status,
      );
    }
  }

  // Esse método vai servir para ler a revista em XML e colocá-la no banco de dados
  private async readParseXMLRPIToObject(
    pathXML: string,
    rpiNumber: string,
    extractFullINPIData: string = 'nao',
  ) {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        processEntities: true,
      });

      const data = await new Promise<string>((join, reject) => {
        fs.readFile(pathXML, 'utf-8', (err, data) => {
          if (err) return reject(err);
          join(data);
        });
      });

      await this.prisma
        .$transaction(
          async (tx) => {
            const toArray = (item) =>
              Array.isArray(item) ? item : item ? [item] : [];

            console.log(`Começando a extrair os dados da RPI ${rpiNumber}...`);

            const rpiObject = parser.parse(data);
            const numeroRevista = rpiObject.revista['@_numero'];

            const dataFormatada = moment(
              rpiObject.revista['@_data'],
              'DD/MM/YYYY',
            ).toDate();

            let revistaExistente = await tx.revistas_RPI.findFirst({
              where: { numero: numeroRevista, deletedAt: null },
              select: { id: true },
            });

            if (revistaExistente) {
              throw new HttpException(
                `A revista ${numeroRevista} já foi cadastrada no banco de dados!`,
                HttpStatus.AMBIGUOUS,
              );
            } else {
              revistaExistente = await tx.revistas_RPI.create({
                data: {
                  numero: numeroRevista,
                  data_lancamento: dataFormatada,
                },
                select: {
                  id: true,
                },
              });
            }

            const processos = toArray(rpiObject.revista.processo);

            console.log(
              `Total de processos da revista ${rpiNumber}: ${processos.length}`,
            );

            let indiceProcesso = 1;

            for (const processo of processos) {
              // De @moacirdavidag para quem pegar o projeto:
              // Aqui é melhor fatorar depois, criar o módulo de cada entidade dessa
              // Relação e buscar a partir dos seus services o que tem a ver com os processos

              const numeroProcesso = processo['@_numero'];
              const processoExiste =
                await this.prisma.processos_Revistas_RPI.findFirst({
                  where: {
                    numero: numeroProcesso,
                  },
                  select: {
                    id: true,
                    numero: true,
                  },
                });

              if (processoExiste) {
                console.log(
                  `Processo nº${indiceProcesso} existente ${processo['@_numero']} - RPI ${rpiNumber}, `,
                );

                const classeNiceAtual = toArray(
                  processo['lista-classe-nice']?.['classe-nice'],
                );
                const classesNiceProcesso =
                  await this.prisma.classes_Nice_Processos_RPI.findMany({
                    where: {
                      deletedAt: null,
                      processo_rpi_id: processo?.id,
                    },
                    select: {
                      codigo: true,
                      id: true,
                    },
                  });

                const classesNiceNovas = classeNiceAtual?.filter(
                  (classe) =>
                    !classesNiceProcesso.some(
                      (existing) =>
                        String(existing.codigo) === String(classe['@_codigo']),
                    ),
                );

                const classesViennaProcesso =
                  await this.prisma.classes_Vienna_Processos_RPI.findMany({
                    where: {
                      deletedAt: null,
                      processo_rpi_id: processoExiste?.id,
                    },
                    select: {
                      codigo: true,
                      edicao: true,
                      id: true,
                    },
                  });

                const classesViennaAtual = toArray(
                  processo['lista-classe-nice']?.['classe-nice'],
                );
                const classesViennaNovas = classesViennaAtual?.filter(
                  (classe) =>
                    !classesViennaProcesso.some(
                      (existing) =>
                        existing.codigo === classe['@_codigo'] &&
                        existing.edicao === classe.edicao,
                    ),
                );

                const titularesAtual = toArray(processo.titulares?.titular);
                const titularesProcesso =
                  await tx.titulares_Processos_RPI.findMany({
                    where: {
                      deletedAt: null,
                      processo_rpi_id: processoExiste?.id,
                    },
                    select: {
                      id: true,
                      nome_razao_social: true,
                      pais: true,
                      uf: true,
                    },
                  });
                const titularesNovos = titularesAtual?.filter(
                  (titular) =>
                    !titularesProcesso.some(
                      (existing) =>
                        existing.nome_razao_social ===
                        titular['@_nome-razao-social'],
                    ),
                );

                const sobrestadoresAtual = toArray(
                  processo.sobrestadores?.sobrestador,
                );
                const sobrestadoresProcesso =
                  await tx.sobrestadores_Processos_RPI.findMany({
                    where: {
                      deletedAt: null,
                      processo_rpi_id: processoExiste.id,
                    },
                    select: {
                      marca: true,
                      processo: true,
                    },
                  });
                const sobrestadoresNovos = sobrestadoresAtual?.filter(
                  (sobrestador) =>
                    !sobrestadoresProcesso.some(
                      (existing) =>
                        existing.marca === sobrestador['@_marca'] &&
                        existing.processo === sobrestador['@_processo'],
                    ),
                );

                await tx.processos_Revistas_RPI.update({
                  where: {
                    id: processoExiste.id,
                  },
                  data: {
                    revista_rpi: {
                      connect: {
                        id: revistaExistente.id,
                      },
                    },
                    numero: processo['@_numero'],
                    procurador: String(processo.procurador) || undefined,
                    data_concessao: parseDate(processo['@_data-concessao']),
                    data_deposito: parseDate(processo['@_data-deposito']),
                    data_vigencia: parseDate(processo['@_data-vigencia']),
                    despachos: createNested(
                      processo.despachos?.despacho,
                      (despacho) => ({
                        codigo: despacho['@_codigo'],
                        nome: String(despacho['@_nome']),
                        texto_complementar: String(
                          despacho['texto-complementar'],
                        ),
                        protocolo_despacho: despacho.protocolo
                          ? {
                              create: {
                                numero: despacho.protocolo['@_numero'],
                                data: parseDate(despacho.protocolo['@_data']),
                                codigo_servico:
                                  despacho.protocolo['@_codigoServico'],
                                requerente_protocolo_rpi: createNested(
                                  despacho.protocolo.requerente,
                                  (req) => ({
                                    nome_razao_social:
                                      req['@_nome-razao-social'],
                                    pais: req['@_pais'],
                                    uf: req['@_uf'] || undefined,
                                  }),
                                ),
                                cedentes_protocolo_rpi: createNested(
                                  despacho.protocolo.cedentes,
                                  (cedente) => ({
                                    nome_razao_social:
                                      cedente['@_nome-razao-social'],
                                    pais: cedente['@_pais'],
                                    uf: cedente['@_uf'] || undefined,
                                  }),
                                ),
                                cessionarios_protocolo_rpi: createNested(
                                  despacho.protocolo.cessionarios,
                                  (cessionario) => ({
                                    nome_razao_social:
                                      cessionario['@_nome-razao-social'],
                                    pais: cessionario['@_pais'],
                                    uf: cessionario['@_uf'] || undefined,
                                  }),
                                ),
                              },
                            }
                          : undefined,
                      }),
                    ),
                    titulares: createNested(titularesNovos, (titular) => ({
                      nome_razao_social: titular['@_nome-razao-social'],
                      pais: titular['@_pais'],
                      uf: titular['@_uf'],
                    })),
                    classes_nice: classesNiceNovas
                      ? {
                          createMany: {
                            data: toArray(classesNiceNovas).map((classe) => ({
                              especificacao: classe.especificacao,
                              status: classe.status,
                              codigo: classe['@_codigo'],
                            })),
                          },
                        }
                      : undefined,
                    marca: processo.marca
                      ? {
                          create: {
                            nome: String(processo.marca.nome),
                            apresentacao: processo.marca['@_apresentacao'] ?? null,
                            natureza: processo.marca['@_natureza'] ?? null,
                          },
                        }
                      : undefined,
                    classes_vienna: createNested(
                      classesViennaNovas,
                      (vienna) => ({
                        codigo: vienna['@_codigo'],
                        edicao: vienna['@_edicao'],
                      }),
                    ),
                    classe_nacional: processo['classe-nacional']
                      ? {
                          create: {
                            codigo: processo['classe-nacional']['@_codigo'],
                            especificacao:
                              processo['classe-nacional'].especificacao,
                            subclasses_nacional: createNested(
                              processo['classe-nacional'][
                                'sub-classes-nacional'
                              ]?.['sub-classe-nacional'],
                              (sub) => ({
                                codigo: sub['@_codigo'],
                              }),
                            ),
                          },
                        }
                      : undefined,
                    sobrestadores: createNested(
                      sobrestadoresNovos,
                      (sobrestador) => ({
                        processo: sobrestador['@_processo'],
                        marca: sobrestador['@_marca'],
                      }),
                    ),
                    prioridade_unionista: createNested(
                      processo['prioridade-unionista']?.prioridade,
                      (prioridade) => ({
                        data: parseDate(prioridade['@_data']),
                        numero: prioridade['@_numero'],
                        pais: prioridade['@_pais'],
                      }),
                    ),
                  },
                });
              } else {
                console.log(
                  `Criando o processo nº${indiceProcesso} ${processo['@_numero']} - revista ${rpiNumber}`,
                );
                await tx.processos_Revistas_RPI.create({
                  data: {
                    revista_rpi: {
                      connect: {
                        id: revistaExistente.id,
                      },
                    },
                    numero: processo['@_numero'],
                    procurador: String(processo.procurador) || undefined,
                    data_concessao: parseDate(processo['@_data-concessao']),
                    data_deposito: parseDate(processo['@_data-deposito']),
                    data_vigencia: parseDate(processo['@_data-vigencia']),
                    despachos: createNested(
                      processo.despachos?.despacho,
                      (despacho) => ({
                        codigo: despacho['@_codigo'],
                        nome: String(despacho['@_nome']),
                        texto_complementar: String(
                          despacho['texto-complementar'],
                        ),
                        protocolo_despacho: despacho.protocolo
                          ? {
                              create: {
                                numero: despacho.protocolo['@_numero'],
                                data: parseDate(despacho.protocolo['@_data']),
                                codigo_servico:
                                  despacho.protocolo['@_codigoServico'],
                                requerente_protocolo_rpi: createNested(
                                  despacho.protocolo.requerente,
                                  (req) => ({
                                    nome_razao_social:
                                      req['@_nome-razao-social'],
                                    pais: req['@_pais'],
                                    uf: req['@_uf'] || undefined,
                                  }),
                                ),
                                cedentes_protocolo_rpi: createNested(
                                  despacho.protocolo.cedentes,
                                  (cedente) => ({
                                    nome_razao_social:
                                      cedente['@_nome-razao-social'],
                                    pais: cedente['@_pais'],
                                    uf: cedente['@_uf'] || undefined,
                                  }),
                                ),
                                cessionarios_protocolo_rpi: createNested(
                                  despacho.protocolo.cessionarios,
                                  (cessionario) => ({
                                    nome_razao_social:
                                      cessionario['@_nome-razao-social'],
                                    pais: cessionario['@_pais'],
                                    uf: cessionario['@_uf'] || undefined,
                                  }),
                                ),
                              },
                            }
                          : undefined,
                      }),
                    ),
                    titulares: createNested(
                      processo.titulares?.titular,
                      (titular) => ({
                        nome_razao_social: titular['@_nome-razao-social'],
                        pais: titular['@_pais'],
                        uf: titular['@_uf'] || undefined,
                      }),
                    ),
                    classes_nice: processo['lista-classe-nice']?.['classe-nice']
                      ? {
                          createMany: {
                            data: toArray(
                              processo['lista-classe-nice']['classe-nice'],
                            ).map((classe) => ({
                              especificacao: classe.especificacao,
                              status: classe.status,
                              codigo: classe['@_codigo'],
                            })),
                          },
                        }
                      : undefined,
                    marca: processo.marca
                      ? {
                          create: {
                            nome: String(processo.marca.nome),
                            apresentacao: processo.marca['@_apresentacao'] ?? null,
                            natureza: processo.marca['@_natureza'] ?? null,
                          },
                        }
                      : undefined,
                    classes_vienna: createNested(
                      processo['classes-vienna']?.['classe-vienna'],
                      (vienna) => ({
                        codigo: vienna['@_codigo'],
                        edicao: vienna['@_edicao'],
                      }),
                    ),
                    classe_nacional: processo['classe-nacional']
                      ? {
                          create: {
                            codigo: processo['classe-nacional']['@_codigo'],
                            especificacao:
                              processo['classe-nacional'].especificacao,
                            subclasses_nacional: createNested(
                              processo['classe-nacional'][
                                'sub-classes-nacional'
                              ]?.['sub-classe-nacional'],
                              (sub) => ({
                                codigo: sub['@_codigo'],
                              }),
                            ),
                          },
                        }
                      : undefined,
                    sobrestadores: createNested(
                      processo.sobrestadores?.sobrestador,
                      (sobrestador) => ({
                        processo: sobrestador['@_processo'],
                        marca: sobrestador['@_marca'],
                      }),
                    ),
                    prioridade_unionista: createNested(
                      processo['prioridade-unionista']?.prioridade,
                      (prioridade) => ({
                        data: parseDate(prioridade['@_data']),
                        numero: prioridade['@_numero'],
                        pais: prioridade['@_pais'],
                      }),
                    ),
                  },
                });
              }
              indiceProcesso++;
            }

            return `A criação da revista ${rpiNumber} e seus processos foi concluída!`;
          },
          {
            maxWait: 1000000000000,
            timeout: 1000000000000,
          },
        )
        .then(async () => {
          console.log(
            `Os processos da revista ${rpiNumber} foram inseridos com sucesso a partir do XML!`,
          );
          // await browser.close();
        })
        .finally(async () => {
          extractFullINPIData === 'sim'
            ? await this.readAllMarcasProcessosINPIPageData([rpiNumber])
            : null;
        });      function parseDate(dateStr) {
        return dateStr && moment(dateStr, 'DD/MM/YYYY', true).isValid()
          ? moment(dateStr, 'DD/MM/YYYY').toDate()
          : null;
      }

      function createNested(data, mapFn) {
        const array = Array.isArray(data) ? data : data ? [data] : [];
        return array.length
          ? {
              create: array.map(mapFn),
            }
          : undefined;
      }

      console.log(
        `Os dados da revista ${rpiNumber} foram inseridos no banco de dados!`,
      );
    } catch (error) {
      console.log(error);
      await this.logsDownloadsRPIsWeeklyService.createLog({
        status: 'erro',
        date: new Date(),
        message: `Ocorreu um erro na inserção dos dados da revista ${rpiNumber} na base de dados!`,
        number: rpiNumber,
      });
      throw new Error(error.message);
    }
  }

  // Esse método vai pegar os dados necessários diretamente na página do INPI
  // E atualizar os processos com as informações faltantes

  async readAllMarcasProcessosINPIPageData(
    rpiNumber?: string[],
    onlyBunkerProcess: string = 'nao',
  ) {
    try {
      // Vamos achar todos os processos das RPIs passadas por parâmetro
      console.log(`RPI Number: ${rpiNumber}`);
      console.log(rpiNumber);

      let where: any = {};

      if (rpiNumber && rpiNumber?.length > 0) {
        where = {
          ...where,
          revista_rpi: {
            numero: {
              in: rpiNumber,
            },
          },
        };
      } else {
        where = {
          ...where,
          imagem_marca: null,
        };
      }

      where.deletedAt = null;

      if (onlyBunkerProcess === 'sim') {
        console.log('Só processos da Bunker');
        where = {
          ...where,
          procurador: {
            contains: 'vivian barbosa viana feitosa',
          },
        };
      }

      const processosRPIs = await this.prisma.processos_Revistas_RPI.findMany({
        where,
        select: {
          numero: true,
          id: true,
          marca: true,
          data_concessao: true,
          data_deposito: true,
          data_vigencia: true,
          revista_rpi: {
            select: {
              numero: true,
            },
          },
        },
        orderBy: {
          revista_rpi: {
            numero: 'asc',
          },
        },
      });

      console.log(`Total de processos: ${processosRPIs.length}`);

      // Agora para cada processo vamos pegar os dados lá na página do INPI
      for (const processo of processosRPIs) {
        const processoData = await this.readProcessoINPIPageData(processo.numero);
        const {
          apresentacao = null,
          classeNice = null,
          classeViena = null,
          datas = null,
          marca = null,
          natureza = null,
          peticoes = null,
          prazos = null,
          procurador = null,
          publicacoes = null,
          situacao = null,
          titulares = null,
        } = processoData || {};

        // De @moacirdavidag para quem pegar o projeto:
        // Aqui é melhor fatorar depois, criar o módulo de cada entidade dessa
        // Relação e buscar a partir dos seus services o que tem a ver com os processos

        const classesNiceProcesso =
          await this.prisma.classes_Nice_Processos_RPI.findMany({
            where: {
              deletedAt: null,
              processo_rpi_id: processo.id,
            },
            select: {
              codigo: true,
              id: true,
            },
          });

        const classesNiceNovas = classeNice?.filter(
          (classe) =>
            !classesNiceProcesso.some((existing) =>
              String(existing.codigo).includes(String(classe.codigo)),
            ),
        );

        const classesViennaProcesso =
          await this.prisma.classes_Vienna_Processos_RPI.findMany({
            where: {
              deletedAt: null,
              processo_rpi_id: processo.id,
            },
            select: {
              codigo: true,
              edicao: true,
              id: true,
            },
          });

        const classesViennaNovas = classeViena?.filter(
          (classe) =>
            !classesViennaProcesso.some(
              (existing) =>
                existing.codigo === classe.codigo &&
                existing.edicao === classe.edicao,
            ),
        );

        const prazosProcesso = await this.prisma.prazos_Processos_RPI.findMany({
          where: {
            deletedAt: null,
            processo_rpi_id: processo.id,
          },
          select: {
            id: true,
            data_fim_prazo_extraordinario: true,
            data_fim_prazo_ordinario: true,
            data_inicio_prazo_extraordinario: true,
            data_inicio_prazo_ordinario: true,
          },
        });

        const prazosNovos = prazos
          ? Object.values(prazos).filter((prazo: any) =>
              !prazosProcesso.some((existing) => {
                // Garante que prazo[0] exista e seja objeto
                const p = Array.isArray(prazo) ? prazo[0] : prazo;
                if (!p) return false;
                return (
                  existing.data_inicio_prazo_ordinario === p.data_inicio_prazo_ordinario &&
                  existing.data_inicio_prazo_extraordinario === p.data_inicio_prazo_extraordinario &&
                  existing.data_fim_prazo_ordinario === p.data_fim_prazo_ordinario &&
                  existing.data_fim_prazo_extraordinario === p.data_fim_prazo_extraordinario
                );
              })
            )
          : [];

        const titularesProcesso =
          await this.prisma.titulares_Processos_RPI.findMany({
            where: {
              deletedAt: null,
              processo_rpi_id: processo.id,
            },
            select: {
              id: true,
              nome_razao_social: true,
            },
          });

        const titularesNovos = titulares?.filter(
          (titular) =>
            !titularesProcesso.some(
              (existing) => existing.nome_razao_social === titular,
            ),
        );

        const peticoesProcesso =
          await this.prisma.peticoes_Processos_RPI.findMany({
            where: {
              deletedAt: null,
              processo_rpi_id: processo.id,
            },
            select: {
              numero_protocolo: true,
              pagamentos: {
                select: {
                  data: true,
                  valor: true,
                },
              },
              publicacoes_processo_rpi: {
                where: {
                  deletedAt: null,
                },
                select: {
                  numero_rpi: true,
                  data_rpi: true,
                },
              },
            },
          });

        const peticoesNovas = peticoes?.filter(
          (peticao) =>
            !peticoesProcesso.some(
              (existing) => existing.numero_protocolo === peticao.protocolo,
            ),
        );

        const marcasProcesso = await this.prisma.marca_Processo_RPI.findMany({
          where: {
            deletedAt: null,
            processo_rpi_id: processo.id,
          },
          select: {
            nome: true,
            id: true,
          },
        });
        const marcasNovas = marcasProcesso.filter(
          (marcaProcesso) => marcaProcesso.nome !== marca,
        );

        /* 
        De @moacirdavidag: Por quê faço essas consultas? E até digo para modularizar isso,
        colocando em outros services para que esse método não fique sobrecarregado
        Com os dados desta consulta, vamos evitar a criação de registros duplicados
        A cada consulta a RPI e gravação no banco de dados
        */

        console.log('### DADOS EM READ ALL');
        console.log(marca, natureza, situacao, apresentacao);

        // Atualizando a marca do processo

        if (marcasProcesso?.length > 0) {
          for (const marcaProcesso of marcasProcesso) {
            await this.prisma.marca_Processo_RPI.update({
              where: {
                id: marcaProcesso.id,
              },
              data: {
                nome: marca ?? null,
                natureza: natureza ?? null,
                apresentacao: apresentacao ?? null,
              },
            });
          }
        } else {
          await this.prisma.marca_Processo_RPI.create({
            data: {
              processo_rpi_id: processo.id,
              nome: marca ?? null,
              natureza: natureza ?? null,
              apresentacao: apresentacao ?? null,
            },
          });
        }

        await this.prisma.processos_Revistas_RPI
          .upsert({
            where: { id: processo.id },
            create: {
              id: processo.id,
              imagem_marca: `${processo.numero}.jpg`,
              apresentacao: apresentacao ?? null,
              natureza: natureza ?? null,
              situacao: situacao ?? null,
              procurador: procurador ?? null,
              data_concessao: datas?.data_concessao
                ? moment(datas.data_concessao, 'DD/MM/YYYY').toDate()
                : null,
              data_deposito: datas?.data_deposito
                ? moment(datas.data_deposito, 'DD/MM/YYYY').toDate()
                : null,
              data_vigencia: datas?.data_vigencia
                ? moment(datas.data_vigencia, 'DD/MM/YYYY').toDate()
                : null,
              marca:
                marcasNovas?.length > 0
                  ? {
                      create: marcasNovas.map((marcaDoProcesso) => ({
                        nome: marcaDoProcesso.nome ?? null,
                        apresentacao: apresentacao ?? null,
                        natureza: natureza ?? null,
                      })),
                    }
                  : undefined,

              classes_nice: {
                create:
                  classesNiceNovas?.map((classe) => ({
                    codigo: classe.codigo,
                    especificacao: classe.especificacao,
                    status: classe.status,
                  })) || [],
              },
              classes_vienna: {
                create:
                  classesViennaNovas?.map((classe) => ({
                    codigo: classe.codigo,
                    edicao: classe.edicao,
                  })) || [],
              },
              prazos: {
                create:
                  prazosNovos?.map((prazo) => {
                    const p = Array.isArray(prazo) ? prazo[0] : prazo;
                    return {
                      data_inicio_prazo_ordinario: p?.data_inicio_prazo_ordinario
                        ? moment(p.data_inicio_prazo_ordinario, 'DD/MM/YYYY').toDate()
                        : null,
                      data_inicio_prazo_extraordinario: p?.data_inicio_prazo_extraordinario
                        ? moment(p.data_inicio_prazo_extraordinario, 'DD/MM/YYYY').toDate()
                        : null,
                      data_fim_prazo_ordinario: p?.data_fim_prazo_ordinario
                        ? moment(p.data_fim_prazo_ordinario, 'DD/MM/YYYY').toDate()
                        : null,
                      data_fim_prazo_extraordinario: p?.data_fim_prazo_extraordinario
                        ? moment(p.data_fim_prazo_extraordinario, 'DD/MM/YYYY').toDate()
                        : null,
                    };
                  }) || [],
              },
              titulares: {
                create:
                  titularesNovos?.map((titular) => ({
                    nome_razao_social: titular,
                  })) || [],
              },
              peticoes_processo: {
                create:
                  peticoesNovas?.map((peticao) => ({
                    cliente: peticao.cliente,
                    imagem: peticao.image,
                    numero_protocolo: peticao.protocolo,
                    servico: peticao?.servico
                      ? parseInt(peticao.servico)
                      : null,
                    data: peticao?.data
                      ? moment(peticao?.data, 'DD/MM/YYYY').toDate()
                      : undefined,
                    pagamentos: {
                      create: {
                        agencia_nome_banco: `${peticao.pagamento?.codigoBanco} - ${peticao.pagamento?.banco}`,
                        data: peticao?.pagamento?.data
                          ? moment(
                              peticao?.pagamento?.data,
                              'DD/MM/YYYY',
                            ).toDate()
                          : null,
                        valor: peticao?.pagamento?.valor
                          ? parseFloat(
                              String(peticao?.pagamento?.valor)
                                .replace('R$', '')
                                .replace(',', '.'),
                            )
                          : undefined,
                      },
                    },
                    publicacoes_processo_rpi: {
                      create:
                        publicacoes?.map((publicacao) => ({
                          numero_rpi: publicacao.rpi,
                          data_rpi: publicacao?.data
                            ? moment(publicacao?.data, 'DD/MM/YYYY').toDate()
                            : null,
                          despacho: publicacao.despacho,
                          certificado: publicacao.certificado,
                          inteiro_teor: publicacao.inteiro_teor,
                          complementos_despacho:
                            publicacao.complementos_despacho
                              ? publicacao.complementos_despacho
                                  .map(
                                    (complemento) =>
                                      `${complemento.titulo} ${complemento.conteudo}\n`,
                                  )
                                  .join('\n')
                              : null,
                        })) || [],
                    },
                  })) || [],
              },
            },
            update: {
              id: processo.id,
              imagem_marca: `${processo.numero}.jpg`,
              apresentacao: apresentacao ?? null,
              natureza: natureza ?? null,
              situacao: situacao ?? null,
              procurador: procurador ?? null,
              data_concessao:
                datas?.data_concessao &&
                moment(datas.data_concessao, 'DD/MM/YYYY').isValid()
                  ? moment(datas.data_concessao, 'DD/MM/YYYY').toDate()
                  : null,
              data_deposito:
                datas?.data_deposito &&
                moment(datas.data_deposito, 'DD/MM/YYYY').isValid()
                  ? moment(datas.data_deposito, 'DD/MM/YYYY').toDate()
                  : null,
              data_vigencia:
                datas?.data_vigencia &&
                moment(datas.data_vigencia, 'DD/MM/YYYY').isValid()
                  ? moment(datas.data_vigencia, 'DD/MM/YYYY').toDate()
                  : null,

              classes_nice: {
                create:
                  classesNiceNovas?.map((classe) => ({
                    codigo: classe.codigo,
                    especificacao: classe.especificacao,
                    status: classe.status,
                  })) || [],
              },
              classes_vienna: {
                create:
                  classesViennaNovas?.map((classe) => ({
                    codigo: classe.codigo,
                    edicao: classe.edicao,
                  })) || [],
              },
              prazos: {
                create:
                  prazosNovos?.map((prazo) => {
                    const p = Array.isArray(prazo) ? prazo[0] : prazo;
                    return {
                      data_inicio_prazo_ordinario:
                        p?.data_inicio_prazo_ordinario &&
                        moment(
                          p.data_inicio_prazo_ordinario,
                          'DD/MM/YYYY',
                          true,
                        ).isValid()
                          ? moment(
                              p.data_inicio_prazo_ordinario,
                              'DD/MM/YYYY',
                            ).toDate()
                          : null,
                      data_inicio_prazo_extraordinario:
                        p?.data_inicio_prazo_extraordinario &&
                        moment(
                          p.data_inicio_prazo_extraordinario,
                          'DD/MM/YYYY',
                          true,
                        ).isValid()
                          ? moment(
                              p.data_inicio_prazo_extraordinario,
                              'DD/MM/YYYY',
                            ).toDate()
                          : null,
                      data_fim_prazo_ordinario:
                        p?.data_fim_prazo_ordinario &&
                        moment(
                          p.data_fim_prazo_ordinario,
                          'DD/MM/YYYY',
                          true,
                        ).isValid()
                          ? moment(
                              p.data_fim_prazo_ordinario,
                              'DD/MM/YYYY',
                            ).toDate()
                          : null,
                      data_fim_prazo_extraordinario:
                        p?.data_fim_prazo_extraordinario &&
                        moment(
                          p.data_fim_prazo_extraordinario,
                          'DD/MM/YYYY',
                          true,
                        ).isValid()
                          ? moment(
                              p.data_fim_prazo_extraordinario,
                              'DD/MM/YYYY',
                            ).toDate()
                          : null,
                    };
                  }) || [],
              },
              titulares: {
                create:
                  titularesNovos?.map((titular) => ({
                    nome_razao_social: titular,
                  })) || [],
              },
              peticoes_processo: {
                create:
                  peticoesNovas?.map((peticao) => ({
                    cliente: peticao.cliente,
                    imagem: peticao.image,
                    numero_protocolo: peticao.protocolo,
                    servico: peticao?.servico
                      ? parseInt(peticao.servico)
                      : null,
                    data:
                      peticao?.data &&
                      moment(peticao?.data, 'DD/MM/YYYY').isValid()
                        ? moment(peticao?.data, 'DD/MM/YYYY').toDate()
                        : null,
                    pagamentos: {
                      create: {
                        agencia_nome_banco: `${peticao.pagamento?.codigoBanco} - ${peticao.pagamento?.banco}`,
                        data:
                          peticao?.pagamento?.data &&
                          moment(
                            peticao?.pagamento?.data,
                            'DD/MM/YYYY',
                          ).isValid()
                            ? moment(
                                peticao?.pagamento?.data,
                                'DD/MM/YYYY',
                              ).toDate()
                            : null,
                        valor: peticao?.pagamento?.valor
                          ? parseFloat(
                              String(peticao?.pagamento?.valor)
                                .replace('R$', '')
                                .replace(',', '.'),
                            )
                          : undefined,
                      },
                    },
                    publicacoes_processo_rpi: {
                      create:
                        publicacoes?.map((publicacao) => ({
                          numero_rpi: publicacao.rpi,
                          data_rpi:
                            publicacao?.data &&
                            moment(publicacao?.data, 'DD/MM/YYYY').isValid()
                              ? moment(publicacao?.data, 'DD/MM/YYYY').toDate()
                              : null,
                          despacho: publicacao.despacho,
                          certificado: publicacao.certificado,
                          inteiro_teor: publicacao.inteiro_teor,
                          complementos_despacho:
                            publicacao.complementos_despacho
                              ? publicacao.complementos_despacho
                                  .map(
                                    (complemento) =>
                                      `${complemento.titulo}\n${complemento.conteudo}`,
                                  )
                                  .join('\n')
                              : null,
                        })) || [],
                    },
                  })) || [],
              },
            },
          })
          .then(() => {
            console.log(
              `O processo ${processo.numero} da revista ${processo.revista_rpi.numero} foi criado ou atualizado!`,
            );
          })
          .catch((error) => {
            console.log(
              `Houve um erro ao processar o processo ${processo.numero} da revista ${processo.revista_rpi.numero}!`,
            );
            console.log(error);
          });
      }

      return `Os processos das revistas estão em processamento!`;
    } catch (error) {
      console.log(error);
    }
  }

  async readProcessoINPIPageData(processNumber: string) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let browser = null;
      try {
        browser = await puppeteer.launch({
          headless: true,
          executablePath:
            process.env.ENV === 'homolog' ? process.env.CHROMIUM_PATH : undefined,
        });
        const page = await browser.newPage();
        console.log(`[INPI][${processNumber}] Tentativa ${attempt}: Indo para a página do INPI`);
        await page.goto(this.URL_MARCAS_INPI, { waitUntil: 'networkidle0', timeout: 120000 });
        const inputs = await page.$$('input');
        let inputContinuar = null;
        for (const input of inputs) {
          const valueInput = (await input.evaluate((el) => el.value)).trim();
          if (valueInput === 'Continuar »') {
            inputContinuar = input;
          }
        }
        let href = null;
        if (inputContinuar) {
          await inputContinuar.click();
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
          console.log(`[INPI][${processNumber}] Continuou para a tabela de marcas`);
        }
        href = '/pePI/jsp/marcas/Pesquisa_num_processo.jsp';
        await page.goto(new URL(href, page.url()).href, { waitUntil: 'networkidle0', timeout: 60000 });
        console.log(`[INPI][${processNumber}] Página de busca por número do processo carregada`);
        await (await page.waitForSelector('input[name="NumPedido"]', { timeout: 60000 })).type(processNumber);
        await (await page.waitForSelector('input[name="botao"]', { timeout: 60000 })).click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        // Pegando as tabelas do resultado da pesquisa pelo processo e o link para a página de detalhes
        let celulaComLink = null;
        let linkProcesso = null;
        try {
          const tabelas = await page.$$('table');
          if (!tabelas[2]) {
            // Não encontrou tabela de resultados, processo não existe
            await browser.close();
            return null;
          }
          const linhasTabela = await tabelas[2].$$('tr');
          if (!linhasTabela[1]) {
            // Não encontrou linha de resultado, processo não existe
            await browser.close();
            return null;
          }
          const tds = await linhasTabela[1].$$('td');
          celulaComLink = tds[0];
          if (!celulaComLink) throw new Error('Célula com link não encontrada');
          const linkEl = await celulaComLink.$('a');
          if (!linkEl) throw new Error('Link do processo não encontrado');
          linkProcesso = await linkEl.evaluate((el) => el.href);
        } catch (err) {
          // Se for erro de tabela/linha de resultado, retorna null
          if (
            String(err.message).includes('Linha de resultado não encontrada') ||
            String(err.message).includes('Tabela de resultados não encontrada')
          ) {
            if (browser) await browser.close();
            return null;
          }
          throw new Error(`[INPI][${processNumber}] Falha ao extrair link do processo: ${err.message}`);
        }
        let detalhesOk = false;
        for (let detAttempt = 1; detAttempt <= 2 && !detalhesOk; detAttempt++) {
          try {
            await page.goto(new URL(linkProcesso, page.url()).href, { waitUntil: 'load', timeout: 120000 });
            // Pegando os valores do cabeçalho do processo
            const tabelasCabecalhoProcesso = await page.$$('table');
            if (!tabelasCabecalhoProcesso[1]) throw new Error('Tabela de cabeçalho não encontrada');
            const tabelaCabecalhoProcessoInfo = tabelasCabecalhoProcesso[1];
            const linhas = await tabelaCabecalhoProcessoInfo?.$$('tr');
            if (!linhas || linhas.length === 0) throw new Error('Linhas do cabeçalho não encontradas');
            let marca = null;
            let situacao = null;
            let apresentacao = null;
            let natureza = null;
            const NUM_LINHAS = linhas.length;
            if (linhas && linhas?.length > 0) {
              console.log('TEM AS LINHAS COM AS INFORMAÇÕES DE MARCA ETC.');
            }
            marca = await linhas[2]?.$$eval('td font', (tds) =>
              tds[1]?.textContent?.trim(),
            );
            situacao = await linhas[NUM_LINHAS === 7 ? 3 : 6]?.$$eval(
              'td font',
              (tds) => tds[1]?.textContent?.trim(),
            );
            apresentacao = await linhas[NUM_LINHAS === 7 ? 4 : 7]?.$$eval(
              'td font',
              (tds) => tds[1]?.textContent?.trim(),
            );
            natureza = await linhas[NUM_LINHAS === 7 ? 5 : 8]?.$$eval(
              'td font',
              (tds) => tds[1]?.textContent?.trim(),
            );
            console.log(marca, situacao, apresentacao, natureza);
            const imgElement = await page.$(
              'img[src^="/pePI/servlet/LogoMarcasServletController"]',
            );
            if (imgElement) {
              const imageUrl = await imgElement.evaluate((img) => img.src);
              const cookies = await page.cookies();
              const cookieHeader = cookies
                .map((c) => `${c.name}=${c.value}`)
                .join('; ');
              try {
                const response = await axios.get(imageUrl, {
                  responseType: 'arraybuffer',
                  headers: {
                    Cookie: cookieHeader,
                  },
                });
                // Enviar diretamente o buffer para o Dropbox sem salvar localmente
                const fileName = `${processNumber}.jpg`;
                await uploadImageToDropbox(response.data, fileName);
                console.log(`Imagem enviada para o Dropbox: ${fileName}`);
              } catch (error) {
                console.error('Erro ao baixar a imagem:', error.message);
              }
            } else {
              console.log('Imagem não encontrada na página.');
            }
            const accordions = await page.$$('.accordion-item');
            const TOTAL_ACCORDIONS = accordions.length;
            const classeNiceLinhas = await accordions[0]?.$$('tbody tr');
            let classeNice = classeNiceLinhas.length
              ? await Promise.all(
                  classeNiceLinhas.map((linha) =>
                    linha.evaluate((tr) => {
                      const tds = tr.querySelectorAll('td');
                      const getText = (td: Element | null) =>
                        td?.textContent?.trim().replace(/\s+/g, ' ') || null;
                      return {
                        codigo: getText(tds[0]),
                        status: getText(tds[1]),
                        especificacao: getText(tds[2]),
                      };
                    }),
                  ),
                )
              : [];
            const classeVienaLinhas = await accordions[1]?.$$('tbody tr');
            const classeViena = classeVienaLinhas.length
              ? await Promise.all(
                  classeVienaLinhas.map((linha) =>
                    linha.evaluate((tr) => {
                      const tds = tr.querySelectorAll('td');
                      const getText = (td: Element | null) =>
                        td?.textContent?.trim().replace(/\s+/g, ' ') || null;
                      return {
                        edicao: getText(tds[0]),
                        codigo: getText(tds[1]),
                        descricao: getText(tds[2]),
                      };
                    }),
                  ),
                )
              : [];
            const accordionTitulares = accordions[2];
            const titulares = await accordionTitulares.$$eval('tbody tr', (linhas) =>
              linhas
                .map((linha) => {
                  const cols = linha.querySelectorAll('td font');
                  return cols[1]?.textContent?.trim() || '';
                })
                .filter((nome) => nome),
            );
            const accordionProcurador = accordions[3];
            const procurador = await accordionProcurador.$$eval(
              'tbody tr',
              (linhas) => {
                const linha = linhas[0];
                if (!linha) return null;
                const cols = linha.querySelectorAll('td font');
                return cols.length > 1 ? cols[1].textContent?.trim() : null;
              },
            );
            const datasTabela = await accordions[4].$('table');
            const dataThsTabela = await datasTabela.$$('th');
            const datas = {
              data_deposito:
                (await dataThsTabela[3]?.evaluate((el) => el.innerText)) ?? null,
              data_concessao:
                (await dataThsTabela[4]?.evaluate((el) => el.innerText)) ?? null,
              data_vigencia:
                (await dataThsTabela[5]?.evaluate((el) => el.innerText)) ?? null,
            };
            console.log(`DATAS: `);
            console.log(datas);
            let prazos: any = [];
            if (TOTAL_ACCORDIONS === 8) {
              const prazosTabela = await accordions[5]?.$('table');
              const tdsPrazosTabela = await prazosTabela?.$$('td');
              prazos = {
                data_inicio_prazo_ordinario:
                  (await tdsPrazosTabela[1]?.evaluate((el) => el.innerText)) ?? null,
                data_fim_prazo_ordinario:
                  (await tdsPrazosTabela[4]?.evaluate((el) => el.innerText)) ?? null,
                data_inicio_prazo_extraordinario:
                  (await tdsPrazosTabela[2]?.evaluate((el) => el.innerText)) ?? null,
                data_fim_prazo_extraordinario:
                  (await tdsPrazosTabela[5]?.evaluate((el) => el.innerText)) ?? null,
              };
            }
            const tabelasPeticoesProcessos = await accordions[
              TOTAL_ACCORDIONS === 8 ? 6 : 5
            ]?.$$('.accordion-content tbody tr');
            const peticoes = [];
            for (let index = 0; index < tabelasPeticoesProcessos.length; index++) {
              const tr = tabelasPeticoesProcessos[index];
              const cols = await tr.$$('td');
              const protocolo = cols[5]
                ? await cols[5]?.evaluate((e) => e.innerText.trim())
                : '';
              const data = cols[6]
                ? await cols[6]?.evaluate((e) => e.innerText.trim())
                : undefined;
              console.log(`DATA PETIÇÃO: ${data}`);
              const image = cols[7]
                ? await cols[7]?.evaluate((e) => e.innerText.trim())
                : '';
              const servico = cols[9]
                ? await cols[9]?.evaluate((e) => e.innerText.trim())
                : '';
              const cliente = cols[14]
                ? await cols[14]?.evaluate((e) => e.innerText.trim())
                : '';
              const peticao = {
                protocolo,
                data,
                servico,
                cliente,
                pagamento: null,
                image,
              };
              const divPagamento =
                await tabelasPeticoesProcessos[index].$('[id^="pgto"]');
              if (divPagamento) {
                const td = await divPagamento.$('td[align="left"]');
                if (td) {
                  const informacoesPagamento = await (
                    await td.$('.normal')
                  ).evaluate((el) => el.textContent.split('\n'));
                  const limpezaInfoPagamentos = informacoesPagamento
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);
                  const bancoDataValor =
                    limpezaInfoPagamentos.length >= 3 ? limpezaInfoPagamentos : [];
                  console.log('BANCO DATA VALOR');
                  console.log(bancoDataValor);
                  const banco = bancoDataValor[0]?.split(' - ')[1];
                  const codigoBanco = bancoDataValor[0]?.split(' - ')[0]?.trim();
                  const data = bancoDataValor[1]?.split(':')[1].trim();
                  const valor = bancoDataValor[2]?.replace('Valor:', '').trim();
                  console.log(`DATA PAGAMENTO: ${data}`);
                  peticao.pagamento = {
                    banco: banco || null,
                    codigoBanco: codigoBanco || null,
                    data: data || undefined,
                    valor: valor || null,
                  };
                }
              }
              if (peticao.protocolo) {
                peticoes.push(peticao);
              }
            }
            const publicacoesPeticoesProcessos = await accordions[
              TOTAL_ACCORDIONS === 8 ? 7 : 6
            ]?.$$('.accordion-content tbody tr');
            const publicacoes = [];
            if (
              publicacoesPeticoesProcessos &&
              publicacoesPeticoesProcessos?.length > 0
            ) {
              for (const trPublicacao of publicacoesPeticoesProcessos) {
                let publicacao: any = {};
                const tdsPublicacao = await trPublicacao?.$$('td');
                publicacao.rpi = await tdsPublicacao[0]?.evaluate((el) =>
                  el.textContent.trim(),
                );
                publicacao.data = await tdsPublicacao[1]?.evaluate((el) => {
                  const dateElement = el.querySelector('b');
                  return dateElement ? dateElement.textContent.trim() : '';
                });
                console.log(`Data Extraída: ${publicacao.data}`);
                publicacao.despacho = await tdsPublicacao[2]?.evaluate((el) =>
                  el.textContent.trim(),
                );
                publicacao.inteiro_teor = await tdsPublicacao[3]?.evaluate((el) =>
                  el.textContent.trim(),
                );
                const complementos_despacho_elemento = (
                  await tdsPublicacao[5]?.evaluate((el) => el.innerHTML)
                )?.split('<br>');
                let complementos: any[] = [];
                if (complementos_despacho_elemento?.length > 0) {
                  for (const complemento of complementos_despacho_elemento) {
                    const textoLimpoComplemento = complemento
                      .replace(/\s+/g, ' ')
                      .trim();
                    const regex = /<b>([^<]+)<\/b>*/g;
                    let match;
                    while ((match = regex.exec(textoLimpoComplemento)) !== null) {
                      complementos.push({
                        titulo: match[1]?.trim(),
                        conteudo: match[2]?.trim(),
                      });
                    }
                  }
                  publicacao.complementos_despacho = complementos;
                  publicacoes.push(publicacao);
                }
              }
            }
            await browser.close();
            return {
              marca,
              apresentacao,
              natureza,
              situacao,
              classeNice,
              classeViena,
              datas,
              prazos,
              peticoes,
              publicacoes,
              procurador,
              titulares,
            };
          } catch (detErr) {
            if (detAttempt < 2 && detErr.message && detErr.message.includes('Execution context is not available')) {
              console.warn(`[INPI][${processNumber}] Frame detached ao acessar detalhes, recarregando página de detalhes (tentativa ${detAttempt})...`);
              await new Promise((res) => setTimeout(res, 2000));
              continue;
            }
            throw detErr;
          }
        }
      } catch (error) {
        lastError = error;
        if (browser) {
          try { await browser.close(); } catch (e) { /* ignore */ }
        }
        const isFrameDetached = error?.message?.includes('frame was detached');
        const isNavigationError = error?.message?.includes('Navigation');
        console.error(`[INPI][${processNumber}] Erro na tentativa ${attempt}:`, error.message);
        if ((isFrameDetached || isNavigationError) && attempt < MAX_RETRIES) {
          console.log(`[INPI][${processNumber}] Retentando após erro de frame/navegação...`);
          await new Promise((res) => setTimeout(res, RETRY_DELAY * attempt));
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('Erro desconhecido ao ler dados do processo INPI');
  }
}
