/* News — one object per item. Rendered newest first (sorted by `date`).
     date   "YYYY-MM" (or "YYYY" if only the year is known)
     html   the item text; may contain <em> and <a> tags
   Items marked "month to confirm" carry a month I could not verify from
   the CV — change the date if it is wrong.
*/
window.SITE = window.SITE || {};

SITE.news = [
  { date: "2026-11", html: "Presented <em>ShapeToVec+</em> at <a href=\"https://doi.org/10.1145/3841645.3843377\" target=\"_blank\" rel=\"noopener noreferrer\">ACM SIGSPATIAL 2026</a>, Riverside, CA, supported by a SIGSPATIAL travel grant. <a href=\"assets/sigspatial26/index.html\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the poster animation</a>." },
  { date: "2026-11", html: "<em>Learning Compact Polygon Signatures via Weighted-Jaccard-Native Distillation</em>, led by my master's mentee Ruban Sampath, submitted to the IEEE Big Spatial Data workshop (BSD 2026)." },
  { date: "2026-10", html: "<em>JPQ</em>, the first product quantizer for the weighted-Jaccard metric, accepted as a short paper at IEEE BigData 2026 (19.2% acceptance rate)." },
  { date: "2026-08", html: "<em>ShapeToVec+</em> accepted at <a href=\"https://sigspatial2026.sigspatial.org/short-paper-accepted/\" target=\"_blank\" rel=\"noopener noreferrer\">ACM SIGSPATIAL 2026</a>, Riverside, CA." },
  { date: "2026-08", html: "<em>JPQ</em>, a weighted-Jaccard product quantizer for billion-scale shape search, submitted to IEEE BigData 2026." },
  { date: "2026-06", html: "Talk at the NAIRR Pilot Classroom Expansion Conference, Orlando: lessons from teaching CS 5463 with NAIRR resources. Supported by a Computing Research Association travel grant." },
  { date: "2026-05", html: "Presented the Research Activities Management Portal (RAMP) at the <a href=\"https://scooterlab.utsa.edu/workshop2026/\" target=\"_blank\" rel=\"noopener noreferrer\">ScooterLab Workshop 2026</a>; organizing committee member." },
  { date: "2026-05", html: "Proceedings Chair for EduPar-26, held with IPDPS 2026." }, // month to confirm
  { date: "2026-04", html: "Poster judge, Graduate Student Appreciation Week Symposium, UTSA." }, // month to confirm
  { date: "2025-12", html: "Presented <em>ShapeToVec</em> at <a href=\"https://ieeexplore.ieee.org/document/11401899\" target=\"_blank\" rel=\"noopener noreferrer\">IEEE BigData 2025</a> (18.7% acceptance rate)." },
  { date: "2025-12", html: "Released the <a href=\"https://doi.org/10.5281/zenodo.11522173\" target=\"_blank\" rel=\"noopener noreferrer\">ShapeToVec Benchmark Dataset v2.1</a> on Zenodo: 1.3 TB of polygons with similarity ground truth." },
  { date: "2025-12", html: "Proceedings Chair for EduHiPC-25, held with HiPC 2025." }, // month to confirm
  { date: "2025-10", html: "Talk at the UTSA CS Algorithms Seminar on segment tree-based polygon clipping with OpenMP and OpenACC." }, // month to confirm
  { date: "2025-09", html: "Poster at the Postdoctoral Appreciation Week presentations, UTSA Graduate School." }, // month to confirm
  { date: "2025-05", html: "Introduced RAMP at the <a href=\"https://scooterlab.utsa.edu/workshop2025/\" target=\"_blank\" rel=\"noopener noreferrer\">ScooterLab Workshop 2025</a>; organizing committee member." },
  { date: "2025-05", html: "Proceedings Chair for EduPar-25, held with IPDPS 2025." }, // month to confirm
  { date: "2025-04", html: "Co-PI on an NSF ACCESS classroom award (100,000 credits on NCSA Delta) for CS 5463 High Performance Machine Learning; also wrote the course's NSF NAIRR Pilot proposal (100,000 SUs on Jetstream2)." },
  { date: "2025-04", html: "Poster at the NSF AI Spring School, MATRIX AI Consortium, UTSA." }, // month to confirm
  { date: "2025-03", html: "ScooterLab demo paper presented at <a href=\"https://ieeexplore.ieee.org/abstract/document/11038542\" target=\"_blank\" rel=\"noopener noreferrer\">IEEE PerCom 2025</a>." },
  { date: "2024-12", html: "Proceedings Chair for EduHiPC-24, held with HiPC 2024." }, // month to confirm
  { date: "2024-09", html: "Started as a Postdoctoral Fellow in the Department of Computer Science, UT San Antonio." },
  { date: "2024-08", html: "Presented the segment tree-based polygon clipping paper at <a href=\"https://dl.acm.org/doi/abs/10.1145/3673038.3673141\" target=\"_blank\" rel=\"noopener noreferrer\">ICPP 2024</a>." },
  { date: "2024-07", html: "Defended Ph.D. in Computer Science at UT San Antonio." },
  { date: "2024-05", html: "Poster at the IPDPS 2024 Ph.D. Forum." }, // month to confirm
  { date: "2024-04", html: "Guest lecture on approximate nearest neighbor similarity search in CS 4593 CS-CURE, UTSA." }, // month to confirm
  { date: "2023-11", html: "Student volunteer at SC23; became webmaster of the EduHPC workshop series (EduHPC, EduPar, EduHiPC)." },
  { date: "2023-10", html: "Poster at the \"30 to R1\" Research Poster Showcase, UTSA Graduate School." }, // month to confirm
  { date: "2023-05", html: "<em>Best Paper Finalist</em> at <a href=\"https://ieeexplore.ieee.org/abstract/document/10171568\" target=\"_blank\" rel=\"noopener noreferrer\">IEEE/ACM CCGrid 2023</a> for the PRAM and GPU polygon clipping paper." },
  { date: "2023-04", html: "Finalist, Radiance Innovation Bowl (Radiance Technologies)." }, // month to confirm
  { date: "2022-08", html: "NSF student travel grant to attend the MVAPICH User Group (MUG) conference; poster presented." },
  { date: "2022-05", html: "Poster at the IPDPS 2022 Ph.D. Forum." } // month to confirm
];
