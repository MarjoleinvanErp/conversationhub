-- ConversationHub Test Data Script
-- Fills database with realistic meeting data for AI Agent testing

-- Clear existing data first
DELETE FROM transcriptions WHERE meeting_id = 1;
DELETE FROM agenda_items WHERE meeting_id = 1;
DELETE FROM participants WHERE meeting_id = 1;
DELETE FROM meeting_reports WHERE meeting_id = 1;
DELETE FROM meetings WHERE id = 1;

-- Insert test meeting (with user_id)
INSERT INTO meetings (id, title, description, type, user_id, scheduled_at, duration_minutes, status, privacy_level, auto_transcription, created_at, updated_at) VALUES 
(1, 'Q4 Planning & Budget Review Meeting', 'Kwartaalplanning en budget bespreking voor laatste kwartaal 2025', 'general', 1, '2025-07-13 10:00:00', 90, 'completed', 'internal', true, NOW(), NOW());

-- Insert agenda items
INSERT INTO agenda_items (meeting_id, title, description, "order", estimated_duration, status, created_at, updated_at) VALUES 
(1, 'Budget Review Q4', 'Bespreking budget allocatie voor het vierde kwartaal', 1, 20, 'pending', NOW(), NOW()),
(1, 'HR Updates & Nieuwe Medewerkers', 'Status update over recruitment en nieuwe teamleden', 2, 15, 'pending', NOW(), NOW()),
(1, 'IT Infrastructure Upgrade', 'Planning voor server upgrade en nieuwe systemen', 3, 25, 'pending', NOW(), NOW()),
(1, 'Marketing Campagne Kerst', 'Voorbereiding marketingactiviteiten voor eindejaar', 4, 20, 'pending', NOW(), NOW()),
(1, 'Actiepunten Vorig Kwartaal', 'Evaluatie afgesloten actiepunten Q3', 5, 10, 'pending', NOW(), NOW());

-- Insert participants
INSERT INTO participants (meeting_id, name, email, role, consent_given, created_at, updated_at) VALUES 
(1, 'Jan de Vries', 'jan.devries@company.nl', 'Manager', true, NOW(), NOW()),
(1, 'Maria van der Berg', 'maria.vandenberg@company.nl', 'Budget Coordinator', true, NOW(), NOW()),
(1, 'Kees Janssen', 'kees.janssen@company.nl', 'IT Director', true, NOW(), NOW()),
(1, 'Lisa de Jong', 'lisa.dejong@company.nl', 'HR Manager', true, NOW(), NOW()),
(1, 'Tom Bakker', 'tom.bakker@company.nl', 'Marketing Lead', true, NOW(), NOW());

-- Insert realistic transcriptions with various speakers and privacy-sensitive content
INSERT INTO transcriptions (meeting_id, text, speaker_name, speaker_color, confidence, source, is_final, spoken_at, created_at, updated_at, metadata) VALUES 

-- Opening en Budget Review (Agenda Item 1)
(1, 'Goedemorgen allemaal, welkom bij onze Q4 planning meeting. Laten we beginnen met het budget overzicht voor het laatste kwartaal.', 'Jan de Vries', '#3B82F6', 0.95, 'n8n_whisper_pyannote', true, '2025-07-13 10:02:00', NOW(), NOW(), '{"segment_index": 0, "word_count": 23}'),

(1, 'Dank je Jan. Ik heb het budget voor Q4 voorbereid. We hebben een totaal budget van 2.5 miljoen euro beschikbaar voor alle afdelingen.', 'Maria van der Berg', '#EF4444', 0.92, 'n8n_whisper_pyannote', true, '2025-07-13 10:03:00', NOW(), NOW(), '{"segment_index": 1, "word_count": 25}'),

(1, 'Mooi Maria. Kunnen we dit budget verdelen? IT heeft dringend 400.000 euro nodig voor de server upgrade die we hebben besproken.', 'Kees Janssen', '#10B981', 0.89, 'n8n_whisper_pyannote', true, '2025-07-13 10:04:30', NOW(), NOW(), '{"segment_index": 2, "word_count": 22}'),

(1, 'Dat lijkt haalbaar Kees. HR heeft ongeveer 150.000 euro nodig voor recruitment en training van nieuwe medewerkers.', 'Lisa de Jong', '#F59E0B', 0.93, 'n8n_whisper_pyannote', true, '2025-07-13 10:05:45', NOW(), NOW(), '{"segment_index": 3, "word_count": 20}'),

