-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'CLIENTE', 'OPERADOR') NULL DEFAULT 'CLIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `users_id_idx`(`id`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_downloads_rpis_weekly` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `details` TEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `logs_downloads_rpis_weekly_id_idx`(`id`),
    INDEX `logs_downloads_rpis_weekly_number_idx`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revistas_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NULL,
    `data_lancamento` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `revistas_rpi_id_numero_data_lancamento_idx`(`id`, `numero`, `data_lancamento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `processos_revistas_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NULL,
    `procurador` TEXT NULL,
    `data_deposito` DATETIME(3) NULL,
    `data_concessao` DATETIME(3) NULL,
    `data_vigencia` DATETIME(3) NULL,
    `apostila` TEXT NULL,
    `imagem_marca` VARCHAR(191) NULL,
    `natureza` VARCHAR(191) NULL,
    `apresentacao` VARCHAR(191) NULL,
    `situacao` VARCHAR(191) NULL,
    `is_acompanhado_pela_bunker` BOOLEAN NULL DEFAULT false,
    `is_processo_de_terceiro` BOOLEAN NULL DEFAULT false,
    `revista_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `responsavel_id` INTEGER NULL,

    INDEX `processos_revistas_rpi_id_numero_idx`(`id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `despachos_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` TEXT NULL,
    `nome` TEXT NULL,
    `texto_complementar` MEDIUMTEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `despachos_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `protocolos_despachos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NULL,
    `data` DATETIME(3) NULL,
    `codigo_servico` VARCHAR(191) NULL,
    `procurador` TEXT NULL,
    `pais` VARCHAR(2) NULL,
    `despacho_protocolo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `protocolos_despachos_rpi_id_numero_idx`(`id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requerente_protocolo_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_razao_social` TEXT NULL,
    `pais` VARCHAR(2) NULL,
    `uf` VARCHAR(2) NULL,
    `protocolo_despacho_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `requerente_protocolo_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cedentes_protocolos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_razao_social` TEXT NULL,
    `pais` VARCHAR(2) NULL,
    `uf` VARCHAR(2) NULL,
    `protocolo_despacho_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `cedentes_protocolos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cessionarios_protocolos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_razao_social` TEXT NULL,
    `pais` VARCHAR(2) NULL,
    `uf` VARCHAR(2) NULL,
    `protocolo_despacho_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `cessionarios_protocolos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `titulares_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_razao_social` TEXT NULL,
    `pais` VARCHAR(2) NULL,
    `uf` VARCHAR(2) NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `titulares_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes_nice_processo_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` TEXT NULL,
    `status` VARCHAR(191) NULL,
    `especificacao` MEDIUMTEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `classes_nice_processo_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marca_processo_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `apresentacao` VARCHAR(191) NULL,
    `natureza` VARCHAR(191) NULL,
    `nome` TEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `marca_processo_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sobrestadores_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `processo` VARCHAR(191) NULL,
    `marca` TEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `sobrestadores_processos_rpi_id_processo_idx`(`id`, `processo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes_vienna_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` TEXT NULL,
    `edicao` TEXT NULL,
    `descricao` TEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `classes_vienna_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classe_nacional_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` TEXT NULL,
    `especificacao` MEDIUMTEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `classe_nacional_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subclasses_nacional_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` TEXT NULL,
    `classe_nacional_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `subclasses_nacional_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prioridade_unionista_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATETIME(3) NULL,
    `numero` VARCHAR(191) NULL,
    `pais` VARCHAR(2) NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `prioridade_unionista_processos_rpi_id_numero_idx`(`id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peticoes_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_protocolo` TEXT NULL,
    `data` DATE NULL,
    `imagem` VARCHAR(191) NULL,
    `servico` INTEGER NULL,
    `cliente` TEXT NULL,
    `delivery` VARCHAR(191) NULL,
    `data_delivery` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `processo_rpi_id` INTEGER NULL,

    INDEX `peticoes_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos_peticoes_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agencia_nome_banco` VARCHAR(191) NULL,
    `data` DATE NULL,
    `valor` DOUBLE NULL,
    `peticao_processo_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `pagamentos_peticoes_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prazos_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data_inicio_prazo_ordinario` DATE NULL,
    `data_fim_prazo_ordinario` DATE NULL,
    `data_inicio_prazo_extraordinario` DATE NULL,
    `data_fim_prazo_extraordinario` DATE NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `prazos_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publicacoes_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_rpi` VARCHAR(191) NULL,
    `data_rpi` DATE NULL,
    `despacho` MEDIUMTEXT NULL,
    `certificado` VARCHAR(191) NULL,
    `inteiro_teor` VARCHAR(191) NULL,
    `complementos_despacho` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `peticao_processo_rpi_id` INTEGER NULL,

    INDEX `publicacoes_processos_rpi_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envolvidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_identificacao` VARCHAR(191) NULL,
    `tipo_envolvido` ENUM('AGENTE', 'CLIENTE', 'OUTRA_PARTE', 'OUTROS', 'TERCEIRO') NULL,
    `cadastro_externo` VARCHAR(191) NULL,
    `inscricao_municipal` VARCHAR(191) NULL,
    `inscricao_estadual` VARCHAR(191) NULL,
    `tipo_pessoa` VARCHAR(191) NULL,
    `cpf_cnpj` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `envolvidos_id_cpf_cnpj_deletedAt_idx`(`id`, `cpf_cnpj`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envolvidos_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `envolvido_id` INTEGER NULL,
    `processo_rpi_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `envolvidos_processos_rpi_id_envolvido_id_processo_rpi_id_idx`(`id`, `envolvido_id`, `processo_rpi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexos_processos_rpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_anexo` TEXT NULL,
    `path` VARCHAR(191) NULL,
    `tipo` ENUM('LOGO', 'PETICAO_DO_INPI') NULL,
    `descricao` TEXT NULL,
    `processo_rpi_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `anexos_processos_rpi_id_processo_rpi_id_idx`(`id`, `processo_rpi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ocorrencias_Processo_RPI` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `processo_rpi_id` INTEGER NULL,
    `data` DATETIME(3) NULL,
    `descricao` VARCHAR(255) NULL,
    `protocolo` VARCHAR(255) NULL,
    `detalhes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colidencias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `processo_base_id` INTEGER NOT NULL,
    `elemento_base` TEXT NULL,
    `processo_colidente_id` INTEGER NOT NULL,
    `elemento_colidido` TEXT NULL,
    `tipo_colidencia` ENUM('APR', 'SUF', 'PRE', 'RAD') NOT NULL,
    `nivel_similaridade` DOUBLE NOT NULL,
    `revista_rpi_id` INTEGER NULL,
    `selecionada` BOOLEAN NOT NULL DEFAULT false,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `colidencias_processo_base_id_processo_colidente_id_idx`(`processo_base_id`, `processo_colidente_id`),
    INDEX `colidencias_revista_rpi_id_idx`(`revista_rpi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `processos_revistas_rpi` ADD CONSTRAINT `processos_revistas_rpi_revista_rpi_id_fkey` FOREIGN KEY (`revista_rpi_id`) REFERENCES `revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos_revistas_rpi` ADD CONSTRAINT `processos_revistas_rpi_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `despachos_processos_rpi` ADD CONSTRAINT `despachos_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `protocolos_despachos_rpi` ADD CONSTRAINT `protocolos_despachos_rpi_despacho_protocolo_rpi_id_fkey` FOREIGN KEY (`despacho_protocolo_rpi_id`) REFERENCES `despachos_processos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requerente_protocolo_rpi` ADD CONSTRAINT `requerente_protocolo_rpi_protocolo_despacho_rpi_id_fkey` FOREIGN KEY (`protocolo_despacho_rpi_id`) REFERENCES `protocolos_despachos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cedentes_protocolos_rpi` ADD CONSTRAINT `cedentes_protocolos_rpi_protocolo_despacho_rpi_id_fkey` FOREIGN KEY (`protocolo_despacho_rpi_id`) REFERENCES `protocolos_despachos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cessionarios_protocolos_rpi` ADD CONSTRAINT `cessionarios_protocolos_rpi_protocolo_despacho_rpi_id_fkey` FOREIGN KEY (`protocolo_despacho_rpi_id`) REFERENCES `protocolos_despachos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `titulares_processos_rpi` ADD CONSTRAINT `titulares_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes_nice_processo_rpi` ADD CONSTRAINT `classes_nice_processo_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marca_processo_rpi` ADD CONSTRAINT `marca_processo_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sobrestadores_processos_rpi` ADD CONSTRAINT `sobrestadores_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes_vienna_processos_rpi` ADD CONSTRAINT `classes_vienna_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classe_nacional_processos_rpi` ADD CONSTRAINT `classe_nacional_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subclasses_nacional_processos_rpi` ADD CONSTRAINT `subclasses_nacional_processos_rpi_classe_nacional_id_fkey` FOREIGN KEY (`classe_nacional_id`) REFERENCES `classe_nacional_processos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prioridade_unionista_processos_rpi` ADD CONSTRAINT `prioridade_unionista_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peticoes_processos_rpi` ADD CONSTRAINT `peticoes_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_peticoes_processos_rpi` ADD CONSTRAINT `pagamentos_peticoes_processos_rpi_peticao_processo_id_fkey` FOREIGN KEY (`peticao_processo_id`) REFERENCES `peticoes_processos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prazos_processos_rpi` ADD CONSTRAINT `prazos_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicacoes_processos_rpi` ADD CONSTRAINT `publicacoes_processos_rpi_peticao_processo_rpi_id_fkey` FOREIGN KEY (`peticao_processo_rpi_id`) REFERENCES `peticoes_processos_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `envolvidos_processos_rpi` ADD CONSTRAINT `envolvidos_processos_rpi_envolvido_id_fkey` FOREIGN KEY (`envolvido_id`) REFERENCES `envolvidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `envolvidos_processos_rpi` ADD CONSTRAINT `envolvidos_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos_processos_rpi` ADD CONSTRAINT `anexos_processos_rpi_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ocorrencias_Processo_RPI` ADD CONSTRAINT `Ocorrencias_Processo_RPI_processo_rpi_id_fkey` FOREIGN KEY (`processo_rpi_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colidencias` ADD CONSTRAINT `colidencias_processo_base_id_fkey` FOREIGN KEY (`processo_base_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colidencias` ADD CONSTRAINT `colidencias_processo_colidente_id_fkey` FOREIGN KEY (`processo_colidente_id`) REFERENCES `processos_revistas_rpi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colidencias` ADD CONSTRAINT `colidencias_revista_rpi_id_fkey` FOREIGN KEY (`revista_rpi_id`) REFERENCES `revistas_rpi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
