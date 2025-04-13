"use client";

import { useState, useEffect } from "react";
import StoryReader from "./StoryReader";
import StoryCard from "./StoryCard";
import StorySearch from "./StorySearch";
import type { ReadingProgress } from "../types/types";
import { stories } from '../data/stories';

export default function Story(): JSX.Element {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState<Record<string, ReadingProgress>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedProgress: Record<string, ReadingProgress> = {};
    stories.forEach((story) => {
      const percentage = localStorage.getItem(`${story.title}_percentage`);
      const lastPage = localStorage.getItem(`${story.title}_progress`);
      if (percentage && lastPage) {
        storedProgress[story.title] = {
          percentage: parseInt(percentage),
          lastPage: parseInt(lastPage)
        };
      }
    });
    setReadingProgress(storedProgress);
  }, []);

  const handleBack = (progress: ReadingProgress) => {
    if (selectedFeature) {
      localStorage.setItem(`${selectedFeature}_percentage`, progress.percentage.toString());
      localStorage.setItem(`${selectedFeature}_progress`, progress.lastPage.toString());
      setReadingProgress(prev => ({
        ...prev,
        [selectedFeature]: progress
      }));
    }
    setSelectedFeature(null);
  };

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.content.some(content => content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section className="lg:my-20">
      {!selectedFeature ? (
        <>
          <StorySearch 
            onSearch={setSearchTerm}
            initialValue={searchTerm}
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.title}
                story={story}
                readingProgress={readingProgress[story.title]}
                onSelect={() => setSelectedFeature(story.title)}
              />
            ))}
          </ul>
          {filteredStories.length === 0 && (
            <p className="text-center text-xl font-comic text-gray-600">
              No se encontraron historias que coincidan con tu búsqueda.
            </p>
          )}
        </>
      ) : (
        <StoryReader
          selectedTitle={selectedFeature}
          onBack={handleBack}
        />
      )}
    </section>
  );
}