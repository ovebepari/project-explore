// ===== THEME (fast cache to prevent flash — canonical source is SQLite) =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme-cache', theme);  // fast cache only
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (state) {
    state.theme = next;
    saveState();
  }
}

// Apply cached theme immediately to prevent flash on load
applyTheme(localStorage.getItem('theme-cache') || 'dark');

// ===== SYLLABUS DATA =====
const SYLLABUS = {
  1: {
    title: "Day 1: Linear Algebra, MatMul & Autograd",
    subtitle: "The Math Kernel — building the foundation of every neural network",
    blocks: [
      {
        id: "d1-morning",
        title: "Morning — Math Engine",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d1m1",
            text: "Watch 3Blue1Brown: Essence of Linear Algebra (Ch. 1–7). Focus on matrices as linear transformations, dot products as similarity, matmul as composing transformations.",
            resources: [
              { label: "3B1B Linear Algebra", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" }
            ]
          },
          {
            id: "d1m2",
            text: "Watch 3B1B Neural Networks Ch. 1–4 (~65 min): What is a neural network, Gradient descent, Backpropagation, Backprop calculus.",
            resources: [
              { label: "3B1B Neural Nets", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi" }
            ]
          }
        ]
      },
      {
        id: "d1-afternoon",
        title: "Afternoon — Autograd & Backprop",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d1a1",
            text: "Watch Karpathy's 'The spelled-out intro to neural networks and backpropagation: building micrograd' (2.5 hrs). Code the 100-line Python autograd engine alongside him.",
            resources: [
              { label: "Karpathy micrograd", url: "https://www.youtube.com/watch?v=VMj-3S1tku0" },
              { label: "micrograd repo", url: "https://github.com/karpathy/micrograd" }
            ]
          },
          {
            id: "d1a2",
            text: "Solve Problem Set — Day 1: Cosine similarity by hand, Shape Inspector (matmul dimensions), Chain Rule trace."
          }
        ]
      },
      {
        id: "d1-evening",
        title: "Evening — Finance: Value Creation",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d1e1",
            text: "Read The Personal MBA frameworks: 'Iron Law of the Market' and '12 Standard Forms of Value'.",
            resources: [
              { label: "Personal MBA", url: "https://personalmba.com/" }
            ]
          },
          {
            id: "d1e2",
            text: "Watch Y Combinator's 'How to Build a Product' (Michael Seibel). Understand why people part with money: reducing friction, saving time, mitigating risk, increasing status.",
            resources: [
              { label: "YC How to Build", url: "https://www.youtube.com/watch?v=C27RVio2rOs" }
            ]
          }
        ]
      },
      {
        id: "d1-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d1b1",
            text: "IEEE 754 Formats (FP32 vs FP16 vs BF16 vs FP8): Understand bit-level layout of Sign, Exponent, Mantissa. Why BF16 replaced FP16.",
          },
          {
            id: "d1b2",
            text: "Einstein Summation (torch.einsum): 20 min learning einsum notation for tensor contractions and batch matmuls.",
          },
          {
            id: "d1b3",
            text: "Finance: Operating Leverage — high-fixed-cost/low-marginal-cost (software) vs. linear human-labor businesses.",
          }
        ]
      }
    ]
  },
  2: {
    title: "Day 2: Transformer Internals & Vocabulary Mastery",
    subtitle: "From attention mechanisms to the full LLM training pipeline",
    blocks: [
      {
        id: "d2-morning",
        title: "Morning — Architecture (Visual-First)",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d2m1",
            text: "Read 'The Illustrated Transformer' by Jay Alammar (~35 min). Focus on the Decoder half. Track how 1 token embedding becomes Q, K, V vectors.",
            resources: [
              { label: "Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/" }
            ]
          },
          {
            id: "d2m2",
            text: "Watch 3B1B Ch. 5: 'But what is a GPT? Visual intro to Transformers' (27 min).",
            resources: [
              { label: "3B1B Ch.5 GPT", url: "https://www.youtube.com/watch?v=wjZofJX0v4M" }
            ]
          },
          {
            id: "d2m3",
            text: "Watch 3B1B Ch. 6: 'Attention in transformers, visually explained' (26 min). Visualize Q×Kᵀ as a token similarity lookup table.",
            resources: [
              { label: "3B1B Ch.6 Attention", url: "https://www.youtube.com/watch?v=eMlx5fFNoYc" }
            ]
          }
        ]
      },
      {
        id: "d2-afternoon",
        title: "Afternoon — LLM Lifecycle & LoRA",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d2a1",
            text: "Study the 4-stage pipeline: Base Model (pre-training) → SFT (instruction tuning) → RLHF/DPO (alignment) → LoRA (adaptation).",
          },
          {
            id: "d2a2",
            text: "Watch Karpathy's 'State of GPT' Microsoft Build talk — conceptual overview of the Pre-training → SFT → RLHF pipeline.",
            resources: [
              { label: "State of GPT", url: "https://www.youtube.com/watch?v=bZQun8Y4L2A" }
            ]
          },
          {
            id: "d2a3",
            text: "Understand LoRA math: frozen W₀ [4096×4096] + trainable A [4096×r] × B [r×4096]. Calculate compression ratio (r=8 → 0.39% params).",
          },
          {
            id: "d2a4",
            text: "Study Open Weights vs. Open Source licensing: Llama (restricted) vs. Qwen/Mistral (Apache 2.0) vs. OLMo (true open source).",
          },
          {
            id: "d2a5",
            text: "Solve Problem Set — Day 2: O(N²) context bomb, LoRA compression ratio, Accounting triage (P&L vs. Cash Flow)."
          }
        ]
      },
      {
        id: "d2-evening",
        title: "Evening — Finance: Accounting as Telemetry",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d2e1",
            text: "Watch MIT 15.401 Ses 1: Introduction & Course Overview (~1hr 15min). Map Balance Sheet to cluster state.",
            resources: [
              { label: "MIT 15.401 Playlist", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP63B2lDhyKOsImI7FjCf6eDn" }
            ]
          },
          {
            id: "d2e2",
            text: "Watch MIT 15.401 Ses 2: Present Value Relations I (~1hr 19min). Learn Time Value of Money and PV operator.",
            resources: [
              { label: "MIT Ses 2 PV", url: "https://www.youtube.com/watch?v=U03Md5enU-0" }
            ]
          },
          {
            id: "d2e3",
            text: "Map: Income Statement = request throughput, Balance Sheet = cluster state snapshot, Cash Flow = actual memory I/O.",
          }
        ]
      },
      {
        id: "d2-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d2b1",
            text: "GQA (Grouped-Query Attention) & MQA: How sharing K/V heads across Q heads slashes KV Cache VRAM by 75%.",
          },
          {
            id: "d2b2",
            text: "RoPE (Rotary Position Embeddings): Encoding token order by rotating Q and K in complex 2D space. NTK-aware scaling / YaRN for 128k+ context.",
          },
          {
            id: "d2b3",
            text: "MoE (Mixture of Experts): Mixtral/DeepSeek-V3 gating router activating 2 of 8 experts per token — giant intelligence at small inference cost.",
          },
          {
            id: "d2b4",
            text: "Finance: CapEx vs. OpEx & GPU Depreciation — H100/B200 depreciation over 4–6 years on balance sheets.",
          }
        ]
      }
    ]
  },
  3: {
    title: "Day 3: GPU Architecture, SIMD & Parallel Computing",
    subtitle: "From your CPU's AVX-512 to NVIDIA CUDA cores and memory hierarchies",
    blocks: [
      {
        id: "d3-morning",
        title: "Morning — CPU SIMD to GPU SIMT",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d3m1",
            text: "Compare i5-1135G7 AVX-512 (16 FP32 per cycle) to GPU SIMT (thousands of CUDA cores, 32-thread Warps, Streaming Multiprocessors).",
          },
          {
            id: "d3m2",
            text: "Read NVIDIA CUDA Refresher blog series. Study GPU hierarchy: HBM (VRAM) → L2 Cache → SRAM (Shared Memory / Registers).",
            resources: [
              { label: "CUDA Refresher", url: "https://developer.nvidia.com/blog/tag/cuda-refresher/" }
            ]
          },
          {
            id: "d3m3",
            text: "Understand FlashAttention: keeping intermediate matrices in fast SRAM instead of slow HBM round-trips.",
            resources: [
              { label: "FlashAttention Paper", url: "https://arxiv.org/abs/2205.14135" }
            ]
          }
        ]
      },
      {
        id: "d3-afternoon",
        title: "Afternoon — Memory Hierarchy & Roofline",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d3a1",
            text: "Study the Roofline Model: Arithmetic Intensity = FLOPS / Memory Bandwidth. RTX 3090 crossover: 142T / 936G ≈ 151 FLOPs/Byte.",
          },
          {
            id: "d3a2",
            text: "Memorize the hardware cheat sheet numbers: DDR4 ~45 GB/s, 3090 936 GB/s, A100 2039 GB/s, H100 3350 GB/s.",
          },
          {
            id: "d3a3",
            text: "Solve Problem Set — Day 3: AVX-512 FP32 vs INT8 throughput, The Wrapper Margin Trap (2.5% gross margin!)."
          }
        ]
      },
      {
        id: "d3-evening",
        title: "Evening — Finance: SaaS & AI Unit Economics",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d3e1",
            text: "Study CAC (Customer Acquisition Cost), LTV (Lifetime Value), Gross Margin, Payback Period.",
          },
          {
            id: "d3e2",
            text: "Calculate why traditional SaaS has 80% gross margins while poorly optimized AI wrappers drop to 30% (GPU inference COGS).",
          }
        ]
      },
      {
        id: "d3-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d3b1",
            text: "OpenAI Triton Language: Write Vector Addition & Fused Softmax kernels in Python. Learn kernel fusion to eliminate HBM reads/writes.",
            resources: [
              { label: "Triton Tutorials", url: "https://triton-lang.org/main/getting-started/tutorials/index.html" }
            ]
          },
          {
            id: "d3b2",
            text: "NVIDIA Nsight Systems (nsys) & PyTorch Profiler: Read GPU execution flamegraphs. Spot 'GPU starvation'.",
          },
          {
            id: "d3b3",
            text: "Finance: Jevons Paradox in Compute — why making inference 10x cheaper per token causes total GPU spending to increase.",
          }
        ]
      }
    ]
  },
  4: {
    title: "Day 4: Local CPU Inference on Dell Latitude",
    subtitle: "Hands-on with llama.cpp, quantization, and your i5-1135G7 / 32GB RAM",
    blocks: [
      {
        id: "d4-morning",
        title: "Morning — Quantization & Memory Math",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d4m1",
            text: "Master the footprint formula: RAM(GB) ≈ Params(B) × Bytes_per_Param × 1.2. Calculate Q4_K_M sizes for 7B, 14B, 32B, 70B models.",
          },
          {
            id: "d4m2",
            text: "Understand why CPU inference is memory-bandwidth bound (not compute-bound) at ~45 GB/s DDR4.",
          },
          {
            id: "d4m3",
            text: "Calculate theoretical decode ceiling: 4.7GB model on 45 GB/s bus → ~9.5 tok/s max.",
          }
        ]
      },
      {
        id: "d4-afternoon",
        title: "Afternoon — Hands-On Lab",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d4a1",
            text: "Clone and compile llama.cpp from source with AVX2/AVX-512 flags for Tiger Lake i5.",
            resources: [
              { label: "llama.cpp repo", url: "https://github.com/ggerganov/llama.cpp" }
            ]
          },
          {
            id: "d4a2",
            text: "Download Llama-3.1-8B-Instruct-Q4_K_M.gguf (~4.9 GB) from HuggingFace.",
            resources: [
              { label: "HuggingFace GGUF", url: "https://huggingface.co/models?search=gguf" }
            ]
          },
          {
            id: "d4a3",
            text: "Download Qwen-2.5-14B-Instruct-Q4_K_M.gguf (~8.5 GB).",
          },
          {
            id: "d4a4",
            text: "Run llama-bench: profile CPU thread scaling (-t 4 vs -t 8), RAM allocation, tokens/sec during Prefill vs. Decode.",
          },
          {
            id: "d4a5",
            text: "Solve Problem Set — Day 4: Will 70B fit in 32GB? Sweet-spot model sizing for your RAM."
          }
        ]
      },
      {
        id: "d4-evening",
        title: "Evening — Finance: Pricing Psychology",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d4e1",
            text: "Read ProfitWell (Patrick Campbell) guide on Value-Based Pricing.",
          },
          {
            id: "d4e2",
            text: "Learn cost-plus pricing (charging per token) vs. value-metric pricing (charging per resolved ticket / automated PR).",
          }
        ]
      },
      {
        id: "d4-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d4b1",
            text: "Intel Iris Xe GPU Offloading: Compile llama.cpp with -DGGML_VULKAN=ON or -DGGML_SYCL=ON, compare iGPU vs CPU.",
          },
          {
            id: "d4b2",
            text: "Speculative Decoding in llama.cpp: Use a 0.5B draft model alongside 7B target model and measure speedup.",
          },
          {
            id: "d4b3",
            text: "mmap & Linux Page Cache: Inspect how llama.cpp uses mmap(). Run vmtouch to verify model pages aren't swapped.",
          },
          {
            id: "d4b4",
            text: "Finance: Price Discrimination & Tiering — Good / Better / Best enterprise tiers (Rate-limited API → VPC → Custom LoRA).",
          }
        ]
      }
    ]
  },
  5: {
    title: "Day 5: Inference Engineering, vLLM & Vast.ai",
    subtitle: "GPU inference serving, PagedAttention, and cloud GPU penny-pinching",
    blocks: [
      {
        id: "d5-morning",
        title: "Morning — Prefill vs. Decode Phases",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d5m1",
            text: "Read 'LLM Inference Unveiled' / Learn Inference book. Study Prefill (compute-bound, TTFT) vs. Decode (memory-bandwidth-bound, ITL).",
            resources: [
              { label: "LLM Inference Handbook", url: "https://www.bentoml.com/blog/llm-inference-handbook" }
            ]
          },
          {
            id: "d5m2",
            text: "Understand PagedAttention: non-contiguous KV Cache allocation like OS virtual memory paging.",
          },
          {
            id: "d5m3",
            text: "Study Continuous Batching: loading weights once and multiplying against 32-128 user prompts simultaneously.",
          }
        ]
      },
      {
        id: "d5-afternoon",
        title: "Afternoon — Vast.ai & vLLM Lab",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d5a1",
            text: "Load $5 into Vast.ai. Rent a Spot RTX 3090 (24GB) or RTX 4090 for ~$0.15–$0.30/hr.",
            resources: [
              { label: "Vast.ai", url: "https://vast.ai/" }
            ]
          },
          {
            id: "d5a2",
            text: "Spin up the official vllm/vllm-openai Docker container serving a 7B/8B AWQ quantized model.",
            resources: [
              { label: "vLLM Docs", url: "https://docs.vllm.ai/" }
            ]
          },
          {
            id: "d5a3",
            text: "Inspect Continuous Batching & KV Cache usage via vLLM's /metrics Prometheus endpoint. Connect to Grafana if possible.",
          },
          {
            id: "d5a4",
            text: "Tear down the Vast.ai instance immediately after to save cents!",
          },
          {
            id: "d5a5",
            text: "Solve Problem Set — Day 5: The OOM Mystery (25 users × 8k context × 160KB), API vs. Self-Hosted crossover math."
          }
        ]
      },
      {
        id: "d5-evening",
        title: "Evening — Finance: Time Value of Money",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d5e1",
            text: "Study NPV (Net Present Value), IRR (Internal Rate of Return), and Opportunity Cost.",
          },
          {
            id: "d5e2",
            text: "Apply to engineering: build in-house vs. buy an API. Evaluate if a 2-month project yields positive ROI.",
          }
        ]
      },
      {
        id: "d5-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d5b1",
            text: "Disaggregated Prefill & Decode Serving: Split Prefill onto compute-dense nodes, stream KV Cache over RDMA/RoCEv2 to Decode nodes.",
          },
          {
            id: "d5b2",
            text: "Guided Decoding / Structured Outputs: Outlines or XGrammar compile JSON Schema into FSMs masking invalid logits — 100% valid JSON.",
          },
          {
            id: "d5b3",
            text: "Multi-GPU Interconnects: PCIe Gen4 (~32 GB/s) vs. NVLink (600–900 GB/s). Why Tensor Parallelism bottlenecks on consumer PCIe.",
          },
          {
            id: "d5b4",
            text: "Finance: FinOps & Spot Instance Arbitrage — stateless checkpointing layers for Spot GPU SIGTERM failover.",
          }
        ]
      }
    ]
  },
  6: {
    title: "Day 6: Vector DBs, Hybrid RAG & Agentic Loops",
    subtitle: "Qdrant, HNSW, BM25 + dense hybrid search, and building a ReAct agent",
    blocks: [
      {
        id: "d6-morning",
        title: "Morning — Docker Vector DB Lab",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d6m1",
            text: "Run: docker run -p 6333:6333 qdrant/qdrant",
            resources: [
              { label: "Qdrant Docs", url: "https://qdrant.tech/documentation/" }
            ]
          },
          {
            id: "d6m2",
            text: "Write a Python script to ingest 1,000 markdown docs using bge-small-en-v1.5 embeddings.",
            resources: [
              { label: "bge-small HF", url: "https://huggingface.co/BAAI/bge-small-en-v1.5" }
            ]
          },
          {
            id: "d6m3",
            text: "Inspect HNSW index parameters (m, ef_construct). Understand it as a multi-layered skip-list graph.",
          }
        ]
      },
      {
        id: "d6-afternoon",
        title: "Afternoon — Hybrid Search & Agents",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d6a1",
            text: "Combine Dense Vector Search (cosine) with Sparse BM25 using Reciprocal Rank Fusion (RRF).",
          },
          {
            id: "d6a2",
            text: "Build a raw 50-line Python ReAct Agent loop (while True: prompt → LLM JSON tool call → execute tool → append stdout). No LangChain!",
          },
          {
            id: "d6a3",
            text: "Solve Problem Set — Day 6: Why pure vector search fails for hex error codes, The Infinite Agent Loop (context overflow)."
          }
        ]
      },
      {
        id: "d6-evening",
        title: "Evening — Finance: B2B Sales & Problem Discovery",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d6e1",
            text: "Read 'The Mom Test' (Rob Fitzpatrick) summary. Learn to interview engineers/managers for budget-backed problems.",
            resources: [
              { label: "The Mom Test", url: "http://momtestbook.com/" }
            ]
          }
        ]
      },
      {
        id: "d6-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d6b1",
            text: "Binary & Scalar Quantization in Qdrant: Cut RAM 32x using 1-bit compression + XOR/POPCNT, rescore top 50 in full precision.",
          },
          {
            id: "d6b2",
            text: "Model Context Protocol (MCP): Anthropic's universal USB-C for connecting LLMs to tools via JSON-RPC servers.",
          },
          {
            id: "d6b3",
            text: "Sandboxing Agent Code: gVisor (runsc) / Firecracker microVMs to stop prompt injection from wiping your host.",
          },
          {
            id: "d6b4",
            text: "Finance: Switching Costs & Data Moats — Why wrapper startups die; build defensibility via proprietary workflow data.",
          }
        ]
      }
    ]
  },
  7: {
    title: "Day 7: Production MLOps, Vertex AI & Capstone",
    subtitle: "CI/CD → CT, model observability, and your SRE Incident RCA Agent",
    blocks: [
      {
        id: "d7-morning",
        title: "Morning — GCP Vertex AI & MLOps",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d7m1",
            text: "Map CI/CD to Continuous Training (CT) and Evaluation Pipelines. Study Vertex AI Model Garden & Endpoints.",
            resources: [
              { label: "Vertex AI Docs", url: "https://cloud.google.com/vertex-ai/docs" }
            ]
          },
          {
            id: "d7m2",
            text: "Study LLM Observability: Tracing with Arize Phoenix or Langfuse. Automated evals with RAGAS (Context Precision, Faithfulness).",
            resources: [
              { label: "Arize Phoenix", url: "https://phoenix.arize.com/" },
              { label: "Langfuse", url: "https://langfuse.com/" },
              { label: "RAGAS", url: "https://docs.ragas.io/" }
            ]
          },
          {
            id: "d7m3",
            text: "Study Made With ML (Goku Mohandas) — free MLOps course with GitHub Actions, Docker, Ray, experiment tracking.",
            resources: [
              { label: "Made With ML", url: "https://madewithml.com/" }
            ]
          }
        ]
      },
      {
        id: "d7-afternoon",
        title: "Afternoon — Capstone Build",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d7a1",
            text: "Build an SRE Incident Root-Cause Analysis Agent: connect Qdrant DB + local llama.cpp (or Vast.ai vLLM) to process K8s crash logs.",
          },
          {
            id: "d7a2",
            text: "Expose the agent via FastAPI with Prometheus metrics (/metrics endpoint).",
          },
          {
            id: "d7a3",
            text: "Solve Problem Set — Day 7: Latency Budget Decomposition (2s SLA), The 1-Minute CFO Pitch ($60k savings)."
          },
          {
            id: "d7a4",
            text: "Review SRE Incident Drills: Work through all 10 production AI debugging scenarios.",
          }
        ]
      },
      {
        id: "d7-evening",
        title: "Evening — Finance: Micro-SaaS Blueprint",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d7e1",
            text: "Draft a 1-page business model canvas for an AI/MLOps problem from your 4 years of SRE work.",
          },
          {
            id: "d7e2",
            text: "Define: buyer persona, quantifiable ROI (e.g., reduce MTTR 30%, cut GPU waste 40%), and pricing tiers.",
          }
        ]
      },
      {
        id: "d7-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d7b1",
            text: "K8s GPU Sharing: MIG (Multi-Instance GPU) hardware-partitioning into 7 slices, CUDA MPS for process-level sharing.",
          },
          {
            id: "d7b2",
            text: "Semantic Caching & LLM Gateways: Deploy LiteLLM as proxy in front of Vertex AI / OpenAI / vLLM with Redis caching.",
            resources: [
              { label: "LiteLLM", url: "https://docs.litellm.ai/" }
            ]
          },
          {
            id: "d7b3",
            text: "Finance: Writing the 1-Page Executive ROI Memo — Situation → Complication → Resolution → Financial Impact structure.",
          }
        ]
      }
    ]
  }
};

