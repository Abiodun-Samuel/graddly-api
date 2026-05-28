import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PdfGenerationJob } from '../pdf/entities/pdf-generation-job.entity.js';
import { PdfJobStatus } from '../pdf/enums/pdf-job-status.enum.js';
import { PdfService } from '../pdf/pdf.service.js';
import { StorageObjectCategory } from '../storage/enums/storage-object-category.enum.js';
import { StorageKeyBuilder } from '../storage/storage-key.builder.js';
import { StorageService } from '../storage/storage.service.js';

import { CreateSignatureRecordDto } from './dto/create-signature-record.dto.js';
import {
  SignSignatureRecordResponseDto,
  SignatureRecordResponseDto,
} from './dto/signature-record-response.dto.js';
import { SignatureRecord } from './entities/signature-record.entity.js';
import { SignatureRecordStatus } from './enums/signature-record-status.enum.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class EsignatureService {
  constructor(
    private readonly storage: StorageService,
    private readonly keyBuilder: StorageKeyBuilder,
    private readonly pdfService: PdfService,
    @InjectRepository(SignatureRecord)
    private readonly recordRepo: Repository<SignatureRecord>,
    @InjectRepository(PdfGenerationJob)
    private readonly pdfJobRepo: Repository<PdfGenerationJob>,
  ) {}

  async createRecord(
    user: AuthenticatedUser,
    dto: CreateSignatureRecordDto,
    clientIp: string,
    userAgent?: string,
  ): Promise<SignatureRecordResponseDto> {
    const organisationId = user.organisationId!;

    if (
      !this.keyBuilder.belongsToOrganisation(
        dto.signatureImageKey,
        organisationId,
      )
    ) {
      throw new BadRequestException('Signature image key is not in org scope');
    }

    if (dto.pdfJobId && dto.sourcePdfKey) {
      throw new BadRequestException(
        'Provide either pdfJobId or sourcePdfKey, not both',
      );
    }

    let pdfJob: PdfGenerationJob | null = null;
    if (dto.pdfJobId) {
      pdfJob = await this.pdfJobRepo.findOne({
        where: { id: dto.pdfJobId, organisationId },
      });
      if (!pdfJob) {
        throw new NotFoundException('PDF job not found');
      }
      if (pdfJob.status !== PdfJobStatus.COMPLETED || !pdfJob.outputKey) {
        throw new BadRequestException('PDF job is not completed');
      }
    } else if (dto.sourcePdfKey) {
      if (
        !this.keyBuilder.belongsToOrganisation(dto.sourcePdfKey, organisationId)
      ) {
        throw new BadRequestException('Source PDF key is not in org scope');
      }
    } else {
      throw new BadRequestException(
        'Either pdfJobId or sourcePdfKey is required',
      );
    }

    const imageBuffer = await this.storage.getObjectBuffer(
      organisationId,
      dto.signatureImageKey,
    );
    const signatureImageHash = createHash('sha256')
      .update(imageBuffer)
      .digest('hex');

    const record = this.recordRepo.create({
      organisationId,
      signerUserId: user.id,
      signatureImageKey: dto.signatureImageKey,
      signatureImageHash,
      signedAt: new Date(),
      clientIp,
      userAgent: userAgent ?? null,
      pdfGenerationJobId: pdfJob?.id ?? null,
      sourcePdfKey: dto.sourcePdfKey ?? null,
      status: SignatureRecordStatus.PENDING,
    });

    const saved = await this.recordRepo.save(record);
    return this.toDto(saved, organisationId);
  }

  async findOne(
    user: AuthenticatedUser,
    recordId: string,
  ): Promise<SignatureRecordResponseDto> {
    const organisationId = user.organisationId!;
    const record = await this.recordRepo.findOne({
      where: { id: recordId, organisationId },
    });
    if (!record) {
      throw new NotFoundException('Signature record not found');
    }
    if (record.signerUserId !== user.id && !this.isAdmin(user)) {
      throw new NotFoundException('Signature record not found');
    }
    return this.toDto(record, organisationId);
  }

  async completeSigning(
    user: AuthenticatedUser,
    recordId: string,
  ): Promise<SignSignatureRecordResponseDto> {
    const organisationId = user.organisationId!;
    const record = await this.recordRepo.findOne({
      where: { id: recordId, organisationId },
    });
    if (!record) {
      throw new NotFoundException('Signature record not found');
    }
    if (record.signerUserId !== user.id) {
      throw new NotFoundException('Signature record not found');
    }
    if (record.status === SignatureRecordStatus.SIGNED && record.signedPdfKey) {
      return this.toSignResponse(record, organisationId);
    }
    if (record.status === SignatureRecordStatus.FAILED) {
      throw new ConflictException('Signature record failed previously');
    }

    try {
      let unsignedPdfKey: string | null = null;
      if (record.pdfGenerationJobId) {
        const pdfJob = await this.pdfJobRepo.findOne({
          where: { id: record.pdfGenerationJobId, organisationId },
        });
        unsignedPdfKey = pdfJob?.outputKey ?? null;
      } else if (record.sourcePdfKey) {
        unsignedPdfKey = record.sourcePdfKey;
      }

      if (!unsignedPdfKey) {
        throw new BadRequestException(
          'Signature record requires a completed PDF job or source PDF key',
        );
      }

      const [unsignedPdf, signaturePng] = await Promise.all([
        this.storage.getObjectBuffer(organisationId, unsignedPdfKey),
        this.storage.getObjectBuffer(organisationId, record.signatureImageKey),
      ]);

      const signedPdf = await this.pdfService.embedSignature(
        unsignedPdf,
        signaturePng,
        {
          signedAt: record.signedAt,
          signerLabel: user.email,
        },
      );

      const signedPdfKey = this.keyBuilder.build({
        organisationId,
        category: StorageObjectCategory.EXPORT,
        filename: `signed-${record.id}.pdf`,
        objectId: record.id,
      });

      await this.storage.putObject(
        organisationId,
        signedPdfKey,
        signedPdf,
        'application/pdf',
      );

      record.signedPdfKey = signedPdfKey;
      record.status = SignatureRecordStatus.SIGNED;
      await this.recordRepo.save(record);

      return this.toSignResponse(record, organisationId);
    } catch (error) {
      record.status = SignatureRecordStatus.FAILED;
      await this.recordRepo.save(record);
      throw error;
    }
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    const roles = user.roles ?? [];
    return roles.includes('owner') || roles.includes('admin');
  }

  private async toDto(
    record: SignatureRecord,
    organisationId: string,
  ): Promise<SignatureRecordResponseDto> {
    const dto: SignatureRecordResponseDto = {
      id: record.id,
      status: record.status,
      signatureImageKey: record.signatureImageKey,
      signatureImageHash: record.signatureImageHash,
      signedAt: record.signedAt.toISOString(),
      clientIp: record.clientIp,
      userAgent: record.userAgent,
      pdfGenerationJobId: record.pdfGenerationJobId,
      signedPdfKey: record.signedPdfKey,
    };

    if (record.signedPdfKey) {
      const download = await this.storage.createDownloadUrl(organisationId, {
        key: record.signedPdfKey,
      });
      dto.downloadUrl = download.downloadUrl;
      dto.downloadExpiresAt = download.expiresAt.toISOString();
    }

    return dto;
  }

  private async toSignResponse(
    record: SignatureRecord,
    organisationId: string,
  ): Promise<SignSignatureRecordResponseDto> {
    if (!record.signedPdfKey) {
      throw new BadRequestException('Signed PDF key missing');
    }
    const download = await this.storage.createDownloadUrl(organisationId, {
      key: record.signedPdfKey,
    });
    return {
      signedPdfKey: record.signedPdfKey,
      downloadUrl: download.downloadUrl,
      downloadExpiresAt: download.expiresAt.toISOString(),
    };
  }
}
