# Feedback from your experience using Meta products - TraceX AI

We built TraceX AI entirely with Meta ecosystem and loved experience but want to share candid feedback:

What We Loved:
1. Meta AI Desktop App as IDE Assistant is powerful: Using Meta AI as coding partner inside our actual project folder (/Applications/WEBSITE/TraceX) accelerated us from idea to architecture to code in hours. It understood blockchain + AI vision and suggested right stack (Next.js + Python FastAPI + Llama).
2. Muse Spark / Llama via Meta Model API is incredibly capable for evidence-backed reasoning: Prompting with structured JSON and forcing citation produced accurate hallucination-free explanations - critical for financial investigations. Standard mode pricing fair for hackathon building.
3. Muse Code agentic coding: Helped plan multi-step tasks like building React Flow graph components and Python heuristics engine. Felt like senior engineer pair-programming.

Pain Points & Suggestions:
1. Files/Finder Integration is Difficult to Discover and Enable: This was biggest friction. We wanted to point Meta AI to generate code directly into /Applications/WEBSITE/TraceX, but Files connection is hidden under Settings -> Apps -> Files, not in System Settings. Error message says user has not connected Files but doesn't guide new users. We wasted time thinking it was macOS permission issue. Suggestion: Add onboarding tooltip in chat when user mentions local path like /Applications/... - auto-prompt Do you want to connect your files? Here's how. Also allow connecting directly from approval card, not just Settings.
2. Folder Linking & Write Approval Flow: When writing many files (package.json, components), each write needs individual approval, and JSON files with double quotes sometimes fail to write due to escaping, forcing us to use generator scripts (generate-package.js). Suggestion: Batch approvals for scaffolding a project folder, and fix JSON escaping for package.json writes.
3. API Credits & Model Discovery: $150 credits generous, but discovering which model to use (Spark vs Wonder vs Glimmer) and geographic availability confusing. We are in Nigeria and had to check Model API Geographic Use Policy separately. Suggestion: Show credits usage real-time inside Meta AI chat, and suggest best model for task (e.g., For evidence-backed report, use Llama 3.3 70B).
4. Documentation Gap for Multi-Model Pipelines: Docs show how to call one model, but not best practices for chaining deterministic data -> heuristics -> Llama reasoning with citation enforcement. Suggestion: Add hackathon recipe: Evidence-backed AI pattern - how to prevent hallucination with structured data.

Overall: Despite friction, Meta AI products enabled us to build TraceX AI - platform that would normally need team of 5 and months - in 10 days. Combination of Meta AI chat + Muse Code + Llama API is superpower for indie hackers. Fixing Files onboarding would make it 10x better. We must win this hackathon!
