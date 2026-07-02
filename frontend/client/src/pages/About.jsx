import React, { useState, useEffect } from 'react';
import { getAbout } from '../services/content.service';

const floatClass = (float) => {
  if (float === 'left')  return 'float-left clear-left mr-6 mb-4 w-full sm:w-72 rounded-xl shadow-lg';
  if (float === 'right') return 'float-right clear-right ml-6 mb-4 w-full sm:w-72 rounded-xl shadow-lg';
  return 'w-full mb-6 rounded-xl shadow-lg';
};

const About = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAbout()
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, []);

  let paragraphCount = 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-2">About Auto Majid</h1>
      <p className="text-primary-400 mb-10">Our story, in our own words.</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>This page hasn't been written yet — check back soon.</p>
        </div>
      ) : (
        <div className="lg:columns-2 lg:gap-10 text-primary-200 leading-relaxed">
          {blocks.map((block) => {
            if (block.type === 'paragraph') {
              paragraphCount += 1;
              return (
                <p
                  key={block.id}
                  className={`mb-5 break-inside-avoid-column ${paragraphCount === 1 ? 'dropcap text-lg' : ''}`}
                >
                  {block.text}
                </p>
              );
            }
            if (block.type === 'image') {
              return (
                <figure key={block.id} className={floatClass(block.float)}>
                  <img src={block.url} alt={block.caption || ''} className="w-full h-auto rounded-xl" />
                  {block.caption && (
                    <figcaption className="text-xs text-primary-500 italic mt-1">{block.caption}</figcaption>
                  )}
                </figure>
              );
            }
            if (block.type === 'video') {
              return (
                <figure key={block.id} className="clear-both w-full mb-6 break-inside-avoid-column">
                  <video src={block.url} controls className="w-full rounded-xl shadow-lg" />
                  {block.caption && (
                    <figcaption className="text-xs text-primary-500 italic mt-1">{block.caption}</figcaption>
                  )}
                </figure>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default About;
