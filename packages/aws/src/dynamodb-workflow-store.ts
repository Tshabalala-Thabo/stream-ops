import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb"

import {
  DEFAULT_PART_SIZE,
  WorkflowError,
  completeUpload,
  expireUpload,
  validateCreateUploadInput,
  validateOwnerAccess,
  type CreateUploadInput,
  type EntityId,
  type UploadSession,
  type UploadedPart,
  type Video,
} from "@streamops/core"

const UPLOAD_TTL_HOURS = 24

type EntityItem = Record<string, unknown> & {
  PK: string
  SK: string
  entityType: string
}

type UploadLookupItem = EntityItem & {
  entityType: "UPLOAD_LOOKUP"
  videoId: EntityId
  ownerId: EntityId
}

export class DynamoDBWorkflowStore {
  private readonly client: DynamoDBDocumentClient

  constructor(
    private readonly tableName: string,
    options?: { client?: DynamoDBDocumentClient; region?: string }
  ) {
    this.client =
      options?.client ??
      DynamoDBDocumentClient.from(new DynamoDBClient({ region: options?.region }), {
        marshallOptions: { removeUndefinedValues: true },
      })
  }

  async createUpload(
    input: CreateUploadInput & {
      objectKey: string
      multipartUploadId: string
      videoId?: EntityId
      uploadSessionId?: EntityId
    }
  ) {
    validateCreateUploadInput(input)

    const created = createAwsUpload(input)
    await this.createUploadRecords(created.video, created.uploadSession)

    return created
  }

  async createUploadRecords(video: Video, uploadSession: UploadSession) {
    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: toUserVideoItem(video),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toVideoMetadataItem(video),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadSessionItem(uploadSession),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadLookupItem(uploadSession),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
        ],
      })
    )
  }

  async listVideos(ownerId: EntityId) {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": userPk(ownerId),
          ":sk": "VIDEO#",
        },
        ScanIndexForward: false,
      })
    )

    return (response.Items ?? []).map(toVideo)
  }

  async getVideo(videoId: EntityId, ownerId: EntityId) {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: videoMetadataKey(videoId),
      })
    )

    if (!response.Item) {
      throw new WorkflowError("Video was not found.", "video_not_found")
    }

    const video = toVideo(response.Item)
    validateOwnerAccess(video.ownerId, ownerId)
    return video
  }

  async getUploadSession(sessionId: EntityId, ownerId: EntityId) {
    const lookup = await this.getUploadLookup(sessionId, ownerId)
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: uploadSessionKey(lookup.videoId, sessionId),
      })
    )

    if (!response.Item) {
      throw new WorkflowError("Upload session was not found.", "upload_not_found")
    }

    const session = toUploadSession(response.Item)
    validateOwnerAccess(session.ownerId, ownerId)
    return session
  }

  async completeUpload(sessionId: EntityId, ownerId: EntityId, parts: UploadedPart[], now = new Date()) {
    const session = await this.getUploadSession(sessionId, ownerId)
    const video = await this.getVideo(session.videoId, ownerId)
    const completed = completeUpload(session, video, parts, now)

    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadSessionItem(completed.session),
              ConditionExpression: "#status = :active",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":active": "active" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadLookupItem(completed.session),
              ConditionExpression: "#status = :active",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":active": "active" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toVideoMetadataItem(completed.video),
              ConditionExpression: "#status = :uploading",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":uploading": "uploading" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUserVideoItem(completed.video),
              ConditionExpression: "#status = :uploading",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":uploading": "uploading" },
            },
          },
        ],
      })
    )

    return completed
  }

  async expireUpload(sessionId: EntityId, ownerId: EntityId, now = new Date()) {
    const session = await this.getUploadSession(sessionId, ownerId)
    const video = await this.getVideo(session.videoId, ownerId)
    const expired = expireUpload(session, video, now)

    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadSessionItem(expired.session),
              ConditionExpression: "#status = :active",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":active": "active" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUploadLookupItem(expired.session),
              ConditionExpression: "#status = :active",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":active": "active" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toVideoMetadataItem(expired.video),
              ConditionExpression: "#status = :uploading",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":uploading": "uploading" },
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: toUserVideoItem(expired.video),
              ConditionExpression: "#status = :uploading",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: { ":uploading": "uploading" },
            },
          },
        ],
      })
    )

    return expired
  }

  private async getUploadLookup(sessionId: EntityId, ownerId: EntityId): Promise<UploadLookupItem> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: uploadLookupKey(sessionId),
      })
    )

    if (!response.Item) {
      throw new WorkflowError("Upload session was not found.", "upload_not_found")
    }

    const lookup = response.Item as UploadLookupItem
    validateOwnerAccess(lookup.ownerId, ownerId)
    return lookup
  }
}

