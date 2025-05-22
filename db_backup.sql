--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2025-05-22 21:20:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- TOC entry 222 (class 1259 OID 16432)
-- Name: detekt_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detekt_results (
    id integer NOT NULL,
    project_id integer,
    detekt_xml text NOT NULL,
    detected_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.detekt_results OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16431)
-- Name: detekt_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detekt_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detekt_results_id_seq OWNER TO postgres;

--
-- TOC entry 4877 (class 0 OID 0)
-- Dependencies: 221
-- Name: detekt_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detekt_results_id_seq OWNED BY public.detekt_results.id;


--
-- TOC entry 220 (class 1259 OID 16417)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    user_id integer,
    name character varying(255) NOT NULL,
    url text NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16416)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- TOC entry 4880 (class 0 OID 0)
-- Dependencies: 219
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- TOC entry 218 (class 1259 OID 16406)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16405)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4883 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4708 (class 2604 OID 16435)
-- Name: detekt_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detekt_results ALTER COLUMN id SET DEFAULT nextval('public.detekt_results_id_seq'::regclass);


--
-- TOC entry 4706 (class 2604 OID 16420)
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- TOC entry 4705 (class 2604 OID 16409)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4870 (class 0 OID 16432)
-- Dependencies: 222
-- Data for Name: detekt_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detekt_results (id, project_id, detekt_xml, detected_at) FROM stdin;
1	1	<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="4.3">\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/PokemonGoApp.kt">\n\t<error line="15" column="36" severity="warning" message="The class or object PokemonGoApp is empty." source="detekt.EmptyClassBlock" />\n\t<error line="24" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/PokemonGoApp.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/CustomFragmentFactory.kt">\n\t<error line="13" column="28" severity="warning" message="An empty default constructor can be removed." source="detekt.EmptyDefaultConstructor" />\n\t<error line="20" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/CustomFragmentFactory.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRepositoryImpl.kt">\n\t<error line="68" column="22" severity="warning" message="The caught exception is too generic. Prefer catching specific exceptions to the case that is currently handled." source="detekt.TooGenericExceptionCaught" />\n\t<error line="88" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRepositoryImpl.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="86" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="86" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/androidTest/java/com/hi/dhl/pokemon/ExampleInstrumentedTest.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/androidTest/java/com/hi/dhl/pokemon/ExampleInstrumentedTest.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/AppHelper.kt">\n\t<error line="18" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/AppHelper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/ListingResponse.kt">\n\t<error line="30" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/ListingResponse.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/NetWorkPokemonInfo.kt">\n\t<error line="43" column="1" severity="warning" message="Line detected, which is longer than the defined maximum line length in the code style." source="detekt.MaxLineLength" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/PokemonEntity.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/PokemonEntity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/RemoteKeysEntity.kt">\n\t<error line="19" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/RemoteKeysEntity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/AppDataBase.kt">\n\t<error line="19" column="5" severity="warning" message="Array literals [...] should be preferred as they are more readable than `arrayOf(...)` expressions." source="detekt.UseArrayLiteralsInAnnotations" />\n\t<error line="22" column="17" severity="warning" message="Array literals [...] should be preferred as they are more readable than `arrayOf(...)` expressions." source="detekt.UseArrayLiteralsInAnnotations" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/LocalTypeConverter.kt">\n\t<error line="34" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/LocalTypeConverter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonDao.kt">\n\t<error line="31" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonInfoDao.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonInfoDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/RemoteKeysDao.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/RemoteKeysDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Entity2ItemModelMapper.kt">\n\t<error line="18" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Entity2ItemModelMapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/InfoEntity2InfoModelMapper.kt">\n\t<error line="71" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/InfoEntity2InfoModelMapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Mapper.kt">\n\t<error line="12" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Mapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/PokemonFactory.kt">\n\t<error line="48" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/PokemonFactory.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/remote/PokemonService.kt">\n\t<error line="25" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/remote/PokemonService.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRemoteMediator.kt">\n\t<error line="31" column="26" severity="warning" message="Function load has 6 return statements which exceeds the limit of 2." source="detekt.ReturnCount" />\n\t<error line="149" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRemoteMediator.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="144" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n\t<error line="145" column="21" severity="warning" message="remotePokemon can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/Repository.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/Repository.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RepositoryModule.kt">\n\t<error line="33" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RepositoryModule.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RoomModule.kt">\n\t<error line="58" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RoomModule.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ext/ContextExt.kt">\n\t<error line="30" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ext/ContextExt.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/init/AppInitializer.kt">\n\t<error line="35" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/init/AppInitializer.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonInfoModel.kt">\n\t<error line="66" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonInfoModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="27" column="73" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="28" column="71" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonItemModel.kt">\n\t<error line="36" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonItemModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/binding/ViewBinding.kt">\n\t<error line="88" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/binding/ViewBinding.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="39" column="14" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="39" column="19" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/AlbumAdapter.kt">\n\t<error line="39" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/AlbumAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailActivity.kt">\n\t<error line="72" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailActivity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="30" column="17" severity="warning" message="Private property `mViewModel` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="66" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="66" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n\t<error line="67" column="21" severity="warning" message="KEY_LIST_MODEL can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailsFragment.kt">\n\t<error line="96" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailsFragment.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="29" column="23" severity="warning" message="Private property `args` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="82" column="21" severity="warning" message="KEY_LIST_MODEL can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailViewModel.kt">\n\t<error line="121" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailViewModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="5" column="1" severity="warning" message="androidx.lifecycle.* is a wildcard import. Replace it with fully qualified imports." source="detekt.WildcardImport" />\n\t<error line="118" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="118" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/FooterAdapter.kt">\n\t<error line="41" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/FooterAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/NetworkStateItemViewHolder.kt">\n\t<error line="39" column="6" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/NetworkStateItemViewHolder.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainActivity.kt">\n\t<error line="82" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainActivity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="68" column="27" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainViewModel.kt">\n\t<error line="87" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainViewModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="15" column="1" severity="warning" message="kotlinx.coroutines.flow.* is a wildcard import. Replace it with fully qualified imports." source="detekt.WildcardImport" />\n\t<error line="44" column="19" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="62" column="28" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/PokemonAdapter.kt">\n\t<error line="56" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/PokemonAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/utils/CollapsibleToolbar.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/utils/CollapsibleToolbar.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/test/java/com/hi/dhl/pokemon/ExampleUnitTest.kt">\n\t<error line="17" column="2" severity="warning" message="The file /data/repo/app/src/test/java/com/hi/dhl/pokemon/ExampleUnitTest.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/buildSrc/build.gradle.kts">\n\t<error line="7" column="2" severity="warning" message="The file /data/repo/buildSrc/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/buildSrc/src/main/java/com/hi/dhl/plugin/BuildConfig.kt">\n\t<error line="17" column="2" severity="warning" message="The file /data/repo/buildSrc/src/main/java/com/hi/dhl/plugin/BuildConfig.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n</checkstyle>	2025-05-20 01:41:20.774166
2	1	<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="4.3">\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/PokemonGoApp.kt">\n\t<error line="15" column="36" severity="warning" message="The class or object PokemonGoApp is empty." source="detekt.EmptyClassBlock" />\n\t<error line="24" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/PokemonGoApp.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/CustomFragmentFactory.kt">\n\t<error line="13" column="28" severity="warning" message="An empty default constructor can be removed." source="detekt.EmptyDefaultConstructor" />\n\t<error line="20" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/CustomFragmentFactory.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRepositoryImpl.kt">\n\t<error line="68" column="22" severity="warning" message="The caught exception is too generic. Prefer catching specific exceptions to the case that is currently handled." source="detekt.TooGenericExceptionCaught" />\n\t<error line="88" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRepositoryImpl.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="86" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="86" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/androidTest/java/com/hi/dhl/pokemon/ExampleInstrumentedTest.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/androidTest/java/com/hi/dhl/pokemon/ExampleInstrumentedTest.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/AppHelper.kt">\n\t<error line="18" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/AppHelper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/ListingResponse.kt">\n\t<error line="30" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/ListingResponse.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/NetWorkPokemonInfo.kt">\n\t<error line="43" column="1" severity="warning" message="Line detected, which is longer than the defined maximum line length in the code style." source="detekt.MaxLineLength" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/PokemonEntity.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/PokemonEntity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/RemoteKeysEntity.kt">\n\t<error line="19" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/entity/RemoteKeysEntity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/AppDataBase.kt">\n\t<error line="19" column="5" severity="warning" message="Array literals [...] should be preferred as they are more readable than `arrayOf(...)` expressions." source="detekt.UseArrayLiteralsInAnnotations" />\n\t<error line="22" column="17" severity="warning" message="Array literals [...] should be preferred as they are more readable than `arrayOf(...)` expressions." source="detekt.UseArrayLiteralsInAnnotations" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/LocalTypeConverter.kt">\n\t<error line="34" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/LocalTypeConverter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonDao.kt">\n\t<error line="31" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonInfoDao.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/PokemonInfoDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/RemoteKeysDao.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/local/RemoteKeysDao.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Entity2ItemModelMapper.kt">\n\t<error line="18" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Entity2ItemModelMapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/InfoEntity2InfoModelMapper.kt">\n\t<error line="71" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/InfoEntity2InfoModelMapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Mapper.kt">\n\t<error line="12" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/mapper/Mapper.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/PokemonFactory.kt">\n\t<error line="48" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/PokemonFactory.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/remote/PokemonService.kt">\n\t<error line="25" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/remote/PokemonService.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRemoteMediator.kt">\n\t<error line="31" column="26" severity="warning" message="Function load has 6 return statements which exceeds the limit of 2." source="detekt.ReturnCount" />\n\t<error line="149" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/PokemonRemoteMediator.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="144" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n\t<error line="145" column="21" severity="warning" message="remotePokemon can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/Repository.kt">\n\t<error line="22" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/data/repository/Repository.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RepositoryModule.kt">\n\t<error line="33" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RepositoryModule.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RoomModule.kt">\n\t<error line="58" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/di/RoomModule.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ext/ContextExt.kt">\n\t<error line="30" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ext/ContextExt.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/init/AppInitializer.kt">\n\t<error line="35" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/init/AppInitializer.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonInfoModel.kt">\n\t<error line="66" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonInfoModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="27" column="73" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="28" column="71" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonItemModel.kt">\n\t<error line="36" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/model/PokemonItemModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/binding/ViewBinding.kt">\n\t<error line="88" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/binding/ViewBinding.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="39" column="14" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="39" column="19" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/AlbumAdapter.kt">\n\t<error line="39" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/AlbumAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailActivity.kt">\n\t<error line="72" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailActivity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="30" column="17" severity="warning" message="Private property `mViewModel` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="66" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="66" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n\t<error line="67" column="21" severity="warning" message="KEY_LIST_MODEL can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailsFragment.kt">\n\t<error line="96" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailsFragment.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="29" column="23" severity="warning" message="Private property `args` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="82" column="21" severity="warning" message="KEY_LIST_MODEL can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailViewModel.kt">\n\t<error line="121" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/detail/DetailViewModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="5" column="1" severity="warning" message="androidx.lifecycle.* is a wildcard import. Replace it with fully qualified imports." source="detekt.WildcardImport" />\n\t<error line="118" column="21" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n\t<error line="118" column="21" severity="warning" message="TAG can be a `const val`." source="detekt.MayBeConst" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/FooterAdapter.kt">\n\t<error line="41" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/FooterAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/NetworkStateItemViewHolder.kt">\n\t<error line="39" column="6" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/footer/NetworkStateItemViewHolder.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainActivity.kt">\n\t<error line="82" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainActivity.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="68" column="27" severity="warning" message="Private property `TAG` is unused." source="detekt.UnusedPrivateProperty" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainViewModel.kt">\n\t<error line="87" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/MainViewModel.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n\t<error line="15" column="1" severity="warning" message="kotlinx.coroutines.flow.* is a wildcard import. Replace it with fully qualified imports." source="detekt.WildcardImport" />\n\t<error line="44" column="19" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="62" column="28" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/PokemonAdapter.kt">\n\t<error line="56" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/ui/main/PokemonAdapter.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/main/java/com/hi/dhl/pokemon/utils/CollapsibleToolbar.kt">\n\t<error line="27" column="2" severity="warning" message="The file /data/repo/app/src/main/java/com/hi/dhl/pokemon/utils/CollapsibleToolbar.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/app/src/test/java/com/hi/dhl/pokemon/ExampleUnitTest.kt">\n\t<error line="17" column="2" severity="warning" message="The file /data/repo/app/src/test/java/com/hi/dhl/pokemon/ExampleUnitTest.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/buildSrc/build.gradle.kts">\n\t<error line="7" column="2" severity="warning" message="The file /data/repo/buildSrc/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/buildSrc/src/main/java/com/hi/dhl/plugin/BuildConfig.kt">\n\t<error line="17" column="2" severity="warning" message="The file /data/repo/buildSrc/src/main/java/com/hi/dhl/plugin/BuildConfig.kt is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n</checkstyle>	2025-05-20 01:50:09.578294
3	2	<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="4.3">\n</checkstyle>	2025-05-20 23:27:26.312215
4	3	<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="4.3">\n<file name="/data/repo/app/src/main/kotlin/com/skydoves/pokedex/utils/PokemonTypeUtils.kt">\n\t<error line="23" column="7" severity="warning" message="The function getTypeColor appears to be too complex based on Cyclomatic Complexity (complexity: 19). Defined complexity threshold for methods is set to &apos;15&apos;" source="detekt.CyclomaticComplexMethod" />\n</file>\n<file name="/data/repo/core-database/src/main/kotlin/com/skydoves/pokedex/core/database/PokemonDao.kt">\n\t<error line="32" column="30" severity="warning" message="Function parameter names should match the pattern: [a-z][A-Za-z0-9]*" source="detekt.FunctionParameterNaming" />\n\t<error line="35" column="33" severity="warning" message="Function parameter names should match the pattern: [a-z][A-Za-z0-9]*" source="detekt.FunctionParameterNaming" />\n</file>\n<file name="/data/repo/core-database/src/main/kotlin/com/skydoves/pokedex/core/database/PokemonInfoDao.kt">\n\t<error line="32" column="30" severity="warning" message="Function parameter names should match the pattern: [a-z][A-Za-z0-9]*" source="detekt.FunctionParameterNaming" />\n</file>\n<file name="/data/repo/core-model/src/main/kotlin/com/skydoves/pokedex/core/model/PokemonInfo.kt">\n\t<error line="39" column="31" severity="warning" message="String.format(&quot;#%03d&quot;, id) uses implicitly default locale for string formatting." source="detekt.ImplicitDefaultLocale" />\n\t<error line="40" column="35" severity="warning" message="String.format(&quot;%.1f KG&quot;, weight.toFloat() / 10) uses implicitly default locale for string formatting." source="detekt.ImplicitDefaultLocale" />\n\t<error line="41" column="35" severity="warning" message="String.format(&quot;%.1f M&quot;, height.toFloat() / 10) uses implicitly default locale for string formatting." source="detekt.ImplicitDefaultLocale" />\n\t<error line="40" column="79" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="41" column="78" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/build.gradle.kts">\n\t<error line="80" column="1" severity="warning" message="Line detected, which is longer than the defined maximum line length in the code style." source="detekt.MaxLineLength" />\n</file>\n<file name="/data/repo/app/src/main/kotlin/com/skydoves/pokedex/binding/RecyclerViewBinding.kt">\n\t<error line="53" column="19" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/kotlin/com/skydoves/pokedex/binding/ViewBinding.kt">\n\t<error line="181" column="30" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="182" column="31" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="184" column="32" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="185" column="27" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="186" column="31" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/app/src/main/kotlin/com/skydoves/pokedex/utils/SpacesItemDecoration.kt">\n\t<error line="32" column="22" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/benchmark/src/main/kotlin/com/github/skydoves/benchmark/BaselineProfileGenerator.kt">\n\t<error line="62" column="78" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n\t<error line="68" column="63" severity="warning" message="This expression contains a magic number. Consider defining it to a well named constant." source="detekt.MagicNumber" />\n</file>\n<file name="/data/repo/buildSrc/build.gradle.kts">\n\t<error line="7" column="2" severity="warning" message="The file /data/repo/buildSrc/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/core-database/build.gradle.kts">\n\t<error line="67" column="2" severity="warning" message="The file /data/repo/core-database/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/core-model/build.gradle.kts">\n\t<error line="35" column="2" severity="warning" message="The file /data/repo/core-model/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/core-test/build.gradle.kts">\n\t<error line="31" column="2" severity="warning" message="The file /data/repo/core-test/build.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n<file name="/data/repo/settings.gradle.kts">\n\t<error line="116" column="22" severity="warning" message="The file /data/repo/settings.gradle.kts is not ending with a new line." source="detekt.NewLineAtEndOfFile" />\n</file>\n</checkstyle>	2025-05-20 23:30:31.155912
\.


