"use client";

import { useState } from "react";
import {
  glossaryTerms,
  categoryLabels,
  categoryColors,
  type GlossaryTerm,
} from "../_lib/glossary-data";

export default function Glossary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    GlossaryTerm["category"] | "all"
  >("all");

  const filtered = glossaryTerms
    .filter((term) => {
      const matchesSearch =
        search === "" ||
        term.term.toLowerCase().includes(search.toLowerCase()) ||
        term.definition.toLowerCase().includes(search.toLowerCase()) ||
        term.plainEnglish.toLowerCase().includes(search.toLowerCase()) ||
        (term.abbreviation &&
          term.abbreviation.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        activeCategory === "all" || term.category === activeCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.term.localeCompare(b.term));

  const categories: Array<GlossaryTerm["category"] | "all"> = [
    "all",
    ...(Object.keys(categoryLabels) as GlossaryTerm["category"][]),
  ];

  return (
    <section className="py-20 px-6" id="glossary">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Space Glossary
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Key terms explained — the jargon of spaceflight translated into
            plain English.
          </p>
        </div>

        {/* Search + filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06]"
                }`}
              >
                {cat === "all"
                  ? "All"
                  : categoryLabels[cat as GlossaryTerm["category"]]}
              </button>
            ))}
          </div>
        </div>

        {/* Terms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((term) => (
            <GlossaryCard key={term.term} term={term} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600 font-mono text-sm">
            No terms match your search.
          </div>
        )}
      </div>
    </section>
  );
}

function GlossaryCard({ term }: { term: GlossaryTerm }) {
  const [showPlain, setShowPlain] = useState(false);

  return (
    <div className="glass-card rounded-xl p-5 group">
      {/* Term name + abbreviation */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-white font-semibold">{term.term}</h3>
          {term.abbreviation && (
            <span className="text-xs font-mono text-zinc-500">
              ({term.abbreviation})
            </span>
          )}
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-mono flex-shrink-0 ${
            categoryColors[term.category]
          }`}
        >
          {categoryLabels[term.category]}
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm text-zinc-400 leading-relaxed mb-3">
        {showPlain ? term.plainEnglish : term.definition}
      </p>

      {/* Toggle */}
      <button
        onClick={() => setShowPlain(!showPlain)}
        className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
      >
        {showPlain ? "Show technical definition" : "Explain like I\u2019m not an astronaut"}
      </button>
    </div>
  );
}
