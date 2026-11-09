/* Publications — one object per paper. Newest first.
   Fields:
     key        reference key, matches the CV ([C6] … [E1]); unpublished work uses U*
     type       "conference" | "journal" | "preprint"
     year       number
     title      string
     authors    array of strings; the name matching SITE.me is rendered bold
     venue      italic line printed under the authors (include the year here)
     url        official page (publisher / IEEE Xplore / ACM DL / Springer)
     urlLabel   text for that link
     doi        optional DOI (rendered as a doi.org link)
     status     optional soft badge for unpublished work
     badges     optional array of {text, award:true} for awards / acceptance rates
     keywords   used by the search box together with title, authors and venue
     selected   true → shown under "Selected publications" on the home page
     bibtex     optional BibTeX string
*/
window.SITE = window.SITE || {};

SITE.me = "M. K. Buddhi Ashan";

SITE.publications = [
  {
    key: "C6",
    type: "conference",
    year: 2026,
    title: "JPQ: Weighted-Jaccard-Aware Product Quantization for Billion-Scale Approximate Shape Similarity Search",
    authors: ["M. K. Buddhi Ashan", "Ruban Sampath", "Sushil K. Prasad"],
    venue: "Short paper, 2026 IEEE International Conference on Big Data (BigData). IEEE, 2026.",
    badges: [{ text: "To appear" }, { text: "Acceptance rate 19.2%" }],
    keywords: ["JPQ", "product quantization", "billion-scale", "weighted Jaccard", "approximate nearest neighbor", "polygon similarity", "vector index", "HNSW", "asymmetric distance computation"],
    selected: true,
    bibtex: `@inproceedings{ashan2026jpq,
  author    = {Ashan, M. K. Buddhi and Sampath, Ruban and Prasad, Sushil K.},
  title     = {JPQ: Weighted-Jaccard-Aware Product Quantization for Billion-Scale Approximate Shape Similarity Search},
  booktitle = {2026 IEEE International Conference on Big Data (BigData)},
  year      = {2026},
  publisher = {IEEE},
  note      = {Short paper, to appear}
}`
  },  {
    key: "C5",
    type: "conference",
    year: 2026,
    title: "ShapeToVec+: A Memory and Query-Efficient System for Weighted-Jaccard Search over Large-scale Polygon Collections",
    authors: ["M. K. Buddhi Ashan", "Ruban Sampath", "Sushil K. Prasad"],
    venue: "Short paper, 34th ACM SIGSPATIAL International Conference on Advances in Geographic Information Systems (SIGSPATIAL '26), Riverside, CA. ACM, 2026.",
    url: "https://doi.org/10.1145/3841645.3843377",
    urlLabel: "ACM Digital Library",
    doi: "10.1145/3841645.3843377",
    badges: [],
    keywords: ["weighted Jaccard", "compression", "bitwise encoding", "integer encoding", "HNSW", "SIMD", "polygon similarity", "memory-efficient", "GIS", "vector index"],
    selected: true,
    bibtex: `@inproceedings{ashan2026shapetovecplus,
  author    = {Ashan, M. K. Buddhi and Sampath, Ruban and Prasad, Sushil K.},
  title     = {ShapeToVec+: A Memory and Query-Efficient System for Weighted-Jaccard Search over Large-scale Polygon Collections},
  booktitle = {Proceedings of the 34th ACM SIGSPATIAL International Conference on Advances in Geographic Information Systems (SIGSPATIAL '26)},
  year      = {2026},
  publisher = {ACM},
  address   = {Riverside, CA, USA},
  doi       = {10.1145/3841645.3843377}
}`
  },

  {
    key: "U1",
    type: "preprint",
    year: 2026,
    title: "Learning Compact Polygon Signatures via Weighted-Jaccard-Native Distillation for Large-Scale Similarity Search under Extreme Area Variation",
    authors: ["Ruban Sampath", "M. K. Buddhi Ashan", "Sushil K. Prasad"],
    venue: "Under review, 9th IEEE International Workshop on Big Spatial Data (BSD 2026).",
    status: "Under review",
    badges: [],
    keywords: ["distillation", "learned encoder", "compact signatures", "weighted Jaccard", "polygon similarity", "BSD 2026", "big spatial data"],
    selected: false
  },
  {
    key: "C4",
    type: "conference",
    year: 2025,
    title: "ShapeToVec: Encoding Polygonal Shapes with Extreme Area Variability for Effective Approximate Jaccard Similarity Queries",
    authors: ["M. K. Buddhi Ashan", "Satish Puri", "Anju Soman", "Matthew Schwennesen", "Sushil K. Prasad"],
    venue: "2025 IEEE International Conference on Big Data (BigData). IEEE, 2025.",
    url: "https://ieeexplore.ieee.org/document/11401899",
    urlLabel: "IEEE Xplore",
    badges: [{ text: "Acceptance rate 18.7%" }],
    keywords: ["quadtree encoding", "polygon similarity", "weighted Jaccard", "HNSW", "NMSLIB", "approximate nearest neighbor", "GIS", "shape search"],
    selected: true,
    bibtex: `@inproceedings{ashan2025shapetovec,
  author    = {Ashan, M. K. Buddhi and Puri, Satish and Soman, Anju and Schwennesen, Matthew and Prasad, Sushil K.},
  title     = {ShapeToVec: Encoding Polygonal Shapes with Extreme Area Variability for Effective Approximate Jaccard Similarity Queries},
  booktitle = {2025 IEEE International Conference on Big Data (BigData)},
  year      = {2025},
  publisher = {IEEE}
}`
  },
  {
    key: "C3",
    type: "conference",
    year: 2025,
    title: "ScooterLab: A Programmable and Participatory Sensing Research Testbed using Micromobility Vehicles",
    authors: ["Ubaidullah Khan", "Raveen Wijewickrama", "M. K. Buddhi Ashan", "A. H. M. Sakib", "Khoi Trinh", "Christina Duthie", "Nima Najafian", "et al.", "Murtuza Jadliwala"],
    venue: "2025 IEEE International Conference on Pervasive Computing and Communications Workshops and other Affiliated Events (PerCom Workshops), demo paper, pp. 555–557. IEEE, 2025.",
    url: "https://ieeexplore.ieee.org/abstract/document/11038542",
    urlLabel: "IEEE Xplore",
    doi: "10.1109/PerComWorkshops65533.2025.00126",
    badges: [],
    keywords: ["ScooterLab", "micromobility", "participatory sensing", "testbed", "e-scooter", "demo"],
    selected: false,
    bibtex: `@inproceedings{khan2025scooterlab,
  author    = {Khan, Ubaidullah and Wijewickrama, Raveen and Ashan, M. K. Buddhi and Sakib, A. H. M. and Trinh, Khoi and Duthie, Christina and Najafian, Nima and others and Jadliwala, Murtuza},
  title     = {ScooterLab: A Programmable and Participatory Sensing Research Testbed using Micromobility Vehicles},
  booktitle = {2025 IEEE International Conference on Pervasive Computing and Communications Workshops and other Affiliated Events (PerCom Workshops)},
  pages     = {555--557},
  year      = {2025},
  publisher = {IEEE},
  doi       = {10.1109/PerComWorkshops65533.2025.00126}
}`
  },
  {
    key: "C2",
    type: "conference",
    year: 2024,
    title: "Extending Segment Tree for Polygon Clipping and Parallelizing using OpenMP and OpenACC Compiler Directives",
    authors: ["M. K. Buddhi Ashan", "Satish Puri", "Sushil K. Prasad"],
    venue: "53rd International Conference on Parallel Processing (ICPP). ACM, 2024.",
    url: "https://dl.acm.org/doi/abs/10.1145/3673038.3673141",
    urlLabel: "ACM Digital Library",
    doi: "10.1145/3673038.3673141",
    badges: [],
    keywords: ["segment tree", "polygon clipping", "OpenMP", "OpenACC", "Chazelle", "GIS", "line segment intersection", "parallel"],
    selected: false,
    bibtex: `@inproceedings{ashan2024segmenttree,
  author    = {Ashan, M. K. Buddhi and Puri, Satish and Prasad, Sushil K.},
  title     = {Extending Segment Tree for Polygon Clipping and Parallelizing using OpenMP and OpenACC Compiler Directives},
  booktitle = {Proceedings of the 53rd International Conference on Parallel Processing (ICPP '24)},
  year      = {2024},
  publisher = {ACM},
  doi       = {10.1145/3673038.3673141}
}`
  },
  {
    key: "C1",
    type: "conference",
    year: 2023,
    title: "Efficient PRAM and Practical GPU Algorithms for Large Polygon Clipping with Degenerate Cases",
    authors: ["M. K. Buddhi Ashan", "Satish Puri", "Sushil K. Prasad"],
    venue: "2023 IEEE/ACM 23rd International Symposium on Cluster, Cloud and Internet Computing (CCGrid). IEEE, 2023.",
    url: "https://ieeexplore.ieee.org/abstract/document/10171568",
    urlLabel: "IEEE Xplore",
    doi: "10.1109/CCGrid57682.2023.00060",
    badges: [{ text: "Best paper finalist", award: true }, { text: "Acceptance rate 21%" }],
    keywords: ["PRAM", "CUDA", "GPU", "polygon clipping", "degenerate cases", "minimum bounding rectangle", "filters", "GIS", "parallel algorithms"],
    selected: true,
    bibtex: `@inproceedings{ashan2023pram,
  author    = {Ashan, M. K. Buddhi and Puri, Satish and Prasad, Sushil K.},
  title     = {Efficient PRAM and Practical GPU Algorithms for Large Polygon Clipping with Degenerate Cases},
  booktitle = {2023 IEEE/ACM 23rd International Symposium on Cluster, Cloud and Internet Computing (CCGrid)},
  year      = {2023},
  publisher = {IEEE},
  doi       = {10.1109/CCGrid57682.2023.00060}
}`
  },
  {
    key: "E2",
    type: "journal",
    year: 2020,
    title: "Performance Evaluation of Transfer Learning for Pornographic Detection",
    authors: ["M. K. Buddhi Ashan", "Hyuk Cho", "Qingzhong Liu"],
    venue: "Advances in Natural Computation, Fuzzy Systems and Knowledge Discovery, Volume 2. Springer International Publishing, 2020.",
    url: "https://link.springer.com/chapter/10.1007/978-3-030-32591-6_43",
    urlLabel: "Springer",
    doi: "10.1007/978-3-030-32591-6_43",
    badges: [],
    keywords: ["transfer learning", "convolutional neural networks", "image classification", "deep learning"],
    selected: false,
    bibtex: `@incollection{ashan2020transfer,
  author    = {Ashan, M. K. Buddhi and Cho, Hyuk and Liu, Qingzhong},
  title     = {Performance Evaluation of Transfer Learning for Pornographic Detection},
  booktitle = {Advances in Natural Computation, Fuzzy Systems and Knowledge Discovery: Volume 2},
  year      = {2020},
  publisher = {Springer International Publishing},
  doi       = {10.1007/978-3-030-32591-6_43}
}`
  },
  {
    key: "E1",
    type: "journal",
    year: 2016,
    title: "Recognition of Vehicle License Plates using MATLAB",
    authors: ["M. K. Buddhi Ashan", "N. G. J. Dias"],
    venue: "European International Journal of Science and Technology 5(6), 2016.",
    url: "https://www.researchgate.net/profile/N-G-J-Dias/publication/310457959_RECOGNITION_OF_VEHICLE_LICENSE_PLATES_USING_MATLAB/links/582dd41908ae102f072daf08/RECOGNITION-OF-VEHICLE-LICENSE-PLATES-USING-MATLAB.pdf",
    urlLabel: "Article",
    badges: [],
    keywords: ["license plate recognition", "MATLAB", "OCR", "image processing"],
    selected: false,
    bibtex: `@article{ashan2016licenseplates,
  author  = {Ashan, M. K. Buddhi and Dias, N. G. J.},
  title   = {Recognition of Vehicle License Plates using MATLAB},
  journal = {European International Journal of Science and Technology},
  volume  = {5},
  number  = {6},
  year    = {2016}
}`
  }
];