--
-- TOC entry 4868 (class 0 OID 16417)
-- Dependencies: 220
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, user_id, name, url, submitted_at) FROM stdin;
1	4	PokemonGo	https://github.com/hi-dhl/PokemonGo	2025-05-20 01:41:10.027807
2	4	DWBI-frontend	https://github.com/LaurentiuALI/DWBI-frontend	2025-05-20 23:26:58.20701
3	4	Pokedex	https://github.com/skydoves/Pokedex	2025-05-20 23:30:15.805999
\.


--
-- TOC entry 4866 (class 0 OID 16406)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password) FROM stdin;
1	ionut	$2b$10$sC8ok.eyH.DsdQLHLOY0Zepaq.QtSMZc6.PX7BF0yP5aDOfenSxPu
2	test	$2b$10$aOoK75/MIHiDV/ecGFVpp.TVaB93pO2/OOnlldbRDkTkO1vBkFS/6
3	sorin	$2b$10$YmSnMhUDCTMB7dXSFN7VJO973d53ML1GkWJLa.LZbydFusrqH.1SW
4	test3	$2b$10$R8yG1eoEejfaJ3jKxMnMfOrt/aYuEgJ4ISzec6cJxq05YkzhCuOWi
5	test123	$2a$10$ekmcZWiAQvRca80SFPMyw.TI3EH7/wL7gXuCoDoVbC9KWkBe8olh.
6	qwerty	$2a$10$Q0wammivghjJMz.0pXdSMeuHjScl4mKrTgGVLb4tqFtEWTEWNoLDu
7	aaaaaaaaaa	$2a$10$S86RoYmqCcNrFM6KKtIcSO1Jdh9RR4u30OHd2exQYDf5AB9IKnyqq
\.