// ===== STORAGE (SQLite via Python server API) =====
const DEFAULT_STATE = {
  tasks: {},
  journal: {},
  timeLog: {},
  customResources: {},
  activeDay: 1,
  journalDay: 1,
  startDate: null,
  theme: 'dark'
};

let state = { ...DEFAULT_STATE };
let _saveTimeout = null;

function saveState() {
  // Debounce — batch rapid clicks into one API call (300ms)
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(err => console.error('Failed to save state', err));
  }, 300);
}

async function loadStateFromServer() {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      state = { ...DEFAULT_STATE, ...data };
      // Sync theme from DB
      if (state.theme) applyTheme(state.theme);
    }
  } catch (err) {
    console.warn('Server not available, using defaults', err);
  }
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['#F5C518', '#d4a017', '#e6b800', '#666', '#888', '#aaa'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 20 + 15) + 's';
    p.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(p);
  }
}

// ===== RENDER DAY PANELS =====
function renderPanels() {
  const container = document.getElementById('dayPanels');
  container.innerHTML = '';

  for (let day = 1; day <= 7; day++) {
    const data = SYLLABUS[day];
    const panel = document.createElement('div');
    panel.className = 'day-panel' + (day === state.activeDay ? ' active' : '');
    panel.id = 'panel-' + day;

    // Count tasks
    let totalTasks = 0, doneTasks = 0;
    data.blocks.forEach(block => {
      block.tasks.forEach(task => {
        totalTasks++;
        if (state.tasks[task.id]) doneTasks++;
      });
    });

    const timeLogged = state.timeLog[day] || 0;
    const hrs = Math.floor(timeLogged / 3600);
    const mins = Math.floor((timeLogged % 3600) / 60);

    let html = `
      <div class="day-header">
        <h2 class="day-title">${data.title}</h2>
        <p class="day-subtitle">${data.subtitle}</p>
        <div class="day-meta">
          <span class="day-time-logged">⏱ ${hrs}h ${mins}m logged</span>
          <span class="day-progress-text">${doneTasks}/${totalTasks} tasks</span>
        </div>
      </div>
    `;

    data.blocks.forEach(block => {
      let blockDone = 0;
      block.tasks.forEach(t => { if (state.tasks[t.id]) blockDone++; });

      html += `
        <div class="block-card ${day === state.activeDay ? 'expanded' : ''}" data-block="${block.id}">
          <div class="block-header" onclick="toggleBlock(this)">
            <div class="block-header-left">
              <span class="block-icon">${block.icon}</span>
              <span class="block-title">${block.title}</span>
              <span class="block-badge badge-${block.badge}">${block.badge === 'bonus' ? '★ BONUS' : block.badge.toUpperCase()}</span>
            </div>
            <div class="block-header-right">
              <span class="block-count">${blockDone}/${block.tasks.length}</span>
              <span class="block-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </div>
          </div>
          <div class="block-content">
            <div class="block-tasks">
      `;

      block.tasks.forEach(task => {
        const checked = state.tasks[task.id] ? 'checked' : '';
        const doneClass = state.tasks[task.id] ? 'done' : '';
        const builtInRes = task.resources || [];
        const customRes = (state.customResources && state.customResources[task.id]) || [];
        let resourceHtml = '';
        if (builtInRes.length || customRes.length) {
          resourceHtml = '<div class="task-resources">';
          builtInRes.forEach(r => {
            resourceHtml += `<a href="${r.url}" target="_blank" rel="noopener" class="resource-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              ${r.label}
            </a>`;
          });
          customRes.forEach((r, idx) => {
            resourceHtml += `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-link custom-resource" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              ${escapeHtml(r.label)}
              <span class="resource-remove" onclick="event.preventDefault();event.stopPropagation();removeCustomResource('${task.id}', ${idx})" title="Remove resource">×</span>
            </a>`;
          });
          resourceHtml += '</div>';
        }
        resourceHtml += `
          <div class="add-resource-wrapper" onclick="event.stopPropagation()">
            <button class="add-resource-btn" onclick="showAddResourceForm('${task.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Resource
            </button>
            <div class="add-resource-form" id="resource-form-${task.id}" style="display:none">
              <input type="text" placeholder="Label (e.g. My Notes)" class="resource-input" id="resource-label-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
              <input type="text" placeholder="https://example.com" class="resource-input" id="resource-url-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
              <div class="resource-form-actions">
                <button class="resource-form-btn save" onclick="addCustomResource('${task.id}')">Save</button>
                <button class="resource-form-btn cancel" onclick="hideAddResourceForm('${task.id}')">Cancel</button>
              </div>
            </div>
          </div>
        `;

        html += `
          <label class="task-item ${doneClass}" data-task="${task.id}">
            <input type="checkbox" class="task-checkbox" ${checked} onchange="toggleTask('${task.id}', this)">
            <div class="task-info">
              <span class="task-text">${task.text}</span>
              ${resourceHtml}
            </div>
          </label>
        `;
      });

      html += `
            </div>
          </div>
        </div>
      `;
    });

    panel.innerHTML = html;
    container.appendChild(panel);
  }
}

