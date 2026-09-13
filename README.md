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

- **Frontend** — built in Bilt, a mobile-responsive app covering invite confirmation, profile creation, the recommendation feed, team-up requests with chat, group creation/joining, channels, and the admin dashboard.
- **Backend** (this branch) — a separate Python/FastAPI service handling all matching logic, profile/group storage, and the AI agent layer. Deployed independently on Render; the frontend calls it over a configured base URL.

## Tech stack

- **Frontend:** Bilt (React Native / Expo)
- **Backend:** Python, FastAPI
- **AI:** OpenAI API — `text-embedding-3-small` for semantic similarity, `gpt-4o-mini` for match explanations and agent orchestration
- **Deployment:** Render (backend), Bilt's hosting (frontend)
- **Storage:** in-memory / JSON (hackathon-scoped; swappable for a real database)


## Backend setup

```bash
git clone <this-repo-url>
git checkout <this-branch-name>
cd <repo-folder>
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then add your real OPENAI_API_KEY
uvicorn main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs.

### Environment variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required for embeddings, explanations, and agent tool calls |
| `PORT` | Set automatically by the deploy platform; defaults to 8000 locally |

**Never commit your real `.env` file** — only `.env.example` (placeholder values) should be tracked in git.

## Backend deployment (Render)

- **Runtime:** Python 3
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add `OPENAI_API_KEY` under the service's Environment settings in Render's dashboard.
- When connecting Render to this repo, set the deploy branch to this branch, not `main`, unless it's been merged.

## Connecting the frontend

In Bilt's project settings, set the API base URL field to your deployed backend's URL (e.g. `https://hackmatch-backend.onrender.com`, no trailing slash). The frontend reads this as `EXPO_PUBLIC_API_BASE_URL` and directs all API calls there.

## API reference (backend)

### Health
- `GET /health`

### Invitation
- `POST /invite/confirm` — `{code}` → confirms invite, returns identity

### Profiles
- `POST /profiles` — create/update
- `GET /profiles/{user_id}` — fetch
- `PATCH /profiles/{user_id}` — partial update

### Recommendations
- `GET /recommendations/{user_id}` — ranked, explained matches (individual or group-aware)

### Team-up requests
- `POST /invite` — send a request, optional `note`
- `GET /invites?user_id=...` — list requests (incoming/outgoing/declined)
- `POST /invite/{invite_id}/respond` — accept/decline; returns HTTP 409 + `sender_already_grouped` if the sender already joined another team
- `GET/POST /invite/{invite_id}/messages` — 1:1 chat tied to a request

### Groups
- `POST /group/create` — `{user_id, name}` → creates group + join code
- `POST /group/invite` — invite someone to a group
- `POST /group/invite/{invite_id}/respond` — accept/decline
- `GET /groups/{group_id}/members` — roster
- `POST /team/gaps` — what skills a group is missing

### Channels
- `GET /channels?user_id=...`
- `GET/POST /channels/{channel_id}/messages`

### Admin
- `GET/POST /admin/form-schema` — customizable profile questions
- `GET /admin/teams/summary` — `{no_group, partial, complete}` counts
- `GET /admin/teams` — team list + ungrouped participants
- `GET /admin/analytics`
- `POST /channels` — create an admin channel

### Internal (used by the recommender pipeline)
- `POST /embeddings`
- `POST /recommendation-explanations`

## Team

Built in 2 days for [hackathon name] by [your names/handles].

## Notes

- Built under hackathon time constraints — data storage is in-memory/JSON, not a production database, and there's no authentication system beyond invite tokens and `user_id`s.
- Free-tier deployment (Render) spins down after inactivity; the first request after idle time may take 30-60 seconds.
- No matching logic is trained on historical data — there isn't any yet. A natural next step, as the platform gets used, would be incorporating accept/decline outcomes to improve ranking over time.

## Architecture