-- Privacy Gevoelige Informatie (BSN voorbeeld)
(1, 'We hebben een nieuwe medewerker aangenomen, zijn BSN is 123456789 voor de administratie. Dit moet natuurlijk vertrouwelijk blijven.', 'Lisa de Jong', '#F59E0B', 0.87, 'n8n_whisper_pyannote', true, '2025-07-13 10:07:00', NOW(), NOW(), '{"segment_index": 4, "word_count": 22}'),

-- Marketing Budget en Campagne (Agenda Item 4)
(1, 'Voor marketing hebben we 300.000 euro gereserveerd voor de kerst campagne. We willen dit lanceren uiterlijk 15 november.', 'Tom Bakker', '#8B5CF6', 0.91, 'n8n_whisper_pyannote', true, '2025-07-13 10:08:30', NOW(), NOW(), '{"segment_index": 5, "word_count": 21}'),

-- Privacy Gevoelige Info (Telefoonnummer)
(1, 'Tom, kun je contact opnemen met de reclamebureau? Hun nummer is 06-12345678. Ze moeten snel een offerte maken.', 'Jan de Vries', '#3B82F6', 0.88, 'n8n_whisper_pyannote', true, '2025-07-13 10:09:15', NOW(), NOW(), '{"segment_index": 6, "word_count": 20}'),

-- IT Infrastructure Planning (Agenda Item 3)
(1, 'De server upgrade is cruciaal voor ons. Onze huidige systemen zijn van 2018 en worden traag. We moeten dit voor december klaar hebben.', 'Kees Janssen', '#10B981', 0.94, 'n8n_whisper_pyannote', true, '2025-07-13 10:11:00', NOW(), NOW(), '{"segment_index": 7, "word_count": 24}'),

-- Actie Item met Deadline
(1, 'Kees, kun jij zorgen dat je volgende week een gedetailleerde planning maakt? We hebben die nodig voor de board meeting op 25 juli.', 'Jan de Vries', '#3B82F6', 0.90, 'n8n_whisper_pyannote', true, '2025-07-13 10:12:30', NOW(), NOW(), '{"segment_index": 8, "word_count": 23}'),

(1, 'Ja Jan, ik zal een planning maken. Ik ga ook contact opnemen met onze leverancier Dell voor de server specificaties.', 'Kees Janssen', '#10B981', 0.92, 'n8n_whisper_pyannote', true, '2025-07-13 10:13:00', NOW(), NOW(), '{"segment_index": 9, "word_count": 20}'),

-- HR Updates (Agenda Item 2)
(1, 'Laten we doorgaan naar HR updates. Lisa, kun je ons bijpraten over de nieuwe medewerkers en recruitment status?', 'Jan de Vries', '#3B82F6', 0.95, 'n8n_whisper_pyannote', true, '2025-07-13 10:15:00', NOW(), NOW(), '{"segment_index": 10, "word_count": 19}'),

(1, 'Zeker Jan. We hebben deze maand 3 nieuwe developers aangenomen. Hun starttatum is 1 augustus. We zoeken nog naar een senior designer.', 'Lisa de Jong', '#F59E0B', 0.91, 'n8n_whisper_pyannote', true, '2025-07-13 10:15:45', NOW(), NOW(), '{"segment_index": 11, "word_count": 22}'),

-- Privacy Info (Email address)
(1, 'Voor de designer positie hebben we een goede kandidaat gevonden. Haar email is sarah.smith@design.com, zeer ervaren.', 'Lisa de Jong', '#F59E0B', 0.89, 'n8n_whisper_pyannote', true, '2025-07-13 10:16:30', NOW(), NOW(), '{"segment_index": 12, "word_count": 18}'),

-- Action Item HR
(1, 'Lisa, kun jij voor vrijdag de contracten regelen voor de nieuwe medewerkers? En ook de workspace setup coordineren met IT?', 'Jan de Vries', '#3B82F6', 0.93, 'n8n_whisper_pyannote', true, '2025-07-13 10:17:15', NOW(), NOW(), '{"segment_index": 13, "word_count": 21}'),