// ===== TOGGLE BLOCK =====
function toggleBlock(header) {
  const card = header.closest('.block-card');
  card.classList.toggle('expanded');
}

// ===== TOGGLE TASK =====
function toggleTask(taskId, checkbox) {
  state.tasks[taskId] = checkbox.checked;
  if (!state.startDate && checkbox.checked) {
    state.startDate = new Date().toISOString();
  }
  saveState();

  // Update label
  const label = checkbox.closest('.task-item');
  if (checkbox.checked) {
    label.classList.add('done');
  } else {
    label.classList.remove('done');
  }

  updateStats();

  // Check if day is complete
  if (checkbox.checked) {
    const dayNum = findDayForTask(taskId);
    if (dayNum && isDayComplete(dayNum)) {
      fireConfetti();
      showToast(`🎉 Day ${dayNum} complete!`);
    }
  }
}

function findDayForTask(taskId) {
  for (let day = 1; day <= 7; day++) {
    for (const block of SYLLABUS[day].blocks) {
      for (const task of block.tasks) {
        if (task.id === taskId) return day;
      }
    }
  }
  return null;
}

function isDayComplete(day) {
  const data = SYLLABUS[day];
  for (const block of data.blocks) {
    if (block.isBonus) continue; // Don't require bonus tasks
    for (const task of block.tasks) {
      if (!state.tasks[task.id]) return false;
    }
  }
  return true;
}

