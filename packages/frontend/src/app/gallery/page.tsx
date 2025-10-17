"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Model {
  id: string;
  prompt: string;
  thumbnail_url: string | null;
  user_id: string;
}

export default function GalleryPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/gallery');
        setModels(response.data);
      } catch (error) {
        console.error("Failed to fetch gallery models", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Community Gallery</h1>
      {isLoading ? (
        <p className="text-center">Loading models...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {models.map((model) => (
            <Link href={`/models/${model.id}`} key={model.id}>
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                  {model.thumbnail_url ? (
                    <img src={model.thumbnail_url} alt={model.prompt} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">No Preview</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm truncate">{model.prompt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}