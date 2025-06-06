<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AzureWhisperService;
use App\Services\AudioChunkingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AudioController extends Controller
{
    private $azureWhisperService;
    private $audioChunkingService;

    public function __construct(AzureWhisperService $azureWhisperService, AudioChunkingService $audioChunkingService)
    {
        $this->azureWhisperService = $azureWhisperService;
        $this->audioChunkingService = $audioChunkingService;
    }

    /**
     * Upload audio file, save it, chunk it, then transcribe each chunk
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            // Validate upload
            $validator = Validator::make($request->all(), [
                'audio' => 'required|file|mimes:wav,mp3,webm,m4a,ogg,flac|max:25600',
                'meeting_id' => 'nullable|integer|exists:meetings,id',
                'use_chunking' => 'nullable|boolean', // New option
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ongeldige audio upload',
                    'errors' => $validator->errors()
                ], 422);
            }

            $audioFile = $request->file('audio');
            $meetingId = $request->input('meeting_id');
            $useChunking = $request->input('use_chunking', true); // Default to chunking
            $userId = $request->user()->id;

            Log::info('Audio upload received', [
                'user_id' => $userId,
                'meeting_id' => $meetingId,
                'original_name' => $audioFile->getClientOriginalName(),
                'file_size' => $audioFile->getSize(),
                'use_chunking' => $useChunking,
            ]);

            // Generate unique filename
            $timestamp = now()->format('Y-m-d_H-i-s');
            $extension = $audioFile->getClientOriginalExtension();
            $filename = "audio_{$userId}_{$timestamp}.{$extension}";

            // Save original file
            $savedPath = $audioFile->storeAs('audio', $filename);
            $fullPath = storage_path('app/' . $savedPath);

            Log::info('Audio file saved', [
                'saved_path' => $savedPath,
                'full_path' => $fullPath,
                'file_size' => filesize($fullPath),
            ]);

            // Process based on chunking preference
            if ($useChunking && filesize($fullPath) > (1024 * 1024 * 2)) { // Chunk files larger than 2MB
                $result = $this->processAudioWithChunking($fullPath, $filename);
            } else {
                $result = $this->processAudioFile($fullPath, $filename);
            }

            return response()->json([
                'success' => true,
                'message' => 'Audio opgeslagen en verwerkt',
                'data' => [
                    'filename' => $filename,
                    'saved_path' => $savedPath,
                    'file_size' => filesize($fullPath),
                    'processing_method' => $useChunking && filesize($fullPath) > (1024 * 1024 * 2) ? 'chunked' : 'single',
                    'transcription' => $result,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Audio upload error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij audio upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process audio with chunking
     */
    private function processAudioWithChunking(string $filePath, string $filename): array
    {
        try {
            Log::info('Starting chunked audio processing', [
                'file_path' => $filePath,
                'filename' => $filename,
            ]);

            // Create chunks
            $chunks = $this->audioChunkingService->chunkAudioFile($filePath, $filename);

            if (empty($chunks)) {
                return [
                    'success' => false,
                    'error' => 'Failed to create audio chunks'
                ];
            }

            $transcriptions = [];
            $combinedText = '';
            $totalDuration = 0;

            // Process each chunk
            foreach ($chunks as $chunk) {
                Log::info('Processing chunk', [
                    'chunk_number' => $chunk['chunk_number'],
                    'chunk_file' => $chunk['filename'],
                    'chunk_size' => $chunk['size'],
                ]);

                // Create UploadedFile for chunk
                $chunkUploadedFile = new \Illuminate\Http\UploadedFile(
                    $chunk['full_path'],
                    $chunk['filename'],
                    mime_content_type($chunk['full_path']),
                    null,
                    true
                );

                // Transcribe chunk
                $chunkResult = $this->azureWhisperService->transcribeAudio($chunkUploadedFile);

                if ($chunkResult['success']) {
                    $transcriptions[] = [
                        'chunk_number' => $chunk['chunk_number'],
                        'start_time' => $chunk['start_time'],
                        'end_time' => $chunk['end_time'],
                        'text' => $chunkResult['text'],
                        'language' => $chunkResult['language'],
                    ];

                    // Add to combined text with timestamp
                    $combinedText .= sprintf("[%02d:%02d] %s\n", 
                        intval($chunk['start_time'] / 60), 
                        $chunk['start_time'] % 60, 
                        $chunkResult['text']
                    );

                    $totalDuration += ($chunkResult['duration'] ?? 30);
                } else {
                    Log::warning('Chunk transcription failed', [
                        'chunk_number' => $chunk['chunk_number'],
                        'error' => $chunkResult['error'],
                    ]);
                }
            }

            // Cleanup chunks
            $this->audioChunkingService->cleanupChunks($chunks);

            Log::info('Chunked processing completed', [
                'total_chunks' => count($chunks),
                'successful_transcriptions' => count($transcriptions),
                'combined_text_length' => strlen($combinedText),
            ]);

            return [
                'success' => true,
                'text' => trim($combinedText),
                'language' => $transcriptions[0]['language'] ?? 'nl',
                'duration' => $totalDuration,
                'chunks' => $transcriptions,
                'processing_method' => 'chunked',
            ];

        } catch (\Exception $e) {
            Log::error('Chunked processing error', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Chunked processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process saved audio file with Whisper (single file)
     */
    private function processAudioFile(string $filePath, string $filename): array
    {
        try {
            Log::info('Starting single file processing', [
                'file_path' => $filePath,
                'filename' => $filename,
            ]);

            if (!$this->azureWhisperService->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure Whisper niet geconfigureerd'
                ];
            }

            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $filePath,
                $filename,
                mime_content_type($filePath),
                null,
                true
            );

            $result = $this->azureWhisperService->transcribeAudio($uploadedFile);
            $result['processing_method'] = 'single';

            return $result;

        } catch (\Exception $e) {
            Log::error('Single file processing error', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Single file processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * List saved audio files
     */
    public function list(Request $request): JsonResponse
    {
        try {
            $audioFiles = Storage::disk('audio')->files();
            
            $fileList = [];
            foreach ($audioFiles as $file) {
                if (Storage::disk('audio')->exists($file)) {
                    $fileList[] = [
                        'filename' => basename($file),
                        'path' => $file,
                        'size' => Storage::disk('audio')->size($file),
                        'created' => date('Y-m-d H:i:s', Storage::disk('audio')->lastModified($file)),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $fileList
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen bestanden: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete audio file
     */
    public function delete(Request $request, string $filename): JsonResponse
    {
        try {
            $filePath = 'audio/' . $filename;
            
            if (Storage::exists($filePath)) {
                Storage::delete($filePath);
                
                Log::info('Audio file deleted', [
                    'filename' => $filename,
                    'user_id' => $request->user()->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Bestand verwijderd'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Bestand niet gevonden'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij verwijderen: ' . $e->getMessage()
            ], 500);
        }
    }
}