// ===== UPDATE STATS =====
function updateStats() {
  let totalTasks = 0, completedTasks = 0;
  let totalBonus = 0, completedBonus = 0;
  let daysComplete = 0;

  for (let day = 1; day <= 7; day++) {
    const data = SYLLABUS[day];
    let dayDone = 0, dayTotal = 0;
    let dayTotalAll = 0, dayDoneAll = 0;

    data.blocks.forEach(block => {
      block.tasks.forEach(task => {
        dayTotalAll++;
        if (state.tasks[task.id]) dayDoneAll++;

        if (block.isBonus) {
          totalBonus++;
          if (state.tasks[task.id]) completedBonus++;
        } else {
          totalTasks++;
          dayTotal++;
          if (state.tasks[task.id]) {
            completedTasks++;
            dayDone++;
          }
        }
      });
    });

    // Update day pill bar
    const bar = document.getElementById('dayBar' + day);
    if (bar) {
      const pct = dayTotalAll > 0 ? (dayDoneAll / dayTotalAll) * 100 : 0;
      bar.style.width = pct + '%';
    }

    // Check day complete (non-bonus)
    const pill = document.querySelector(`.day-pill[data-day="${day}"]`);
    if (pill) {
      if (dayTotal > 0 && dayDone === dayTotal) {
        pill.classList.add('completed');
        daysComplete++;
      } else {
        pill.classList.remove('completed');
      }
    }
  }

  // Overall
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById('overallPercent').textContent = overallPct + '%';
  document.getElementById('overallBar').style.width = overallPct + '%';
  document.getElementById('completedTasks').textContent = `${completedTasks} / ${totalTasks}`;
  document.getElementById('bonusDone').textContent = `${completedBonus} / ${totalBonus}`;
  document.getElementById('daysComplete').textContent = `${daysComplete} / 7`;

  // Total hours
  let totalSeconds = 0;
  for (const d in state.timeLog) totalSeconds += state.timeLog[d];
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  document.getElementById('totalHours').textContent = totalH + 'h';
  document.getElementById('todayHours').textContent = `${totalH}h ${totalM}m`;

  // Streak
  const streak = calculateStreak();
  document.getElementById('streakCount').textContent = streak + ' 🔥';
}

