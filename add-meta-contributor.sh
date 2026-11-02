#!/bin/bash
# Add Meta AI as co-authored contributor like Claude and Copilot auto-appeared
# Builder: Okokoh Benjamin - TraceX AI - Built for Meta AI Developer Hackathon 2026
# Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence.

cd /Applications/WEBSITE/TraceX

echo "Adding Meta AI as contributor (like Claude and Copilot auto-appeared)..."

# Stage README which already credits Meta AI as starter
git add README.md

# Create empty commit with Co-authored-by trailers - this makes GitHub auto-show Meta AI as contributor
git commit --allow-empty -m "Credit Meta AI as project starter - architecture and Meta AI model Llama 3.3 (Meta AI model) integration

TraceX AI was started in /Applications/WEBSITE/TraceX using Meta AI desktop app and Muse Code.
Meta AI helped scaffold Next.js frontend, Express backend, Python analysis-engine,
and integration of Meta AI model Llama 3.3 70B Instruct (Meta AI model) via Meta Model API + Fireworks + Baseten + Modal.

Builder: Okokoh Benjamin
Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.
For: https://cerebralvalley.ai/e/meta-ai-developer-hackathon

Co-authored-by: Meta AI <meta-ai@meta.com>
Co-authored-by: Okokoh Benjamin <ekumahost@gmail.com>
Co-authored-by: Claude <noreply@anthropic.com>" -m "Co-authored-by: Copilot <copilot@github.com>"

echo ""
echo "Now pushing to https://github.com/ekumahost/TraceX..."
git push origin main

echo ""
echo "Done! Check https://github.com/ekumahost/TraceX/commits/main"
echo "Meta AI should now appear as co-author like Claude and Copilot did."
