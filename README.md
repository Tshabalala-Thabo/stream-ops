# StreamOps

![StreamOps logo](./ChatGPT%20Image%20Jun%2024%2C%202026%2C%2003_28_16%20PM.png)

A cloud-native video processing platform that demonstrates scalable file uploads, object storage integration, asynchronous processing pipelines, distributed queues, and background workers.

## Overview

StreamOps is a portfolio project designed to showcase modern backend engineering concepts commonly used in media platforms such as YouTube, Vimeo, TikTok, and enterprise video management systems.

The platform allows users to upload large video files, store them in object storage, process them asynchronously, generate thumbnails, transcode videos into multiple resolutions, and monitor processing status in real-time.

The primary goal of this project is to demonstrate expertise in:

* Large file uploads
* Multipart/chunked upload workflows
* Object storage systems
* Distributed job queues
* Background workers
* Video transcoding
* Segment-based video streaming
* Cloud architecture
* System design
* Dockerized deployments
* API development

---

## Features

### Upload Management

* Secure upload sessions
* Presigned upload URLs
* Multipart/chunked uploads
* Upload progress tracking
* Upload validation

### Video Processing

* Background processing pipeline
* FFmpeg-powered transcoding
* Thumbnail generation
* Metadata extraction
* Multi-resolution output generation
* HLS playlist and playback segment generation

### Queue Processing

* Redis-backed job queues
* Retryable jobs
* Failed job handling
* Worker monitoring
* Horizontal worker scaling

### Storage

* Original video storage
* Processed video storage
* Thumbnail storage
* Object storage abstraction

### Monitoring

* Processing status updates
* Job execution tracking
* Queue monitoring dashboard
* Error reporting

---

## System Architecture

```text
┌─────────────┐
│   Next.js   │
│ Frontend UI │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Laravel API │
└──────┬──────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌───────────┐   ┌─────────────┐
│ Database  │   │ Object      │
│ MySQL     │   │ Storage     │
└───────────┘   │ S3 / R2     │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ Redis Queue │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ FFmpeg      │
                │ Workers     │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ Processed   │
                │ Outputs     │
                └─────────────┘
```

---

## Processing Workflow

### 1. Upload Creation

User initiates an upload request.

The API:

* Creates a video record
* Creates an upload session
* Generates presigned upload URLs for one or more file parts
* Returns upload configuration, chunk size, and object storage metadata

### 2. Chunked File Upload

The frontend uploads the original video directly to object storage using multipart/chunked uploads.

This upload flow is designed for reliable ingestion of large video files:

* The browser splits the upload into numbered parts
* Each part is uploaded directly to object storage
* Failed parts can be retried without restarting the whole upload
* Upload progress can be tracked per part and for the whole file
* Object storage combines the parts into the final original video object

The original video is kept as the source/master file for future processing or reprocessing.

### 3. Queue Dispatch

Once upload completes:

* The frontend confirms upload completion with the API
* The API verifies the completed object in storage
* Video status becomes `queued`
* Processing jobs are dispatched

### 4. Background Processing

Workers:

* Download source video
* Extract metadata
* Generate thumbnail
* Generate multiple playback resolutions
* Generate HLS playlists and playback segments
* Upload generated assets

### 5. Completion

Video status becomes:

```text
completed
```

Available outputs:

* Thumbnail
* HLS master playlist
* 480p playlist and segments
* 720p playlist and segments
* 1080p playlist and segments

---

## Upload Chunking Flow

Upload chunking is used when a large source video is uploaded into object storage.

```text
Browser
   ↓
Create upload session
   ↓
Laravel API creates video record and multipart upload
   ↓
Browser uploads parts directly to S3 / R2 / MinIO
   ↓
Browser confirms upload completion
   ↓
Laravel API marks video as uploaded
   ↓
Laravel API dispatches processing job
```

