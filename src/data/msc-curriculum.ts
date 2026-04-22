/**
 * Self-Directed MSc in Cognitive Science — curriculum data.
 *
 * Source: synthesised from MIT BCS, CMU Psychology, Stanford Symbolic Systems,
 * Edinburgh Informatics, UCSD, Indiana, and Sussex CogSci syllabi.
 */

export type ItemKind = "read" | "watch" | "paper" | "code" | "write" | "activity" | "note";

export interface WeekItem {
  kind: ItemKind;
  text: string;
}

export interface Artifact {
  title: string;
  length: string;
  kind: "Written" | "Code + Report" | "Visual" | "Written + Code" | "Dissertation";
  /**
   * URL to the published artifact (blog post, repo, PDF, etc.).
   * An artifact week is only treated as complete once this field is set —
   * a week can be listed in `completedWeeks` but won't count toward progress
   * until the link is added. Enforces "ship the work, then mark it done."
   */
  link?: string;
}

export interface Week {
  n: number;
  title: string;
  items: WeekItem[];
  artifact?: Artifact;
  hours?: string;
}

export interface Module {
  code: string;
  title: string;
  weeks: [number, number];
  question: string;
  weekDetails: Week[];
}

export interface Semester {
  n: 1 | 2 | 3 | 4 | 5;
  title: string;
  /** Short label used in tight contexts — heatmap row labels, etc. */
  shortTitle: string;
  subtitle: string;
  weeks: [number, number];
  modules: Module[];
}

export interface Milestone {
  week: number;
  label: string;
  artifactsCompleted: number;
  major?: boolean;
}

export const programme = {
  title: "My Self-Directed MSc in Cognitive Science",
  tagline:
    "A world-class curriculum synthesised from MIT, CMU, Stanford, Edinburgh, UCSD, Indiana and Sussex.",
  level: "NFQ Level 9 · MSc equivalent",
  startedLabel: "April 2026",
  totalWeeks: 80,
  totalArtifacts: 21,
  totalModules: 21,
  totalSemesters: 5,
  pace: "12–14 hrs/week",
  rhythm:
    "1–2 hours on weekday evenings for reading and lectures; 4–6 hours on weekends for writing, coding, and deep thinking.",
  methodology: [
    {
      heading: "Each module contains",
      body: "Core readings (textbooks + primary papers), lectures (free online courses and video series), and an artifact — the same kind of submission a masters student would turn in.",
    },
    {
      heading: "Pacing",
      body: "One module every 3–4 weeks. Heavier modules (10 ECTS equivalent) get 4 weeks; lighter ones get 3. The capstone gets 10 weeks. Expect the 80-week schedule to slip to 90–100 weeks in practice — that is normal and accounted for.",
    },
    {
      heading: "Assessment",
      body: "Every artifact is written to publishable or submission-ready quality. Share with peers, online communities (LessWrong, PhilPapers discussions, r/CogSci), or use AI-assisted review. For the capstone: budgeted paid reads from two PhD students in the field — the single change that most narrows the gap to an accredited programme.",
    },
  ],
  weeklyBudget: [
    { activity: "Reading", hours: "5–6 hrs", note: "Textbooks + primary papers" },
    { activity: "Lectures", hours: "2–3 hrs", note: "Free university video series" },
    { activity: "Coding / stats", hours: "3–4 hrs", note: "Modeling + reanalyses" },
    { activity: "Writing", hours: "2–4 hrs", note: "Notes, drafts, artifacts" },
  ],
  sources: [
    "MIT Brain and Cognitive Sciences",
    "Carnegie Mellon Psychology (Cognitive Science track)",
    "Stanford Symbolic Systems",
    "University of Edinburgh Informatics",
    "UC San Diego Cognitive Science",
    "Indiana University Cognitive Science",
    "University of Sussex Centre for Cognitive Science",
  ],
} as const;

export const milestones: Milestone[] = [
  { week: 3, label: "Semester 1 started — first essay done", artifactsCompleted: 1 },
  { week: 7, label: "Philosophy of Mind complete", artifactsCompleted: 2 },
  { week: 10, label: "Cognitive Psychology complete", artifactsCompleted: 3 },
  { week: 14, label: "Neuroscience & Imaging Methods complete", artifactsCompleted: 4 },
  {
    week: 17,
    label: "Semester 1 complete — foundations + stats spine built",
    artifactsCompleted: 5,
    major: true,
  },
  { week: 21, label: "First computational model built", artifactsCompleted: 6 },
  { week: 25, label: "Bayesian modeling complete", artifactsCompleted: 7 },
  { week: 29, label: "Connectionist modeling complete", artifactsCompleted: 8 },
  {
    week: 33,
    label: "Semester 2 complete — can model cognition computationally",
    artifactsCompleted: 9,
    major: true,
  },
  { week: 36, label: "Memory systems module complete", artifactsCompleted: 10 },
  { week: 40, label: "RL & decision neuroscience complete", artifactsCompleted: 11 },
  { week: 44, label: "Developmental + comparative + social essay done", artifactsCompleted: 12 },
  {
    week: 47,
    label: "Semester 3 complete — brain + behaviour + development integrated",
    artifactsCompleted: 13,
    major: true,
  },
  { week: 51, label: "Embodied cognition comparative essay done", artifactsCompleted: 14 },
  { week: 54, label: "Phenomenology module complete", artifactsCompleted: 15 },
  { week: 58, label: "Consciousness studies complete", artifactsCompleted: 16 },
  {
    week: 61,
    label: "Semester 4 complete — embodied + phenomenological turn integrated",
    artifactsCompleted: 17,
    major: true,
  },
  { week: 64, label: "Contemporary computational cog-sci module complete", artifactsCompleted: 18 },
  { week: 67, label: "Cognitive architectures capstone essay", artifactsCompleted: 19 },
  { week: 70, label: "Dynamical systems complete", artifactsCompleted: 20 },
  {
    week: 80,
    label: "Programme complete — dissertation submitted",
    artifactsCompleted: 21,
    major: true,
  },
];

const w = (n: number, title: string, items: WeekItem[], extras: Partial<Week> = {}): Week => ({
  n,
  title,
  items,
  ...extras,
});