/* Open-source software and data. `keys` refer to the publications above. */
SITE.software = [
  {
    name: "shape-similarity",
    url: "https://github.com/buddhi1/shape-similarity",
    keys: "C4 · C5",
    text: "Quad tree-based polygon encoding and weighted-Jaccard similarity search over HNSW indexes."
  },
  {
    name: "jpq",
    url: "https://github.com/buddhi1/jpq",
    keys: "C6",
    text: "Weighted-Jaccard-aware product quantization for billion-scale shape similarity search."
  },
  {
    name: "segment-tree-based-clipping",
    url: "https://github.com/buddhi1/segment-tree-based-clipping",
    keys: "C2",
    text: "Augmented segment tree for polygon clipping, parallelized with OpenMP and OpenACC."
  },
  {
    name: "GH-CUDA",
    url: "https://github.com/buddhi1/GH-CUDA",
    keys: "C1",
    text: "CUDA implementation of parallel polygon clipping with degenerate-case handling."
  },
  {
    name: "ShapeToVec Benchmark Dataset v2.1 · Zenodo",
    url: "https://doi.org/10.5281/zenodo.11522173",
    keys: "doi 10.5281/zenodo.11522173",
    text: "1.3 TB of curated polygon geometries with precomputed similarity ground truth across Parks, Water Bodies, and Sports categories.",
    wide: true
  }
];
