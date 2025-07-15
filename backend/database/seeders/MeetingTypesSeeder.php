<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MeetingTypesSeeder extends Seeder
{
    public function run()
    {
        $meetingTypes = [
            [
                'name' => 'participatie_intake',
                'display_name' => 'Participatie Intake',
                'description' => 'Intake gesprek voor participatie in de gemeente',
                'privacy_filters' => [
                    'medical_terms' => ['diagnose', 'medicatie', 'therapie', 'psychiater'],
                    'personal_data' => ['bsn', 'sofinummer', 'adres_volledig'],
                    'sensitive_topics' => ['schulden', 'uitkering_bedrag', 'persoonlijke_problemen']
                ],
                'participant_filters' => [
                    'exclude_from_report' => ['huisarts', 'psycholoog', 'therapeut'],
                    'anonymize_roles' => ['casemanager', 'consulent']
                ],
                'auto_anonymize' => true,
                'default_agenda_items' => [
                    ['title' => 'Welkomst en kennismaking', 'estimated_duration' => 5],
                    ['title' => 'Huidige situatie bespreken', 'estimated_duration' => 15],
                    ['title' => 'Mogelijkheden en wensen', 'estimated_duration' => 20],
                    ['title' => 'Vervolgstappen bepalen', 'estimated_duration' => 10],
                    ['title' => 'Afsluiting', 'estimated_duration' => 5]
                ],
                'allowed_participant_roles' => [
                    'client', 'casemanager', 'consulent', 'begeleider'
                ],
                'privacy_levels_by_role' => [
                    'client' => 'full_privacy',
                    'casemanager' => 'professional_context',
                    'consulent' => 'professional_context',
                    'begeleider' => 'professional_context'
                ],
                'report_template' => [
                    'sections' => [
                        'samenvatting' => 'Korte samenvatting van het gesprek',
                        'besproken_punten' => 'Belangrijkste besproken onderwerpen',
                        'afspraken' => 'Gemaakte afspraken en vervolgstappen',
                        'actiepunten' => 'Concrete acties met verantwoordelijken'
                    ],
                    'tone' => 'professional_caring',
                    'exclude_personal_details' => true
                ],
                'auto_generate_report' => true,
                'estimated_duration_minutes' => 60,
                'is_active' => true,
                'metadata' => [
                    'department' => 'participatie',
                    'avg_compliance_level' => 'high',
                    'requires_consent' => true
                ]
            ],
            [
                'name' => 'algemeen_overleg',
                'display_name' => 'Algemeen Overleg',
                'description' => 'Standaard overleg tussen professionals',
                'privacy_filters' => [
                    'personal_data' => ['bsn', 'sofinummer'],
                    'sensitive_topics' => []
                ],
                'participant_filters' => [
                    'exclude_from_report' => [],
                    'anonymize_roles' => []
                ],
                'auto_anonymize' => false,
                'default_agenda_items' => [
                    ['title' => 'Opening en mededelingen', 'estimated_duration' => 5],
                    ['title' => 'Bespreking agenda punten', 'estimated_duration' => 40],
                    ['title' => 'Actiepunten en vervolgstappen', 'estimated_duration' => 10],
                    ['title' => 'Rondvraag en sluiting', 'estimated_duration' => 5]
                ],
                'allowed_participant_roles' => [
                    'teamleider', 'medewerker', 'projectleider', 'extern_adviseur'
                ],
                'privacy_levels_by_role' => [
                    'teamleider' => 'standard',
                    'medewerker' => 'standard',
                    'projectleider' => 'standard',
                    'extern_adviseur' => 'limited'
                ],
                'report_template' => [
                    'sections' => [
                        'aanwezigen' => 'Lijst van aanwezigen',
                        'besproken_punten' => 'Besproken agenda punten',
                        'besluiten' => 'Genomen besluiten',
                        'actiepunten' => 'Actiepunten met deadlines'
                    ],
                    'tone' => 'professional_neutral',
                    'exclude_personal_details' => false
                ],
                'auto_generate_report' => true,
                'estimated_duration_minutes' => 60,
                'is_active' => true,
                'metadata' => [
                    'department' => 'algemeen',
                    'avg_compliance_level' => 'medium',
                    'requires_consent' => false
                ]
            ],
            [
                'name' => 'wmo_keukentafel',
                'display_name' => 'WMO Keukentafelgesprek',
                'description' => 'Informeel WMO gesprek bij de cliënt thuis',
                'privacy_filters' => [
                    'medical_terms' => [
                        'diagnose', 'medicatie', 'ziektebeeld', 'behandeling',
                        'huisarts', 'specialist', 'ziekenhuis', 'therapie'
                    ],
                    'personal_data' => ['bsn', 'sofinummer', 'adres_volledig', 'geboortedatum'],
                    'sensitive_topics' => [
                        'financiele_situatie', 'schulden', 'uitkering_bedrag',
                        'familie_problemen', 'relationele_problemen'
                    ]
                ],
                'participant_filters' => [
                    'exclude_from_report' => [
                        'huisarts', 'medisch_specialist', 'psychiater', 
                        'psycholoog', 'therapeut'
                    ],
                    'anonymize_roles' => ['wmo_consulent', 'begeleider'],
                    'professional_context_only' => [
                        'zorgprofessional', 'maatschappelijk_werker'
                    ]
                ],
                'auto_anonymize' => true,
                'default_agenda_items' => [
                    ['title' => 'Welkomst in vertrouwde omgeving', 'estimated_duration' => 5],
                    ['title' => 'Huidige leefsituatie bespreken', 'estimated_duration' => 20],
                    ['title' => 'Ondersteuningsbehoeften inventariseren', 'estimated_duration' => 25],
                    ['title' => 'Mogelijke ondersteuning bespreken', 'estimated_duration' => 15],
                    ['title' => 'Vervolgproces en afspraken', 'estimated_duration' => 10]
                ],
                'allowed_participant_roles' => [
                    'client', 'mantelzorger', 'wmo_consulent', 
                    'zorgprofessional', 'begeleider'
                ],
                'privacy_levels_by_role' => [
                    'client' => 'maximum_privacy',
                    'mantelzorger' => 'family_context',
                    'wmo_consulent' => 'professional_context',
                    'zorgprofessional' => 'care_professional_only',
                    'begeleider' => 'support_context'
                ],
                'report_template' => [
                    'sections' => [
                        'gesprekscontext' => 'Korte context van het gesprek',
                        'ondersteuningsbehoeften' => 'Geïdentificeerde ondersteuningsbehoeften',
                        'mogelijke_interventies' => 'Besproken ondersteuningsopties',
                        'vervolgstappen' => 'Afgesproken vervolgstappen'
                    ],
                    'tone' => 'empathetic_professional',
                    'exclude_personal_details' => true,
                    'medical_info_handling' => 'exclude_completely',
                    'family_info_handling' => 'general_context_only'
                ],
                'auto_generate_report' => true,
                'estimated_duration_minutes' => 75,
                'is_active' => true,
                'metadata' => [
                    'department' => 'wmo',
                    'avg_compliance_level' => 'maximum',
                    'requires_consent' => true,
                    'requires_home_visit_protocol' => true,
                    'special_privacy_rules' => true
                ]
            ]
        ];

        foreach ($meetingTypes as $type) {
            DB::table('meeting_types')->insert([
                ...$type,
                'privacy_filters' => json_encode($type['privacy_filters']),
                'participant_filters' => json_encode($type['participant_filters']),
                'default_agenda_items' => json_encode($type['default_agenda_items']),
                'allowed_participant_roles' => json_encode($type['allowed_participant_roles']),
                'privacy_levels_by_role' => json_encode($type['privacy_levels_by_role']),
                'report_template' => json_encode($type['report_template']),
                'metadata' => json_encode($type['metadata']),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}