const r = (text: string): WeekItem => ({ kind: "read", text });
const watch = (text: string): WeekItem => ({ kind: "watch", text });
const p = (text: string): WeekItem => ({ kind: "paper", text });
const c = (text: string): WeekItem => ({ kind: "code", text });
const wr = (text: string): WeekItem => ({ kind: "write", text });
const a = (text: string): WeekItem => ({ kind: "activity", text });
const note = (text: string): WeekItem => ({ kind: "note", text });

export const semesters: Semester[] = [
  {
    n: 1,
    title: "Foundations",
    shortTitle: "Foundations",
    subtitle:
      "Build the conceptual map of the field — and the methods spine that will carry the rest of the degree.",
    weeks: [1, 17],
    modules: [
      {
        code: "1.1",
        title: "Introduction to Cognitive Science",
        weeks: [1, 3],
        question:
          "What is cognitive science? What are the competing paradigms? Where did they come from?",
        weekDetails: [
          w(1, "The Landscape", [
            r(
              "Bermúdez Ch 1–5 — history of cognitive science, classical computationalism, physical symbol systems",
            ),
            watch("Berkeley COGSCI 1 — Lectures 1–6 (field overview, history, methods)"),
            p("Turing (1950) — Computing Machinery and Intelligence"),
            note(
              "Start a running glossary of key terms and positions. You'll reference it all programme.",
            ),
          ]),
          w(2, "The Paradigms", [
            r("Bermúdez Ch 6–10 — connectionism, dynamical systems, Bayesian approaches"),
            watch("Berkeley COGSCI 1 — Lectures 7–14"),
            p("McCulloch & Pitts (1943) · Newell & Simon (1956)"),
            r("Skim: Dawson Mind, Body, World Ch 1–3 — second perspective on the same territory"),
          ]),
          w(
            3,
            "Synthesis + Artifact",
            [
              r("Bermúdez Ch 11–14 — embodied cognition, consciousness, the future"),
              watch("Berkeley COGSCI 1 — Lectures 15–25"),
              p("Miller (1956) — The Magical Number Seven"),
            ],
            {
              artifact: {
                title: "Paradigm Map Essay",
                length: "3,000 words",
                kind: "Written",
              },
              hours: "12–14",
            },
          ),
        ],
      },
      {
        code: "1.2",
        title: "Philosophy of Mind",
        weeks: [4, 7],
        question: "What is a mind? What is consciousness? Can machines think?",
        weekDetails: [
          w(4, "The Mind–Body Problem", [
            r(
              "Kim Philosophy of Mind Ch 1–4 — substance dualism, behaviorism, mind-brain identity",
            ),
            watch('Edinburgh Coursera "Philosophy of Cognitive Sciences" — Weeks 1–2'),
            p("Putnam (1967) — The Nature of Mental States"),
          ]),
          w(5, "Functionalism and Computation", [
            r("Kim Ch 5–7 — functionalism, machine functionalism, mental causation"),
            p("Searle (1980) — Minds, Brains, and Programs + peer commentary"),
            p("Fodor (1983) — Modularity of Mind Part I"),
            watch("Coursera — Weeks 3–4"),
          ]),
          w(6, "Consciousness and Qualia", [
            r("Kim Ch 8–10 — consciousness, qualia, the explanatory gap"),
            p("Nagel (1974) — What Is It Like to Be a Bat?"),
            p("Jackson (1982) — Epiphenomenal Qualia"),
            watch("Coursera — Weeks 5–6"),
            wr("Start outlining your essay — thesis + argument structure"),
          ]),
          w(7, "Artifact", [r("Reread key sections of Searle, Fodor, Putnam for your argument")], {
            artifact: {
              title: "Critical Essay on the Computational Theory of Mind",
              length: "4,000 words",
              kind: "Written",
            },
            hours: "14–16",
          }),
        ],
      },
      {
        code: "1.3",
        title: "Cognitive Psychology",
        weeks: [8, 10],
        question: "How do humans actually perceive, attend, remember, decide, and reason?",
        weekDetails: [
          w(8, "Perception and Attention", [
            r("Gazzaniga, Ivry & Mangun — Cognitive Neuroscience Ch 5–7 (perception, attention)"),
            p("Shepard & Metzler (1971) — Mental Rotation"),
            p("Sperry (1968) — Hemisphere Deconnection"),
            note(
              "Switched from Goldstein to Gazzaniga — the standard MSc-level text; integrates neuroscience from the start.",
            ),
          ]),
          w(9, "Memory, Reasoning, and Decision-Making", [
            r(
              "Gazzaniga et al. Ch 9 (memory), Ch 12 (decision & reasoning), Ch 13 (problem-solving)",
            ),
            p("Rosch & Mervis (1975) — Family Resemblances"),
            p("Tversky & Kahneman (1974) — Heuristics and Biases"),
            p("Wason (1968) — Reasoning About a Rule"),
            a(
              "Find the OSF pre-registration template (osf.io). Study 2–3 published pre-registrations in your target area.",
            ),
          ]),
          w(
            10,
            "Artifact",
            [
              wr(
                "Pick your phenomenon: anchoring, Stroop interference, false memory formation, etc.",
              ),
              wr("Write: background, hypothesis, method, predicted results, analysis plan"),
              note(
                "This pre-reg is a first draft — you'll tighten the stats plan after Module 1.5.",
              ),
            ],
            {
              artifact: {
                title: "Experiment Design Document (pre-registration style)",
                length: "~2,000 words",
                kind: "Written",
              },
              hours: "10–12",
            },
          ),
        ],
      },
      {
        code: "1.4",
        title: "Neuroscience & Neuroimaging Methods",
        weeks: [11, 14],
        question:
          "How does the brain give rise to cognition, and by what measurements do we actually probe it?",
        weekDetails: [
          w(11, "Neural Signaling", [
            r(
              "Bear, Connors & Paradiso — Neuroscience: Exploring the Brain Ch 2–4 (neurons, resting/action potential, synapses)",
            ),
            watch(
              "MIT 9.13 The Human Brain — Lectures 1–6 (Kanwisher: intro, methods, face perception)",
            ),
            note(
              "The most unfamiliar territory if you're coming from CS. Go slow. Take notes on mechanisms.",
            ),
          ]),
          w(12, "Sensory Systems", [
            r("Bear et al. Ch 6–10 — somatic sensation, auditory system, visual system in detail"),
            watch("MIT 9.13 — Lectures 7–12 (visual system, object recognition, attention)"),
            p("Lettvin et al. (1959) — What the Frog's Eye Tells the Frog's Brain"),
          ]),
          w(13, "Higher Cognition, Cortex, and Cognitive Neuroscience", [
            r("Bear et al. Ch 12 (cortical organization), Ch 24–25 (memory systems)"),
            r("Gazzaniga, Ivry & Mangun Ch 2–3 — methods overview, anatomy for cog neuro"),
            watch("MIT 9.13 — Lectures 13–18 (navigation, memory, language)"),
            r("Churchland Neurophilosophy — Ch 1–2 (bridging neuroscience and philosophy)"),
          ]),
          w(
            14,
            "Neuroimaging Methods + Artifact",
            [
              r(
                "Huettel, Song & McCarthy — Functional Magnetic Resonance Imaging Ch 1–5 (BOLD signal, GLM, experimental design)",
              ),
              r("Luck — An Introduction to the ERP Technique Ch 1–3 (N400, P300, MMN)"),
              p(
                "Kutas & Federmeier (2011) — Thirty years and counting: Finding meaning in the N400",
              ),
              r(
                "Skim: Hari & Puce — MEG-EEG Primer Ch 1–2; skim eye-tracking + pupillometry primer",
              ),
              a(
                "Pick one fMRI and one ERP paper from your area; annotate the methods sections end-to-end.",
              ),
              watch("MIT 9.13 — Lectures 19–24 (emotion, consciousness, social cognition)"),
              note(
                "The artifact is now methods-aware — each region is annotated with how we actually measured it.",
              ),
            ],
            {
              artifact: {
                title:
                  "Brain–Cognition–Methods Map — annotated diagram linking brain structures to cognitive functions AND to the imaging modality that licenses each claim",
                length: "Annotated diagram + ~1,500 word methods commentary",
                kind: "Visual",
              },
              hours: "12–14",
            },
          ),
        ],
      },
      {
        code: "1.5",
        title: "Research Methods & Statistics",
        weeks: [15, 17],
        question:
          "How does the field produce credible knowledge after the replication crisis? This is the methodology spine that every later artifact leans on.",
        weekDetails: [
          w(15, "The Replication Crisis and Open Science", [
            p("Simmons, Nelson & Simonsohn (2011) — False-Positive Psychology"),
            p(
              "Open Science Collaboration (2015) — Estimating the Reproducibility of Psychological Science",
            ),
            p("Munafò et al. (2017) — A Manifesto for Reproducible Science"),
            p("Gelman & Loken (2013) — The Garden of Forking Paths"),
            a(
              "Study two registered reports in detail; note how every degree of freedom was locked down before data collection.",
            ),
          ]),
          w(16, "Bayesian Data Analysis", [
            r(
              "McElreath — Statistical Rethinking Ch 1–5 (Bayesian updating, small worlds vs large worlds, geocentric models, multivariate regression)",
            ),
            watch("McElreath — Statistical Rethinking lectures 1–5 (YouTube)"),
            c(
              "Work through the Rethinking exercises in PyMC or the rethinking R package — reproduce Ch 4 & 5 figures from raw.",
            ),
          ]),
          w(
            17,
            "Mixed-Effects, Multiverse, and Artifact",
            [
              r("McElreath — Statistical Rethinking Ch 13 (multilevel models)"),
              p(
                "Barr, Levy, Scheepers & Tily (2013) — Random effects structure for confirmatory hypothesis testing: Keep it maximal",
              ),
              p(
                "Baayen, Davidson & Bates (2008) — Mixed-effects modeling with crossed random effects",
              ),
              p(
                "Steegen, Tuerlinckx, Gelman & Vanpaemel (2016) — Increasing transparency through a multiverse analysis",
              ),
              p(
                "Wagenmakers et al. (2011) — Why psychologists must change the way they analyze their data",
              ),
              note(
                "This module is a spine, not an artifact factory. You will revisit it in every subsequent modelling module.",
              ),
            ],
            {
              artifact: {
                title:
                  "Reanalysis of a Published Dataset — Bayesian hierarchical model + multiverse analysis + write-up with pre-registered analytic choices",
                length: "3,500 words + code + figures",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
    ],
  },
  {
    n: 2,
    title: "Computational Core",
    shortTitle: "Computational",
    subtitle: "Learn to model the mind computationally — with real statistics under every fit.",
    weeks: [18, 33],
    modules: [
      {
        code: "2.1",
        title: "Computational Cognitive Science",
        weeks: [18, 21],
        question: "How do we build formal, testable models of cognitive processes?",
        weekDetails: [
          w(18, "Modeling Foundations", [
            r(
              "Farrell & Lewandowsky Ch 1–4 — why model?, the modeling cycle, parameter estimation, model comparison",
            ),
            r(
              "Marr Vision Ch 1 — the three levels of analysis (computational, algorithmic, implementational)",
            ),
            watch("MIT Brains, Minds, Machines — Tenenbaum lectures (first 3)"),
          ]),
          w(19, "Model Fitting and Evaluation", [
            r(
              "Farrell & Lewandowsky Ch 5–8 — maximum likelihood, Bayesian estimation, model selection",
            ),
            watch("MIT Brains, Minds, Machines — Kanwisher + Poggio lectures"),
            c(
              "Set up your Python environment for cognitive modeling (NumPy, SciPy, matplotlib, Jupyter, PyMC)",
            ),
          ]),
          w(20, "Building Your First Model", [
            r("Farrell & Lewandowsky Ch 9–12 — specific model families, hierarchical models"),
            watch(
              "MIT OCW 9.66J — browse lecture notes, pick 2–3 topics matching your chosen phenomenon",
            ),
            c(
              "Start implementing your chosen cognitive phenomenon at the computational level (what problem is being solved?)",
            ),
          ]),
          w(
            21,
            "Artifact",
            [
              c("Complete algorithmic and implementational level analyses"),
              note(
                "Apply the Module 1.5 spine: report posterior distributions over parameters, not point estimates.",
              ),
            ],
            {
              artifact: {
                title: "Three-Level Model Analysis",
                length: "3,000 words + code",
                kind: "Written + Code",
              },
              hours: "14–16",
            },
          ),
        ],
      },
      {
        code: "2.2",
        title: "Bayesian Cognitive Science",
        weeks: [22, 25],
        question:
          "The mind as a rational inference engine — probabilistic models of learning, reasoning, and perception.",
        weekDetails: [
          w(22, "Bayesian Foundations", [
            r(
              "Griffiths, Chater & Tenenbaum Ch 1–4 — Bayes' theorem, priors, likelihood, posterior inference",
            ),
            r("Princeton Bayesian Reading List — pick 3 foundational papers"),
            c(
              "Implement Bayes' theorem from scratch. Solve toy problems (coin flipping, disease diagnosis).",
            ),
          ]),
          w(23, "Bayesian Models of Cognition", [
            r("Griffiths et al. Ch 5–8 — concept learning, causal reasoning, categorization"),
            r("Lee & Wagenmakers — Bayesian Cognitive Modeling Ch 1–5"),
            p("Tenenbaum (1999) — Bayesian modeling of human concept learning (the number game)"),
            c("Implement a Bayesian concept learning model targeting Tenenbaum's number game"),
          ]),
          w(24, "Advanced Topics + Data", [
            r("Griffiths et al. Ch 9–12 — language, perception, development"),
            p(
              "Nicenboim & Vasishth (2016) — Statistical methods for linguistic research: Foundational Bayesian ideas",
            ),
            c(
              "Find human behavioral data from a published study. Fit your hierarchical Bayesian model with a full random-effects structure. Compare predictions to data.",
            ),
          ]),
          w(
            25,
            "Artifact",
            [
              c("Finalize model, generate posterior predictive checks, generate comparison plots"),
              note("Compute BFs or information criteria (LOO / WAIC) per Module 1.5."),
            ],
            {
              artifact: {
                title: "Bayesian Cognitive Model Report",
                length: "3,000 words + Python code + figures",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
      {
        code: "2.3",
        title: "Connectionism and Neural Networks",
        weeks: [26, 29],
        question:
          "Parallel distributed processing — how networks of simple units give rise to complex cognition.",
        weekDetails: [
          w(26, "PDP Foundations", [
            r(
              "O'Reilly & Munakata (free online) Ch 1–3 — neuroscience foundations, learning mechanisms, networks",
            ),
            p("Rumelhart, Hinton & Williams (1986) — Back-Propagation"),
            p("Rosenblatt (1958) — The Perceptron"),
            c(
              "Implement a simple feedforward network from scratch in Python (no frameworks). Train on XOR.",
            ),
          ]),
          w(27, "Cognitive Models with Networks", [
            r("O'Reilly & Munakata Ch 4–6 — perception, attention, memory"),
            p("McClelland & Rumelhart (1981) — Interactive Activation Model"),
            r("PDP Vol 1 — Ch 1 (overview), Ch 8 (past tense)"),
            c(
              "Start building your chosen PDP model (word recognition, past tense, or categorization)",
            ),
          ]),
          w(28, "The Systematicity Debate", [
            r("O'Reilly & Munakata Ch 7–9 — language, executive function, development"),
            p(
              "Fodor & Pylyshyn (1988) — Connectionism and Cognitive Architecture — the core critique",
            ),
            c(
              "Continue model development. Run experiments with mixed-effects analysis on results across seeds.",
            ),
          ]),
          w(
            29,
            "Artifact",
            [
              c(
                "Analyze model representations (hidden unit activations, similarity structure, representational similarity analysis)",
              ),
            ],
            {
              artifact: {
                title: "PDP Modeling Project — includes response to Fodor & Pylyshyn",
                length: "3,000 words + code",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
      {
        code: "2.4",
        title: "Computational Neuroscience",
        weeks: [30, 33],
        question: "Mathematical models of neurons, circuits, and neural computation.",
        weekDetails: [
          w(30, "Neural Encoding", [
            r("Dayan & Abbott Ch 1–2 — neural encoding, firing rates, tuning curves"),
            watch("Coursera Computational Neuroscience (UW) — Weeks 1–3"),
            c("Simulate a leaky integrate-and-fire neuron. Plot firing rate curves."),
          ]),
          w(31, "Neural Decoding and Information", [
            r("Dayan & Abbott Ch 3–4 — decoding, information theory, signal detection"),
            watch("Coursera — Weeks 4–6"),
            c(
              "Implement a population coding model (e.g., orientation tuning in V1) with a Bayesian decoder",
            ),
          ]),
          w(32, "Network Models", [
            r("Dayan & Abbott Ch 7–8 — network models, associative memory, attractor dynamics"),
            watch("Coursera — Weeks 7–8"),
            watch("Browse: MIT BCS Computational Tutorial Series — relevant tutorials"),
            c(
              "Start implementing your circuit model (drift-diffusion, Hopfield, or winner-take-all)",
            ),
          ]),
          w(
            33,
            "Artifact",
            [
              c("Complete model. Analyze dynamics. Generate figures."),
              note(
                "Semester 2 review: you can now model cognition computationally at multiple levels with honest statistics. Take a breath.",
              ),
            ],
            {
              artifact: {
                title: "Neural Circuit Model Report",
                length: "2,500 words + code + figures",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
    ],
  },
  {
    n: 3,
    title: "Brain, Behaviour, and Development",
    shortTitle: "Brain & Dev",
    subtitle: "Memory, value, development, and language — the empirical heart of the field.",
    weeks: [34, 47],
    modules: [
      {
        code: "3.1",
        title: "Memory and Learning Systems",
        weeks: [34, 36],
        question:
          "What are the memory systems, how are traces formed and reformed, and why does consolidation never really end?",
        weekDetails: [
          w(34, "The Classical Taxonomy", [
            p("Tulving (1972) — Episodic and semantic memory"),
            p(
              "Squire (1992) — Memory and the hippocampus: A synthesis from findings with rats, monkeys, and humans",
            ),
            r(
              "Eichenbaum — Cognitive Neuroscience of Memory Ch 1–4 (systems, hippocampal function, relational memory)",
            ),
          ]),
          w(35, "Circuits, Oscillations, Reconsolidation", [
            r(
              "Buzsáki — Rhythms of the Brain Ch 8 & 11 (hippocampal theta, sequence replay, memory consolidation)",
            ),
            r("Eichenbaum Ch 5–8 (systems-level consolidation, pattern separation and completion)"),
            p(
              "Nader, Schafe & LeDoux (2000) — Fear memories require protein synthesis in the amygdala for reconsolidation",
            ),
            p("Dudai (2012) — The Restless Engram: Consolidations Never End"),
          ]),
          w(
            36,
            "Artifact",
            [
              note(
                "A self-directed cog-sci programme that ignores memory is building on sand. This module closes that gap.",
              ),
            ],
            {
              artifact: {
                title:
                  "Memory Systems Essay — standard model of consolidation vs. reconsolidation: where each is right, where the evidence forces revision",
                length: "3,500 words",
                kind: "Written",
              },
              hours: "12–14",
            },
          ),
        ],
      },
      {
        code: "3.2",
        title: "Reinforcement Learning and Decision Neuroscience",
        weeks: [37, 40],
        question:
          "How do brains learn to value and to choose? The single most empirically productive arm of contemporary cog-neuro.",
        weekDetails: [
          w(37, "RL Foundations", [
            r(
              "Sutton & Barto — Reinforcement Learning: An Introduction Ch 1–4 (MDPs, dynamic programming, Monte Carlo)",
            ),
            p("Rescorla & Wagner (1972) — A theory of Pavlovian conditioning"),
          ]),
          w(38, "Dopamine as Prediction Error", [
            r("Sutton & Barto Ch 5–7 (TD learning, n-step, planning)"),
            p("Schultz, Dayan & Montague (1997) — A neural substrate of prediction and reward"),
            p("Niv (2009) — Reinforcement learning in the brain"),
          ]),
          w(39, "Model-Based, Model-Free, and Decision Neuroscience", [
            r("Sutton & Barto Ch 8 (planning and learning with tabular methods)"),
            p(
              "Daw, Gershman, Seymour, Dayan & Dolan (2011) — Model-based influences on humans' choices and striatal prediction errors",
            ),
            r("Gershman — What Makes Us Smart Ch 3, 5, 7"),
            p("Gershman, Horvitz & Tenenbaum (2015) — Computational rationality"),
          ]),
          w(
            40,
            "Artifact",
            [
              c(
                "Implement the Daw two-step task and fit a hybrid model-based / model-free learner",
              ),
              c(
                "Show how the mixing weight shifts under cognitive load or stress (use a published dataset; mixed-effects estimation per Module 1.5)",
              ),
            ],
            {
              artifact: {
                title: "Two-Step Task Implementation + Hybrid MB/MF Analysis",
                length: "3,000 words + code + figures",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
      {
        code: "3.3",
        title: "Developmental, Comparative & Social Cognition",
        weeks: [41, 44],
        question:
          "How does cognition come into existence — across development, across species, and between minds?",
        weekDetails: [
          w(41, "Development I — Piaget, Vygotsky, Core Knowledge", [
            r("Piaget — The Construction of Reality in the Child (selected chapters)"),
            r("Vygotsky — Mind in Society (selected chapters on the zone of proximal development)"),
            r(
              "Spelke — What Babies Know Ch 1–5 (core knowledge of objects, agents, number, places)",
            ),
            p("Spelke & Kinzler (2007) — Core knowledge"),
          ]),
          w(42, "Development II — Conceptual Change, Bayesian Theory-Theory, Number", [
            r("Carey — The Origin of Concepts Ch 1–4, 8 (bootstrapping and conceptual change)"),
            p(
              "Gopnik & Wellman (2012) — Reconstructing constructivism: causal models, Bayesian learning mechanisms, and the theory-theory",
            ),
            p("Xu & Garcia (2008) — Intuitive statistics by 8-month-old infants"),
            p(
              "Dehaene, Izard, Spelke & Pica (2008) — Log or linear? Distinct intuitions of the number scale",
            ),
          ]),
          w(43, "Comparative Cognition", [
            r("de Waal — Are We Smart Enough to Know How Smart Animals Are? Ch 1–5, 9–11"),
            p("Premack & Woodruff (1978) — Does the chimpanzee have a theory of mind?"),
            p(
              "Call & Tomasello (2008) — Does the chimpanzee have a theory of mind? 30 years later",
            ),
            p(
              "Hauser, Chomsky & Fitch (2002) — The faculty of language: what is it, who has it, and how did it evolve?",
            ),
            p("Santos & Rosati (2015) — The evolutionary roots of human decision making"),
          ]),
          w(
            44,
            "Social Cognition, Theory of Mind, WEIRD + Artifact",
            [
              p("Leslie (1987) — Pretense and representation: The origins of 'theory of mind'"),
              p(
                "Baron-Cohen, Leslie & Frith (1985) — Does the autistic child have a 'theory of mind'?",
              ),
              p("Wellman, Cross & Watson (2001) — Meta-analysis of theory-of-mind development"),
              p(
                "Apperly & Butterfill (2009) — Do humans have two systems to track beliefs and belief-like states?",
              ),
              p("Saxe & Kanwisher (2003) — People thinking about thinking people (rTPJ)"),
              p(
                "Hickok (2009) — Eight problems for the mirror neuron theory of action understanding",
              ),
              p("Sperber & Mercier (2011) — Why do humans reason? (argumentative theory)"),
              p("Henrich, Heine & Norenzayan (2010) — The weirdest people in the world?"),
            ],
            {
              artifact: {
                title:
                  "Uniquely-Human Cognition Essay — what (if anything) is uniquely human? Argue across core-knowledge, comparative, ToM, and cultural evolution evidence",
                length: "5,000 words",
                kind: "Written",
              },
              hours: "16–18",
            },
          ),
        ],
      },
      {
        code: "3.4",
        title: "Language and Psycholinguistics",
        weeks: [45, 47],
        question:
          "How does language relate to thought? Is it symbolic computation, embodied simulation, dialogic alignment, or something else?",
        weekDetails: [
          w(45, "Architecture of the Language Faculty", [
            r("Jackendoff — Foundations of Language Ch 1–6 (parallel architecture)"),
            p("Chomsky (1959) — Review of Skinner (historical context)"),
            p("Pinker & Jackendoff (2005) — The faculty of language: What's special about it?"),
          ]),
          w(46, "Sentence Processing, Alignment, Acquisition, Embodiment", [
            r("Bergen — Louder than Words (full book — accessible, engaging)"),
            r("Lakoff & Johnson — Metaphors We Live By (full book, ~190 pages)"),
            p("Pickering & Garrod (2004) — Toward a mechanistic psychology of dialogue"),
            p("Trueswell, Tanenhaus & Garnsey (1994) — Semantic influences on parsing"),
            p(
              "Tanenhaus, Spivey-Knowlton, Eberhard & Sedivy (1995) — Integration of visual and linguistic information in spoken language comprehension",
            ),
            p("Tomasello (2003) — Constructing a Language (selected chapters)"),
          ]),
          w(
            47,
            "Artifact",
            [
              note(
                "Semester 3 review: you now have the empirical substrate — memory, value, development, language — that the embodied/phenomenological turn in Semester 4 will push against.",
              ),
            ],
            {
              artifact: {
                title:
                  "Language & Embodiment Analysis — embodied simulation, dialogic alignment, and the Chomskyan/Tomasello debate through computational + phenomenological lenses",
                length: "3,500 words",
                kind: "Written",
              },
              hours: "12–14",
            },
          ),
        ],
      },
    ],
  },
  {
    n: 4,
    title: "The Embodied & Phenomenological Turn",
    shortTitle: "Embodied Turn",
    subtitle:
      "Challenge the computational orthodoxy. What if the body, the world, and lived experience are constitutive of mind?",
    weeks: [48, 61],
    modules: [
      {
        code: "4.1",
        title: "Embodied Cognition and Enactivism",
        weeks: [48, 51],
        question:
          "Cognition isn't just in the head. It's in the body, the environment, and the dynamic coupling between them.",
        weekDetails: [
          w(48, "The Embodied Mind", [
            r("Varela, Thompson & Rosch — The Embodied Mind (full book, ~280 pages)"),
            p("Gibson (1979) — Chapter on affordances"),
            note(
              "This will challenge the computational framing you've built in Semester 2. Sit with the tension.",
            ),
          ]),
          w(49, "Situated Cognition", [
            r("Clark — Being There (full book)"),
            p("Brooks (1991) — Intelligence Without Representation"),
            p("Clark & Chalmers (1998) — The Extended Mind"),
          ]),
          w(50, "Deep Enactivism", [
            r(
              "Thompson — Mind in Life Ch 1–4, Ch 7–8 (autonomy, sense-making, life-mind continuity)",
            ),
            p("Di Paolo, Buhrmann & Barandiaran (2017) — Sensorimotor Life: selected chapters"),
            wr("Start outlining your 5,000-word comparative essay"),
          ]),
          w(51, "Artifact", [note("This is a major essay. Block out extra time this week.")], {
            artifact: {
              title: "Comparative Framework Essay — computationalism vs embodied vs enactive",
              length: "5,000 words",
              kind: "Written",
            },
            hours: "16–18",
          }),
        ],
      },
      {
        code: "4.2",
        title: "Phenomenology for Cognitive Science",
        weeks: [52, 54],
        question:
          "What can first-person experience teach us about the structure of the mind — and what does Dreyfus force computationalism to concede?",
        weekDetails: [
          w(52, "The Phenomenological Method", [
            r(
              "Gallagher & Zahavi — The Phenomenological Mind Ch 1–5 (method, intentionality, consciousness, self-consciousness)",
            ),
            r(
              "Merleau-Ponty — Phenomenology of Perception, Preface + Part I Ch 1–3 (body schema, motor intentionality) — required, not optional",
            ),
            r("Noë — Action in Perception Ch 1–3 (perception as something we do)"),
          ]),
          w(53, "Body, Time, Intersubjectivity, and the Dreyfus Bridge", [
            r(
              "Gallagher & Zahavi Ch 6–10 — embodiment, time-consciousness, intersubjectivity, social cognition",
            ),
            r(
              "Dreyfus — What Computers Still Can't Do (Introduction to the MIT edition + Ch 1, 7) — the essential bridge text against classical AI",
            ),
            p(
              "Dreyfus (2007) — Why Heideggerian AI failed and how fixing it would require making it more Heideggerian",
            ),
            r("Optional: Gallagher — How the Body Shapes the Mind Ch 1–4"),
          ]),
          w(54, "Artifact", [], {
            artifact: {
              title:
                "Phenomenological Analysis — first-person description of a cognitive phenomenon + constraints on computational models, with Dreyfusian critique",
              length: "4,000 words",
              kind: "Written",
            },
            hours: "14–16",
          }),
        ],
      },
      {
        code: "4.3",
        title: "Consciousness Studies",
        weeks: [55, 58],
        question:
          "The hard problem, the easy problems, and the theories trying to bridge them — including the one most empirically grounded theory the 2010s canon tends to forget.",
        weekDetails: [
          w(55, "The Hard Problem", [
            r(
              "Chalmers — The Conscious Mind Part I (Ch 1–5: the hard problem, supervenience, logical possibility of zombies)",
            ),
            p("Chalmers (1995) — Facing Up to the Problem of Consciousness"),
            p(
              "Block (1995) — On a Confusion About a Function of Consciousness (access vs phenomenal)",
            ),
          ]),
          w(56, "Global Workspace Theory — Baars & Dehaene", [
            r("Baars — A Cognitive Theory of Consciousness Ch 1–4 (origin of GWT)"),
            r(
              "Dehaene — Consciousness and the Brain Ch 1–5 (Global Neuronal Workspace, signatures of conscious access)",
            ),
            p(
              "Dehaene & Changeux (2011) — Experimental and theoretical approaches to conscious processing",
            ),
          ]),
          w(57, "Competing Theories — IIT, HOT, PP, and Dennett", [
            r("Koch — The Feeling of Life Itself Ch 1–5 (Integrated Information Theory)"),
            r(
              "Dennett — Consciousness Explained Ch 5–7, 10–12 (multiple drafts model, qualia disqualified)",
            ),
            r("Hohwy — The Predictive Mind Ch 1–3"),
            p("Lau & Rosenthal (2011) — Empirical support for higher-order theories"),
            p(
              "Block (2007) — Consciousness, accessibility, and the mesh between psychology and neuroscience",
            ),
          ]),
          w(58, "Artifact", [], {
            artifact: {
              title:
                "Consciousness Theory Evaluation — contrast GWT, IIT, HOT, PP on empirical and conceptual grounds; does any solve the hard problem?",
              length: "4,500 words",
              kind: "Written",
            },
            hours: "14–16",
          }),
        ],
      },
      {
        code: "4.4",
        title: "Predictive Processing and Free Energy",
        weeks: [59, 61],
        question:
          "The brain as a prediction machine — perception, action, and learning as inference.",
        weekDetails: [
          w(59, "The Prediction Machine", [
            r(
              "Clark — Surfing Uncertainty Ch 1–5 (prediction machine, perception as controlled hallucination, action-oriented PP)",
            ),
            r("Hohwy — The Predictive Mind Ch 4–8"),
          ]),
          w(60, "The Free Energy Principle", [
            r(
              "Clark — Surfing Uncertainty Ch 6–10 (attention, emotion, the hard problem through PP)",
            ),
            p("Friston (2010) — The Free-Energy Principle: A Unified Brain Theory?"),
            p("Friston (2009) — Predictive Coding Under the Free-Energy Principle"),
            p("Parr, Pezzulo & Friston (2022) — Active Inference: selected chapters"),
          ]),
          w(
            61,
            "Building the Model + Artifact",
            [
              c(
                "Implement a simple predictive coding model — hierarchical message-passing between 2–3 layers",
              ),
              c(
                "Demonstrate prediction error minimization on a toy perceptual task (line orientation, simple pattern completion)",
              ),
              c("Vary precision weighting; show how it changes model behavior"),
              note(
                "Semester 4 review: you've traveled from computation to embodiment to phenomenology to prediction. The synthesis is coming.",
              ),
            ],
            {
              artifact: {
                title:
                  "Predictive Coding Model + Paper — connect computation to philosophy of perception and agency",
                length: "3,000 words + code",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
    ],
  },
  {
    n: 5,
    title: "Integration & Capstone",
    shortTitle: "Capstone",
    subtitle: "Catch up to 2026, pull everything together, ship original research.",
    weeks: [62, 80],
    modules: [
      {
        code: "5.1",
        title: "Contemporary Computational Cognitive Science",
        weeks: [62, 64],
        question:
          "Where is the field in the mid-2020s? Probabilistic programs, program synthesis, LLMs as cognitive models, and mechanistic interpretability.",
        weekDetails: [
          w(62, "Human-Machine Learning Comparison", [
            p(
              "Lake, Ullman, Tenenbaum & Gershman (2017) — Building machines that learn and think like people",
            ),
            p("Marcus (2018) — Deep learning: A critical appraisal"),
            p("Shiffrin & Mitchell (2023) — Probing the psychology of AI models"),
          ]),
          w(63, "Probabilistic Programs, Pragmatics, LLMs as Cognitive Models", [
            p("Frank & Goodman (2012) — Predicting pragmatic reasoning in language games (RSA)"),
            p(
              "Goodman & Frank (2016) — Pragmatic language interpretation as probabilistic inference",
            ),
            p(
              "Ellis et al. (2021) — DreamCoder: Bootstrapping inductive program synthesis with wake-sleep library learning",
            ),
            p(
              "Binz & Schulz (2023) — Using cognitive psychology to understand GPT-3; Turning LLMs into cognitive models",
            ),
          ]),
          w(
            64,
            "Mechanistic Interpretability + Artifact",
            [
              p("Olah et al. (2020) — Zoom In: An Introduction to Circuits"),
              p("Bricken et al. (2023) — Towards Monosemanticity (Anthropic)"),
              p("Elhage et al. (2022) — Toy Models of Superposition"),
              p("Sharkey et al. (2025) — Open Problems in Mechanistic Interpretability"),
              c(
                "Reproduce a small mech-interp result — probe for induction heads on a small transformer using TransformerLens, or replicate one of the toy-models findings",
              ),
            ],
            {
              artifact: {
                title:
                  "Contemporary Computational Cog-Sci Essay — are LLMs cognitive models? What counts as understanding in 2026? (with reproducibility notebook)",
                length: "4,000 words + code",
                kind: "Code + Report",
              },
              hours: "14–16",
            },
          ),
        ],
      },
      {
        code: "5.2",
        title: "Cognitive Architectures",
        weeks: [65, 67],
        question: "Can we build a unified theory of the mind? What would it take?",
        weekDetails: [
          w(65, "Classical Architectures", [
            r(
              "Newell — Unified Theories of Cognition Ch 1–4 (the case for unified theories, Soar)",
            ),
            r("Anderson — How Can the Human Mind Occur in the Physical Universe? Ch 1–4 (ACT-R)"),
          ]),
          w(66, "Beyond Classical", [
            r(
              "Clark — Supersizing the Mind (full book: extended mind, cognitive assembly, scaffolded cognition)",
            ),
            note(
              "Revisit key chapters from Varela et al., Clark Surfing Uncertainty, Thompson Mind in Life, Lake et al. — now with architecture eyes.",
            ),
          ]),
          w(
            67,
            "Artifact",
            [
              note(
                "The convergent essay where everything you've learned comes together — the intellectual capstone before the research project.",
              ),
            ],
            {
              artifact: {
                title:
                  "Cognitive Architectures Analysis — classical (ACT-R, Soar), connectionist, Bayesian, predictive processing, enactive, LLM-as-architecture. Propose criteria for a complete theory of mind.",
                length: "5,000 words",
                kind: "Written",
              },
              hours: "16–18",
            },
          ),
        ],
      },
      {
        code: "5.3",
        title: "Dynamical Systems",
        weeks: [68, 70],
        question: "Cognition as a dynamical process, not a computational one.",
        weekDetails: [
          w(68, "Foundations — Mind as Motion", [
            r(
              "Port & van Gelder (eds) — Mind as Motion Ch 1–3 (the dynamical hypothesis) + one applied chapter (decision making or speech)",
            ),
            r("Kelso — Dynamic Patterns Ch 1–4 (coordination dynamics, HKB model, metastability)"),
            p("Beer (2000) — Dynamical Approaches to Cognitive Science"),
            a(
              "Work through basic dynamical systems math — phase spaces, attractors, bifurcations (3Blue1Brown + Strogatz Nonlinear Dynamics Ch 1–3 selections)",
            ),
          ]),
          w(69, "Modeling Dynamics", [
            r(
              "Hutchins — Cognition in the Wild Ch 1–4, Ch 9 (distributed cognition in naval navigation)",
            ),
            r("Port & van Gelder — chapter on Smith & Thelen on A-not-B"),
            c(
              "Implement a dynamical systems model — HKB coupled oscillator, A-not-B (Thelen/Smith), or a drift-diffusion with collapsing bounds",
            ),
            c("Generate phase space plots, identify attractor states, demonstrate bifurcations"),
          ]),
          w(70, "Artifact", [], {
            artifact: {
              title: "Dynamical Systems Model + Report",
              length: "2,500 words + code + phase space plots",
              kind: "Code + Report",
            },
            hours: "12–14",
          }),
        ],
      },
      {
        code: "5.4",
        title: "Masters Research Project",
        weeks: [71, 80],
        question:
          "The capstone. Original research integrating multiple strands of the curriculum — and the first piece of your work that lives or dies by external feedback.",
        weekDetails: [
          w(71, "Topic Selection and Scoping", [
            a(
              "Decide your format: Edinburgh (10–15K dissertation), Stanford (qualifying paper + thesis), or single long-form paper",
            ),
            wr(
              'Finalize topic. Suggested: "Cognitive Architecture as Lived Structure: A Predictive Processing and Enactive Account with Implications for AI Agent Design"',
            ),
            wr(
              "Write: 1-page project proposal — research question, method, expected contribution, outline",
            ),
            a(
              "Identify 2 PhD students or early-career postdocs in the field who will read two drafts each for $200 per reader. Budget: $400–800 total. Reach out now; lead time is weeks, not days.",
            ),
          ]),
          w(72, "Literature Review Deep Dive", [
            r(
              "Read 15–20 papers directly relevant to your topic (Google Scholar, Semantic Scholar, Connected Papers)",
            ),
            wr("Write: Literature review draft (3,000–4,000 words)"),
            note("Identify the specific gap your project addresses."),
          ]),
          w(73, "Literature Review Refinement", [
            wr("Revise literature review based on gaps found while reading"),
            r("Read 5–10 more papers to fill specific holes"),
            wr("Write: Refined literature review (4,000–5,000 words)"),
          ]),
          w(74, "Core Argument / Experiment I", [
            wr(
              "Theoretical: develop your central argument — first main section. Each section advances a distinct claim supported by evidence.",
            ),
            c(
              "Empirical: begin designing and implementing your computational experiment — with pre-registered analysis plan (Module 1.5).",
            ),
          ]),
          w(75, "Core Argument / Experiment II — First Paid Read", [
            wr("Theoretical: continue with second and third main sections."),
            c("Empirical: collect results, iterate on design."),
            a(
              "Send proposal + literature review + partial draft to Reader 1. Turnaround: 1–2 weeks.",
            ),
          ]),
          w(76, "Drafting I", [
            wr("Full first draft — aim for ~50% of target word count"),
            note(
              "Include: introduction, literature review, main body (argument or experiment + results), discussion, conclusion. Don't self-edit yet.",
            ),
          ]),
          w(77, "Drafting II — Integrate First Reader Feedback", [
            wr("Integrate Reader 1 feedback. Push to 80% of target word count."),
            note(
              "Get it all down first, then integrate structural feedback. Editing is the next phase.",
            ),
          ]),
          w(78, "Revision Pass 1 — Structure + Second Paid Read", [
            wr(
              "Reread the full draft. Fix structural issues: does the argument flow? Are sections in the right order? Is the research question clearly answered?",
            ),
            wr("Cut anything that doesn't serve the argument. Add where the argument is thin."),
            a("Send revised full draft to Reader 2 (fresh eyes). Turnaround: 1–2 weeks."),
          ]),
          w(79, "Revision Pass 2 — Quality", [
            wr("Line-edit for clarity, precision, and academic voice"),
            a("Check: every claim has a citation or argument. Every section connects to the next."),
            wr(
              "Integrate Reader 2 feedback. Optional: loop back to Reader 1 for a final short read of the discussion section.",
            ),
          ]),
          w(
            80,
            "Final Revision, Presentation, and Completion",
            [
              wr("Final polish: abstract, bibliography, formatting"),
              a(
                "Prepare a 20-minute presentation of your research (slides or outline — even without audience, the exercise forces synthesis). Record yourself giving the presentation.",
              ),
              note("Compile your full artifact portfolio — 21 pieces of work across ~18 months."),
              note(
                "Celebrate. You just completed an MSc-equivalent education in cognitive science — with a methods spine, a real feedback loop, and contemporary reach.",
              ),
            ],
            {
              artifact: {
                title: "Masters Research Project",
                length: "10,000–20,000 words (format-dependent)",
                kind: "Dissertation",
              },
            },
          ),
        ],
      },
    ],
  },
];

/** Flat list of weeks that have an artifact, in order. */
export const artifactWeeks: number[] = semesters
  .flatMap((s) => s.modules.flatMap((m) => m.weekDetails))
  .filter((w) => !!w.artifact)
  .map((w) => w.n);

/**
 * Committed progress — the source of truth for what's been completed.
 *
 * Edit this array and commit to publish progress. No localStorage, no backend —
 * the page reflects exactly what's in git.
 *
 * Note: artifact weeks only count toward progress when the corresponding
 * `artifact.link` is also set. You can list an artifact week here, but it
 * will render as "awaiting link" until the URL is filled in. This enforces
 * the rule: artifacts ship before they count.
 */
export const completedWeeks: number[] = [];

/**
 * The week currently being worked on. At most one at a time.
 * Set to `null` when between modules or not actively studying.
 * Rendered with a distinct "in progress" treatment in the heatmap,
 * curriculum list, and dashboard counter.
 */
export const inProgressWeek: number | null = null;
