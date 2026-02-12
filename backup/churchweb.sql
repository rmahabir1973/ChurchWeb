--
-- PostgreSQL database dump
--

\restrict FiDknuwaEmyRbGfIdzhdvFIQnYHCeRIIbX2e4ZCpyl60xTybe3jW816EMaF0Mub

-- Dumped from database version 16.11 (df20cf9)
-- Dumped by pg_dump version 16.10

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

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    church_name character varying(255),
    phone character varying(50),
    whmcs_client_id integer,
    duda_account_created boolean DEFAULT false,
    is_legacy boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: sites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sites (
    id integer NOT NULL,
    site_name character varying(255) NOT NULL,
    client_id integer,
    template_id character varying(100),
    church_name character varying(255),
    preview_url text,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sites OWNER TO neondb_owner;

--
-- Name: sites_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sites_id_seq OWNER TO neondb_owner;

--
-- Name: sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sites_id_seq OWNED BY public.sites.id;


--
-- Name: trials; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.trials (
    id integer NOT NULL,
    client_id integer,
    site_id integer,
    email character varying(255) NOT NULL,
    site_name character varying(255) NOT NULL,
    trial_start timestamp with time zone NOT NULL,
    trial_expiry timestamp with time zone NOT NULL,
    has_paid boolean DEFAULT false,
    has_publish_access boolean DEFAULT false,
    upgraded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trials OWNER TO neondb_owner;

--
-- Name: trials_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.trials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trials_id_seq OWNER TO neondb_owner;

--
-- Name: trials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.trials_id_seq OWNED BY public.trials.id;


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: sites id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sites ALTER COLUMN id SET DEFAULT nextval('public.sites_id_seq'::regclass);


--
-- Name: trials id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trials ALTER COLUMN id SET DEFAULT nextval('public.trials_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	9a55c8f6-c0d9-473d-8abc-d03c3e9b73c8	1ff0cbce-28cf-4200-8fbb-22c40756835e	10	2025-12-12 19:46:42.101184+00
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, email, first_name, last_name, church_name, phone, whmcs_client_id, duda_account_created, is_legacy, created_at, updated_at) FROM stdin;
2	churchwebsupport@protonmail.com	\N	\N	The Path Church	\N	\N	t	t	2025-12-12 21:28:43.122899+00	2025-12-12 21:28:43.122899+00
3	info@grace.com	\N	\N	Grace Presbytrtian	\N	\N	t	f	2025-12-13 01:24:58.698768+00	2025-12-13 01:24:58.862561+00
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sites (id, site_name, client_id, template_id, church_name, preview_url, is_published, created_at, updated_at) FROM stdin;
383	5f2bdbe7	2	\N	www.burkholderunited.ca	https://www.burkholderunited.ca	t	2025-12-12 21:28:51.923975+00	2025-12-12 21:28:51.923975+00
384	e0408b37	2	\N	www.ardenpastoralcharge.ca	https://www.ardenpastoralcharge.ca	t	2025-12-12 21:28:52.082496+00	2025-12-12 21:28:52.082496+00
385	e8e52a60	2	\N	e8e52a60	https://anesatraining.multiscreensite.com/	t	2025-12-12 21:28:52.226483+00	2025-12-12 21:28:52.226483+00
386	8d9191dd	2	\N	Gaetz Memorial Church	https://www.gaetzmemorialunitedchurch.ca	t	2025-12-12 21:28:52.369515+00	2025-12-12 21:28:52.369515+00
387	62c5952c	2	\N	62c5952c	https://billpoole.multiscreensite.com/	t	2025-12-12 21:28:52.516263+00	2025-12-12 21:28:52.516263+00
388	cabfb0f3	2	\N	www.burforduc.ca	https://www.burforduc.ca	t	2025-12-12 21:28:52.662814+00	2025-12-12 21:28:52.662814+00
389	ec0b067c	2	\N	Home United Church	https://www.homeunitedchurch.ca	t	2025-12-12 21:28:52.813613+00	2025-12-12 21:28:52.813613+00
390	b4a35f29	2	\N	Central United Church in the Heart of Weston, Ontario	https://www.centralwestonuc.ca	t	2025-12-12 21:28:52.965738+00	2025-12-12 21:28:52.965738+00
391	fa8016c1	2	\N	Gospel and Worship International Church of Christ	https://www.gwicoc.com	t	2025-12-12 21:28:53.118005+00	2025-12-12 21:28:53.118005+00
392	7c4cb280	2	\N	www.trustedmcmeekin.ca	https://www.trustedmcmeekin.ca	t	2025-12-12 21:28:53.260338+00	2025-12-12 21:28:53.260338+00
393	470b7edd	2	\N	www.drdavedavis.com	https://www.drdavedavis.com	t	2025-12-12 21:28:53.448488+00	2025-12-12 21:28:53.448488+00
394	ec8442d0	2	\N	www.chapelinthepark.ca	https://www.chapelinthepark.ca	t	2025-12-12 21:28:53.590797+00	2025-12-12 21:28:53.590797+00
395	b55feb7a	2	\N	www.creativesources.faith	https://www.creativesources.faith	t	2025-12-12 21:28:53.739454+00	2025-12-12 21:28:53.739454+00
396	f1b304ca	2	\N	f1b304ca	https://smd02.multiscreensite.com/	t	2025-12-12 21:28:53.88558+00	2025-12-12 21:28:53.88558+00
397	90f99c12	2	\N	90f99c12	https://smd01.multiscreensite.com/	t	2025-12-12 21:28:54.036651+00	2025-12-12 21:28:54.036651+00
398	1a68d0a0	2	\N	www.autoclinicofpendleton.com	https://www.autoclinicofpendleton.com	t	2025-12-12 21:28:54.173387+00	2025-12-12 21:28:54.173387+00
399	4d51fb67	2	\N	www.socialmediadental.today	https://www.socialmediadental.today	t	2025-12-12 21:28:54.31991+00	2025-12-12 21:28:54.31991+00
400	931b27a1	2	\N	www.edenunitedchurch.com	https://www.edenunitedchurch.com	t	2025-12-12 21:28:54.465463+00	2025-12-12 21:28:54.465463+00
401	126a3ab0	2	\N	www.aylesfordunited.com	https://www.aylesfordunited.com	t	2025-12-12 21:28:54.614561+00	2025-12-12 21:28:54.614561+00
402	60600a81	2	\N	Dave Davis Writing	https://drdavedaviswriter-v2.multiscreensite.com/	t	2025-12-12 21:28:54.770119+00	2025-12-12 21:28:54.770119+00
403	a9d4bdd3	2	\N	a9d4bdd3	https://bartonstonemounthope.multiscreensite.com/	t	2025-12-12 21:28:54.912116+00	2025-12-12 21:28:54.912116+00
404	9620b7bb	2	\N	www.wfpconline.com	https://www.wfpconline.com	t	2025-12-12 21:28:55.061363+00	2025-12-12 21:28:55.061363+00
405	85c7a5fc	2	\N	www.guidedprayernetwork.ca	https://www.guidedprayernetwork.ca	t	2025-12-12 21:28:55.209357+00	2025-12-12 21:28:55.209357+00
406	1f0ee4e8	2	\N	www.emuc.ca	https://www.emuc.ca	t	2025-12-12 21:28:55.352019+00	2025-12-12 21:28:55.352019+00
407	d511905a	2	\N	www.sherwinlaw.ca	https://www.sherwinlaw.ca	t	2025-12-12 21:28:55.501446+00	2025-12-12 21:28:55.501446+00
408	b4642f82	2	\N	www.littdesign.ca	https://www.littdesign.ca	t	2025-12-12 21:28:55.654064+00	2025-12-12 21:28:55.654064+00
409	1fc67adf	2	\N	www.smokeykennels.com	https://www.smokeykennels.com	t	2025-12-12 21:28:55.815353+00	2025-12-12 21:28:55.815353+00
410	111cbfed	2	\N	www.southamptonunited.ca	https://www.southamptonunited.ca	t	2025-12-12 21:28:55.961802+00	2025-12-12 21:28:55.961802+00
411	828f6787	2	\N	www.joanofarc.ca	https://www.joanofarc.ca	t	2025-12-12 21:28:56.113819+00	2025-12-12 21:28:56.113819+00
412	b2f33a00	2	\N	b2f33a00	https://sample-curves.multiscreensite.com/	t	2025-12-12 21:28:56.265466+00	2025-12-12 21:28:56.265466+00
413	5410fd53	2	\N	Litt Dance and Music	https://www.littdancemusic.ca	t	2025-12-12 21:28:56.410047+00	2025-12-12 21:28:56.410047+00
414	d21ef6df	2	\N	d21ef6df	https://trinityacton.multiscreensite.com/	t	2025-12-12 21:28:56.555451+00	2025-12-12 21:28:56.555451+00
415	810279ee	2	\N	810279ee	https://sample-church1695e2d3.multiscreensite.com/	t	2025-12-12 21:28:56.695734+00	2025-12-12 21:28:56.695734+00
416	b1f105cd	2	\N	www.circle-m.ca	https://www.circle-m.ca	t	2025-12-12 21:28:56.843479+00	2025-12-12 21:28:56.843479+00
417	ffbb5a35	2	\N	www.kilsythkeadynorthderbyuc.ca	https://www.kilsythkeadynorthderbyuc.ca	t	2025-12-12 21:28:56.991217+00	2025-12-12 21:28:56.991217+00
418	a281a43a	2	\N	a281a43a	https://storesamplede3c4b15.multiscreensite.com/	t	2025-12-12 21:28:57.142999+00	2025-12-12 21:28:57.142999+00
419	7d4441b0	2	\N	7d4441b0	https://weekofguidedprayer-template-03.multiscreensite.com/	t	2025-12-12 21:28:57.291433+00	2025-12-12 21:28:57.291433+00
420	1a8b52b4	2	\N	1a8b52b4	https://weekofguidedprayer-template-02.multiscreensite.com/	t	2025-12-12 21:28:57.431631+00	2025-12-12 21:28:57.431631+00
421	84d6bdc0	2	\N	84d6bdc0	https://weekofguidedprayer-template-01.multiscreensite.com/	t	2025-12-12 21:28:57.577726+00	2025-12-12 21:28:57.577726+00
422	f995d003	2	\N	www.volumemediaproductions.com	https://www.volumemediaproductions.com	t	2025-12-12 21:28:57.730672+00	2025-12-12 21:28:57.730672+00
423	ed6e40f1	2	\N	ed6e40f1	https://samplerecordstore.multiscreensite.com/	t	2025-12-12 21:28:57.876586+00	2025-12-12 21:28:57.876586+00
424	290c56af	2	\N	290c56af	https://sampleautorepair.multiscreensite.com/	t	2025-12-12 21:28:58.019955+00	2025-12-12 21:28:58.019955+00
425	bf0d4b15	2	\N	bf0d4b15	https://samplehomedecor.multiscreensite.com/	t	2025-12-12 21:28:58.164584+00	2025-12-12 21:28:58.164584+00
426	807a43a8	2	\N	807a43a8	https://samplecardealer.multiscreensite.com/	t	2025-12-12 21:28:58.301501+00	2025-12-12 21:28:58.301501+00
427	266fdf64	2	\N	266fdf64	https://samplepainter.multiscreensite.com/	t	2025-12-12 21:28:58.450859+00	2025-12-12 21:28:58.450859+00
428	fe94c8b2	2	\N	fe94c8b2	https://stdavids-woodstock.multiscreensite.com/	t	2025-12-12 21:28:58.598811+00	2025-12-12 21:28:58.598811+00
429	ec16a12b	2	\N	ec16a12b	https://toronto-academy-of-dentistry.multiscreensite.com/	t	2025-12-12 21:28:58.746104+00	2025-12-12 21:28:58.746104+00
430	2551bc1e	2	\N	www.windermerechurch.ca	https://www.windermerechurch.ca	t	2025-12-12 21:28:58.896503+00	2025-12-12 21:28:58.896503+00
431	2fdcef08	2	\N	www.donwaycovenant.com	https://www.donwaycovenant.com	t	2025-12-12 21:28:59.042943+00	2025-12-12 21:28:59.042943+00
432	8d8735c1	2	\N	Mountain Springs Baptist Church	https://www.msbcmonroe.com	t	2025-12-12 21:28:59.193282+00	2025-12-12 21:28:59.193282+00
433	ce8d59af	2	\N	ce8d59af	https://trainingsite-second_version.multiscreensite.com/	t	2025-12-12 21:28:59.338585+00	2025-12-12 21:28:59.338585+00
434	764c35b0	2	\N	www.wayneirwinphotography.com	https://www.wayneirwinphotography.com	t	2025-12-12 21:28:59.486865+00	2025-12-12 21:28:59.486865+00
435	858fc531	2	\N	www.annmcraebooks.ca	https://www.annmcraebooks.ca	t	2025-12-12 21:28:59.630975+00	2025-12-12 21:28:59.630975+00
436	a36c6f08	2	\N	a36c6f08	https://volumemediaproductions_version_2020.multiscreensite.com/	t	2025-12-12 21:28:59.779101+00	2025-12-12 21:28:59.779101+00
437	5cd4a5cc	2	\N	www.onlineremembrances.com	https://www.onlineremembrances.com	t	2025-12-12 21:28:59.921707+00	2025-12-12 21:28:59.921707+00
438	116f29f0	2	\N	www.stdavidsunited.com	https://www.stdavidsunited.com	t	2025-12-12 21:29:00.12585+00	2025-12-12 21:29:00.12585+00
439	8b0c8bbb	2	\N	www.trilliumunited.ca	https://www.trilliumunited.ca	t	2025-12-12 21:29:00.274265+00	2025-12-12 21:29:00.274265+00
440	164837f5	2	\N	164837f5	https://templatebracebridge.multiscreensite.com/	t	2025-12-12 21:29:00.421627+00	2025-12-12 21:29:00.421627+00
633	5cc8fd76	2	\N	Bracebridge United Church	https://www.bracebridgeunitedchurch.ca	t	2025-12-12 21:29:28.917841+00	2025-12-12 21:29:28.917841+00
634	62eefc52	2	\N	waterfordunitedchurch.org	https://waterfordunitedchurch.org	t	2025-12-12 21:29:29.068134+00	2025-12-12 21:29:29.068134+00
635	63a1e5b8	2	\N	www.knoxburlington.ca	https://www.knoxburlington.ca	t	2025-12-12 21:29:29.210535+00	2025-12-12 21:29:29.210535+00
636	9c700dd7	2	\N	Calvary United Church	https://www.calvarymemorial.ca	t	2025-12-12 21:29:29.363964+00	2025-12-12 21:29:29.363964+00
637	7f03f23d	2	\N	seedsoflivinghope.com	https://seedsoflivinghope.com	t	2025-12-12 21:29:29.509487+00	2025-12-12 21:29:29.509487+00
638	69cec3ca	2	\N	First Presbyterian Church	https://www.firstpressterling.org	t	2025-12-12 21:29:29.650841+00	2025-12-12 21:29:29.650841+00
639	527cb80d	2	\N	www.salemlutherannalc.com	https://www.salemlutherannalc.com	t	2025-12-12 21:29:29.795221+00	2025-12-12 21:29:29.795221+00
640	c0a3a453	2	\N	c0a3a453	https://volumemediaproductions.multiscreensite.com/	t	2025-12-12 21:29:29.941138+00	2025-12-12 21:29:29.941138+00
641	378da622	2	\N	www.caledoneastunitedchurch.ca	https://www.caledoneastunitedchurch.ca	t	2025-12-12 21:29:30.092995+00	2025-12-12 21:29:30.092995+00
642	df1ef568	2	\N	avonglenchurch.ca	https://avonglenchurch.ca	t	2025-12-12 21:29:30.240866+00	2025-12-12 21:29:30.240866+00
643	75ba78ef	2	\N	FBC Student Ministry	https://www.fbcwhstudents.com	t	2025-12-12 21:29:30.386156+00	2025-12-12 21:29:30.386156+00
644	5bfa6148	3	\N	Grace Presbytrtian	\N	f	2025-12-13 01:24:58.990822+00	2025-12-13 01:24:58.990822+00
645	f3708116	2	\N	f3708116	https://church-template-2.multiscreensite.com/	t	2025-12-23 18:18:06.380139+00	2025-12-23 18:18:06.380139+00
324	f1940ccb	2	\N	The Path Church	https://modern-church-design.multiscreensite.com/	t	2025-12-12 21:28:43.143197+00	2025-12-12 21:28:43.143197+00
325	1f7bbff6	2	\N	The Path Church	https://modern-church.multiscreensite.com/	t	2025-12-12 21:28:43.295337+00	2025-12-12 21:28:43.295337+00
326	a4d85905	2	\N	www.keithknill.ca	https://www.keithknill.ca	t	2025-12-12 21:28:43.442218+00	2025-12-12 21:28:43.442218+00
327	5b2685a9	2	\N	The Path Church	https://armstrongunited.multiscreensite.com/	t	2025-12-12 21:28:43.589615+00	2025-12-12 21:28:43.589615+00
328	b9a6f216	2	\N	The Path Church	https://village-of-love-canada.multiscreensite.com/	t	2025-12-12 21:28:43.735796+00	2025-12-12 21:28:43.735796+00
329	d3a34e7f	2	\N	d3a34e7f	https://staging-erindaleunitedchurch.multiscreensite.com/	t	2025-12-12 21:28:43.884732+00	2025-12-12 21:28:43.884732+00
330	04bbb231	2	\N	www.oxfordliberals.ca	https://www.oxfordliberals.ca	t	2025-12-12 21:28:44.033198+00	2025-12-12 21:28:44.033198+00
331	d2c97ab8	2	\N	www.bethelmemorialchapelandcemetery.ca	https://www.bethelmemorialchapelandcemetery.ca	t	2025-12-12 21:28:44.18072+00	2025-12-12 21:28:44.18072+00
332	a946ffad	2	\N	a946ffad	https://volumemediaproductions-2025.multiscreensite.com/	t	2025-12-12 21:28:44.326157+00	2025-12-12 21:28:44.326157+00
333	f23fd714	2	\N	www.churchwebglobal.com	https://www.churchwebglobal.com	t	2025-12-12 21:28:44.472687+00	2025-12-12 21:28:44.472687+00
334	f6c9374f	2	\N	www.revtbc.com	https://www.revtbc.com	t	2025-12-12 21:28:44.627534+00	2025-12-12 21:28:44.627534+00
335	2b600192	2	\N	www.edunny.com	https://www.edunny.com	t	2025-12-12 21:28:44.772936+00	2025-12-12 21:28:44.772936+00
336	208a7788	2	\N	www.unitedlivestream.ca	https://www.unitedlivestream.ca	t	2025-12-12 21:28:44.922343+00	2025-12-12 21:28:44.922343+00
337	0605d9dd	2	\N	www.riversunitedchurch.org	https://www.riversunitedchurch.org	t	2025-12-12 21:28:45.075589+00	2025-12-12 21:28:45.075589+00
338	b4bf7dd3	2	\N	Gospel and Worship International Church of Christ	https://www.greatvisionpsc.com	t	2025-12-12 21:28:45.224288+00	2025-12-12 21:28:45.224288+00
339	c0231521	2	\N	www.emilypresbyteriancemetery.ca	https://www.emilypresbyteriancemetery.ca	t	2025-12-12 21:28:45.381961+00	2025-12-12 21:28:45.381961+00
340	b8f811fb	2	\N	www.brucefieldchurch.ca	https://www.brucefieldchurch.ca	t	2025-12-12 21:28:45.529089+00	2025-12-12 21:28:45.529089+00
341	df278b6b	2	\N	www.worshipresources.ca	https://www.worshipresources.ca	t	2025-12-12 21:28:45.679281+00	2025-12-12 21:28:45.679281+00
342	bbc6c77a	2	\N	bbc6c77a	https://www-emuc-ca-2025.multiscreensite.com/	t	2025-12-12 21:28:45.821805+00	2025-12-12 21:28:45.821805+00
343	0aa7e31e	2	\N	www.liferemembrance.ca	https://www.liferemembrance.ca	t	2025-12-12 21:28:45.969589+00	2025-12-12 21:28:45.969589+00
344	a8859588	2	\N	a8859588	https://stpaulsdundasvdup.multiscreensite.com/	t	2025-12-12 21:28:46.119244+00	2025-12-12 21:28:46.119244+00
345	c8733363	2	\N	c8733363	https://stpaulsdundasv2.multiscreensite.com/	t	2025-12-12 21:28:46.269273+00	2025-12-12 21:28:46.269273+00
346	fa3c4a69	2	\N	www.wesleyunitedchurch.net	https://www.wesleyunitedchurch.net	t	2025-12-12 21:28:46.418867+00	2025-12-12 21:28:46.418867+00
347	dd6700d3	2	\N	www.oxfordlpa.ca	https://www.oxfordlpa.ca	t	2025-12-12 21:28:46.557153+00	2025-12-12 21:28:46.557153+00
348	e4438a70	2	\N	e4438a70	https://streetsville-united-church.multiscreensite.com/	t	2025-12-12 21:28:46.705868+00	2025-12-12 21:28:46.705868+00
349	156f428d	2	\N	www.stdavidswoodstock.com	https://www.stdavidswoodstock.com	t	2025-12-12 21:28:46.85542+00	2025-12-12 21:28:46.85542+00
350	cdf8999e	2	\N	www.sabatinovacca.com	https://www.sabatinovacca.com	t	2025-12-12 21:28:47.01412+00	2025-12-12 21:28:47.01412+00
351	f587d1e8	2	\N	www.erinunitedchurch.org	https://www.erinunitedchurch.org	t	2025-12-12 21:28:47.163469+00	2025-12-12 21:28:47.163469+00
352	d7ec7508	2	\N	d7ec7508	https://erinunitedchurch2.multiscreensite.com/	t	2025-12-12 21:28:47.310837+00	2025-12-12 21:28:47.310837+00
353	c8b10ed5	2	\N	c8b10ed5	https://churchsample-goldtemplate.multiscreensite.com/	t	2025-12-12 21:28:47.458268+00	2025-12-12 21:28:47.458268+00
354	cea5de06	2	\N	The Path Church	https://churchsample-pathchurch.multiscreensite.com/	t	2025-12-12 21:28:47.60761+00	2025-12-12 21:28:47.60761+00
355	e763d7ed	2	\N	Boyds United Church	https://www.boydsunited.ca	t	2025-12-12 21:28:47.758407+00	2025-12-12 21:28:47.758407+00
356	18d94614	2	\N	18d94614	https://ngomainsite.multiscreensite.com/	t	2025-12-12 21:28:47.904379+00	2025-12-12 21:28:47.904379+00
357	a9ab8cd1	2	\N	www.ngosamplesite.com	https://www.ngosamplesite.com	t	2025-12-12 21:28:48.051395+00	2025-12-12 21:28:48.051395+00
358	a17dfe54	2	\N	www.dundas55plus.com	https://www.dundas55plus.com	t	2025-12-12 21:28:48.201797+00	2025-12-12 21:28:48.201797+00
359	e0b6524b	2	\N	The Path Church	https://ryansample1.multiscreensite.com/	t	2025-12-12 21:28:48.361445+00	2025-12-12 21:28:48.361445+00
360	32fdeb5a	2	\N	www.newexcellence.ca	https://www.newexcellence.ca	t	2025-12-12 21:28:48.51304+00	2025-12-12 21:28:48.51304+00
361	746635bc	2	\N	www.northwoodmemorial.com	https://www.northwoodmemorial.com	t	2025-12-12 21:28:48.66495+00	2025-12-12 21:28:48.66495+00
362	314cd3ca	2	\N	314cd3ca	https://admin77719849.multiscreensite.com/	t	2025-12-12 21:28:48.830826+00	2025-12-12 21:28:48.830826+00
363	427501f9	2	\N	First Presbyterian Church	https://admine210afb1.multiscreensite.com/	t	2025-12-12 21:28:48.980381+00	2025-12-12 21:28:48.980381+00
364	9d5d6ef3	2	\N	First Presbyterian Church	https://admin6f818f77.multiscreensite.com/	t	2025-12-12 21:28:49.128838+00	2025-12-12 21:28:49.128838+00
365	8ce1767e	2	\N	Dalhousie-New Mills Pastoral Charge	https://www.dalhousienewmillspc.org	t	2025-12-12 21:28:49.275939+00	2025-12-12 21:28:49.275939+00
366	b78b42fd	2	\N	www.bdrck-inc.ca	https://www.bdrck-inc.ca	t	2025-12-12 21:28:49.422843+00	2025-12-12 21:28:49.422843+00
367	88bf6b0f	2	\N	88bf6b0f	https://markpracticewebsite-blank.multiscreensite.com/	t	2025-12-12 21:28:49.576383+00	2025-12-12 21:28:49.576383+00
368	6c0a68eb	2	\N	The Path Church	https://markpracticewebsite.multiscreensite.com/	t	2025-12-12 21:28:49.719566+00	2025-12-12 21:28:49.719566+00
369	103559d5	2	\N	The Path Church	https://billpoolesamplechurchsite.multiscreensite.com/	t	2025-12-12 21:28:49.858434+00	2025-12-12 21:28:49.858434+00
370	2592b80d	2	\N	2592b80d	https://blackburn1370effa.multiscreensite.com/	t	2025-12-12 21:28:49.999838+00	2025-12-12 21:28:49.999838+00
371	77f8bfa7	2	\N	Humbervale United Church	https://www.humbervaleunitedchurch.com	t	2025-12-12 21:28:50.160671+00	2025-12-12 21:28:50.160671+00
372	1c08aa8a	2	\N	www.crossroadsunited.org	https://www.crossroadsunited.org	t	2025-12-12 21:28:50.312915+00	2025-12-12 21:28:50.312915+00
373	f8d4087c	2	\N	www.wheelsdrivertraining.ca	https://www.wheelsdrivertraining.ca	t	2025-12-12 21:28:50.45777+00	2025-12-12 21:28:50.45777+00
374	d4b865f6	2	\N	www.loonbaycamp.ca	https://www.loonbaycamp.ca	t	2025-12-12 21:28:50.603731+00	2025-12-12 21:28:50.603731+00
375	98971ab3	2	\N	98971ab3	https://dundaschurches.multiscreensite.com/	t	2025-12-12 21:28:50.754602+00	2025-12-12 21:28:50.754602+00
376	ccd43726	2	\N	www.copetownunitedchurch.com	https://www.copetownunitedchurch.com	t	2025-12-12 21:28:50.896605+00	2025-12-12 21:28:50.896605+00
377	f2f8bbb1	2	\N	f2f8bbb1	https://ebenezerunited.multiscreensite.com/	t	2025-12-12 21:28:51.036578+00	2025-12-12 21:28:51.036578+00
378	352e7885	2	\N	Belwood-Metz Pastoral Charge	https://www.belwoodmetzuc.ca	t	2025-12-12 21:28:51.179718+00	2025-12-12 21:28:51.179718+00
379	8dd1a6c5	2	\N	8dd1a6c5	https://volumemediaproductions-2024.multiscreensite.com/	t	2025-12-12 21:28:51.328751+00	2025-12-12 21:28:51.328751+00
380	3fa57696	2	\N	StDavids-Queenston United Church	https://www.stdavids-queenstonuc.ca	t	2025-12-12 21:28:51.485011+00	2025-12-12 21:28:51.485011+00
381	f6c76e16	2	\N	Avon United Church	https://www.avonunited.ca	t	2025-12-12 21:28:51.629249+00	2025-12-12 21:28:51.629249+00
382	940f1e33	2	\N	Sheridan United Church	https://www.sheridanunited.ca	t	2025-12-12 21:28:51.777643+00	2025-12-12 21:28:51.777643+00
441	76e149cd	2	\N	www.stjohnsmarathon.ca	https://www.stjohnsmarathon.ca	t	2025-12-12 21:29:00.560017+00	2025-12-12 21:29:00.560017+00
442	97a56699	2	\N	www.experiencelifefa.com	https://www.experiencelifefa.com	t	2025-12-12 21:29:00.70346+00	2025-12-12 21:29:00.70346+00
443	e25c2a2e	2	\N	www.floraandwayne.com	https://www.floraandwayne.com	t	2025-12-12 21:29:00.852374+00	2025-12-12 21:29:00.852374+00
444	80a5d528	2	\N	80a5d528	https://business_promotion.multiscreensite.com/	t	2025-12-12 21:29:00.999214+00	2025-12-12 21:29:00.999214+00
445	d47646db	2	\N	www.westminsterunited.org	https://www.westminsterunited.org	t	2025-12-12 21:29:01.145437+00	2025-12-12 21:29:01.145437+00
446	90b64a19	2	\N	90b64a19	https://stjohnhamilton.multiscreensite.com/	t	2025-12-12 21:29:01.290743+00	2025-12-12 21:29:01.290743+00
447	7110ae04	2	\N	7110ae04	https://guardtrainingacademy.multiscreensite.com/	t	2025-12-12 21:29:01.438323+00	2025-12-12 21:29:01.438323+00
448	a647178b	2	\N	www.stjameswaterdown.ca	https://www.stjameswaterdown.ca	t	2025-12-12 21:29:01.577646+00	2025-12-12 21:29:01.577646+00
449	bb192b23	2	\N	www.agnesmartin.ca	https://www.agnesmartin.ca	t	2025-12-12 21:29:01.730831+00	2025-12-12 21:29:01.730831+00
450	b3501124	2	\N	www.trinitymalton.ca	https://www.trinitymalton.ca	t	2025-12-12 21:29:01.878137+00	2025-12-12 21:29:01.878137+00
451	c6f02bbb	2	\N	www.portelginunitedchurch.ca	https://www.portelginunitedchurch.ca	t	2025-12-12 21:29:02.023942+00	2025-12-12 21:29:02.023942+00
452	a145e7ca	2	\N	a145e7ca	https://michael_nash_photography.multiscreensite.com/	t	2025-12-12 21:29:02.179821+00	2025-12-12 21:29:02.179821+00
453	76bbc0ce	2	\N	www.standrewsunited.com	https://www.standrewsunited.com	t	2025-12-12 21:29:02.342123+00	2025-12-12 21:29:02.342123+00
454	d64b61fd	2	\N	www.marybeercounselling.ca	https://www.marybeercounselling.ca	t	2025-12-12 21:29:02.481619+00	2025-12-12 21:29:02.481619+00
455	b1e7ac36	2	\N	b1e7ac36	https://standrewstoronto_v_summer2019.multiscreensite.com/	t	2025-12-12 21:29:02.64235+00	2025-12-12 21:29:02.64235+00
456	8694cf2c	2	\N	www.united-in-worship.ca	https://www.united-in-worship.ca	t	2025-12-12 21:29:02.787394+00	2025-12-12 21:29:02.787394+00
457	ba5946d2	2	\N	www.westminsterunitedchurch.ca	https://www.westminsterunitedchurch.ca	t	2025-12-12 21:29:02.94802+00	2025-12-12 21:29:02.94802+00
458	e21dc685	2	\N	www.presenceprojectnetwork.ca	https://www.presenceprojectnetwork.ca	t	2025-12-12 21:29:03.090009+00	2025-12-12 21:29:03.090009+00
459	5493d574	2	\N	5493d574	https://stgeorgeunited.multiscreensite.com/	t	2025-12-12 21:29:03.243957+00	2025-12-12 21:29:03.243957+00
460	ae6d67e4	2	\N	ae6d67e4	https://northmsliving.multiscreensite.com/	t	2025-12-12 21:29:03.390779+00	2025-12-12 21:29:03.390779+00
461	7271ab4d	2	\N	Great Lakes Bible College- Canadian Christian Education	https://www.glbc.ca	t	2025-12-12 21:29:03.530994+00	2025-12-12 21:29:03.530994+00
462	155681db	2	\N	www.alwynenterprises.ca	https://www.alwynenterprises.ca	t	2025-12-12 21:29:03.672524+00	2025-12-12 21:29:03.672524+00
463	a63287b9	2	\N	www.tracingroots.ca	https://www.tracingroots.ca	t	2025-12-12 21:29:03.817658+00	2025-12-12 21:29:03.817658+00
464	63c5677b	2	\N	www.websiteservice.pro	https://www.websiteservice.pro	t	2025-12-12 21:29:03.987155+00	2025-12-12 21:29:03.987155+00
465	fb142229	2	\N	fb142229	https://churchtemplate_bw.multiscreensite.com/	t	2025-12-12 21:29:04.131661+00	2025-12-12 21:29:04.131661+00
466	a4825a60	2	\N	www.sttlc.ca	https://www.sttlc.ca	t	2025-12-12 21:29:04.279324+00	2025-12-12 21:29:04.279324+00
467	9bb80533	2	\N	9bb80533	https://faithformation_network.multiscreensite.com/	t	2025-12-12 21:29:04.422924+00	2025-12-12 21:29:04.422924+00
468	53a8ca7b	2	\N	53a8ca7b	https://hffra_horseshoefallsregionretireesassociation.multiscreensite.com/	t	2025-12-12 21:29:04.568574+00	2025-12-12 21:29:04.568574+00
469	ba56f314	2	\N	ba56f314	https://lightofgodtransministry.multiscreensite.com/	t	2025-12-12 21:29:04.715523+00	2025-12-12 21:29:04.715523+00
470	8309bf40	2	\N	8309bf40	https://midbrucesharedministry.multiscreensite.com/	t	2025-12-12 21:29:04.870949+00	2025-12-12 21:29:04.870949+00
471	70c8e17d	2	\N	70c8e17d	https://superiorlodge501.multiscreensite.com/	t	2025-12-12 21:29:05.010822+00	2025-12-12 21:29:05.010822+00
472	6327b76d	2	\N	www.faithunitedchurch.ca	https://www.faithunitedchurch.ca	t	2025-12-12 21:29:05.153591+00	2025-12-12 21:29:05.153591+00
473	2a850532	2	\N	www.missioncouncil.ca	https://www.missioncouncil.ca	t	2025-12-12 21:29:05.304639+00	2025-12-12 21:29:05.304639+00
474	4355a885	2	\N	www.drprodgroup.com	https://www.drprodgroup.com	t	2025-12-12 21:29:05.448624+00	2025-12-12 21:29:05.448624+00
475	fd6a34d5	2	\N	www.grandriverbooks.ca	https://www.grandriverbooks.ca	t	2025-12-12 21:29:05.607067+00	2025-12-12 21:29:05.607067+00
476	06e7cf96	2	\N	www.pocketsizedministry.com	https://www.pocketsizedministry.com	t	2025-12-12 21:29:05.75671+00	2025-12-12 21:29:05.75671+00
477	9212d625	2	\N	www.willowgroveunited.ca	https://www.willowgroveunited.ca	t	2025-12-12 21:29:05.911948+00	2025-12-12 21:29:05.911948+00
478	b48ded03	2	\N	Music At Port Hope United Church	https://www.albrightgardens.ca	t	2025-12-12 21:29:06.059512+00	2025-12-12 21:29:06.059512+00
479	080814bc	2	\N	080814bc	https://stpaulsvideoproject.multiscreensite.com/	t	2025-12-12 21:29:06.206399+00	2025-12-12 21:29:06.206399+00
480	d0145b5c	2	\N	d0145b5c	https://drdavedavis_ca_archive2021.multiscreensite.com/	t	2025-12-12 21:29:06.360506+00	2025-12-12 21:29:06.360506+00
481	72d2e444	2	\N	Glebe St. James United Church	https://www.glebestjames.ca	t	2025-12-12 21:29:06.499252+00	2025-12-12 21:29:06.499252+00
482	f5278061	2	\N	f5278061	https://crosspointbinghamton_blueversion2019.multiscreensite.com/	t	2025-12-12 21:29:06.639981+00	2025-12-12 21:29:06.639981+00
483	7ce21333	2	\N	7ce21333	https://levitemissionarychurch.multiscreensite.com/	t	2025-12-12 21:29:06.811329+00	2025-12-12 21:29:06.811329+00
484	2a97f7e6	2	\N	2a97f7e6	https://languagesite.multiscreensite.com/	t	2025-12-12 21:29:06.965082+00	2025-12-12 21:29:06.965082+00
485	6dd09147	2	\N	www.thehad.ca	https://www.thehad.ca	t	2025-12-12 21:29:07.116685+00	2025-12-12 21:29:07.116685+00
486	ed6c111f	2	\N	www.minister.ca	https://www.minister.ca	t	2025-12-12 21:29:07.271336+00	2025-12-12 21:29:07.271336+00
487	41cf3163	2	\N	www.stmarksunitedchurch.ca	https://www.stmarksunitedchurch.ca	t	2025-12-12 21:29:07.424834+00	2025-12-12 21:29:07.424834+00
488	d6aa9f0e	2	\N	www.kruc.ca	https://www.kruc.ca	t	2025-12-12 21:29:07.571194+00	2025-12-12 21:29:07.571194+00
489	d1264261	2	\N	www.prayercycles.ca	https://www.prayercycles.ca	t	2025-12-12 21:29:07.722962+00	2025-12-12 21:29:07.722962+00
490	90409c84	2	\N	www.centralwestside.ca	https://www.centralwestside.ca	t	2025-12-12 21:29:07.869516+00	2025-12-12 21:29:07.869516+00
491	edd21daa	2	\N	edd21daa	https://blogsample_v1.multiscreensite.com/	t	2025-12-12 21:29:08.013545+00	2025-12-12 21:29:08.013545+00
492	833098c3	2	\N	833098c3	https://rameshmishra.multiscreensite.com/	t	2025-12-12 21:29:08.173145+00	2025-12-12 21:29:08.173145+00
493	e4a1cf35	2	\N	e4a1cf35	https://blogsample.multiscreensite.com/	t	2025-12-12 21:29:08.315429+00	2025-12-12 21:29:08.315429+00
494	9d9610bf	2	\N	9d9610bf	https://cowanheightsunited.multiscreensite.com/	t	2025-12-12 21:29:08.458778+00	2025-12-12 21:29:08.458778+00
495	ad19b757	2	\N	www.centralunitedlunenburg.ca	https://www.centralunitedlunenburg.ca	t	2025-12-12 21:29:08.60743+00	2025-12-12 21:29:08.60743+00
496	73f4ad8d	2	\N	www.coleyspointgraceuc.ca	https://www.coleyspointgraceuc.ca	t	2025-12-12 21:29:08.751223+00	2025-12-12 21:29:08.751223+00
497	39224537	2	\N	www.thornhillunitedchurch.ca	https://www.thornhillunitedchurch.ca	t	2025-12-12 21:29:08.893643+00	2025-12-12 21:29:08.893643+00
498	e1ac3097	2	\N	e1ac3097	https://millgrove-and-troy-united-churches.multiscreensite.com/	t	2025-12-12 21:29:09.037898+00	2025-12-12 21:29:09.037898+00
499	bb5008b7	2	\N	www.hillcrestunitedchurch.org	https://www.hillcrestunitedchurch.org	t	2025-12-12 21:29:09.177366+00	2025-12-12 21:29:09.177366+00
500	1f1489c4	2	\N	www.trinityunitedgravenhurst.ca	https://www.trinityunitedgravenhurst.ca	t	2025-12-12 21:29:09.317238+00	2025-12-12 21:29:09.317238+00
501	a16103be	2	\N	a16103be	https://regionalcouncilsample.multiscreensite.com/	t	2025-12-12 21:29:09.466401+00	2025-12-12 21:29:09.466401+00
502	a2cb7bc2	2	\N	www.ucstayner.ca	https://www.ucstayner.ca	t	2025-12-12 21:29:09.610716+00	2025-12-12 21:29:09.610716+00
503	23466c30	2	\N	www.markstreetunited.ca	https://www.markstreetunited.ca	t	2025-12-12 21:29:09.762857+00	2025-12-12 21:29:09.762857+00
504	434575e9	2	\N	434575e9	https://delhiunitedchurch.multiscreensite.com/	t	2025-12-12 21:29:09.903316+00	2025-12-12 21:29:09.903316+00
505	a39bb015	2	\N	www.churchwebsupport.com	https://www.churchwebsupport.com	t	2025-12-12 21:29:10.057904+00	2025-12-12 21:29:10.057904+00
506	4c8a18a8	2	\N	www.churchwebcanada.ca	https://www.churchwebcanada.ca	t	2025-12-12 21:29:10.211154+00	2025-12-12 21:29:10.211154+00
507	52e0962b	2	\N	www.whuc.net	https://www.whuc.net	t	2025-12-12 21:29:10.360003+00	2025-12-12 21:29:10.360003+00
508	a847fab5	2	\N	www.theashbourne.ca	https://www.theashbourne.ca	t	2025-12-12 21:29:10.522335+00	2025-12-12 21:29:10.522335+00
509	fab50ce0	2	\N	fab50ce0	https://margaretbain.multiscreensite.com/	t	2025-12-12 21:29:10.666368+00	2025-12-12 21:29:10.666368+00
510	63982a7f	2	\N	www.a-cuc.ca	https://www.a-cuc.ca	t	2025-12-12 21:29:10.808776+00	2025-12-12 21:29:10.808776+00
511	156d30a5	2	\N	156d30a5	https://trainingsite.multiscreensite.com/	t	2025-12-12 21:29:10.95498+00	2025-12-12 21:29:10.95498+00
512	b0512455	2	\N	b0512455	https://fskt-fultonstonekertapleytown.multiscreensite.com/	t	2025-12-12 21:29:11.101554+00	2025-12-12 21:29:11.101554+00
513	fa9e8ded	2	\N	Linden Park Community Church	https://lindenparkchurch.multiscreensite.com/	t	2025-12-12 21:29:11.241702+00	2025-12-12 21:29:11.241702+00
514	d86e27e6	2	\N	fc.churchwebcanada.ca	https://fc.churchwebcanada.ca	t	2025-12-12 21:29:11.390267+00	2025-12-12 21:29:11.390267+00
515	f1143142	2	\N	Dew Sant	https://dewisantwelshunited.multiscreensite.com/	t	2025-12-12 21:29:11.533467+00	2025-12-12 21:29:11.533467+00
516	5fde7aae	2	\N	5fde7aae	https://jerseyvilleunited.multiscreensite.com/	t	2025-12-12 21:29:11.679612+00	2025-12-12 21:29:11.679612+00
517	ef8385e5	2	\N	ef8385e5	https://stjohnsnassagaweya.multiscreensite.com/	t	2025-12-12 21:29:11.834838+00	2025-12-12 21:29:11.834838+00
518	fde49927	2	\N	fde49927	https://bristolpastoralcharge.multiscreensite.com/	t	2025-12-12 21:29:11.982071+00	2025-12-12 21:29:11.982071+00
519	b9ced966	2	\N	b9ced966	https://brucefieldcommunity.multiscreensite.com/	t	2025-12-12 21:29:12.145216+00	2025-12-12 21:29:12.145216+00
520	74649d11	2	\N	74649d11	https://transfigurationlutheran.multiscreensite.com/	t	2025-12-12 21:29:12.294501+00	2025-12-12 21:29:12.294501+00
521	98166b40	2	\N	98166b40	https://stpaulspresbyterianburlington.multiscreensite.com/	t	2025-12-12 21:29:12.447714+00	2025-12-12 21:29:12.447714+00
522	fadaeb26	2	\N	fadaeb26	https://northernlakespastoralcharge.multiscreensite.com/	t	2025-12-12 21:29:12.59283+00	2025-12-12 21:29:12.59283+00
523	cb3317de	2	\N	cb3317de	https://wesleyunitedaurora.multiscreensite.com/	t	2025-12-12 21:29:12.733708+00	2025-12-12 21:29:12.733708+00
524	5f76ab01	2	\N	www.temperancevilleunitedchurch.net	https://www.temperancevilleunitedchurch.net	t	2025-12-12 21:29:12.874634+00	2025-12-12 21:29:12.874634+00
525	7b32fddd	2	\N	www.sedgewicklougheedunited.ca	https://www.sedgewicklougheedunited.ca	t	2025-12-12 21:29:13.02511+00	2025-12-12 21:29:13.02511+00
526	d84ebf1a	2	\N	d84ebf1a	https://communityunited.multiscreensite.com/	t	2025-12-12 21:29:13.168168+00	2025-12-12 21:29:13.168168+00
527	4f525ec1	2	\N	4f525ec1	https://huttonvilleunited.multiscreensite.com/	t	2025-12-12 21:29:13.310731+00	2025-12-12 21:29:13.310731+00
528	e03276ab	2	\N	www.copetowncommunitycentre.com	https://www.copetowncommunitycentre.com	t	2025-12-12 21:29:13.452693+00	2025-12-12 21:29:13.452693+00
529	c494b98e	2	\N	www.ucespanola.ca	https://www.ucespanola.ca	t	2025-12-12 21:29:13.602784+00	2025-12-12 21:29:13.602784+00
530	51d43145	2	\N	51d43145	https://groupsofhope.multiscreensite.com/	t	2025-12-12 21:29:13.743933+00	2025-12-12 21:29:13.743933+00
531	c27bcb32	2	\N	c27bcb32	https://sochshymnsociety.multiscreensite.com/	t	2025-12-12 21:29:13.887981+00	2025-12-12 21:29:13.887981+00
532	f1ffb20e	2	\N	f1ffb20e	https://gracetavistock.multiscreensite.com/	t	2025-12-12 21:29:14.034718+00	2025-12-12 21:29:14.034718+00
533	9332b867	2	\N	9332b867	https://dalhousienewmills.multiscreensite.com/	t	2025-12-12 21:29:14.184331+00	2025-12-12 21:29:14.184331+00
534	0cca24c1	2	\N	0cca24c1	https://garneauunited.multiscreensite.com/	t	2025-12-12 21:29:14.325812+00	2025-12-12 21:29:14.325812+00
535	4d34e0ec	2	\N	4d34e0ec	https://eccottawaenvironment.multiscreensite.com/	t	2025-12-12 21:29:14.472113+00	2025-12-12 21:29:14.472113+00
536	82033d14	2	\N	82033d14	https://weekofguidedprayer.multiscreensite.com/	t	2025-12-12 21:29:14.615942+00	2025-12-12 21:29:14.615942+00
537	f88547e7	2	\N	f88547e7	https://harshadkhiste.multiscreensite.com/	t	2025-12-12 21:29:14.757606+00	2025-12-12 21:29:14.757606+00
538	08822d7a	2	\N	www.kindersleyunitedchurch.ca	https://www.kindersleyunitedchurch.ca	t	2025-12-12 21:29:14.930163+00	2025-12-12 21:29:14.930163+00
539	413a8cd9	2	\N	413a8cd9	https://crossroadspastoralcharge.multiscreensite.com/	t	2025-12-12 21:29:15.084491+00	2025-12-12 21:29:15.084491+00
540	c6d058aa	2	\N	www.pcreekuc.ca	https://www.pcreekuc.ca	t	2025-12-12 21:29:15.234312+00	2025-12-12 21:29:15.234312+00
541	8fd49d10	2	\N	8fd49d10	https://theashbourne_old.multiscreensite.com/	t	2025-12-12 21:29:15.375399+00	2025-12-12 21:29:15.375399+00
542	ef615186	2	\N	www.cliffordpastoralchargeuc.ca	https://www.cliffordpastoralchargeuc.ca	t	2025-12-12 21:29:15.516471+00	2025-12-12 21:29:15.516471+00
543	f5d72f10	2	\N	www.prairiespiritpc.ca	https://www.prairiespiritpc.ca	t	2025-12-12 21:29:15.686532+00	2025-12-12 21:29:15.686532+00
544	802d37f3	2	\N	802d37f3	https://elmstreetunited.multiscreensite.com/	t	2025-12-12 21:29:15.831381+00	2025-12-12 21:29:15.831381+00
545	6a330398	2	\N	6a330398	https://callawaychristianchurch.multiscreensite.com/	t	2025-12-12 21:29:15.976853+00	2025-12-12 21:29:15.976853+00
546	cac98944	2	\N	cac98944	https://loveliftministries.multiscreensite.com/	t	2025-12-12 21:29:16.123744+00	2025-12-12 21:29:16.123744+00
547	95068506	2	\N	www.estonunitedchurch.ca	https://www.estonunitedchurch.ca	t	2025-12-12 21:29:16.269687+00	2025-12-12 21:29:16.269687+00
548	3346f1ce	2	\N	www.freeltonstrabaneuc.ca	https://www.freeltonstrabaneuc.ca	t	2025-12-12 21:29:16.420841+00	2025-12-12 21:29:16.420841+00
549	c162511d	2	\N	www.bluerosespiritualministry.ca	https://www.bluerosespiritualministry.ca	t	2025-12-12 21:29:16.571224+00	2025-12-12 21:29:16.571224+00
550	e4b7a650	2	\N	e4b7a650	https://knoxdundas.multiscreensite.com/	t	2025-12-12 21:29:16.714859+00	2025-12-12 21:29:16.714859+00
551	eae47228	2	\N	www.walnutstreetbaptistchurch.org	https://www.walnutstreetbaptistchurch.org	t	2025-12-12 21:29:16.877582+00	2025-12-12 21:29:16.877582+00
552	661e5c3d	2	\N	www.larchehamilton.org	https://www.larchehamilton.org	t	2025-12-12 21:29:17.020623+00	2025-12-12 21:29:17.020623+00
553	bbc5dfe2	2	\N	bbc5dfe2	https://deemadickhaas.multiscreensite.com/	t	2025-12-12 21:29:17.164228+00	2025-12-12 21:29:17.164228+00
554	242cbd48	2	\N	www.fiftyunitedchurch.org	https://www.fiftyunitedchurch.org	t	2025-12-12 21:29:17.312372+00	2025-12-12 21:29:17.312372+00
555	27d19f28	2	\N	27d19f28	https://erinmillsunited.multiscreensite.com/	t	2025-12-12 21:29:17.460009+00	2025-12-12 21:29:17.460009+00
556	be993920	2	\N	www.routesyouthcentre.ca	https://www.routesyouthcentre.ca	t	2025-12-12 21:29:17.601934+00	2025-12-12 21:29:17.601934+00
557	c27fef75	2	\N	www.erindaleunited.church	https://www.erindaleunited.church	t	2025-12-12 21:29:17.752731+00	2025-12-12 21:29:17.752731+00
558	a42fbdb2	2	\N	www.englishtexts.org	https://www.englishtexts.org	t	2025-12-12 21:29:17.895398+00	2025-12-12 21:29:17.895398+00
559	cc20b071	2	\N	cc20b071	https://gatheringbaptists_ca.multiscreensite.com/	t	2025-12-12 21:29:18.041862+00	2025-12-12 21:29:18.041862+00
560	e34f963c	2	\N	e34f963c	https://ststephenunited.multiscreensite.com/	t	2025-12-12 21:29:18.193775+00	2025-12-12 21:29:18.193775+00
561	2112d256	2	\N	www.firstunited-os.com	https://www.firstunited-os.com	t	2025-12-12 21:29:18.342789+00	2025-12-12 21:29:18.342789+00
562	f556c452	2	\N	f556c452	https://stdavidsqueenstonunited.multiscreensite.com/	t	2025-12-12 21:29:18.484119+00	2025-12-12 21:29:18.484119+00
563	44dbb6c2	2	\N	44dbb6c2	https://oldwindhamunited.multiscreensite.com/	t	2025-12-12 21:29:18.631035+00	2025-12-12 21:29:18.631035+00
564	0fc1ba3e	2	\N	www.stjamesunited.ca	https://www.stjamesunited.ca	t	2025-12-12 21:29:18.773085+00	2025-12-12 21:29:18.773085+00
565	04cbfe48	2	\N	04cbfe48	https://westminsterunitedchurch_old.multiscreensite.com/	t	2025-12-12 21:29:18.92385+00	2025-12-12 21:29:18.92385+00
566	9c98cf42	2	\N	9c98cf42	https://windermerechurch_archived.multiscreensite.com/	t	2025-12-12 21:29:19.071682+00	2025-12-12 21:29:19.071682+00
567	caacd967	2	\N	caacd967	https://loonbaycamp.multiscreensite.com/	t	2025-12-12 21:29:19.218096+00	2025-12-12 21:29:19.218096+00
568	52728d5b	2	\N	52728d5b	https://woodlawnbaptist_wbcgc.multiscreensite.com/	t	2025-12-12 21:29:19.358942+00	2025-12-12 21:29:19.358942+00
569	ad666b44	2	\N	ad666b44	https://powerhousenaz.multiscreensite.com/	t	2025-12-12 21:29:19.500311+00	2025-12-12 21:29:19.500311+00
570	e18b98a2	2	\N	www.lowvilleunitedchurch.ca	https://www.lowvilleunitedchurch.ca	t	2025-12-12 21:29:19.643884+00	2025-12-12 21:29:19.643884+00
571	1f1d5daa	2	\N	www.famunitedchurch.ca	https://www.famunitedchurch.ca	t	2025-12-12 21:29:19.785194+00	2025-12-12 21:29:19.785194+00
572	91316ad3	2	\N	www.mountainsideunited.ca	https://www.mountainsideunited.ca	t	2025-12-12 21:29:19.923846+00	2025-12-12 21:29:19.923846+00
573	d6355722	2	\N	www.littlecurrent-sheguiandah-unitedchurch.org	https://www.littlecurrent-sheguiandah-unitedchurch.org	t	2025-12-12 21:29:20.067657+00	2025-12-12 21:29:20.067657+00
574	0e919ed9	2	\N	www.peacetburg.ca	https://www.peacetburg.ca	t	2025-12-12 21:29:20.211191+00	2025-12-12 21:29:20.211191+00
575	0c5fe3ed	2	\N	0c5fe3ed	https://glebestjamesottawa_old.multiscreensite.com/	t	2025-12-12 21:29:20.352637+00	2025-12-12 21:29:20.352637+00
576	77bc3b7f	2	\N	77bc3b7f	https://standrewstoronto.multiscreensite.com/	t	2025-12-12 21:29:20.498303+00	2025-12-12 21:29:20.498303+00
577	0d96f951	2	\N	www.thesouthcayugacommunitychurch.com	https://www.thesouthcayugacommunitychurch.com	t	2025-12-12 21:29:20.645635+00	2025-12-12 21:29:20.645635+00
578	7258f2b0	2	\N	www.dunwichunited.ca	https://www.dunwichunited.ca	t	2025-12-12 21:29:20.796509+00	2025-12-12 21:29:20.796509+00
579	b6587469	2	\N	www.graceunitedcaledonia.com	https://www.graceunitedcaledonia.com	t	2025-12-12 21:29:20.943782+00	2025-12-12 21:29:20.943782+00
580	de467c46	2	\N	www.munnsunited.com	https://www.munnsunited.com	t	2025-12-12 21:29:21.093655+00	2025-12-12 21:29:21.093655+00
581	bb00f962	2	\N	bb00f962	https://woodbridgeunited.multiscreensite.com/	t	2025-12-12 21:29:21.235057+00	2025-12-12 21:29:21.235057+00
582	4e8a4e06	2	\N	www.lam-mrl.com	https://www.lam-mrl.com	t	2025-12-12 21:29:21.377677+00	2025-12-12 21:29:21.377677+00
583	d81313df	2	\N	www.binkleyunitedchurch.org	https://www.binkleyunitedchurch.org	t	2025-12-12 21:29:21.531853+00	2025-12-12 21:29:21.531853+00
584	09810d28	2	\N	www.wmuc.ca	https://www.wmuc.ca	t	2025-12-12 21:29:21.681635+00	2025-12-12 21:29:21.681635+00
585	232739aa	2	\N	Faith United Church	https://www.faithunitedhamilton.com	t	2025-12-12 21:29:21.828691+00	2025-12-12 21:29:21.828691+00
586	f4465c11	2	\N	www.summersvillebaptist.com	https://www.summersvillebaptist.com	t	2025-12-12 21:29:21.97352+00	2025-12-12 21:29:21.97352+00
587	dc04caae	2	\N	www.stjohnsalliston.ca	https://www.stjohnsalliston.ca	t	2025-12-12 21:29:22.120151+00	2025-12-12 21:29:22.120151+00
588	04d73aac	2	\N	www.bayfieldunited.church	https://www.bayfieldunited.church	t	2025-12-12 21:29:22.273915+00	2025-12-12 21:29:22.273915+00
589	47346c13	2	\N	47346c13	https://ebenezer.multiscreensite.com/	t	2025-12-12 21:29:22.418072+00	2025-12-12 21:29:22.418072+00
590	657d54ec	2	\N	657d54ec	https://stlukesfortstjohn.multiscreensite.com/	t	2025-12-12 21:29:22.566262+00	2025-12-12 21:29:22.566262+00
591	cdf33bb2	2	\N	www.rocktonunitedchurch.com	https://www.rocktonunitedchurch.com	t	2025-12-12 21:29:22.72073+00	2025-12-12 21:29:22.72073+00
592	f641ef71	2	\N	www.rescent.ca	https://www.rescent.ca	t	2025-12-12 21:29:22.869696+00	2025-12-12 21:29:22.869696+00
593	e14e10ce	2	\N	www.calvarylincolnton.org	https://www.calvarylincolnton.org	t	2025-12-12 21:29:23.018565+00	2025-12-12 21:29:23.018565+00
594	ce3d378c	2	\N	Wesley United Church	https://wesleychurch.ca	t	2025-12-12 21:29:23.17189+00	2025-12-12 21:29:23.17189+00
595	776aa94f	2	\N	776aa94f	https://southampton_mounthope_smhuc.multiscreensite.com/	t	2025-12-12 21:29:23.324134+00	2025-12-12 21:29:23.324134+00
596	6afd8346	2	\N	6afd8346	https://tfctrinityfellowship.multiscreensite.com/	t	2025-12-12 21:29:23.46796+00	2025-12-12 21:29:23.46796+00
597	9d6c2a7b	2	\N	www.binbrookblackheath.org	https://www.binbrookblackheath.org	t	2025-12-12 21:29:23.618523+00	2025-12-12 21:29:23.618523+00
598	1728d460	2	\N	www.haymorechurch.com	https://www.haymorechurch.com	t	2025-12-12 21:29:23.764951+00	2025-12-12 21:29:23.764951+00
599	1084241a	2	\N	www.caseunitedchurch.ca	https://www.caseunitedchurch.ca	t	2025-12-12 21:29:23.906873+00	2025-12-12 21:29:23.906873+00
600	c3020ad6	2	\N	c3020ad6	https://erinunited.multiscreensite.com/	t	2025-12-12 21:29:24.04955+00	2025-12-12 21:29:24.04955+00
601	32e8cbf6	2	\N	filipinobible.org	https://filipinobible.org	t	2025-12-12 21:29:24.197851+00	2025-12-12 21:29:24.197851+00
602	8c1addcb	2	\N	www.heartlakeunitedchurch.com	https://www.heartlakeunitedchurch.com	t	2025-12-12 21:29:24.338844+00	2025-12-12 21:29:24.338844+00
603	a440b046	2	\N	www.stmatthewsbelleville.com	https://www.stmatthewsbelleville.com	t	2025-12-12 21:29:24.48172+00	2025-12-12 21:29:24.48172+00
604	e6272062	2	\N	www.mayfieldunitedchurch.org	https://www.mayfieldunitedchurch.org	t	2025-12-12 21:29:24.621213+00	2025-12-12 21:29:24.621213+00
605	e499d262	2	\N	www.calvinunitedpembroke.ca	https://www.calvinunitedpembroke.ca	t	2025-12-12 21:29:24.763729+00	2025-12-12 21:29:24.763729+00
606	86722f72	2	\N	carlisleuc.ca	https://carlisleuc.ca	t	2025-12-12 21:29:24.912153+00	2025-12-12 21:29:24.912153+00
607	a78a524e	2	\N	Spirit of Hope United Church	https://www.spiritofhope.ca	t	2025-12-12 21:29:25.064204+00	2025-12-12 21:29:25.064204+00
608	3dc83016	2	\N	St Andrews United Church	https://sprucegroveunited.com	t	2025-12-12 21:29:25.219544+00	2025-12-12 21:29:25.219544+00
609	a7ce07e2	2	\N	www.blenheimunitedchurch.com	https://www.blenheimunitedchurch.com	t	2025-12-12 21:29:25.369151+00	2025-12-12 21:29:25.369151+00
610	cca6e282	2	\N	www.hcfusa.com	https://www.hcfusa.com	t	2025-12-12 21:29:25.513692+00	2025-12-12 21:29:25.513692+00
611	e1f94ec2	2	\N	e1f94ec2	https://pilgrimlutheranchurch.multiscreensite.com/	t	2025-12-12 21:29:25.665682+00	2025-12-12 21:29:25.665682+00
612	4eb81a02	2	\N	4eb81a02	https://genericmainstreet.multiscreensite.com/	t	2025-12-12 21:29:25.822848+00	2025-12-12 21:29:25.822848+00
613	b3b3a3d7	2	\N	Flora United Methodist Church	https://floraumc.multiscreensite.com/	t	2025-12-12 21:29:25.9721+00	2025-12-12 21:29:25.9721+00
614	761fe460	2	\N	Flamboro Skating Club	https://flamboroskatingclub.multiscreensite.com/	t	2025-12-12 21:29:26.116273+00	2025-12-12 21:29:26.116273+00
615	68081e64	2	\N	primaverapeace.org	https://primaverapeace.org	t	2025-12-12 21:29:26.262262+00	2025-12-12 21:29:26.262262+00
616	747081c7	2	\N	www.nynganuniting.church	https://www.nynganuniting.church	t	2025-12-12 21:29:26.413083+00	2025-12-12 21:29:26.413083+00
617	549805e5	2	\N	www.oromoctopastoralcharge.ca	https://www.oromoctopastoralcharge.ca	t	2025-12-12 21:29:26.550904+00	2025-12-12 21:29:26.550904+00
618	32b31c2d	2	\N	United Church, Vermilion	https://vermilionmannvilleunited.multiscreensite.com/	t	2025-12-12 21:29:26.696859+00	2025-12-12 21:29:26.696859+00
619	1bc2fb74	2	\N	crosspointbinghamton.com	https://crosspointbinghamton.com	t	2025-12-12 21:29:26.844352+00	2025-12-12 21:29:26.844352+00
620	6a3aa37d	2	\N	Music At Port Hope United Church	https://www.porthopeunitedchurch.com	t	2025-12-12 21:29:26.987678+00	2025-12-12 21:29:26.987678+00
621	1979fc78	2	\N	Summersville Baptist Church	https://summersvillebaptist_0ld.multiscreensite.com/	t	2025-12-12 21:29:27.131386+00	2025-12-12 21:29:27.131386+00
622	c8185a8b	2	\N	www.christisyourlife.com	https://www.christisyourlife.com	t	2025-12-12 21:29:27.286703+00	2025-12-12 21:29:27.286703+00
623	3a2e35b5	2	\N	3a2e35b5	https://strashuninstitute.multiscreensite.com/	t	2025-12-12 21:29:27.431684+00	2025-12-12 21:29:27.431684+00
624	3eb99a34	2	\N	www.laidlawchurch.ca	https://www.laidlawchurch.ca	t	2025-12-12 21:29:27.578609+00	2025-12-12 21:29:27.578609+00
625	54d3926d	2	\N	www.hbuc.ca	https://www.hbuc.ca	t	2025-12-12 21:29:27.721583+00	2025-12-12 21:29:27.721583+00
626	bb03ec14	2	\N	Emmanuel United Church United Churches	https://www.emmanueluc.com	t	2025-12-12 21:29:27.869619+00	2025-12-12 21:29:27.869619+00
627	23c42888	2	\N	www.myfatherstools.com	https://www.myfatherstools.com	t	2025-12-12 21:29:28.017867+00	2025-12-12 21:29:28.017867+00
628	0b4c0d7c	2	\N	0b4c0d7c	https://msbcmonroe-com.multiscreensite.com/	t	2025-12-12 21:29:28.159269+00	2025-12-12 21:29:28.159269+00
629	c6b3d0d9	2	\N	stpaulsdundas.com	https://stpaulsdundas.com	t	2025-12-12 21:29:28.305364+00	2025-12-12 21:29:28.305364+00
630	0fb3784b	2	\N	0fb3784b	https://edunny_com.multiscreensite.com/	t	2025-12-12 21:29:28.448365+00	2025-12-12 21:29:28.448365+00
631	791af85b	2	\N	791af85b	https://callawaychristianchurch_old.multiscreensite.com/	t	2025-12-12 21:29:28.621664+00	2025-12-12 21:29:28.621664+00
632	e56d0e8c	2	\N	articulatetruth.com	https://articulatetruth.com	t	2025-12-12 21:29:28.771821+00	2025-12-12 21:29:28.771821+00
\.


--
-- Data for Name: trials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.trials (id, client_id, site_id, email, site_name, trial_start, trial_expiry, has_paid, has_publish_access, upgraded_at, created_at, updated_at) FROM stdin;
1	3	644	info@grace.com	5bfa6148	2025-12-13 01:24:59.012+00	2025-12-27 01:24:59.012+00	f	f	\N	2025-12-13 01:24:59.035667+00	2025-12-13 01:24:59.035667+00
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 1, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clients_id_seq', 3, true);


--
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sites_id_seq', 645, true);


--
-- Name: trials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.trials_id_seq', 1, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: sites sites_site_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_site_name_key UNIQUE (site_name);


--
-- Name: trials trials_email_site_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trials
    ADD CONSTRAINT trials_email_site_name_key UNIQUE (email, site_name);


--
-- Name: trials trials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trials
    ADD CONSTRAINT trials_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: idx_clients_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clients_email ON public.clients USING btree (email);


--
-- Name: idx_sites_client_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sites_client_id ON public.sites USING btree (client_id);


--
-- Name: idx_trials_email_site; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_trials_email_site ON public.trials USING btree (email, site_name);


--
-- Name: idx_trials_site_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_trials_site_id ON public.trials USING btree (site_id);


--
-- Name: sites sites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: trials trials_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trials
    ADD CONSTRAINT trials_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: trials trials_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trials
    ADD CONSTRAINT trials_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict FiDknuwaEmyRbGfIdzhdvFIQnYHCeRIIbX2e4ZCpyl60xTybe3jW816EMaF0Mub

