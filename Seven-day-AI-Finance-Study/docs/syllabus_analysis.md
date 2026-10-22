# Analysis: AI Systems & Finance Syllabus

[Source document](file:///home/ovebepari/Codes/Seven-day-AI-Finance-Study/AI%20Systems%20%26%20Finance%20Syllabus.md)

---

## 📋 Document Overview

This is a **75KB, 686-line Gemini conversation export** that captures a fully interactive study planning session. It's structured as a **7-Day Intensive Bootcamp** targeting a DevOps/SRE professional (4+ YOE) who wants to break into AI Engineering / MLOps while simultaneously picking up financial literacy.

| Metric | Value |
|---|---|
| **Total study time** | ~60–70 hrs core, ~80+ hrs with bonuses |
| **Daily commitment** | 8–10 hrs/day (core) or 10–12 hrs/day (with bonuses) |
| **Split** | 80% AI Systems / 20% Finance |
| **Target hardware** | i5-1135G7, 32GB DDR4 (local) + Vast.ai spot GPUs (cloud) |

---

## 🏗️ Structure & Sections

The document contains **7 distinct sections** accumulated through an iterative conversation:

| # | Section | Lines | Purpose |
|---|---|---|---|
| 1 | **Core 7-Day Syllabus** | 1–98 | The main day-by-day study plan with Morning/Afternoon/Evening blocks |
| 2 | **Daily Bonus Deep-Dives** | 111–157 | Optional 30–60 min extensions per day (advanced topics) |
| 3 | **1-Page Desk Reference Cheat Sheet** | 190–246 | Printable hardware specs, capacity equations, tensor dimensions, finance formulas |
| 4 | **Workout Problem Set** | 254–310 | 14 napkin-math puzzles with answer key (one per day) |
| 5 | **SRE On-Call Incident Drills** | 318–373 | 10 production AI infrastructure debugging scenarios |
| 6 | **3B1B Playlist Placement** | ~376–406 | Where to insert the 3Blue1Brown Neural Networks series |
| 7 | **Interactive Tutorials (Days 2–2 Evening)** | ~408–686 | Gemini-guided explanations of autograd, Transformers, LoRA, and MIT Finance |

---

## 🧠 Day-by-Day Curriculum Breakdown

### Day 1 – Linear Algebra, MatMul & Autograd
- **Morning:** 3Blue1Brown *Essence of Linear Algebra* (Ch. 1–7)
- **Afternoon:** Karpathy's *micrograd* (build a 100-line autograd engine)
- **Evening:** Personal MBA value frameworks + YC product talks
- **Bonus:** IEEE 754 formats (FP32/FP16/BF16), `torch.einsum`, operating leverage

### Day 2 – Transformer Internals & Vocabulary
- **Morning:** Jay Alammar's *Illustrated Transformer* + 3B1B Ch. 5–6 (visual-first rescue plan)
- **Afternoon:** LLM lifecycle: Base Model → SFT → RLHF/DPO → LoRA (no PyTorch coding required)
- **Evening:** MIT 15.401 Lectures 1–2 (financial statements as SRE telemetry)
- **Bonus:** GQA, RoPE, MoE architectures, CapEx vs. OpEx

### Day 3 – GPU Architecture, SIMD & Parallel Computing
- **Morning:** CPU AVX-512 SIMD vs. GPU SIMT/CUDA architecture
- **Afternoon:** GPU memory hierarchy, FlashAttention, Roofline model
- **Evening:** SaaS & AI unit economics (CAC, LTV, Gross Margin)
- **Bonus:** OpenAI Triton kernels, Nsight profiling, Jevons Paradox

### Day 4 – Local CPU Inference on Dell Latitude
- **Morning:** Quantization math (RAM footprint equations)
- **Afternoon:** llama.cpp compilation with AVX-512, benchmarking 8B/14B models
- **Evening:** Value-based pricing frameworks
- **Bonus:** Intel Iris Xe GPU offload, speculative decoding, mmap/page cache tuning

### Day 5 – Inference Engineering, vLLM & Vast.ai
- **Morning:** Prefill vs. Decode phases (compute-bound vs. memory-bandwidth-bound)
- **Afternoon:** Vast.ai RTX 3090 lab, vLLM Docker, Prometheus + Grafana monitoring
- **Evening:** NPV, IRR, Opportunity Cost, build-vs-buy ROI
- **Bonus:** Disaggregated serving, guided decoding/FSMs, NVLink vs. PCIe

### Day 6 – Vector DBs, RAG & Agentic Loops
- **Morning:** Qdrant Docker lab, HNSW indexing, local embeddings
- **Afternoon:** Hybrid search (Dense + BM25 + RRF), 50-line ReAct agent
- **Evening:** *The Mom Test* – B2B problem discovery
- **Bonus:** Binary quantization, MCP protocol, gVisor sandboxing

### Day 7 – Production MLOps, Vertex AI & Capstone
- **Morning:** GCP Vertex AI, Continuous Training, LLM observability (Arize/Langfuse/RAGAS)
- **Afternoon:** Capstone – SRE Incident RCA Agent (Qdrant + llama.cpp + FastAPI)
- **Evening:** 1-page micro-SaaS business model canvas
- **Bonus:** K8s GPU sharing (MIG/MPS), LiteLLM semantic caching, ROI memos

---

## 💪 Strengths

1. **Brilliant SRE-to-AI mental model bridging** — Every AI concept is mapped to an infrastructure analogy (KV Cache = RSS, PagedAttention = mmap, LoRA = Docker OverlayFS, Autograd = distributed tracing DAG). This is the document's strongest feature and reflects deep understanding of the target audience.

2. **Hardware-grounded, not hand-wavy** — Specific numbers are given: exact memory bandwidth (45 GB/s DDR4, 936 GB/s 3090), exact model sizes (Qwen2.5-7B-Q4_K_M = 4.9 GB), exact cost/hr on Vast.ai. The back-of-envelope equations are genuinely useful.

3. **The problem sets are production-quality interview material** — The 14 napkin-math puzzles and 10 SRE incident drills are industry-grade. Problems like the "Wrapper Margin Trap" (Problem 3.2: 2.5% gross margin selling an AI wrapper) and "Prompt Cache Invalidation Bug" (Incident 06) are scenarios real MLOps engineers face.

4. **Adaptive and iterative** — The conversation shows real-time course correction (e.g., pivoting Day 2 away from Karpathy's *Let's build GPT* to a visual-first approach when the user hit a wall).

5. **Finance is woven in, not bolted on** — Each evening finance session ties directly back to AI economics (GPU depreciation, inference COGS, API vs. self-hosted crossover math).

---

## ⚠️ Weaknesses & Gaps

1. **Unrealistic time compression** — 10–12 hrs/day for 7 straight days (~80 hrs) is a burnout risk. Day 3 alone asks you to understand GPU architecture, CUDA, FlashAttention, AND Roofline models in a single morning. The pacing tips (Section 174–178) acknowledge this but don't really solve it.

2. **No hands-on fine-tuning lab** — LoRA/QLoRA are explained conceptually but there's no afternoon lab where you actually run a fine-tuning job (e.g., using `unsloth` or HuggingFace `trl`). For someone targeting MLOps, this is a notable gap.

3. **Missing evaluation & testing** — The syllabus covers LLM observability (Arize, RAGAS) only in a morning theory block on Day 7. There's no lab for writing evals, running benchmarks beyond `llama-bench`, or testing RAG pipeline quality.

4. **No training/pre-training lab** — Understandable for 7 days, but the gap between "watch Karpathy build nanoGPT" and "deploy vLLM in production" is enormous. A toy training run (even on a small model) would help cement the concepts.

5. **Document format is messy for reference use** — This is a raw conversation export with prompts, responses, citations, and markdown artifacts all interleaved. It would benefit hugely from being split into separate, clean documents:
   - A printable 2-page syllabus
   - A printable desk reference cheat sheet
   - A printable problem set
   - A printable SRE incident drill sheet

6. **Some resource links are missing or broken** — The Gemini conversation references YouTube URLs and Google Docs links, but many are either generic or may not resolve outside the original session.

7. **Vertex AI coverage is thin** — Given the user specifically asked for Google Cloud Vertex AI, the coverage is limited to a brief morning mention on Day 7 (Model Garden, Endpoints). No hands-on lab with `gcloud ai` CLI or Vertex SDK.

---

## 📊 Coverage Heatmap

| Topic | Depth | Hands-On Lab? |
|---|---|---|
| Linear Algebra / MatMul | 🟢 Deep | ✅ micrograd |
| Transformer Architecture | 🟢 Deep | ⚠️ Visual only (Karpathy skipped) |
| Tokenization / Embeddings | 🟡 Moderate | ✅ Qdrant + bge-small |
| GPU Architecture (SIMD/SIMT) | 🟢 Deep | ❌ Theory only |
| CUDA / Kernel Programming | 🟡 Moderate | ❌ Bonus only (Triton) |
| Quantization (GGUF/AWQ) | 🟢 Deep | ✅ llama.cpp |
| Local CPU Inference | 🟢 Deep | ✅ llama.cpp + benchmarking |
| GPU Inference (vLLM) | 🟢 Deep | ✅ Vast.ai lab |
| Vector Databases (Qdrant) | 🟢 Deep | ✅ Docker lab |
| RAG / Hybrid Search | 🟡 Moderate | ✅ BM25 + Dense |
| Agents (ReAct) | 🟡 Moderate | ✅ 50-line loop |
| LoRA / QLoRA Fine-Tuning | 🟡 Conceptual | ❌ No lab |
| MLOps / CI-CT-CD | 🟡 Moderate | ❌ Theory only |
| Vertex AI / GCP | 🔴 Shallow | ❌ No lab |
| LLM Observability | 🔴 Shallow | ❌ Mentioned only |
| Finance Fundamentals | 🟡 Moderate | ❌ Lectures + reading |
| Business / Pricing | 🟡 Moderate | ❌ Reading only |

---

## 🎯 Recommendations

> [!TIP]
> ### Quick wins to improve this study plan

1. **Split into clean printable documents** — Extract the 4 printable sheets (syllabus, cheat sheet, problem set, incident drills) into separate markdown files.

2. **Add a LoRA fine-tuning lab on Day 5 or 6** — Use `unsloth` + a free Colab/Kaggle T4 GPU to fine-tune Qwen2.5-3B on a small dataset. Takes ~1 hour and would fill the biggest gap.

3. **Add a Vertex AI quickstart on Day 7** — Even a 30-minute `gcloud ai endpoints deploy` exercise would fulfill the original ask.

4. **Build in rest** — Consider making it a 9-day plan (2 rest half-days) or explicitly mark Day 4 afternoon and Day 7 evening as lighter sessions.

5. **Add a progress tracking mechanism** — The interactive tracker mentioned on line 91–93 was never actually created. A simple checklist markdown file would help.
