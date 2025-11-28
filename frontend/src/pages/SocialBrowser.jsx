// frontend/src/pages/SocialBrowser.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MediaViewer from "../components/MediaViewer";
import api, { setAuthToken } from "../services/api"; 

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

  // viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState([]); // [{ type: 'image'|'video', src }]
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPost, setViewerPost] = useState(null);

  // local UI: filters
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    void loadPosts();
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
  setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), liking: true } }));
  try {
    console.log('DEBUG handleLike - localStorage token (first 40 chars):', (localStorage.getItem('token') || '').slice(0,40));
    // force the latest token into axios
    setAuthToken(localStorage.getItem('token') || null);

    const res = await api.post(`/recipes/${id}/like`);
    const newCount = res.data?.likes ?? null;
    if (newCount !== null) {
      setLikes((prev) => ({ ...prev, [id]: newCount }));
      setPosts((prev) =>
        prev.map((post) =>
          post._id === id ? { ...post, likes: post.likes ? post.likes : [] } : post
        )
      );
    } else {
      await loadPosts();
    }
  } catch (err) {
    console.error("Like failed:", err);
    console.log("Token at like failure:", localStorage.getItem("token"));
  } finally {
    setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), liking: false } }));
  }
}


  async function submitComment(id) {
  const text = (commentText[id] || "").trim();
  if (!text) return;

  setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), commenting: true } }));
  try {
  console.log('DEBUG submitComment - localStorage token (first 40 chars):', (localStorage.getItem('token') || '').slice(0,40));
    // ensure token is attached
    setAuthToken(localStorage.getItem('token') || null);

    const res = await api.post(`/recipes/${id}/comment`, { text });

    if (res.data && Array.isArray(res.data)) {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === id ? { ...post, comments: res.data } : post
        )
      );
    } else {
      await loadPosts();
    }

    setCommentText((prev) => ({ ...prev, [id]: "" }));
    setOpenComments((prev) => ({ ...prev, [id]: true }));
  } catch (err) {
    console.error("Comment failed:", err);
    console.log("Token at comment failure:", localStorage.getItem("token"));
  } finally {
    setProcessing((p) => ({ ...p, [id]: { ...(p[id] || {}), commenting: false } }));
  }
}


  // small UI helpers (filter posts client-side by query & category) future work
  const categories = ["All", "Vegetarian", "Desserts", "Quick 30-min", "Vegan", "Breakfast"];
  const filteredPosts = posts.filter((p) => {
    const q = query.trim().toLowerCase();
    const inCategory = activeCategory === "All" || (p.category && p.category === activeCategory);
    const inQuery =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q);
    return inCategory && inQuery;
  });

  // open the media viewer for a post (images & video)
  function openViewerForPost(post, startIndex = 0) {
    const images = post.images?.length ? post.images : post.image ? [post.image] : [];
    const items = [];

    // push images first
    images.forEach((img) => {
      items.push({ type: "image", src: resolveMedia(img) });
    });

    // then video if present
    if (post.video) items.push({ type: "video", src: resolveMedia(post.video) });

    if (items.length === 0) return;
    setViewerItems(items);
    // determine initial index (if startIndex might refer to image index)
    const idx = Math.min(startIndex, items.length - 1);
    setViewerIndex(idx);
    setViewerPost(post);
    setViewerOpen(true);
  }

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-amber-700">Discover delicious recipes</h1>
              <p className="text-slate-600 mt-2 max-w-xl">
                Fresh recipes from the community — save your favorites, try new ideas, and share your own dishes.
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/add" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow">
                + Add Recipe
              </Link>
              <button
                onClick={loadPosts}
                className="inline-flex items-center gap-2 bg-white border border-amber-200 px-4 py-2 rounded-lg shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: left (filters/compose), center feed (shifted right) */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - improved compose / filters (desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-2xl shadow p-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-800">Quick Compose</h3>
              <span className="text-xs text-slate-400">{posts.length} posts</span>
            </div>

            <p className="text-sm text-slate-500">Share a short recipe or upload a quick photo.</p>

            <Link to="/add" className="block bg-amber-600 hover:bg-amber-700 text-white text-center py-2 rounded-lg">Create Recipe</Link>

            <div className="pt-3 border-t">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, description, author..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`text-sm px-3 py-1 rounded-full ${
                      activeCategory === c ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Quick Filters</h4>
              <div className="flex flex-col gap-2">
                <button className="text-sm text-left px-3 py-2 rounded hover:bg-amber-50">Under 30 mins</button>
                <button className="text-sm text-left px-3 py-2 rounded hover:bg-amber-50">Most liked</button>
                <button className="text-sm text-left px-3 py-2 rounded hover:bg-amber-50">Newest</button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Stats</h4>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <div>
                  <div className="text-xs text-slate-400">Recipes</div>
                  <div className="font-medium">{posts.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Chefs</div>
                  <div className="font-medium">{Array.from(new Set(posts.map(p => p.user?.name).filter(Boolean))).length}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: feed (wider to shift right) */}
        <main className="lg:col-span-9">
          {loading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="w-40 h-4 bg-gray-200 rounded" />
                  </div>
                  <div className="w-full h-56 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow text-center text-slate-600">
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-sm">Try a different search or category.</p>
              <div className="mt-4">
                <Link to="/add" className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg">Add Recipe</Link>
              </div>
            </div>
          )}

          <div className="space-y-6 mt-2">
            {filteredPosts.map((p) => {
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
                <article key={p._id} className="bg-white p-6 rounded-2xl shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={p.user?.avatar || fallbackAvatar}
                        alt={userName}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => handleAvatarError(e, userName)}
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{userName}</div>
                        <div className="text-xs text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSteps(p._id)}
                        className="text-sm px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                      >
                        {openSteps[p._id] ? "Hide steps" : "Show steps"}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleIngredients(p._id)}
                        className="text-sm px-3 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                      >
                        {openIngredients[p._id] ? "Hide ingredients" : "Ingredients"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLike(p._id)}
                        className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-2"
                        disabled={!!isLiking}
                        title="Like"
                      >
                        <span aria-hidden>❤️</span>
                        <span>{likes[p._id] ?? p.likes?.length ?? 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleComments(p._id)}
                        className="text-sm px-3 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                      >
                        {openComments[p._id] ? "Hide Comments" : "Comments"}
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-semibold text-xl mt-4 mb-1">{p.title}</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{p.description}</p>

                  {/* Media */}
                  <div className="mt-4">
                    {mainImageUrl && (
                      <div className="relative">
                        <img
                          src={mainImageUrl}
                          alt={p.title}
                          className="w-full h-[420px] md:h-[360px] object-cover rounded-lg cursor-pointer"
                          onClick={() => openViewerForPost(p, mainIdx)}
                        />

                        {/* show play badge if video exists (visual) */}
                        {p.video && (
                          <div className="absolute top-3 right-3 bg-black/40 text-white px-2 py-1 rounded-md text-xs">Video</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails (click to switch main image OR open viewer starting at thumbnail) */}
                  {images.length > 1 && (
                    <div className="mt-3 flex gap-3 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openViewerForPost(p, idx)}
                          className={`flex-none rounded-md overflow-hidden ${idx === mainIdx ? "ring-2 ring-amber-300" : "border border-gray-200"}`}
                          aria-label={`Show image ${idx + 1}`}
                        >
                          <img src={resolveMedia(img)} alt={`thumb-${idx}`} className="w-24 h-20 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Video (separate if no image, click to open viewer) */}
                  {!mainImageUrl && p.video && (
                    <div className="mt-4">
                      <div
                        className="w-full h-[320px] md:h-[360px] bg-black rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => openViewerForPost(p, 0)}
                      >
                        <div className="text-white bg-white/10 px-3 py-2 rounded">Play Video</div>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {openSteps[p._id] && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-2">Steps</h4>
                      {stepsArr.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-2 text-slate-700">
                          {stepsArr.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      ) : (
                        <p className="text-sm text-gray-500">No steps provided.</p>
                      )}
                    </div>
                  )}

                  {/* Ingredients */}
                  {openIngredients[p._id] && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-2">Ingredients</h4>
                      {ingredientsArr.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
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

                  {/* Comments */}
                  {openComments[p._id] && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-2">Comments</h4>

                      {/* comment list */}
                      {commentList.length > 0 ? (
                        <div className="space-y-2">
                          {commentList.map((c, i) => (
                            <div key={c._id || i} className="bg-gray-50 p-3 rounded">
                              <div className="text-sm font-medium">{c.user?.name || "User"}</div>
                              <p className="text-slate-700">{c.text}</p>
                              <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
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
                          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-200"
                          value={commentText[p._id] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({ ...prev, [p._id]: e.target.value }))
                          }
                          aria-label="Write a comment"
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(p._id)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
                          disabled={!!isCommenting}
                        >
                          {isCommenting ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </main>
      </div>

      {/* Media viewer (lightbox) */}
      {viewerOpen && (
        <MediaViewer
          items={viewerItems}
          initialIndex={viewerIndex}
          post={viewerPost}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
