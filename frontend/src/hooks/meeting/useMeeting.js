import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import meetingService from '../../services/api/meetingService'; // Jouw bestaande service

export const useMeetings = () => {
  const queryClient = useQueryClient();

  // Query voor alle meetings - we filteren later in de component
  const {
    data: allMeetingsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['meetings', 'all'],
    queryFn: () => meetingService.getAllMeetings(),
    refetchInterval: 30000, // Refresh elke 30 seconden
  });

  // Filter logica om actieve en completed meetings te scheiden
  const allMeetings = allMeetingsResponse?.success ? allMeetingsResponse.data || [] : [];
  
  const activeMeetings = allMeetings.filter(meeting => 
    meeting.status === 'active' || meeting.status === 'paused' || meeting.status === 'waiting'
  );
  
  const completedMeetings = allMeetings.filter(meeting => 
    meeting.status === 'completed' || meeting.status === 'cancelled' || meeting.status === 'stopped'
  );

  // Mutations voor meeting acties
  const startMeetingMutation = useMutation({
    mutationFn: (meetingId) => meetingService.startMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
    },
  });

  const stopMeetingMutation = useMutation({
    mutationFn: (meetingId) => meetingService.stopMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: (meetingData) => meetingService.createMeeting(meetingData),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
    },
  });

  return {
    // Data
    activeMeetings,
    completedMeetings,
    allMeetings,
    
    // Loading states
    isLoading,
    
    // Errors - check voor API response format
    error: error || (!allMeetingsResponse?.success ? { message: allMeetingsResponse?.message || 'Onbekende fout' } : null),
    
    // Actions - aangepast naar jouw API
    startMeeting: startMeetingMutation.mutateAsync,
    stopMeeting: stopMeetingMutation.mutateAsync,
    createMeeting: createMeetingMutation.mutateAsync,
    
    // Loading states voor actions
    isStarting: startMeetingMutation.isPending,
    isStopping: stopMeetingMutation.isPending,
    isCreating: createMeetingMutation.isPending,
  };
};

// Hook voor een specifieke meeting
export const useMeeting = (meetingId) => {
  const queryClient = useQueryClient();

  const {
    data: meetingResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['meetings', meetingId],
    queryFn: () => meetingService.getMeeting(meetingId),
    enabled: !!meetingId,
  });

  const meeting = meetingResponse?.success ? meetingResponse.data : null;

  return {
    meeting,
    isLoading,
    error: error || (!meetingResponse?.success ? { message: meetingResponse?.message || 'Meeting niet gevonden' } : null),
  };
};