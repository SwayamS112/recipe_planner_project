// frontend/src/pages/dashboard/UserRecipes.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import PostItem from "../../components/PostItem";

const UserRecipes = () => {
  const [recipes, setRecipes] = useState([]);

  const loadMyRecipes = async () => {
    try {
      const res = await api.get("/recipes/my"); // if you have a dedicated endpoint; otherwise filter
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
      // fallback: fetch all and filter by author if endpoint missing
      try {
        const all = await api.get("/recipes");
        const userId = localStorage.getItem("userId"); // if you store it
        setRecipes(all.data.filter(r => String(r.author?._id ?? r.author) === String(userId)));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadMyRecipes();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">My Recipes</h2>
      {recipes.length === 0 ? (
        <div>No recipes found.</div>
      ) : (
        recipes.map(r => <PostItem key={r._id} recipe={r} />)
      )}
    </div>
  );
};

export default UserRecipes;