function calculateStreak() {
  // Simple streak: count consecutive days completed
  let streak = 0;
  for (let day = 1; day <= 7; day++) {
    if (isDayComplete(day)) streak++;
    else break;
  }
  return streak;
}

// ===== CUSTOM RESOURCES =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showAddResourceForm(taskId) {
  // Hide any other open forms first
  document.querySelectorAll('.add-resource-form').forEach(f => f.style.display = 'none');
  const form = document.getElementById('resource-form-' + taskId);
  if (form) {
    form.style.display = 'flex';
    const labelInput = document.getElementById('resource-label-' + taskId);
    if (labelInput) setTimeout(() => labelInput.focus(), 50);
  }
}

function hideAddResourceForm(taskId) {
  const form = document.getElementById('resource-form-' + taskId);
  if (form) {
    form.style.display = 'none';
    document.getElementById('resource-label-' + taskId).value = '';
    document.getElementById('resource-url-' + taskId).value = '';
  }
}

function addCustomResource(taskId) {
  const label = document.getElementById('resource-label-' + taskId).value.trim();
  const url = document.getElementById('resource-url-' + taskId).value.trim();

  if (!label || !url) {
    showToast('⚠️ Please enter both a label and URL');
    return;
  }

  if (!state.customResources) state.customResources = {};
  if (!state.customResources[taskId]) state.customResources[taskId] = [];

  state.customResources[taskId].push({ label, url });
  saveState();

  renderPanels();
  switchDay(state.activeDay);
  showToast('🔗 Resource added');
}

