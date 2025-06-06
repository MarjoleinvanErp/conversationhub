<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AudioChunkingService
{
    private $chunkDuration = 30; // seconds
    private $overlapDuration = 2; // seconds overlap to prevent cutting words

    /**
     * Split audio file into chunks of specified duration
     */
    public function chunkAudioFile(string $filePath, string $originalFilename): array
    {
        try {
            if (!file_exists($filePath)) {
                throw new \Exception('Audio file not found: ' . $filePath);
            }

            $fileInfo = pathinfo($originalFilename);
            $baseName = $fileInfo['filename'];
            $extension = $fileInfo['extension'];
            
            Log::info('Starting audio chunking', [
                'file_path' => $filePath,
                'file_size' => filesize($filePath),
                'chunk_duration' => $this->chunkDuration,
                'overlap' => $this->overlapDuration,
            ]);

            // For now, we'll use a simple time-based chunking approach
            // In production, you might want to use FFmpeg for more precise chunking
            $chunks = $this->createTimeBasedChunks($filePath, $baseName, $extension);

            Log::info('Audio chunking completed', [
                'original_file' => $originalFilename,
                'chunks_created' => count($chunks),
            ]);

            return $chunks;

        } catch (\Exception $e) {
            Log::error('Audio chunking failed', [
                'file_path' => $filePath,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Create time-based chunks (simplified approach)
     */
    private function createTimeBasedChunks(string $filePath, string $baseName, string $extension): array
    {
        $chunks = [];
        $fileSize = filesize($filePath);
        $chunkSize = intval($fileSize / max(1, ceil($this->getAudioDuration($filePath) / $this->chunkDuration)));
        
        // Ensure minimum chunk size
        $chunkSize = max($chunkSize, 1024 * 10); // At least 10KB per chunk
        
        $fileHandle = fopen($filePath, 'rb');
        if (!$fileHandle) {
            throw new \Exception('Cannot open audio file for chunking');
        }

        $chunkNumber = 0;
        $offset = 0;

        while (!feof($fileHandle)) {
            $chunkNumber++;
            $chunkData = fread($fileHandle, $chunkSize);
            
            if (empty($chunkData)) {
                break;
            }

            // Create chunk filename
            $chunkFilename = sprintf('%s_chunk_%03d.%s', $baseName, $chunkNumber, $extension);
            $chunkPath = 'audio/chunks/' . $chunkFilename;
            
            // Save chunk
            Storage::put($chunkPath, $chunkData);
            $chunkFullPath = storage_path('app/' . $chunkPath);

            $chunks[] = [
                'chunk_number' => $chunkNumber,
                'filename' => $chunkFilename,
                'path' => $chunkPath,
                'full_path' => $chunkFullPath,
                'size' => strlen($chunkData),
                'start_time' => ($chunkNumber - 1) * $this->chunkDuration,
                'end_time' => $chunkNumber * $this->chunkDuration,
            ];

            $offset += $chunkSize;
        }

        fclose($fileHandle);

        Log::info('Time-based chunks created', [
            'total_chunks' => count($chunks),
            'chunk_size_bytes' => $chunkSize,
        ]);

        return $chunks;
    }

    /**
     * Estimate audio duration (simplified)
     */
    private function getAudioDuration(string $filePath): float
    {
        // This is a very rough estimation
        // For WebM/WAV files, we estimate based on file size
        $fileSize = filesize($filePath);
        
        // Rough estimation: 1 minute of audio ≈ 1MB for typical web audio
        // This is not accurate but gives us a ballpark for chunking
        $estimatedDuration = $fileSize / (1024 * 1024) * 60;
        
        // Minimum 10 seconds, maximum 10 minutes for safety
        return max(10, min(600, $estimatedDuration));
    }

    /**
     * Clean up chunk files
     */
    public function cleanupChunks(array $chunks): void
    {
        foreach ($chunks as $chunk) {
            try {
                if (Storage::exists($chunk['path'])) {
                    Storage::delete($chunk['path']);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to cleanup chunk', [
                    'chunk_path' => $chunk['path'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Chunk cleanup completed', [
            'chunks_cleaned' => count($chunks),
        ]);
    }

    /**
     * Set chunk duration
     */
    public function setChunkDuration(int $seconds): self
    {
        $this->chunkDuration = max(10, min(120, $seconds)); // Between 10 and 120 seconds
        return $this;
    }
}