-- Marketing Campagne Details (Agenda Item 4 continued)
(1, 'Wat betreft de marketing campagne, we willen focussen op online kanalen. Social media, Google Ads en influencer marketing.', 'Tom Bakker', '#8B5CF6', 0.92, 'n8n_whisper_pyannote', true, '2025-07-13 10:20:00', NOW(), NOW(), '{"segment_index": 14, "word_count": 19}'),

-- Privacy Info (Postcode)
(1, 'We willen ook een pop-up store openen in Amsterdam, postcode 1012AB, vlakbij het Centraal Station voor extra zichtbaarheid.', 'Tom Bakker', '#8B5CF6', 0.88, 'n8n_whisper_pyannote', true, '2025-07-13 10:21:00', NOW(), NOW(), '{"segment_index": 15, "word_count": 20}'),

-- Action Item Marketing
(1, 'Tom, regel jij de permits voor de pop-up store? En maak een budget breakdown voor de verschillende marketing kanalen?', 'Jan de Vries', '#3B82F6', 0.91, 'n8n_whisper_pyannote', true, '2025-07-13 10:22:00', NOW(), NOW(), '{"segment_index": 16, "word_count": 20}'),

-- Externe persoon genoemd
(1, 'Ik ga ook contact opnemen met Peter van Dijk van het marketing bureau. Hij heeft vorig jaar fantastisch werk geleverd.', 'Tom Bakker', '#8B5CF6', 0.90, 'n8n_whisper_pyannote', true, '2025-07-13 10:23:00', NOW(), NOW(), '{"segment_index": 17, "word_count": 21}'),

-- Agenda Item 5 - Actiepunten vorig kwartaal
(1, 'Laten we de laatste agenda punt bespreken. Actiepunten van vorig kwartaal. Maria, heb je de lijst?', 'Jan de Vries', '#3B82F6', 0.94, 'n8n_whisper_pyannote', true, '2025-07-13 10:25:00', NOW(), NOW(), '{"segment_index": 18, "word_count": 18}'),

(1, 'Ja, we hadden 8 actiepunten. 6 zijn afgerond, 2 lopen nog door naar dit kwartaal. Die hebben betrekking op compliance training.', 'Maria van der Berg', '#EF4444', 0.92, 'n8n_whisper_pyannote', true, '2025-07-13 10:25:45', NOW(), NOW(), '{"segment_index": 19, "word_count": 22}'),

-- Privacy Info (Medische informatie)
(1, 'Een van onze medewerkers heeft langdurig ziekteverlof vanwege burnout. We moeten zorgen voor betere work-life balance policies.', 'Lisa de Jong', '#F59E0B', 0.87, 'n8n_whisper_pyannote', true, '2025-07-13 10:27:00', NOW(), NOW(), '{"segment_index": 20, "word_count": 20}'),

-- Action Item met urgentie
(1, 'Lisa, dit is belangrijk. Kun je urgentie voor maandag een voorstel maken voor nieuwe wellness policies? Dit heeft prioriteit.', 'Jan de Vries', '#3B82F6', 0.93, 'n8n_whisper_pyannote', true, '2025-07-13 10:28:00', NOW(), NOW(), '{"segment_index": 21, "word_count": 21}'),

-- Afsluiting
(1, 'Goed team, we zijn door alle agenda punten heen. Iedereen heeft duidelijke actiepunten. Bedankt voor jullie tijd vandaag.', 'Jan de Vries', '#3B82F6', 0.95, 'n8n_whisper_pyannote', true, '2025-07-13 10:30:00', NOW(), NOW(), '{"segment_index": 22, "word_count": 21}'),

-- Extra transcriptie die niet goed matcht (test voor "open" status)
(1, 'Oh, we zijn vergeten om over de kantine renovatie te praten. Dat stond niet op de agenda maar is wel belangrijk.', 'Maria van der Berg', '#EF4444', 0.89, 'n8n_whisper_pyannote', true, '2025-07-13 10:31:00', NOW(), NOW(), '{"segment_index": 23, "word_count": 21}');

-- Verify data insertion
SELECT 'Meeting created: ' || title as result FROM meetings WHERE id = 1
UNION ALL
SELECT 'Agenda items: ' || COUNT(*)::text FROM agenda_items WHERE meeting_id = 1  
UNION ALL
SELECT 'Participants: ' || COUNT(*)::text FROM participants WHERE meeting_id = 1
UNION ALL  
SELECT 'Transcriptions: ' || COUNT(*)::text FROM transcriptions WHERE meeting_id = 1;