--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agenda_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agenda_items (
    id bigint NOT NULL,
    meeting_id bigint NOT NULL,
    title character varying(191) NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    estimated_duration integer,
    status character varying(191) DEFAULT 'pending'::character varying NOT NULL,
    completed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.agenda_items OWNER TO postgres;

--
-- Name: agenda_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agenda_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agenda_items_id_seq OWNER TO postgres;

--
-- Name: agenda_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agenda_items_id_seq OWNED BY public.agenda_items.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(191) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: meeting_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meeting_reports (
    id bigint NOT NULL,
    meeting_id bigint NOT NULL,
    report_title character varying(191) NOT NULL,
    report_content text NOT NULL,
    report_type character varying(191) DEFAULT 'ai_generated'::character varying NOT NULL,
    generated_by character varying(191) DEFAULT 'N8N_AI_Agent'::character varying NOT NULL,
    generated_at timestamp(0) without time zone,
    metadata json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    privacy_filtered boolean DEFAULT false NOT NULL,
    is_editable boolean DEFAULT true NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    CONSTRAINT meeting_reports_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'final'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.meeting_reports OWNER TO postgres;

--
-- Name: meeting_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meeting_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_reports_id_seq OWNER TO postgres;

--
-- Name: meeting_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meeting_reports_id_seq OWNED BY public.meeting_reports.id;


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings (
    id bigint NOT NULL,
    title character varying(191) NOT NULL,
    description text,
    type character varying(191) DEFAULT 'general'::character varying NOT NULL,
    template_id bigint,
    scheduled_at timestamp(0) without time zone,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status character varying(191) DEFAULT 'scheduled'::character varying NOT NULL,
    privacy_level character varying(191) DEFAULT 'standard'::character varying NOT NULL,
    auto_transcription boolean DEFAULT true NOT NULL,
    user_id bigint NOT NULL,
    metadata json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.meetings OWNER TO postgres;

--
-- Name: meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meetings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meetings_id_seq OWNER TO postgres;

--
-- Name: meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meetings_id_seq OWNED BY public.meetings.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(191) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: n8n_exports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.n8n_exports (
    id bigint NOT NULL,
    export_id uuid NOT NULL,
    meeting_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status character varying(255) DEFAULT 'sent'::character varying NOT NULL,
    export_options json,
    n8n_response json,
    error_message text,
    exported_at timestamp(0) without time zone,
    completed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT n8n_exports_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.n8n_exports OWNER TO postgres;

--
-- Name: n8n_exports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.n8n_exports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.n8n_exports_id_seq OWNER TO postgres;

--
-- Name: n8n_exports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.n8n_exports_id_seq OWNED BY public.n8n_exports.id;


--
-- Name: n8n_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.n8n_reports (
    id bigint NOT NULL,
    report_id uuid NOT NULL,
    meeting_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status character varying(255) DEFAULT 'requested'::character varying NOT NULL,
    report_options json,
    content text,
    format character varying(191) DEFAULT 'markdown'::character varying NOT NULL,
    error_message text,
    estimated_completion timestamp(0) without time zone,
    requested_at timestamp(0) without time zone,
    completed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT n8n_reports_status_check CHECK (((status)::text = ANY ((ARRAY['requested'::character varying, 'generating'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.n8n_reports OWNER TO postgres;

--
-- Name: n8n_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.n8n_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.n8n_reports_id_seq OWNER TO postgres;

--
-- Name: n8n_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.n8n_reports_id_seq OWNED BY public.n8n_reports.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participants (
    id bigint NOT NULL,
    meeting_id bigint NOT NULL,
    name character varying(191) NOT NULL,
    email character varying(191),
    role character varying(191) DEFAULT 'participant'::character varying NOT NULL,
    consent_given boolean DEFAULT false NOT NULL,
    consent_at timestamp(0) without time zone,
    privacy_notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.participants OWNER TO postgres;

--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.participants_id_seq OWNER TO postgres;

--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(191) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(191) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: report_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_sections (
    id bigint NOT NULL,
    meeting_report_id bigint NOT NULL,
    agenda_item_id bigint,
    section_type character varying(191) NOT NULL,
    title character varying(191) NOT NULL,
    content text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    contains_privacy_info boolean DEFAULT false NOT NULL,
    privacy_markers json,
    original_content text,
    is_editable boolean DEFAULT true NOT NULL,
    is_auto_generated boolean DEFAULT true NOT NULL,
    last_edited_by bigint,
    last_edited_at timestamp(0) without time zone,
    metadata json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.report_sections OWNER TO postgres;

--
-- Name: report_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_sections_id_seq OWNER TO postgres;

--
-- Name: report_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_sections_id_seq OWNED BY public.report_sections.id;


--
-- Name: transcriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transcriptions (
    id bigint NOT NULL,
    meeting_id bigint NOT NULL,
    speaker_name character varying(191) NOT NULL,
    speaker_id character varying(191),
    speaker_color character varying(191) DEFAULT '#6B7280'::character varying NOT NULL,
    text text NOT NULL,
    confidence numeric(3,2) DEFAULT 0.8 NOT NULL,
    source character varying(191) DEFAULT 'live'::character varying NOT NULL,
    is_final boolean DEFAULT true NOT NULL,
    spoken_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    speaker_confidence numeric(5,3),
    speaker_metadata json,
    metadata json
);


ALTER TABLE public.transcriptions OWNER TO postgres;

--
-- Name: COLUMN transcriptions.speaker_confidence; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.transcriptions.speaker_confidence IS 'Confidence score for speaker identification (0.000-1.000)';


--
-- Name: COLUMN transcriptions.speaker_metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.transcriptions.speaker_metadata IS 'Additional speaker detection metadata';


--
-- Name: COLUMN transcriptions.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.transcriptions.metadata IS 'General metadata for transcription processing';


--
-- Name: transcriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transcriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transcriptions_id_seq OWNER TO postgres;

--
-- Name: transcriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transcriptions_id_seq OWNED BY public.transcriptions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(191) NOT NULL,
    email character varying(191) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(191) NOT NULL,
    role character varying(191) DEFAULT 'user'::character varying NOT NULL,
    privacy_consent boolean DEFAULT false NOT NULL,
    privacy_consent_at timestamp(0) without time zone,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: agenda_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_items ALTER COLUMN id SET DEFAULT nextval('public.agenda_items_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: meeting_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_reports ALTER COLUMN id SET DEFAULT nextval('public.meeting_reports_id_seq'::regclass);


--
-- Name: meetings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings ALTER COLUMN id SET DEFAULT nextval('public.meetings_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: n8n_exports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_exports ALTER COLUMN id SET DEFAULT nextval('public.n8n_exports_id_seq'::regclass);


--
-- Name: n8n_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_reports ALTER COLUMN id SET DEFAULT nextval('public.n8n_reports_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: report_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sections ALTER COLUMN id SET DEFAULT nextval('public.report_sections_id_seq'::regclass);


--
-- Name: transcriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcriptions ALTER COLUMN id SET DEFAULT nextval('public.transcriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: agenda_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agenda_items (id, meeting_id, title, description, "order", estimated_duration, status, completed_at, created_at, updated_at) FROM stdin;
1	2	welkom	\N	1	10	pending	\N	2025-06-05 19:04:36	2025-06-05 19:04:36
2	2	afsluiting	\N	2	10	pending	\N	2025-06-05 19:04:36	2025-06-05 19:04:36
3	3	start gesprek	\N	1	10	pending	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
4	3	uitleg werking	\N	2	10	pending	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
5	3	controle wie spreekt	\N	3	10	pending	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
6	3	einde gesprek	\N	4	10	pending	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
7	4	Welkom	\N	1	10	pending	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
8	4	uitleg	\N	2	10	pending	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
9	4	test	\N	3	10	pending	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
10	4	einde	\N	4	10	pending	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
14	1	hallo	\N	4	\N	pending	\N	2025-06-14 16:48:22	2025-06-20 10:39:46
12	1	tweede agenda	test	2	\N	pending	\N	2025-06-14 07:00:46	2025-06-20 10:39:49
11	1	welkom	test	1	\N	pending	\N	2025-06-14 06:53:07	2025-06-20 10:39:53
18	5	Welkom	\N	1	10	pending	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
19	5	Impact media	\N	2	10	pending	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
20	5	prestatiedruk	\N	3	10	pending	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
21	5	relatie	\N	4	10	pending	\N	2025-06-24 06:51:54	2025-06-24 06:51:54
22	5	onzekerheid	\N	5	10	pending	\N	2025-06-24 06:51:54	2025-06-24 06:51:54
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meeting_reports (id, meeting_id, report_title, report_content, report_type, generated_by, generated_at, metadata, created_at, updated_at, privacy_filtered, is_editable, version_number, status) FROM stdin;
0	1	"dit is een test" && utcnow()	Op basis van de beschikbare gegevens kan ik zien dat dit een transcriptie betreft van wat lijkt op een kinderboek of verhaal over Rutger, Thomas en hun hond Paco, in plaats van een zakelijke vergadering. De transcriptie bevat een verhaal over een mysterieuze professor die cadeaus stuurt en een hond die bijzondere eigenschappen krijgt.\n\nAangezien dit geen reguliere zakelijke vergadering is, maar eerder een verhaal of audioboek opname, is het niet mogelijk om een standaard gespreksverslag te maken volgens de Nederlandse zakelijke structuur die ik normaal zou hanteren.\n\nEchter, als je toch een samenvatting/verslag wilt van dit materiaal, kan ik dat wel maken. Zou je willen dat ik:\n\n1. Een samenvatting maak van het verhaal dat is opgenomen\n2. Een transcriptie-overzicht maak van de opgenomen sessie\n3. Of heb je misschien andere meeting data die wel een zakelijke vergadering betreft?\n\nLaat me weten hoe je wilt dat ik verder ga met dit materiaal.	n8n report	n8n	\N	\N	2025-06-23 01:07:19	2025-06-23 01:07:19	f	t	1	draft
8	1	dit is een test - 2025-06-23T01:09:02.904-04:00	Op basis van de beschikbare gegevens kan ik een gespreksverslag maken. Er zijn echter enkele belangrijke opmerkingen:\n\n1. **Inhoud transcriptie**: De transcriptie lijkt geen vergaderinhoud te bevatten, maar eerder een verhaal over een youtube-video met personages Rutger, Thomas en hun hond Paco.\n\n2. **Gegevens beschikbaar**: Ik heb wel de deelnemerinformatie (Marjolein als facilitator en Benthe als observer) en de transcriptie-data.\n\n3. **Meeting informatie**: De meeting heeft ID 1 en status "completed".\n\nGezien de inconsistentie tussen de verwachte vergaderinhoud en de werkelijke transcriptie-inhoud, maak ik een gespreksverslag gebaseerd op de beschikbare gegevens, maar met de nodige opmerkingen over de privacy en inhoud.\n\n# GESPREKSVERSLAG\n\n## 1. VERGADERGEGEVENS\n\n**Vergadering:** Meeting 1  \n**Datum:** 19-06-2025  \n**Tijd:** 11:46 - 18:52  \n**Locatie:** Niet gespecificeerd  \n**Voorzitter:** Marjolein (Facilitator)  \n\n**Aanwezig:**\n- Marjolein (Facilitator)\n- Benthe (Observer)\n\n**Afwezig:** Geen\n\n## 2. AGENDA EN BEHANDELDE PUNTEN\n\n### Opgemerkte inconsistentie in transcriptie-inhoud\n**Toegewezen aan:** Facilitator  \n**Status:** Aandachtspunt  \n\n**Behandeling:**\nDe transcriptie bevat inhoud die niet consistent is met een reguliere vergadering. In plaats van vergaderinhoud bevat de transcriptie een verhaal over YouTube-content creators en hun hond. Dit wijst op een mogelijk technische storing of verkeerd bestand.\n\n**Genomen besluiten:**\n- Transcriptie-inhoud vereist verificatie\n- Follow-up nodig voor correcte meeting-inhoud\n\n## 3. ACTIEPUNTEN\n\n| Actie | Verantwoordelijke | Deadline | Status |\n|-------|------------------|----------|--------|\n| Verificatie transcriptie-inhoud | Marjolein | Volgende werkdag | Open |\n| Technische controle audio-opname | IT-support | Te bepalen | Open |\n\n## 4. VERVOLGSTAPPEN\n\n**Volgende vergadering:** Te bepalen na verificatie transcriptie  \n**Te bespreken punten:**\n- Correctie van transcriptie-inhoud\n- Evaluatie van opname-proces\n- Reguliere agenda-items (indien van toepassing)\n\n## 5. PRIVACY EN GEVOELIGE INFORMATIE\n\n**Privacy Compliance:**\n- Data bewaard volgens GDPR-richtlijnen  \n- Toestemming voor opname: Niet verleend (consent_given: false)\n- Privacy filtering: Actief\n\n**Niet-vastgelegde gespreksonderwerpen:**\nVanwege de inconsistentie in de transcriptie-inhoud kunnen mogelijk relevante vergaderonderwerpen ontbreken. \n\n**Voorbeelden van mogelijk gemiste onderwerpen:**\n- Werkelijke agenda-items van de vergadering\n- Officiële besluitvorming\n- Verdeling van verantwoordelijkheden\n- Projectspecifieke besprekingen\n\n**Opmerking:** De transcriptie lijkt technische inhoud te bevatten die niet gerelateerd is aan de vergadering. Dit vereist verificatie en mogelijk hertranscriptie van de originele audio-opname. Zonder toestemming voor opname van deelnemers dient de privacy-compliance herzien te worden.\n\n**Aanbeveling:** Verificatie van de transcriptie-inhoud en herziening van het consent-proces voor toekomstige vergaderingen.	n8n report	n8n	2025-06-23 01:09:03	\N	2025-06-23 01:09:03	2025-06-23 01:09:03	f	t	1	draft
1	1	AI Gespreksverslag	Test report content	ai_generated	N8N_AI_Agent	\N	\N	2025-06-20 06:55:14	2025-06-24 06:11:13	t	t	1	draft
43	1	dit is een test - 2025-06-24T01:07:17.006-04:00	Op basis van de beschikbare gegevens kan ik een gespreksverslag maken voor meeting 5. Ik zie dat dit een interview is met Femke (vermoedelijk een topatleet) waarbij Robbert aanwezig was. Hier is het gespreksverslag:\n\n---\n\n# GESPREKSVERSLAG\n\n## 1. VERGADERGEGEVENS\n\n**Vergadering:** Interview Open Kaart - Femke  \n**Datum:** 24-06-2025  \n**Tijd:** 06:58 - 07:05  \n**Locatie:** [Niet gespecificeerd]  \n**Voorzitter:** Robbert (Interviewer)\n\n**Aanwezig:**\n- Femke (Geïnterviewde, topsporter atletiek)\n- Robbert (Interviewer, deelnemer)\n\n**Afwezig:** Niet van toepassing\n\n## 2. AGENDA EN BEHANDELDE PUNTEN\n\n### Interview met Femke - Topsport en Persoonlijk Leven\n\n**Toegewezen aan:** Robbert (Interviewer)  \n**Status:** Afgerond  \n\n**Behandeling:**\nHet interview behandelde verschillende aspecten van Femke's leven als topsporter, waaronder haar houding ten opzichte van roem, het balanceren van sport en privéleven, en haar motivatie. Femke deelde openhartig over hoe zij omgaat met de druk van topsport en hoe haar omgeving haar helpt gefocust te blijven.\n\n**Belangrijkste gespreksonderwerpen:**\n- Omgang met roem en erkenning als wereldster\n- Balans tussen topsport en privéleven\n- Emotionele verwerking van prestaties en teleurstellingen\n- Motivatie en doelen na het behalen van grote successen\n- Rol van familie, vrienden en support systeem\n\n**Genomen besluiten:**\n- Interview succesvol afgerond\n- Inhoud geschikt voor verdere productie\n\n## 3. ACTIEPUNTEN\n\n| Actie | Verantwoordelijke | Deadline | Status |\n|-------|------------------|----------|--------|\n| Verwerking interview voor publicatie | Robbert | [Niet gespecificeerd] | Open |\n\n## 4. VERVOLGSTAPPEN\n\n**Volgende vergadering:** Niet gespecificeerd  \n**Te bespreken punten:**\n- Productieproces verdere afwerking interview\n\n## 5. PRIVACY EN GEVOELIGE INFORMATIE\n\n**Privacy Compliance:**\n- Data bewaard volgens GDPR-richtlijnen\n- Toestemming voor opname: Niet geregistreerd\n- Privacy filtering: Actief\n\n**Niet-vastgelegde gespreksonderwerpen:**\nIn dit interview zijn geen expliciet vertrouwelijke onderwerpen behandeld, maar er zijn wel persoonlijke aspecten besproken die gevoelig kunnen zijn:\n\n- Specifieke emotionele reacties op nederlagen\n- Persoonlijke relatie met familie en vrienden\n- Strategische sportpsychologische aanpak\n- Persoonlijke coping mechanismen\n\n**Opmerking:** Deze persoonlijke aspecten zijn onderdeel van het publieke interview-format, maar details over specifieke personen in de omgeving van de geïnterviewde zijn beperkt gehouden conform privacy-richtlijnen.\n\n---\n\n*Verslag opgesteld op basis van automatische transcriptie van meeting 5, status: completed*	n8n report	n8n	2025-06-24 01:07:17	\N	2025-06-24 01:07:17	2025-06-24 01:07:17	f	t	1	draft
42	1	Test Sectie Report - 2025-06-24 06:00:53		structured	Manual_Test	2025-06-24 06:00:53	\N	2025-06-24 06:00:53	2025-06-29 19:59:14	f	t	1	draft
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meetings (id, title, description, type, template_id, scheduled_at, duration_minutes, status, privacy_level, auto_transcription, user_id, metadata, created_at, updated_at) FROM stdin;
1	test	\N	participation	\N	2025-06-06 09:19:30	60	active	standard	t	1	\N	2025-06-03 20:00:40	2025-06-06 09:19:30
2	test gesprek	korte beschrijving van het gesprek	general	\N	2025-06-05 19:06:52	60	completed	standard	t	1	\N	2025-06-05 19:04:36	2025-06-07 17:21:55
4	test gesprek	\N	general	\N	\N	60	completed	standard	t	1	\N	2025-06-08 14:12:34	2025-06-08 14:47:11
3	test gesprek	\N	general	\N	2025-06-07 17:25:31	60	completed	standard	t	1	\N	2025-06-07 17:22:53	2025-06-09 11:21:42
5	Open kaart interview	\N	general	\N	\N	60	scheduled	standard	t	1	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	2019_12_14_000001_create_personal_access_tokens_table	1
2	2025_06_03_184820_create_users_table	1
3	2025_06_03_184956_create_password_reset_tokens_table	1
4	2025_06_03_185034_create_jobs_table	1
5	2025_06_03_194931_create_meetings_table	2
6	2025_06_03_195104_create_participants_table	2
7	2025_06_03_195209_create_agenda_items_table	2
8	2025_06_07_191426_create_transcriptions_table	3
9	2025_06_17_130405_add_basic_indexes	4
10	2025_06_19_103649_create_n8n_exports_table	5
11	2025_06_19_103810_create_n8n_reports_table	5
12	2025_06_20_065208_create_meeting_reports_table	6
13	2025_06_23_214426_create_report_sections_table	7
14	2025_06_23_214735_update_meeting_reports_for_sections	7
15	2025_06_24_105531_add_speaker_detection_to_transcriptions_table	8
\.


--
-- Data for Name: n8n_exports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.n8n_exports (id, export_id, meeting_id, user_id, status, export_options, n8n_response, error_message, exported_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: n8n_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.n8n_reports (id, report_id, meeting_id, user_id, status, report_options, content, format, error_message, estimated_completion, requested_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.participants (id, meeting_id, name, email, role, consent_given, consent_at, privacy_notes, created_at, updated_at) FROM stdin;
1	1	marjolein	\N	facilitator	f	\N	\N	2025-06-03 20:00:41	2025-06-03 20:00:41
2	1	benthe	\N	observer	f	\N	\N	2025-06-03 20:00:41	2025-06-03 20:00:41
3	2	marjolein	\N	participant	f	\N	\N	2025-06-05 19:04:36	2025-06-05 19:04:36
4	3	Marjolein	\N	participant	f	\N	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
5	3	Benthe	\N	participant	f	\N	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
6	3	Jaloe	\N	participant	f	\N	\N	2025-06-07 17:22:53	2025-06-07 17:22:53
7	4	Marjolein	\N	participant	f	\N	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
8	4	Benthe	\N	participant	f	\N	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
9	4	Jaloe	\N	participant	f	\N	\N	2025-06-08 14:12:34	2025-06-08 14:12:34
10	5	Femke	\N	participant	f	\N	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
11	5	Robbert	\N	participant	f	\N	\N	2025-06-24 06:51:53	2025-06-24 06:51:53
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
20	App\\Models\\User	1	ConversationHub	6819580c10262588b265f0c9095dd163c66007dec300abff543244ced1249fac	["*"]	2025-06-13 11:38:50	\N	2025-06-13 06:27:39	2025-06-13 11:38:50
13	App\\Models\\User	1	ConversationHub	64e0394cdf8ab2345550a4eaf415bada46096117431d5cdf7ea7b70a9260fceb	["*"]	2025-06-09 22:30:53	\N	2025-06-09 11:06:18	2025-06-09 22:30:53
10	App\\Models\\User	1	ConversationHub	f1bfc5023fe0fa5a5f419ca209e5d852494a47cf41a06696bab0abb71a3beb4d	["*"]	2025-06-08 15:01:44	\N	2025-06-08 08:52:19	2025-06-08 15:01:44
1	App\\Models\\User	1	ConversationHub	f99d643c0530008263e82fd74791ae53b4520551ae3d81549586d03a6816bbec	["*"]	2025-06-03 19:55:52	\N	2025-06-03 19:39:29	2025-06-03 19:55:52
19	App\\Models\\User	1	ConversationHub	53847d44d8eb5aa6b4cfa5865bc00943ba161849c9a886ff4b491119cd82a068	["*"]	2025-06-12 18:52:17	\N	2025-06-12 14:15:06	2025-06-12 18:52:17
12	App\\Models\\User	1	ConversationHub	e310b42e3e67b8ab970e159f23ad676c35cb7f04479974e69d96ccb74e7a7ec5	["*"]	2025-06-09 08:43:36	\N	2025-06-09 08:42:58	2025-06-09 08:43:36
33	App\\Models\\User	1	ConversationHub	245f68f37335563765fbb7b057d2745454bf0aa3d59219ee17b276c93eb41b4e	["*"]	2025-06-19 12:24:14	\N	2025-06-19 08:45:18	2025-06-19 12:24:14
31	App\\Models\\User	1	ConversationHub	5dea57b44e470d12c02331ddd6b270252daa63de62a8fedbc7ce9597920b4377	["*"]	2025-06-19 05:50:44	\N	2025-06-19 05:45:36	2025-06-19 05:50:44
3	App\\Models\\User	1	ConversationHub	9265aa8ca80c41261c3a9bb091685e2770659a4a1e7f81017f09f386b0aec54d	["*"]	2025-06-03 20:02:24	\N	2025-06-03 19:47:19	2025-06-03 20:02:24
4	App\\Models\\User	1	ConversationHub	3ec0d9dbb64bf0678ac5361d7e49a7c2bd91980c657ce04179837101bbaf23e1	["*"]	2025-06-05 19:12:06	\N	2025-06-05 18:07:42	2025-06-05 19:12:06
30	App\\Models\\User	1	ConversationHub	59a7847cd71b720914478c0ec70053355fb25fb6fe17e091ca3ef86f5667f672	["*"]	2025-06-19 07:10:03	\N	2025-06-19 05:42:16	2025-06-19 07:10:03
18	App\\Models\\User	1	ConversationHub	1a57239225ed3565ecbb26a07d40e5093f574d77b2b93ac6075f8b76eaea8ad9	["*"]	2025-06-12 13:24:15	\N	2025-06-12 08:26:15	2025-06-12 13:24:15
6	App\\Models\\User	1	ConversationHub	99d6f221ca15c8815785db6d072e16b1c4a366e0c1609b8194ff68079aa9f4ac	["*"]	\N	\N	2025-06-06 08:55:03	2025-06-06 08:55:03
22	App\\Models\\User	1	ConversationHub	44a763e52c6754a1a7b7da79922a37839d0cfe32cc167adb1507748c848d8e99	["*"]	2025-06-14 14:20:05	\N	2025-06-14 06:13:01	2025-06-14 14:20:05
17	App\\Models\\User	1	ConversationHub	0a8ac66a9283a21cf20c1b4ff562b552dc348989e28bc77a709f65bbdd049e42	["*"]	2025-06-11 21:42:46	\N	2025-06-10 08:36:37	2025-06-11 21:42:46
7	App\\Models\\User	1	ConversationHub	2846326985bada64bb1217bd25e07b0091e6801910d19e6e2d709c26aa8aa4fe	["*"]	2025-06-06 09:10:07	\N	2025-06-06 08:55:10	2025-06-06 09:10:07
14	App\\Models\\User	1	ConversationHub	4fa35553e8a14c9965b541563b832e68901d9b8228114cf447a209a888c41ace	["*"]	\N	\N	2025-06-09 11:43:33	2025-06-09 11:43:33
5	App\\Models\\User	1	ConversationHub	d5c0b95776796ce54dfc585715df9676b0ea269870078dea4485875f20153e23	["*"]	2025-06-06 14:24:04	\N	2025-06-06 08:26:50	2025-06-06 14:24:04
15	App\\Models\\User	1	ConversationHub	c1bba97121339eb41fcffbf378467152adc5a3c2b24775c1e044be6644d729c2	["*"]	2025-06-09 11:47:35	\N	2025-06-09 11:45:59	2025-06-09 11:47:35
16	App\\Models\\User	1	ConversationHub	43eb3577089d0514bc4136c5ddb4910fa47d3116cfaf2222e79d4514cce78e33	["*"]	2025-06-09 11:53:27	\N	2025-06-09 11:51:13	2025-06-09 11:53:27
25	App\\Models\\User	1	ConversationHub	d5f103508f6c398dc4777771a9459f7263965c2d89d62d4bd4eeaf0d209f08b1	["*"]	2025-06-15 10:19:29	\N	2025-06-15 09:52:40	2025-06-15 10:19:29
11	App\\Models\\User	1	ConversationHub	0e31df0423ec8e0553c190e6a01bf683f75a9417300187e94e93a466790956b6	["*"]	2025-06-09 08:40:35	\N	2025-06-09 07:50:55	2025-06-09 08:40:35
8	App\\Models\\User	1	ConversationHub	7e5ab169e3160d0f2e8cec71e4265e54d95e8e5847ad7cfee89d8c86391e0bc1	["*"]	2025-06-06 09:42:59	\N	2025-06-06 09:41:59	2025-06-06 09:42:59
40	App\\Models\\User	1	ConversationHub	8fdfe8cfd8fb322490b63c08c14d96292a89c9747a5b8d84a34af249e89ba267	["*"]	2025-06-21 19:39:03	\N	2025-06-21 19:37:27	2025-06-21 19:39:03
32	App\\Models\\User	1	Debug Token	0a5b78fa9571c28830399a783d9cc2854e9ceb7d9043c601b1d4c2fd62f82899	["*"]	2025-06-19 06:59:30	\N	2025-06-19 06:04:39	2025-06-19 06:59:30
9	App\\Models\\User	1	ConversationHub	4ef0bc6ceb84448f35b8b9f6294e79b4cc78508a7435ab1b606f42a8f373795e	["*"]	2025-06-07 19:46:17	\N	2025-06-07 14:47:13	2025-06-07 19:46:17
26	App\\Models\\User	1	ConversationHub	b2871bf48d600b8b5096cc7c3a4eec9762208b3c55a0c6bcf83569feaf21424b	["*"]	2025-06-17 14:26:15	\N	2025-06-17 13:06:18	2025-06-17 14:26:15
27	App\\Models\\User	3	ConversationHub	a3adccc98dcf337165db87a303de3d7dc96b744832c6fab2c9a9139460293a4b	["*"]	\N	\N	2025-06-17 14:31:29	2025-06-17 14:31:29
21	App\\Models\\User	1	ConversationHub	5a07696ddab285d2fc7cc9f1ec9143e7a25fd58d040933aea2b4b956b0de56cd	["*"]	2025-06-13 22:26:02	\N	2025-06-13 15:54:23	2025-06-13 22:26:02
24	App\\Models\\User	1	ConversationHub	c4a475863e61e7ecdd8d458403b5f8d73429df85f90d792f8ddade3bd27b0584	["*"]	2025-06-15 07:02:07	\N	2025-06-15 06:53:10	2025-06-15 07:02:07
28	App\\Models\\User	3	ConversationHub	ea7bcc3d90bd279b17963af6f1f2bae3ecc4cc4b56c54badfb1efa12d1b18bb9	["*"]	2025-06-17 14:32:30	\N	2025-06-17 14:31:51	2025-06-17 14:32:30
29	App\\Models\\User	3	ConversationHub	a5f60198f0b8214fc753b6f77e31ec42b122a8ee4da688876489c7192390e3b6	["*"]	\N	\N	2025-06-17 14:37:26	2025-06-17 14:37:26
23	App\\Models\\User	1	ConversationHub	369190b46bdf6b1ba6f48e717272c60a2e43a75777c22f3fefbca7e4314eac88	["*"]	2025-06-14 22:04:23	\N	2025-06-14 15:57:38	2025-06-14 22:04:23
42	App\\Models\\User	1	ConversationHub	fb5f0936e942e5f109a05dfc0d7422d14f0be75e234d6c1f717e543ab9fe6fe8	["*"]	2025-06-24 06:02:41	\N	2025-06-24 05:51:24	2025-06-24 06:02:41
38	App\\Models\\User	1	ConversationHub	738db3a6b319529558bf05a41cdb113ffe3051df84a8b48ceb799bbdd411f699	["*"]	2025-06-21 07:21:28	\N	2025-06-20 10:36:12	2025-06-21 07:21:28
37	App\\Models\\User	1	ConversationHub	0b3f78ba92fba19b4f9e8a1fceb67b3120ded3287bcab80d27514766c2f8ee29	["*"]	2025-06-20 06:09:42	\N	2025-06-20 05:43:33	2025-06-20 06:09:42
35	App\\Models\\User	1	ConversationHub	ff1b4f653f50784b66d03e0eb636663f71110f09fe877119fb6a45eb7a365998	["*"]	2025-06-19 21:35:18	\N	2025-06-19 21:26:49	2025-06-19 21:35:18
36	App\\Models\\User	1	ConversationHub	433180854975b50d62dcde45c104b8d8f7e8db8655bfbbc2c6fa7e77c6bf82f7	["*"]	2025-06-20 05:36:52	\N	2025-06-20 05:36:19	2025-06-20 05:36:52
34	App\\Models\\User	1	ConversationHub	b6d3e8fccd6aab9261a9737deec38f3ff7ef09d92ab79cf80e03aece2da6cc45	["*"]	2025-06-19 13:53:34	\N	2025-06-19 13:41:50	2025-06-19 13:53:34
39	App\\Models\\User	1	ConversationHub	b045f8d4004a699da7bda52fe594bb5947d0776a30ce871ae161868cc3e3cd98	["*"]	2025-06-21 20:52:52	\N	2025-06-21 19:24:59	2025-06-21 20:52:52
41	App\\Models\\User	1	ConversationHub	0ea2c0ae58e974fea7e24a1d3ed6383ca0fc1df8972e05c82f2cda582772590a	["*"]	2025-06-23 07:00:27	\N	2025-06-23 06:00:29	2025-06-23 07:00:27
43	App\\Models\\User	1	ConversationHub	1c9d31b601c6e52be68f9ab8e8f9cbd18d62f0594659cb86ac20d5be01d90da4	["*"]	2025-06-24 11:21:43	\N	2025-06-24 06:09:03	2025-06-24 11:21:43
44	App\\Models\\User	1	ConversationHub	13d232c337006b82f52be3b288a4992eef425a0a4a87f47a5abd8b8645800d87	["*"]	2025-06-29 22:32:14	\N	2025-06-29 19:44:43	2025-06-29 22:32:14
45	App\\Models\\User	1	ConversationHub	fb227f60596d2575218e4c95b7f7cda308935779a6587af785eca9131601b5d2	["*"]	2025-06-29 20:26:30	\N	2025-06-29 20:22:54	2025-06-29 20:26:30
46	App\\Models\\User	1	ConversationHub	48fd551f272d738ab37c2e5ab5eca6f66bdf0ae83f00c7653ee8122a74a01577	["*"]	2025-06-30 17:09:37	\N	2025-06-30 16:55:25	2025-06-30 17:09:37
\.


--
-- Data for Name: report_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_sections (id, meeting_report_id, agenda_item_id, section_type, title, content, order_index, contains_privacy_info, privacy_markers, original_content, is_editable, is_auto_generated, last_edited_by, last_edited_at, metadata, created_at, updated_at) FROM stdin;
1	42	\N	summary	Samenvatting testen	Dit is een test samenvatting van de vergadering met belangrijke punten.	1	f	\N	\N	t	f	1	2025-06-24 06:45:04	\N	2025-06-24 06:01:04	2025-06-24 06:45:04
2	42	\N	action_items	Actiepunten	• Actie 1: Follow-up meeting plannen voor volgende week\n• Actie 2: Budget goedkeuring aanvragen bij finance	2	f	\N	\N	t	f	1	2025-06-29 19:58:54	\N	2025-06-24 06:01:10	2025-06-29 19:58:54
\.


--
-- Data for Name: transcriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transcriptions (id, meeting_id, speaker_name, speaker_id, speaker_color, text, confidence, source, is_final, spoken_at, created_at, updated_at, speaker_confidence, speaker_metadata, metadata) FROM stdin;
1	3	Onbekende Spreker	unknown_speaker	#6B7280	Hallo binnen horen.	0.80	live	t	2025-06-07 17:44:16	2025-06-07 19:44:20	2025-06-07 19:44:20	\N	\N	\N
2	3	Onbekende Spreker	unknown_speaker	#6B7280	Hij is een man.	0.80	live	t	2025-06-07 17:44:32	2025-06-07 19:44:35	2025-06-07 19:44:35	\N	\N	\N
3	3	Onbekende Spreker	unknown_speaker	#6B7280	Ook al was het helemaal niet, jokken salade.	0.80	live	t	2025-06-07 17:44:42	2025-06-07 19:44:45	2025-06-07 19:44:45	\N	\N	\N
4	3	Onbekende Spreker	unknown_speaker	#6B7280	Mijn kleine zusje?	0.80	live	t	2025-06-07 17:44:46	2025-06-07 19:44:48	2025-06-07 19:44:48	\N	\N	\N
5	3	Onbekende Spreker	unknown_speaker	#6B7280	Dankjewel.	0.80	live	t	2025-06-07 17:44:47	2025-06-07 19:44:51	2025-06-07 19:44:51	\N	\N	\N
6	3	Onbekende Spreker	unknown_speaker	#6B7280	En jij epke?	0.80	live	t	2025-06-07 17:44:49	2025-06-07 19:44:58	2025-06-07 19:44:58	\N	\N	\N
7	3	Onbekende Spreker	unknown_speaker	#6B7280	Nou ja.	0.80	live	t	2025-06-07 17:44:52	2025-06-07 19:45:04	2025-06-07 19:45:04	\N	\N	\N
36	3	Opname	participant_4	#10B981	Hallo, dit is een test. Wat gebeurt er nu? Doet ie nu audio-opname, audio-opname, opspaan, wisper. Knap het eigenlijk niet. Ik zie ook nergens tekst verschijnen. Stop.	0.80	live	t	2025-06-09 09:08:35	2025-06-09 11:08:41	2025-06-09 11:08:41	\N	\N	\N
182	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:02:15	2025-06-29 20:02:15	2025-06-29 20:02:15	\N	\N	\N
183	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:07:26	2025-06-29 20:07:26	2025-06-29 20:07:26	\N	\N	\N
184	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:12:46	2025-06-29 20:12:46	2025-06-29 20:12:46	\N	\N	\N
187	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:34:17	2025-06-29 20:34:17	2025-06-29 20:34:17	\N	\N	\N
188	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:39:16	2025-06-29 20:39:16	2025-06-29 20:39:16	\N	\N	\N
189	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:58:31	2025-06-29 20:58:31	2025-06-29 20:58:31	\N	\N	\N
190	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 21:00:57	2025-06-29 21:00:57	2025-06-29 21:00:57	\N	\N	\N
191	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 22:13:18	2025-06-29 22:13:18	2025-06-29 22:13:18	\N	\N	\N
192	1	Onbekende Spreker	unknown_speaker	#6B7280	Whisper verwerkt audio...	0.10	enhanced_live	t	2025-06-29 22:23:53	2025-06-29 22:23:54	2025-06-29 22:23:54	\N	\N	\N
193	1	Onbekende Spreker	unknown_speaker	#6B7280	Whisper verwerkt audio...	0.10	enhanced_live	t	2025-06-29 22:29:37	2025-06-29 22:29:37	2025-06-29 22:29:37	\N	\N	\N
174	5	Onbekende Spreker	unknown_speaker	#6B7280	Femke, welkom bij Open Kaart. Dankjewel. Ik vind het ontzettend leuk dat je er bent. Ik denk dat jij, en dat zal het zijn, twee, drie jaar geleden op mijn radar kwam dat ik op een gegeven moment elke keer meer en meer over jou voorbij zag komen. Prijs na prijs, medaille na medaille. Maar wel dat ik dacht, wie is zij nou precies? Wat houdt haar bezig? Je voelde voor mij een beetje, en ik weet niet of het bewust of onbewust is, maar een beetje mysterieus. Ja, ik had mijn benen denk ik liever twee keer eruit vallen dan dat ik iets zeg. Hoe vind je het dan nu om hier te zitten? Ja, wel spannend. Toen je het vroeg, dacht ik, heel leuk. Ook al heel spannend, want normaal doe ik niet zomaar zoiets. Ik ben heel benieuwd, maar ik kijk wel heel vaak naar de serie. Ik vind het supermooie interviews, dus ik ga het er maar aan wagen. We liggen hier naartoe kaartjes, we gaan ons de beurt elkaar een vraag stellen. Ik begin altijd, laten we beginnen. Je bent een wereldster in de atletiek, maar het lijkt alsof je extreem nuchter blijft. Hoe zorg je ervoor dat je niet wordt meegezogen in de gekte ronde van jouw prestaties? Voel jij je een wereldster? Nee, eigenlijk totaal niet. Op de baan wel, op een atletietje wel. Maar daarbuiten voel ik me eigenlijk een wereldster.	1.00	whisper_verified	t	2025-06-24 04:58:44	2025-06-24 06:59:05	2025-06-24 06:59:05	\N	\N	\N
175	5	Onbekende Spreker	unknown_speaker	#6B7280	gewoon, ja, wie ik ben, opgegroeid in Amersfoort, gewoon bij mijn vriendinnen of dezelfde, Femke die ik altijd ben. Dus soms is dat ook wel gek. Bij picnic hebben we geen winkels, maar halen we alles zo van het land. Daar hebben we alles vers, veel verser. En brengen we het zonder omwegen bij jou thuis. Gratis. Dat is het voordeel van picnic, de supermarkt op wielen. Kopieer mijn traits, zodat je direct vanaf dag één kunt gaan verdienen met het trainen. De toepassing van dit concept. Zijn het voor jou twee hele verschillende werelden? Het is deels niet echt uit elkaar te halen, want als topsporter ben je eigenlijk altijd topsporter en altijd bezig met jezelf verzorgen en ook buiten de uur dat je op de baan staat alles te doen voor je sport. Maar tegelijkertijd probeer ik het af en toe wel te doen, omdat ik vind het ook fijn om af en toe niet bezig te zijn met de sport en gewoon het leven van mijn vriendinnen hebben of gewoon fijn met mijn familie te zijn en niet te veel bezig met alles. Heb je dan nu bijvoorbeeld wel eens momenten dat je denkt, oh, mijn vriendinnen gaan dit doen, mijn familie gaat dit doen?	1.00	whisper_verified	t	2025-06-24 05:00:21	2025-06-24 07:00:58	2025-06-24 07:00:58	\N	\N	\N
176	5	Onbekende Spreker	unknown_speaker	#6B7280	nu voor mezelf kiezen, voor mijn werk kiezen, voor mijn prestaties kiezen? Ja, best vaak. Wij zijn heel vaak op feestkamp, dus ik ben heel veel weg, waardoor ik best wel veel dingen mis. Gelukkig heb je lekker feesttijd tegenwoordig en alles, maar ja, mijn oma wordt dan 80 en dan gingen we met z'n allen erg overnachten en ik ben er dan wel een avond bij, maar overnachten lukt niet, want daarna heb je belangrijke wedstrijden of belangrijke trainingen. Dat zijn wel momenten dat ik het wel heel erg mis ook. Heb je weleens momenten gehad dat bijvoorbeeld mensen, bijvoorbeeld je moeder of vriendinnen tegen je zeiden, nou, nu zien we even een andere kant? Nee, ik denk het niet heel erg. Ik ben heel open met mijn ouders, we praten over alles en mijn vriend ook, die doet ook dezelfde sport, dus daardoor zitten we in dezelfde wereld, maar ik denk dat ze me altijd wel met beide benen op de grond houden. Tuurlijk als ik wel eens misschien heel erg kon beharen van iets, maar is gewoon, kom op man. Wat is het nou? Je hebt een keer een slechte race, het is niet het einde van de wereld, je bent een mens, het kan allemaal gebeuren, dus dan, op zulke momenten denk ik juist meer dat ze me soms weer met beide benen op de grond zetten van, je bent geen machine, je bent niet bezig met wat iedereen van je verwacht, doe gewoon je ding. Je bent en blijft een mens. Moet je bij jou uit de buurt blijven, als je verliest? Ik denk sommige mensen wel, ja. Ik kan er niet zo van verliezen, maar ik word dan vooral heel emotioneel. Als ik heel boos ben, heel gestresst ben, dan hel ik gewoon.	1.00	whisper_verified	t	2025-06-24 05:01:43	2025-06-24 07:02:11	2025-06-24 07:02:11	\N	\N	\N
177	5	Onbekende Spreker	unknown_speaker	#6B7280	Dan kan iedereen even goed mee omgaan, wat ik heel goed begrijp. En soms moet je me dan gewoon even tijd geven om het in m'n eentje uit te zoeken... en m'n gedachten weer op een rijtje te krijgen. Ja? En hoe doe je dat? Schrijven. Gewoon opschrijven hoe ik me voel of er veel over praten. Met m'n familie of met dan m'n vriend of met de sportpsycholoog. Gewoon alles op een rijtje zetten en dan eigenlijk weer een plan maken... hoe het beter te doen of hoe het anders te doen. Ja. Kan je makkelijk je emoties delen? Als in, kan je makkelijk praten over je gevoel? Ja, heel makkelijk. Ja, ze denken eigenlijk opgevoed. En als er bij mij iets dwars zit... dan zien ze dat ook mensen die heel dichtbij me staan meteen... en dan moet het er ook meestal uit. Als ik het opklop, dan gaat het bij mij meestal juist een keer de kant op. Als je terugkijkt naar de afgelopen jaren... heb je een soort van mama-I-made-it-moment gehad? Ja. Ja, ik denk best wel heel veel. De allereerste keer voor mij was wel toen ik het wereldrecord liep. Dat is echt een droom van elke atleet. En toen dat uitkwam, toen wist ik ook echt even niet wat ik aan moest. Ik dacht, wow, ik heb gehaald wat een van de ultieme dromen is. En ook toen ik wereldkampioen werd, was het eigenlijk hetzelfde. En het Olympische Spelen met goud winnen was ook... Het zijn echt van die dromen die je eigenlijk niet weet of ooit zullen uitkomen... maar je wel elke dag alles voor doet en laat om ze te laten uitkomen.	1.00	whisper_verified	t	2025-06-24 05:03:14	2025-06-24 07:03:43	2025-06-24 07:03:43	\N	\N	\N
181	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 19:56:55	2025-06-29 19:56:55	2025-06-29 19:56:55	\N	\N	\N
185	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:17:50	2025-06-29 20:17:50	2025-06-29 20:17:50	\N	\N	\N
186	1	Onbekende Spreker	unknown_speaker	#6B7280	Audio chunk transcriptie wordt verwerkt...	0.50	enhanced_live	t	2025-06-29 20:19:45	2025-06-29 20:19:45	2025-06-29 20:19:45	\N	\N	\N
194	1	Onbekende Spreker	unknown_speaker	#6B7280	Ik wil even testen of hij het nu wel doet, want de vorige keer deed hij het niet en dat vind ik heel frustrerend.	1.00	whisper_verified	t	2025-06-30 14:58:07	2025-06-30 16:58:19	2025-06-30 16:58:19	\N	\N	\N
178	5	Onbekende Spreker	unknown_speaker	#6B7280	Dus dat, ja, niet echt te omschrijven. Ja, maar Fimke, jij bent nog zo jong. Waar zit voor jou dan nu nog de motivatie? Continu. Wat houdt die motor draaiende bij jou? Ik vind het gewoon zo leuk wat ik doe. Ik houd echt van atletiek. Ik houd van elke dag mezelf beter proberen te maken. En dat is ook... De atletiek zie je gewoon aan het einde van de dag op de klok. Of je eigenlijk vooruit gaat of niet. Tuurlijk, je hebt het wel door in trainingen. Maar dan moet je het laten zien. En ja, ik ben best wel perfectionistisch. En ik kan altijd wel iets beter. Zeker bij 400 horden. Die horden schakelen perfect. En ik vind dat gewoon zo'n leuk proces. Het proces van jezelf beter maken. Nog iets beter worden in iets. Of denken, dit kan ik beter. En dan toch heel hard werken en het nog iets sterker krijgen. Dat vind ik gewoon echt het mooiste wat er is, denk ik. Ja, en het klinkt op zich als je het omschrijft wel logisch. Maar ik vind dat bij topsport zo interessant. Dat ik denk, je moet er, wat je zelf net ook zegt, zoveel voor laten. Je moet zoveel geven aan de sport. En dan is het denk ik bij jou dat je natuurlijk ook nog eens elke keer wint. Dus je weet ook echt, ik ben misschien voor een reden. Geef ik dingen op. Maar die motivatie, die intrinsieke motivatie moet zo diep zitten dan bij jou. Ja, klopt. Ja, ik moet nu wel zeggen, na de Spelen had ik eigenlijk echt alles gehaald waar ik ooit van droomde. Ik ben Europese kampioen, wereldkampioen, olympische kampioen. Ja. En toen had ik ook wel even zoiets van, ik moet even uit de bubbel van...	1.00	whisper_verified	t	2025-06-24 05:04:50	2025-06-24 07:05:14	2025-06-24 07:05:14	\N	\N	\N
179	5	Onbekende Spreker	unknown_speaker	#6B7280	Ja, mag ik een kaartje pakken?	1.00	whisper_verified	t	2025-06-24 05:06:35	2025-06-24 07:07:01	2025-06-24 07:07:01	\N	\N	\N
180	5	Onbekende Spreker	unknown_speaker	#6B7280	Alles maar laten en alles voor m'n sportdoen. Ik ben nu 24, heb alles gehaald. Ik vond ook wel dat ik mezelf even een moment mocht verliezen in gewoon... Het leven. Ja. Dus dat heb ik nu ook de afgelopen tijd iets meer gedaan. Van mijn doen dan. En hoe ziet dat eruit? Toch een keer na tien uur naar bed gaan ofzo. Dat is toch... Ja, ik zit in een heel strak regime en daar haal ik ook heel veel zelfvertrouwen uit voor de wedstrijd. Als ik weet, ik heb er alles aan gedaan. Ja. Ook toch een keer naar vriendinnen gaan. Terwijl ik eigenlijk normaal zou denken, ik heb twee dagen na een belangrijke training, moet ik dat wel doen. Iets later naar het trainingskamp gaan, iets meer thuis zijn. Met kerst iets op m'n eten letten. Met allemaal zulke kleine dingen. Eigenlijk gewoon even niet dat stemmetje van de topsporter in je hoofd, moet je dat wel doen. Ja. Moet je dat niet net anders doen. Iets meer laten gaan. En, bevalt het? Ja, op zich wel. Ik vond het wel even fijn. Ik merkte ook wel dat ik gewoon alsnog trainen zo fijn vind. En als ik wedstrijden wil doen, dan weet ik dat ik het niet helemaal aan kan om het op die manier te doen. Dan heb ik constant een conflict met mezelf. Maar ik vond het wel fijn om even aan te halen, even uit de burrel te komen. Gewoon even weer te zien van, naast m'n sport heb ik ook een heel mooi leven. En sport is alles. En zeker in het Olympisch jaar voelt het alsof het het allerbelangrijkste ter wereld is. Ja. Maar uiteindelijk zag ik, ja, ik heb gewoon zulke mooie mensen om me heen. Ik heb, ja, zo'n fijn leven, ook los van de sport. En dat heeft me heel goed gedaan. Ja. Mooi. Ik denk dat dat weer extra motivatie geeft. Ja, absoluut.	1.00	whisper_verified	t	2025-06-24 05:06:23	2025-06-24 07:07:27	2025-06-24 07:07:27	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified_at, password, role, privacy_consent, privacy_consent_at, remember_token, created_at, updated_at) FROM stdin;
1	Test Admin	test@conversationhub.nl	2025-06-03 18:56:08	$2y$12$w2hsPWDBrB2diFblflx/Te3VkPuViIf6u50W4e1MW8j4X/UgEzhfq	admin	t	2025-06-03 18:56:08	\N	2025-06-03 18:56:08	2025-06-03 18:56:08
2	Demo User	demo@conversationhub.nl	2025-06-03 18:56:08	$2y$12$h1rnfX9sSSbE9.PWhr2.oOg0yUPW72yzWFgsx8AUs5OsNniAfYGfW	user	t	2025-06-03 18:56:08	\N	2025-06-03 18:56:08	2025-06-03 18:56:08
3	Test User	test@example.com	\N	$2y$12$f/VV7kkXXgd4QnIC4Neqa.guP791R9diuSdp7OhnjgqdbYK94Fg3q	user	t	2025-06-17 14:31:29	\N	2025-06-17 14:31:29	2025-06-17 14:31:29
\.


--
-- Name: agenda_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agenda_items_id_seq', 22, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: meeting_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meeting_reports_id_seq', 43, true);


--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meetings_id_seq', 5, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 15, true);


--
-- Name: n8n_exports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.n8n_exports_id_seq', 1, false);


--
-- Name: n8n_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.n8n_reports_id_seq', 1, false);


--
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.participants_id_seq', 11, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 46, true);


--
-- Name: report_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_sections_id_seq', 2, true);


--
-- Name: transcriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transcriptions_id_seq', 194, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: agenda_items agenda_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: meeting_reports meeting_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: n8n_exports n8n_exports_export_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_exports
    ADD CONSTRAINT n8n_exports_export_id_unique UNIQUE (export_id);


--
-- Name: n8n_exports n8n_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_exports
    ADD CONSTRAINT n8n_exports_pkey PRIMARY KEY (id);


--
-- Name: n8n_reports n8n_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_reports
    ADD CONSTRAINT n8n_reports_pkey PRIMARY KEY (id);


--
-- Name: n8n_reports n8n_reports_report_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_reports
    ADD CONSTRAINT n8n_reports_report_id_unique UNIQUE (report_id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: report_sections report_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sections
    ADD CONSTRAINT report_sections_pkey PRIMARY KEY (id);


--
-- Name: transcriptions transcriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcriptions
    ADD CONSTRAINT transcriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: agenda_items_meeting_id_order_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX agenda_items_meeting_id_order_index ON public.agenda_items USING btree (meeting_id, "order");


--
-- Name: agenda_meeting_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX agenda_meeting_idx ON public.agenda_items USING btree (meeting_id);


--
-- Name: idx_speaker_detection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_speaker_detection ON public.transcriptions USING btree (speaker_id, speaker_confidence);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: meeting_reports_generated_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_generated_at_index ON public.meeting_reports USING btree (generated_at);


--
-- Name: meeting_reports_meeting_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_meeting_id_index ON public.meeting_reports USING btree (meeting_id);


--
-- Name: meeting_reports_meeting_id_version_number_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_meeting_id_version_number_index ON public.meeting_reports USING btree (meeting_id, version_number);


--
-- Name: meeting_reports_privacy_filtered_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_privacy_filtered_index ON public.meeting_reports USING btree (privacy_filtered);


--
-- Name: meeting_reports_report_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_report_type_index ON public.meeting_reports USING btree (report_type);


--
-- Name: meeting_reports_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meeting_reports_status_index ON public.meeting_reports USING btree (status);


--
-- Name: meetings_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meetings_created_idx ON public.meetings USING btree (created_at);


--
-- Name: meetings_scheduled_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meetings_scheduled_at_index ON public.meetings USING btree (scheduled_at);


--
-- Name: meetings_user_id_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meetings_user_id_status_index ON public.meetings USING btree (user_id, status);


--
-- Name: meetings_user_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meetings_user_status_idx ON public.meetings USING btree (user_id, status);


--
-- Name: n8n_exports_export_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_exports_export_id_index ON public.n8n_exports USING btree (export_id);


--
-- Name: n8n_exports_meeting_id_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_exports_meeting_id_status_index ON public.n8n_exports USING btree (meeting_id, status);


--
-- Name: n8n_exports_user_id_created_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_exports_user_id_created_at_index ON public.n8n_exports USING btree (user_id, created_at);


--
-- Name: n8n_reports_meeting_id_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_reports_meeting_id_status_index ON public.n8n_reports USING btree (meeting_id, status);


--
-- Name: n8n_reports_report_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_reports_report_id_index ON public.n8n_reports USING btree (report_id);


--
-- Name: n8n_reports_user_id_created_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX n8n_reports_user_id_created_at_index ON public.n8n_reports USING btree (user_id, created_at);


--
-- Name: participants_meeting_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX participants_meeting_id_index ON public.participants USING btree (meeting_id);


--
-- Name: participants_meeting_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX participants_meeting_idx ON public.participants USING btree (meeting_id);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: report_sections_agenda_item_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_sections_agenda_item_id_index ON public.report_sections USING btree (agenda_item_id);


--
-- Name: report_sections_contains_privacy_info_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_sections_contains_privacy_info_index ON public.report_sections USING btree (contains_privacy_info);


--
-- Name: report_sections_meeting_report_id_order_index_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_sections_meeting_report_id_order_index_index ON public.report_sections USING btree (meeting_report_id, order_index);


--
-- Name: report_sections_section_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_sections_section_type_index ON public.report_sections USING btree (section_type);


--
-- Name: transcriptions_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transcriptions_created_idx ON public.transcriptions USING btree (created_at);


--
-- Name: transcriptions_meeting_id_spoken_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transcriptions_meeting_id_spoken_at_index ON public.transcriptions USING btree (meeting_id, spoken_at);


--
-- Name: transcriptions_meeting_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transcriptions_meeting_idx ON public.transcriptions USING btree (meeting_id);


--
-- Name: agenda_items agenda_items_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_reports meeting_reports_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: n8n_exports n8n_exports_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_exports
    ADD CONSTRAINT n8n_exports_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: n8n_exports n8n_exports_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_exports
    ADD CONSTRAINT n8n_exports_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: n8n_reports n8n_reports_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_reports
    ADD CONSTRAINT n8n_reports_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: n8n_reports n8n_reports_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_reports
    ADD CONSTRAINT n8n_reports_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: participants participants_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: report_sections report_sections_agenda_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sections
    ADD CONSTRAINT report_sections_agenda_item_id_foreign FOREIGN KEY (agenda_item_id) REFERENCES public.agenda_items(id) ON DELETE SET NULL;


--
-- Name: report_sections report_sections_last_edited_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sections
    ADD CONSTRAINT report_sections_last_edited_by_foreign FOREIGN KEY (last_edited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: report_sections report_sections_meeting_report_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sections
    ADD CONSTRAINT report_sections_meeting_report_id_foreign FOREIGN KEY (meeting_report_id) REFERENCES public.meeting_reports(id) ON DELETE CASCADE;


--
-- Name: transcriptions transcriptions_meeting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcriptions
    ADD CONSTRAINT transcriptions_meeting_id_foreign FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

