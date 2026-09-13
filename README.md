# HackMatch

An AI-powered teammate recommender for hackathons — built because finding a team at our last hackathon was pure luck: scrolling through huge participant lists, reading everyone's skills manually, messaging people one by one, and losing good candidates to whoever moved faster. HackMatch actually recommends who you should team up with, instead of making you browse and guess.

> **Branch note:** this branch contains the backend (recommender + agent + API). The frontend (built in Bilt) connects to it via a configured API base URL — see "Connecting the frontend" below.

## The problem

At a typical hackathon, there's no real process for finding teammates — just a list of names and skills you have to sift through yourself. By the time you find someone who's actually a good fit, they've often already joined another team. There's no visibility into who's still looking, no way to see if a team's skill gaps match what you offer, and no structured way to reach out and have a real conversation before committing.

## What HackMatch does

- Participants fill out a profile (skills, interests, what they're looking for) after confirming an admin-sent invite
- An AI recommender ranks potential teammates for each person, with a plain-language explanation for every match
- If someone already has teammates, the system recommends based on what the *whole team* is missing, not just one person's preferences
- Users can send team-up requests (with an optional note), chat directly before committing, and browse/click into anyone's profile from shared channels
- Admins get a live dashboard of how many participants are unmatched, partially grouped, or in complete teams, plus a customizable profile-question builder

## How the recommender works

Two signals combine into every match score:
- **Skill complementarity** — direct comparison of what someone has vs. what a candidate wants, and vice versa (exact matching on structured tags)
- **Semantic similarity** — bios and interests are converted into embeddings via OpenAI's embeddings API and compared using cosine similarity, catching good matches even when people describe things in completely different words

These combine into a single ranked score. A separate AI agent call then generates a specific, one-sentence explanation for each match (e.g. "You want a designer, they know Figma and want to build in health-tech").

If a user is part of a group, the same scoring runs against a *synthetic group profile* — the union of the team's skills and interests, with the gap calculated as what they're still missing collectively — so recommendations reflect the team's real needs, not just one member's.

No part of this system is trained on historical data — there isn't any yet, since this is a fresh hackathon project. The embedding model is pretrained (used, not trained, by this project), and the skill-matching and scoring logic is hand-written.

## Architecture
