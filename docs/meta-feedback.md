# Meta Product Feedback — Personal Draft

This form asks for feedback from the builder's own experience. Do not submit a first-person claim below unless it is true for you. Add concrete examples from products you personally used, and remove any items that do not match your experience.

## Experience to describe

- Which Meta products did you use while building TraceX? (For example, Meta Model API / Muse Spark, Muse Code, or another product.)
- What task did you try, and what worked well?
- What was confusing or slow? Include the step or screen where it happened.
- Did you use the API in the running product, or only during development?
- What should Meta improve for developers in your region?

## Application facts you can reference

TraceX's backend contains a Muse Spark integration through the Meta Model API. It sends a bounded blockchain graph and deterministic findings to request an explanation. The prompt asks for evidence-grounded answers, but this does not guarantee correctness. The app can show a matching transaction citation in its evidence UI.

The same features also run on Muse Spark Open (Meta's open-weights model) through Fireworks AI and Baseten; both were configured and tested on 2 Nov 2026. Things you could mention if they match your experience: both partners served `muse-spark-open` but no Llama models on these accounts; Muse Spark models spend reasoning tokens before answering, so a small `max_tokens` budget returned no text at all until it was raised; and response times differed a lot between hosts for the same model (about 8 s on Baseten vs 30 s on Fireworks for the same brief).

Also new on 2 Nov: Muse Spark vision read a wrapped 66-character transaction hash from a phone screenshot exactly, where Muse Spark Open on the partners dropped characters; and Muse Voice Transcribe took a 16 kHz WAV and accepted "Nigerian Pidgin" as a `languageBias` - but the docs do not list supported languages or say whether Igbo, Yoruba and Hausa are supported, and the endpoint only takes WAV, so browser recordings have to be re-encoded first.

## Optional structure

1. **What I tried:** [Describe the product and task you personally completed.]
2. **What worked:** [Give one concrete example.]
3. **What could improve:** [Describe the friction and its impact.]
4. **Suggestion:** [Offer one actionable product change.]