--
-- TOC entry 4885 (class 0 OID 0)
-- Dependencies: 221
-- Name: detekt_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detekt_results_id_seq', 4, true);


--
-- TOC entry 4886 (class 0 OID 0)
-- Dependencies: 219
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 3, true);


--
-- TOC entry 4887 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- TOC entry 4717 (class 2606 OID 16440)
-- Name: detekt_results detekt_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detekt_results
    ADD CONSTRAINT detekt_results_pkey PRIMARY KEY (id);


--
-- TOC entry 4715 (class 2606 OID 16425)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4711 (class 2606 OID 16413)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4713 (class 2606 OID 16415)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4719 (class 2606 OID 16441)
-- Name: detekt_results detekt_results_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detekt_results
    ADD CONSTRAINT detekt_results_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4718 (class 2606 OID 16426)
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE detekt_results; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.detekt_results TO dissertation_user;


--
-- TOC entry 4878 (class 0 OID 0)
-- Dependencies: 221
-- Name: SEQUENCE detekt_results_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.detekt_results_id_seq TO dissertation_user;


--
-- TOC entry 4879 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT INSERT ON TABLE public.projects TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.projects TO dissertation_user;
GRANT INSERT ON TABLE public.projects TO pg_write_all_data;


--
-- TOC entry 4881 (class 0 OID 0)
-- Dependencies: 219
-- Name: SEQUENCE projects_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.projects_id_seq TO dissertation_user;


--
-- TOC entry 4882 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO dissertation_user;


--
-- TOC entry 4884 (class 0 OID 0)
-- Dependencies: 217
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO dissertation_user;


-- Completed on 2025-05-22 21:20:50

--
-- PostgreSQL database dump complete
--

