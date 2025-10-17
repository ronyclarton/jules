"use client";

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/navigation';

interface ModelData {
    id: string;
    prompt: string;
    asset_url: string;
    user_id: string;
    likes_count: number;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState<ModelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setIsLoading(true);
        const modelResponse = await api.get(`/models/${params.id}`);
        setModel(modelResponse.data);
      } catch (error) {
        console.error("Failed to fetch model data", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) {
        fetchModelData();
    }
  }, [params.id]);

  const handleLike = async () => {
    if (!isLoggedIn() || !model) return router.push('/login');
    try {
        // We optimistically update the UI
        setModel({ ...model, likes_count: model.likes_count + 1 });
        await api.post(`/models/${params.id}/like`);
    } catch (error) {
        // Rollback on error
        setModel({ ...model, likes_count: model.likes_count - 1 });
        console.error("Failed to like model", error);
    }
  };

  if (isLoading) return <p className="text-center mt-20">Loading model...</p>;
  if (!model) return <p className="text-center mt-20">Model not found.</p>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 w-full h-[60vh] bg-gray-800 rounded-lg overflow-hidden">
          <Canvas dpr={[1, 2]} camera={{ fov: 45 }}>
            <Suspense fallback={null}>
              <Stage environment="city" intensity={0.6}>
                {model.asset_url && <Model url={model.asset_url} />}
              </Stage>
            </Suspense>
            <OrbitControls makeDefault />
          </Canvas>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">{model.prompt}</h1>
          <p className="text-sm text-gray-400 mb-4">Created by: {model.user_id}</p>
          <div className="flex gap-4 mb-6">
            <button onClick={handleLike} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
              Like <span className="ml-2 bg-white text-pink-500 text-xs font-bold px-2 py-1 rounded-full">{model.likes_count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}