function removeCustomResource(taskId, index) {
  if (!state.customResources || !state.customResources[taskId]) return;

  state.customResources[taskId].splice(index, 1);
  if (state.customResources[taskId].length === 0) {
    delete state.customResources[taskId];
  }
  saveState();

  renderPanels();
  switchDay(state.activeDay);
  showToast('🗑️ Resource removed');
}

function handleResourceKeydown(e, taskId) {
  e.stopPropagation();
  if (e.key === 'Enter') {
    e.preventDefault();
    addCustomResource(taskId);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    hideAddResourceForm(taskId);
  }
}

// ===== DAY NAVIGATION =====
function switchDay(day) {
  state.activeDay = day;
  saveState();

  // Update pills
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.classList.toggle('active', parseInt(pill.dataset.day) === day);
  });

  // Update panels
  document.querySelectorAll('.day-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const target = document.getElementById('panel-' + day);
  if (target) {
    target.classList.add('active');
    // Expand all blocks in active panel
    target.querySelectorAll('.block-card').forEach(card => card.classList.add('expanded'));
  }
}

// ===== TIMER =====
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('timerStart').disabled = true;
  document.getElementById('timerPause').disabled = false;
  document.getElementById('timerStop').disabled = false;
  document.getElementById('timerPulse').classList.add('active');

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('timerStart').disabled = false;
  document.getElementById('timerPause').disabled = true;
  document.getElementById('timerPulse').classList.remove('active');
}

