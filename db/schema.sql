--
--

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

--
--

--
--

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: identity_commitment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_commitment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    validation_group_id uuid NOT NULL,
    commitment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: portfolio_company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_company (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    domain text,
    year integer,
    program text,
    location text,
    industries text,
    description text,
    image_url text,
    linkedin_url text,
    twitter_url text,
    crunchbase_url text,
    batch text,
    source text DEFAULT 'techstars'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vc_id uuid NOT NULL,
    validation_group_id uuid NOT NULL,
    nullifier text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: validation_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_group (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    website text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: validation_group_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_group_member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    validation_group_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_name text,
    logo_url text,
    linkedin_url text,
    city text,
    country text,
    industry_vertical text[],
    program_names text[],
    first_session_year integer,
    founded_year integer,
    worldregion text,
    worldsubregion text,
    is_exit boolean DEFAULT false,
    is_unicorn boolean DEFAULT false
);

--
-- Name: vc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    website text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    linkedin text
);

--
-- Name: identity_commitment identity_commitment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_commitment
    ADD CONSTRAINT identity_commitment_pkey PRIMARY KEY (id);

--
-- Name: identity_commitment identity_commitment_validation_group_id_commitment_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_commitment
    ADD CONSTRAINT identity_commitment_validation_group_id_commitment_key UNIQUE (validation_group_id, commitment);

--
-- Name: portfolio_company portfolio_company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_company
    ADD CONSTRAINT portfolio_company_pkey PRIMARY KEY (id);

--
-- Name: review review_nullifier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_nullifier_key UNIQUE (nullifier);

--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);

--
-- Name: validation_group_member validation_group_member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_group_member
    ADD CONSTRAINT validation_group_member_pkey PRIMARY KEY (id);

--
-- Name: validation_group_member validation_group_member_validation_group_id_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_group_member
    ADD CONSTRAINT validation_group_member_validation_group_id_domain_key UNIQUE (validation_group_id, domain);

--
-- Name: validation_group validation_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_group
    ADD CONSTRAINT validation_group_pkey PRIMARY KEY (id);

--
-- Name: vc vc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vc
    ADD CONSTRAINT vc_pkey PRIMARY KEY (id);

--
-- Name: identity_commitment_commitment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_commitment_commitment_idx ON public.identity_commitment USING btree (commitment);

--
-- Name: identity_commitment_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_commitment_group_idx ON public.identity_commitment USING btree (validation_group_id);

--
-- Name: idx_portfolio_company_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_company_source ON public.portfolio_company USING btree (source);

--
-- Name: idx_portfolio_company_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_company_year ON public.portfolio_company USING btree (year);

--
-- Name: idx_review_nullifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_nullifier ON public.review USING btree (nullifier);

--
-- Name: idx_review_vc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_vc_id ON public.review USING btree (vc_id);

--
-- Name: idx_validation_group_member_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validation_group_member_company_name ON public.validation_group_member USING btree (company_name);

--
-- Name: idx_validation_group_member_session_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validation_group_member_session_year ON public.validation_group_member USING btree (first_session_year);

--
-- Name: validation_group_member_domain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX validation_group_member_domain_idx ON public.validation_group_member USING btree (domain);

--
-- Name: identity_commitment identity_commitment_validation_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_commitment
    ADD CONSTRAINT identity_commitment_validation_group_id_fkey FOREIGN KEY (validation_group_id) REFERENCES public.validation_group(id) ON DELETE CASCADE;

--
-- Name: review review_validation_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_validation_group_id_fkey FOREIGN KEY (validation_group_id) REFERENCES public.validation_group(id);

--
-- Name: review review_vc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_vc_id_fkey FOREIGN KEY (vc_id) REFERENCES public.vc(id) ON DELETE CASCADE;

--
-- Name: validation_group_member validation_group_member_validation_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_group_member
    ADD CONSTRAINT validation_group_member_validation_group_id_fkey FOREIGN KEY (validation_group_id) REFERENCES public.validation_group(id) ON DELETE CASCADE;

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

--
--

