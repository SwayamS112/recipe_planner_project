import React, {useEffect, useState} from 'react';
import api from '../utils/api';

export default function SocialBrowser(){
  const [posts,setPosts]=useState([]);
  useEffect(()=>{ fetch(); },[]);
  async function fetch(){
    const res = await api.get('/recipes/public');
    setPosts(res.data);
  }
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Public Recipes</h2>
      <div className="space-y-4">
        {posts.map(p=>(
          <div key={p._id} className="bg-white p-4 shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-bold">{p.user?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <h3 className="font-bold">{p.title}</h3>
            <p>{p.description}</p>
            {p.image && <img src={p.image.startsWith('/')? (import.meta.env.VITE_API_URL.replace('/api','') + p.image) : p.image} alt="" className="mt-2 max-h-64 object-cover" />}
            {p.video && <video controls src={p.video.startsWith('/')? (import.meta.env.VITE_API_URL.replace('/api','') + p.video) : p.video} className="mt-2 max-h-64" />}
          </div>
        ))}
      </div>
    </div>
  )
}
