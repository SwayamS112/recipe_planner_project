// frontend/src/pages/SocialBrowser.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";

function svgAvatarDataUrl(name = "User", size = 40) {
  const initials = (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0].toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const colors = [
    "#F97316",
    "#7C3AED",
    "#0284C7",
    "#059669",
    "#B91C1C",
    "#0EA5E9",
    "#10B981",
  ];
  const color = colors[initials.charCodeAt(0) % colors.length];

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' rx='8' fill='${color}' />
    <text x='50%' y='50%' dy='.12em' text-anchor='middle'
      font-family='Arial, Helvetica, sans-serif'
      font-size='${Math.floor(size / 2.2)}'
      fill='white'>${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function SocialBrowser() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // toggles
  const [openSteps, setOpenSteps] = useState({});
  const [openIngredients, setOpenIngredients] = useState({});
  const [openComments, setOpenComments] = useState({});

  // per-post transient states (loading while liking/commenting)
  const [processing, setProcessing] = useState({}); // { [postId]: { liking: bool, commenting: bool } }

  // comment text inputs and likes counts
  const [commentText, setCommentText] = useState({});
  const [likes, setLikes] = useState({});

  // track which main image is selected
  const [mainImageIndex, setMainImageIndex] = useState({});

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const res = await api.get("/recipes/public");
      const sorted = [...(res.data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setPosts(sorted);

      // init main image index map and likes
      const idxMap = {};
      const likesMap = {};
      sorted.forEach((p) => {
        idxMap[p._id] = 0;
        likesMap[p._id] = p.likes?.length ?? p.likes ?? 0;
      });
      setMainImageIndex(idxMap);
      setLikes(likesMap);
    } catch (e) {
      console.error("Failed to load posts:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSteps(id) {
    setOpenSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleIngredients(id) {
    setOpenIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleComments(id) {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAvatarError(e, name) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = svgAvatarDataUrl(name, 40);
  }

  function resolveMedia(url) {
    if (!url) return "";
    return url.startsWith("/")
      ? import.meta.env.VITE_API_URL.replace("/api", "") + url
      : url;
  }

  function setMainImage(postId, idx) {
    setMainImageIndex((prev) => ({ ...prev, [postId]: idx }));
  }

  async function handleLike(id) {
    // optimistic UI: disable like button while processing
    setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), liking: true } }));
    try {
      const res = await api.post(`/recipes/${id}/like`);
      const newCount = res.data?.likes ?? null;
      if (newCount !== null) {
        setLikes((prev) => ({ ...prev, [id]: newCount }));
        // also update posts array copy so counts reflect across UI
        setPosts((prev) =>
          prev.map((post) => (post._id === id ? { ...post, likes: post.likes ? post.likes : [] } : post))
        );
      } else {
        // fallback: reload posts if server didn't return count
        await loadPosts();
      }
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), liking: false } }));
    }
  }

  async function submitComment(id) {
    const text = (commentText[id] || "").trim();
    if (!text) return;

    setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), commenting: true } }));
    try {
      const res = await api.post(`/recipes/${id}/comment`, { text });

      // If server returns the updated comments array, use it to update state
      if (res.data && Array.isArray(res.data)) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === id ? { ...post, comments: res.data } : post
          )
        );
      } else {
        // fallback: refetch single post (if you have endpoint) or reload posts
        await loadPosts();
      }

      setCommentText((prev) => ({ ...prev, [id]: "" }));
      // ensure comments panel is open
      setOpenComments((prev) => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), commenting: false } }));
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Public Recipes</h2>
        <button
          type="button"
          onClick={loadPosts}
          className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-full h-48 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <p className="text-gray-500 text-center mt-10 text-lg">No public posts yet.</p>
      )}

      <div className="space-y-4 mt-2">
        {posts.map((p) => {
          const userName = p.user?.name || "User";
          const fallbackAvatar = svgAvatarDataUrl(userName, 40);

          const images = p.images?.length ? p.images : p.image ? [p.image] : [];
          const mainIdx = mainImageIndex[p._id] ?? 0;
          const mainImageUrl = images[mainIdx] ? resolveMedia(images[mainIdx]) : "";

          const stepsArr = p.steps || p.instructions || p.method || [];
          const ingredientsArr = p.ingredients || [];
          const commentList = Array.isArray(p.comments) ? p.comments : [];

          const isLiking = processing[p._id]?.liking;
          const isCommenting = processing[p._id]?.commenting;

          return (
            <div key={p._id} className="bg-white p-4 shadow rounded-md">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={p.user?.avatar || fallbackAvatar}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => handleAvatarError(e, userName)}
                  />
                  <div>
                    <div className="font-bold">{userName}</div>
                    <div className="text-sm text-gray-500">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Steps */}
                  <button
                    type="button"
                    onClick={() => toggleSteps(p._id)}
                    className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    aria-pressed={!!openSteps[p._id]}
                  >
                    {openSteps[p._id] ? "Hide steps" : "Show steps"}
                  </button>

                  {/* Toggle Ingredients */}
                  <button
                    type="button"
                    onClick={() => toggleIngredients(p._id)}
                    className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    aria-pressed={!!openIngredients[p._id]}
                  >
                    {openIngredients[p._id] ? "Hide ingredients" : "Show ingredients"}
                  </button>

                  {/* Like */}
                  <button
                    type="button"
                    onClick={() => handleLike(p._id)}
                    className="text-sm px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-2"
                    disabled={!!isLiking}
                    aria-pressed={false}
                    title="Like"
                  >
                    <span aria-hidden>❤️</span>
                    <span>{likes[p._id] ?? p.likes?.length ?? 0}</span>
                  </button>

                  {/* Comments toggle */}
                  <button
                    type="button"
                    onClick={() => toggleComments(p._id)}
                    className="text-sm px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    aria-pressed={!!openComments[p._id]}
                  >
                    {openComments[p._id] ? "Hide Comments" : "Comments"}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-lg mb-1">{p.title}</h3>

              {/* Description */}
              <p className="text-gray-700 whitespace-pre-wrap">{p.description}</p>

              {/* Media */}
              <div className="mt-3">
                {mainImageUrl && (
                  <img
                    src={mainImageUrl}
                    alt=""
                    className="w-full h-72 object-cover rounded-md"
                  />
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMainImage(p._id, idx)}
                      className={`flex-none rounded-md overflow-hidden border ${
                        idx === mainIdx ? "border-blue-500" : "border-gray-200"
                      }`}
                      aria-label={`Show image ${idx + 1}`}
                    >
                      <img
                        src={resolveMedia(img)}
                        alt={`thumb-${idx}`}
                        className="w-20 h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* VIDEO */}
              {p.video && (
                <div className="mt-3">
                  <video
                    controls
                    src={resolveMedia(p.video)}
                    className="w-full max-h-[420px] rounded-md object-contain bg-black"
                  />
                </div>
              )}

              {/* STEPS */}
              {openSteps[p._id] && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-semibold mb-2">Steps</h4>
                  {stepsArr.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      {stepsArr.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-gray-500">No steps provided.</p>
                  )}
                </div>
              )}

              {/* INGREDIENTS */}
              {openIngredients[p._id] && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-semibold mb-2">Ingredients</h4>
                  {ingredientsArr.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {ingredientsArr.map((ing, i) => (
                        <li key={i}>
                          {typeof ing === "string"
                            ? ing
                            : `${ing.qty ? ing.qty + " " : ""}${ing.unit ? ing.unit + " " : ""}${ing.name}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No ingredients provided.</p>
                  )}
                </div>
              )}

              {/* COMMENTS */}
              {openComments[p._id] && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-semibold mb-2">Comments</h4>

                  {/* comment list */}
                  {commentList.length > 0 ? (
                    <div className="space-y-2">
                      {commentList.map((c, i) => (
                        <div key={c._id || i} className="bg-gray-100 p-2 rounded">
                          <strong>{c.user?.name || "User"}</strong>
                          <p className="text-gray-700">{c.text}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                  )}

                  {/* input box */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      className="flex-1 border p-2 rounded"
                      value={commentText[p._id] || ""}
                      onChange={(e) =>
                        setCommentText((prev) => ({ ...prev, [p._id]: e.target.value }))
                      }
                      aria-label="Write a comment"
                    />
                    <button
                      type="button"
                      onClick={() => submitComment(p._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                      disabled={!!isCommenting}
                    >
                      {isCommenting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
