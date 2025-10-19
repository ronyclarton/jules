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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setIsLoading(true);
        const modelResponse = await api.get(`/models/${params.id}`);
        setModel(modelResponse.data);

        const commentsResponse = await api.get(`/models/${params.id}/comments`);
        setComments(commentsResponse.data);

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

  const handleFollow = async () => {
    if (!isLoggedIn() || !model) return router.push('/login');
    try {
      await api.post(`/users/${model.user_id}/follow`);
      // Add visual feedback later
    } catch (error) {
      console.error("Failed to follow user", error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !isLoggedIn()) return;
    try {
      const response = await api.post(`/models/${params.id}/comment`, { content: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const handleRemix = async () => {
    if (!isLoggedIn()) return router.push('/login');
    try {
      const response = await api.post(`/models/${params.id}/remix`);
      // Redirect to the main editor page with the new remixed model
      router.push(`/?remix_id=${response.data.id}`);
    } catch (error) {
      console.error("Failed to remix model", error);
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
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">Created by: {model.user_id}</p>
            <button onClick={handleFollow} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Follow</button>
          </div>
          <div className="flex gap-4 mb-6">
            <button onClick={handleLike} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
              Like <span className="ml-2 bg-white text-pink-500 text-xs font-bold px-2 py-1 rounded-full">{model.likes_count}</span>
            </button>
            <button onClick={handleRemix} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Remix</button>
          </div>

          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm">{comment.content}</p>
                <p className="text-xs text-gray-400 mt-1">by {comment.user_id}</p>
              </div>
            ))}
          </div>

          {isLoggedIn() && (
            <div className="mt-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleComment} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Post Comment</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}