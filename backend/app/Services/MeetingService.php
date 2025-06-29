<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\Participant;
use Illuminate\Support\Facades\Log;

/**
 * Meeting Service voor meeting gerelateerde operaties
 */
class MeetingService
{
    /**
     * Get meeting by ID
     */
    public function getMeeting(int $meetingId): ?Meeting
    {
        try {
            return Meeting::with(['participants', 'transcriptions'])->find($meetingId);
        } catch (\Exception $e) {
            Log::error('Failed to get meeting', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get meeting participants
     */
    public function getMeetingParticipants(int $meetingId): array
    {
        try {
            $meeting = Meeting::with('participants')->find($meetingId);
            return $meeting ? $meeting->participants->toArray() : [];
        } catch (\Exception $e) {
            Log::error('Failed to get meeting participants', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Create or update participant
     */
    public function createOrUpdateParticipant(int $meetingId, array $participantData): ?Participant
    {
        try {
            return Participant::updateOrCreate(
                [
                    'meeting_id' => $meetingId,
                    'name' => $participantData['name']
                ],
                $participantData
            );
        } catch (\Exception $e) {
            Log::error('Failed to create/update participant', [
                'meeting_id' => $meetingId,
                'participant_data' => $participantData,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Start meeting
     */
    public function startMeeting(int $meetingId): bool
    {
        try {
            $meeting = Meeting::find($meetingId);
            if (!$meeting) {
                return false;
            }

            $meeting->update([
                'status' => 'active',
                'started_at' => now()
            ]);

            Log::info('Meeting started', ['meeting_id' => $meetingId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to start meeting', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Stop meeting
     */
    public function stopMeeting(int $meetingId): bool
    {
        try {
            $meeting = Meeting::find($meetingId);
            if (!$meeting) {
                return false;
            }

            $meeting->update([
                'status' => 'completed',
                'ended_at' => now()
            ]);

            Log::info('Meeting stopped', ['meeting_id' => $meetingId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to stop meeting', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get meeting statistics
     */
    public function getMeetingStats(int $meetingId): array
    {
        try {
            $meeting = Meeting::with(['participants', 'transcriptions'])->find($meetingId);
            
            if (!$meeting) {
                return [];
            }

            $stats = [
                'participant_count' => $meeting->participants->count(),
                'transcription_count' => $meeting->transcriptions->count(),
                'duration' => null,
                'status' => $meeting->status
            ];

            // Calculate duration if meeting has started
            if ($meeting->started_at) {
                $endTime = $meeting->ended_at ?? now();
                $stats['duration'] = $meeting->started_at->diffInMinutes($endTime);
            }

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get meeting stats', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Validate meeting exists and is accessible
     */
    public function validateMeeting(int $meetingId): bool
    {
        try {
            return Meeting::where('id', $meetingId)->exists();
        } catch (\Exception $e) {
            Log::error('Failed to validate meeting', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}