function createAwsUpload(
  input: CreateUploadInput & {
    objectKey: string
    multipartUploadId: string
    videoId?: EntityId
    uploadSessionId?: EntityId
  }
) {
  const now = input.now ?? new Date()
  const timestamp = now.toISOString()
  const videoId = input.videoId ?? createId()
  const uploadSessionId = input.uploadSessionId ?? createId()
  const totalParts = Math.max(1, Math.ceil(input.fileSize / DEFAULT_PART_SIZE))
  const expiresAt = new Date(now.getTime() + UPLOAD_TTL_HOURS * 60 * 60 * 1000)

  const video: Video = {
    id: videoId,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: "uploading",
    sourceKey: null,
    thumbnailKey: null,
    playbackManifestKey: null,
    durationSeconds: null,
    width: null,
    height: null,
    processingError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const uploadSession: UploadSession = {
    id: uploadSessionId,
    videoId,
    ownerId: input.ownerId,
    status: "active",
    objectKey: input.objectKey,
    multipartUploadId: input.multipartUploadId,
    partSize: DEFAULT_PART_SIZE,
    totalParts,
    uploadedParts: [],
    originalFileName: input.fileName,
    originalFileSize: input.fileSize,
    originalMimeType: input.mimeType,
    expiresAt: expiresAt.toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return { video, uploadSession }
}

function createId() {
  return globalThis.crypto.randomUUID()
}

function userPk(ownerId: EntityId) {
  return `USER#${ownerId}`
}

function videoPk(videoId: EntityId) {
  return `VIDEO#${videoId}`
}

function uploadPk(sessionId: EntityId) {
  return `UPLOAD#${sessionId}`
}

function videoMetadataKey(videoId: EntityId) {
  return { PK: videoPk(videoId), SK: "METADATA" }
}

function uploadSessionKey(videoId: EntityId, sessionId: EntityId) {
  return { PK: videoPk(videoId), SK: `UPLOAD#${sessionId}` }
}

function uploadLookupKey(sessionId: EntityId) {
  return { PK: uploadPk(sessionId), SK: "METADATA" }
}

function ttlSeconds(expiresAt: string) {
  return Math.floor(new Date(expiresAt).getTime() / 1000)
}

function toUserVideoItem(video: Video): EntityItem {
  return {
    ...video,
    PK: userPk(video.ownerId),
    SK: `VIDEO#${video.id}`,
    entityType: "VIDEO_LIST",
  }
}

function toVideoMetadataItem(video: Video): EntityItem {
  return {
    ...video,
    ...videoMetadataKey(video.id),
    entityType: "VIDEO",
  }
}

function toUploadSessionItem(session: UploadSession): EntityItem {
  return {
    ...session,
    ...uploadSessionKey(session.videoId, session.id),
    entityType: "UPLOAD_SESSION",
    ttl: ttlSeconds(session.expiresAt),
  }
}

function toUploadLookupItem(session: UploadSession): UploadLookupItem & { status: UploadSession["status"]; ttl: number } {
  return {
    ...uploadLookupKey(session.id),
    entityType: "UPLOAD_LOOKUP",
    videoId: session.videoId,
    ownerId: session.ownerId,
    status: session.status,
    ttl: ttlSeconds(session.expiresAt),
  }
}

function toVideo(item: Record<string, unknown>): Video {
  return {
    id: String(item.id),
    ownerId: String(item.ownerId),
    title: String(item.title),
    description: item.description === null ? null : String(item.description),
    status: item.status as Video["status"],
    sourceKey: item.sourceKey === null ? null : String(item.sourceKey),
    thumbnailKey: item.thumbnailKey === null ? null : String(item.thumbnailKey),
    playbackManifestKey: item.playbackManifestKey === null ? null : String(item.playbackManifestKey),
    durationSeconds: item.durationSeconds === null ? null : Number(item.durationSeconds),
    width: item.width === null ? null : Number(item.width),
    height: item.height === null ? null : Number(item.height),
    processingError: item.processingError === null ? null : String(item.processingError),
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt),
  }
}

function toUploadSession(item: Record<string, unknown>): UploadSession {
  return {
    id: String(item.id),
    videoId: String(item.videoId),
    ownerId: String(item.ownerId),
    status: item.status as UploadSession["status"],
    objectKey: String(item.objectKey),
    multipartUploadId: String(item.multipartUploadId),
    partSize: Number(item.partSize),
    totalParts: Number(item.totalParts),
    uploadedParts: Array.isArray(item.uploadedParts) ? (item.uploadedParts as UploadedPart[]) : [],
    originalFileName: String(item.originalFileName),
    originalFileSize: Number(item.originalFileSize),
    originalMimeType: String(item.originalMimeType),
    expiresAt: String(item.expiresAt),
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt),
  }
}