function stopTimer() {
  pauseTimer();
  const day = parseInt(document.getElementById('timerDay').value);
  if (!state.timeLog[day]) state.timeLog[day] = 0;
  state.timeLog[day] += timerSeconds;
  saveState();

  showToast(`⏱ Logged ${formatTime(timerSeconds)} to Day ${day}`);

  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById('timerStop').disabled = true;

  // Re-render to update time logged
  renderPanels();
  updateStats();
}

function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent =
    String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ===== JOURNAL =====
let currentJournalDay = state.journalDay || 1;

function switchJournalDay(day) {
  // Save current before switching
  saveJournalEntry();

  currentJournalDay = day;
  state.journalDay = day;
  saveState();

  document.querySelectorAll('.journal-tab').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.dataset.jday) === day);
  });

  document.getElementById('journalText').value = state.journal[day] || '';
  updateJournalTabDots();
}

function saveJournalEntry() {
  const text = document.getElementById('journalText').value.trim();
  if (text) {
    state.journal[currentJournalDay] = text;
  } else {
    delete state.journal[currentJournalDay];
  }
  saveState();
  updateJournalTabDots();
}

function updateJournalTabDots() {
  document.querySelectorAll('.journal-tab').forEach(tab => {
    const d = parseInt(tab.dataset.jday);
    if (state.journal[d] && state.journal[d].trim()) {
      tab.classList.add('has-content');
    } else {
      tab.classList.remove('has-content');
    }
  });
}

