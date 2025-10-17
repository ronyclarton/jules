"use client";

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// A simple component to render the model
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// A simple tooltip component
function Tooltip({ text, show }: { text: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-md text-sm shadow-lg animate-bounce">
      {text}
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, token } = useAuthStore();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const pollStatus = async (modelId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/models/${modelId}/status`);
        if (response.data.status === 'complete') {
          clearInterval(interval);
          setModelUrl(response.data.asset_url);
          setIsLoading(false);
          setTutorialStep(3);
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setError('Model generation failed. Please try again.');
          setIsLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Failed to get model status.');
        setIsLoading(false);
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError('');
    setModelUrl('');
    setTutorialStep(2);

    try {
      // This is a simplified user_id for the MVP.
      // In a real app, you'd decode the JWT to get the user ID.
      const tempUserId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post('/generate', { prompt, user_id: tempUserId });
      await pollStatus(response.data.model_id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start generation.');
      setIsLoading(false);
    }
  };

  if (!isLoggedIn()) {
    return null; // or a loading spinner
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          AI 3D Creation Platform
        </p>
        <button onClick={() => useAuthStore.getState().setToken(null)} className="text-sm text-gray-400 hover:text-white">Logout</button>
      </div>

      <div className="relative flex place-items-center w-full h-[500px] border rounded-lg overflow-hidden bg-gray-900">
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10"><p>Crafting your creation...</p></div>}
        <Canvas dpr={[1, 2]} camera={{ fov: 45 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6}>
              {modelUrl && <Model url={modelUrl} />}
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      <div className="w-full max-w-5xl mt-8">
        <div className="relative flex gap-4">
          <Tooltip text="1. Type your idea here to begin!" show={tutorialStep === 0} />
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (tutorialStep === 0) setTutorialStep(1);
            }}
            placeholder="e.g., a futuristic spaceship"
            className="flex-grow p-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <div className="relative">
            <Tooltip text="2. Now, let's bring it to life!" show={tutorialStep === 1} />
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 h-full"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {modelUrl && (
          <div className="relative mt-4 text-center">
             <Tooltip text="3. Your masterpiece is ready! Download it here." show={tutorialStep === 3} />
            <a
              href={modelUrl}
              download
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              onClick={() => setTutorialStep(4)}
            >
              Download Model
            </a>
          </div>
        )}
      </div>
    </main>
  );
}