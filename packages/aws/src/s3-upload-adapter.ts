import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createWriteStream } from "node:fs"
import { readFile } from "node:fs/promises"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { UploadedPart } from "@streamops/core"

export type PresignedUploadPart = {
  partNumber: number
  url: string
}

export type CreateMultipartUploadInput = {
  key: string
  contentType: string
  metadata?: Record<string, string>
}

export type PresignUploadPartsInput = {
  key: string
  multipartUploadId: string
  totalParts: number
  expiresInSeconds?: number
}

export type CompleteMultipartUploadInput = {
  key: string
  multipartUploadId: string
  parts: UploadedPart[]
}

export type AbortMultipartUploadInput = {
  key: string
  multipartUploadId: string
}

export type PutObjectInput = {
  key: string
  filePath: string
  contentType: string
  cacheControl?: string
}

export type PresignGetObjectInput = {
  key: string
  expiresInSeconds?: number
}

export type GetObjectBytesResult = {
  body: Uint8Array
  contentType: string
}

export class S3MultipartUploadAdapter {
  private readonly client: S3Client

  constructor(
    private readonly bucket: string,
    options?: { client?: S3Client; region?: string }
  ) {
    this.client = options?.client ?? new S3Client({ region: options?.region })
  }

  async createMultipartUpload(input: CreateMultipartUploadInput) {
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        ContentType: input.contentType,
        Metadata: input.metadata,
        ServerSideEncryption: "AES256",
      })
    )

    if (!response.UploadId) {
      throw new Error("S3 did not return a multipart upload ID.")
    }

    return response.UploadId
  }

  async presignUploadPartUrls(input: PresignUploadPartsInput): Promise<PresignedUploadPart[]> {
    const expiresIn = input.expiresInSeconds ?? 15 * 60

    return Promise.all(
      Array.from({ length: input.totalParts }, async (_, index) => {
        const partNumber = index + 1
        const command = new UploadPartCommand({
          Bucket: this.bucket,
          Key: input.key,
          UploadId: input.multipartUploadId,
          PartNumber: partNumber,
        })

        return {
          partNumber,
          url: await getSignedUrl(this.client, command, { expiresIn }),
        }
      })
    )
  }

  async completeMultipartUpload(input: CompleteMultipartUploadInput) {
    const parts = input.parts
      .slice()
      .sort((a, b) => a.partNumber - b.partNumber)
      .map<CompletedPart>((part) => ({
        PartNumber: part.partNumber,
        ETag: normalizeEtag(part.etag),
      }))

    return this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.multipartUploadId,
        MultipartUpload: { Parts: parts },
      })
    )
  }

  async abortMultipartUpload(input: AbortMultipartUploadInput) {
    return this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.multipartUploadId,
      })
    )
  }

  async downloadObjectToFile(key: string, filePath: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )

    if (!(response.Body instanceof Readable)) {
      throw new Error("S3 returned an unsupported object body.")
    }

    await pipeline(response.Body, createWriteStream(filePath))
  }

  async putObjectFromFile(input: PutObjectInput) {
    return this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: await readFile(input.filePath),
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        ServerSideEncryption: "AES256",
      })
    )
  }

  async presignGetObjectUrl(input: PresignGetObjectInput) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
      }),
      { expiresIn: input.expiresInSeconds ?? 10 * 60 }
    )
  }

  async getObjectBytes(key: string): Promise<GetObjectBytesResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )

    const body = await response.Body?.transformToByteArray()

    if (!body) {
      throw new Error("S3 returned an empty object body.")
    }

    return {
      body,
      contentType: response.ContentType ?? "application/octet-stream",
    }
  }
}

function normalizeEtag(etag: string) {
  const trimmed = etag.trim()
  return trimmed.startsWith("\"") ? trimmed : `"${trimmed}"`
}