// ===== CONFETTI =====
function fireConfetti() {
  const colors = ['#F5C518', '#e6b800', '#d4a017', '#1a1a1a', '#333', '#F5C518', '#FFD700'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-10px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    const size = Math.random() * 6 + 4;
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

// ===== TOAST =====
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

// ===== RESET =====
async function resetAll() {
  if (!confirm('🗑️ Reset ALL progress? This will clear all checkboxes, time logs, and journal entries. This cannot be undone.')) return;
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      state = await res.json();
    }
  } catch (e) {
    state = { ...DEFAULT_STATE };
  }
  renderPanels();
  updateStats();
  switchDay(1);
  switchJournalDay(1);
  showToast('♻️ All progress reset');
}

// ===== INIT =====
async function init() {
  // Load persisted state from SQLite before rendering anything
  await loadStateFromServer();
  currentJournalDay = state.journalDay || 1;

  createParticles();
  renderPanels();
  updateStats();

  // Day pills
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => switchDay(parseInt(pill.dataset.day)));
  });
  switchDay(state.activeDay);

  // Timer
  document.getElementById('timerStart').addEventListener('click', startTimer);
  document.getElementById('timerPause').addEventListener('click', pauseTimer);
  document.getElementById('timerStop').addEventListener('click', stopTimer);

  // Sync timer dropdown with active day
  document.getElementById('timerDay').value = state.activeDay;

  // Journal
  document.querySelectorAll('.journal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchJournalDay(parseInt(tab.dataset.jday)));
  });
  document.getElementById('journalText').value = state.journal[currentJournalDay] || '';
  updateJournalTabDots();

  document.getElementById('journalSave').addEventListener('click', function() {
    saveJournalEntry();
    this.classList.add('saved');
    this.textContent = '✓ Saved';
    setTimeout(() => {
      this.classList.remove('saved');
      this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Note`;
    }, 1500);
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Day pill sync with timer dropdown
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById('timerDay').value = parseInt(pill.dataset.day);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