This flow is about reliability and scalability during upload. The API coordinates the upload, but the large video bytes do not need to pass through the Laravel application server.

---

## Playback Segmenting Flow

Playback segmenting is used after the source video has been uploaded and processing begins.

```text
Original video
   ↓
FFmpeg worker
   ↓
Generate 480p / 720p / 1080p renditions
   ↓
Split each rendition into small playback segments
   ↓
Generate HLS playlists
   ↓
Upload playlists and segments to object storage
   ↓
Video player streams segments from storage/CDN
```

This flow is about streaming performance. Instead of serving one large processed video file, the player loads a playlist and downloads small segments as needed.

The project can support adaptive bitrate playback by generating multiple quality levels and a master playlist that lets the player switch between qualities based on network speed.

---

## Media Storage Strategy

StreamOps separates source files from generated playback assets:

* Original/source video: kept permanently as the master file
* Thumbnail: kept as a generated preview asset
* HLS playlists: kept as playback entry points
* HLS segments: stored in object storage under structured output paths

Spatie Media Library can be used as the media catalog for the source video, thumbnails, and primary playback playlist records. Individual HLS segment files should be stored in object storage as grouped output assets rather than tracked as separate database records for every segment.

---

## Technology Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* TanStack Query

### Backend

* Laravel
* PHP 8.4
* REST API

### Database

* MySQL

### Queue

* Redis
* Laravel Horizon

### Storage

* Amazon S3
* Cloudflare R2
* MinIO (local development)

### Processing

* FFmpeg

### Infrastructure

* Docker
* Docker Compose
* Nginx

### Deployment

* AWS EC2
* Oracle Cloud VM
* DigitalOcean Droplets

---

## Database Design

### videos

| Column        | Type      |
| ------------- | --------- |
| id            | UUID      |
| filename      | string    |
| original_path | string    |
| status        | enum      |
| duration      | integer   |
| size          | bigint    |
| mime_type     | string    |
| error_message | text      |
| created_at    | timestamp |

### video_outputs

| Column       | Type      |
| ------------ | --------- |
| id           | UUID      |
| video_id     | UUID      |
| type         | string    |
| resolution   | string    |
| storage_path | string    |
| size         | bigint    |
| created_at   | timestamp |

---

## Status Lifecycle

```text
uploaded
    ↓
queued
    ↓
processing
    ↓
completed
```

Failure path:

```text
processing
    ↓
failed
```

---

## Future Enhancements

### Phase 2

* Advanced adaptive bitrate tuning
* CDN delivery and signed playback URLs
* Video trimming
* Watermarking
* Subtitle generation

### Phase 3

* AI-powered scene detection
* Automatic video summarization
* Object recognition
* Content moderation
* Speech-to-text transcription

### Phase 4

* Kubernetes deployment
* Event-driven architecture
* Multiple processing services
* Auto-scaling workers

---

## Local Development

### Prerequisites

* Docker
* Docker Compose
* PHP 8.4
* Node.js 22+
* Redis
* FFmpeg

### Installation

```bash
git clone https://github.com/your-username/stream-ops.git

cd stream-ops

cp .env.example .env

docker compose up -d

composer install

npm install

php artisan migrate

php artisan horizon
```

### Run Frontend

```bash
npm run dev
```

### Run Backend

```bash
php artisan serve
```

---

## Learning Objectives

This project demonstrates practical experience with:

* Cloud-native application design
* Distributed systems concepts
* Object storage architecture
* Queue-based processing
* Background job orchestration
* Video processing pipelines
* Dockerized development environments
* Scalable backend architecture

---

## Portfolio Value

StreamOps is designed as a production-style engineering project that showcases skills commonly required for:

* Backend Engineer
* Software Engineer
* Platform Engineer
* Cloud Engineer
* DevOps Engineer
* Solutions Architect

The architecture intentionally mirrors patterns used by large-scale media and content delivery platforms while remaining small enough to build and maintain as an individual portfolio project.
