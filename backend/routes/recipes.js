// backend/routes/recipes.js
const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const multer = require("multer");
const jwtAuth = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");
const util = require('util');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload buffer → Cloudinary
const uploadToCloudinary = async (buffer, folder, resourceType = "image") =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });

function getUserFieldName() {
  if (Recipe.schema.path("user")) return "user";
  if (Recipe.schema.path("author")) return "author";
  return null;
}

function parseArrayField(input, isIngredient = false) {
  if (!input) return [];

  if (Array.isArray(input)) return input;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      const lines = trimmed.split("\n").map((s) => s.trim()).filter(Boolean);

      if (isIngredient) {
        return lines.map((name) => ({ name, qty: "", unit: "" }));
      }

      return lines; 
    }
  }

  return [];
}

  //  CREATE RECIPE
router.post(
  "/",
  jwtAuth,
  upload.fields([{ name: "images" }, { name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { title, description, ingredients, steps, isPublic } = req.body;

      // Structured parsing
      const ingredientsArr = parseArrayField(ingredients, true);
      const stepsArr = parseArrayField(steps, false);

      // Image uploads
      const imagesArr = [];

      if (req.files?.images?.length) {
        for (const f of req.files.images) {
          imagesArr.push(
            await uploadToCloudinary(f.buffer, "recipes/images", "image")
          );
        }
      }

      // Single image fallback
      if (req.files?.image?.[0]) {
        imagesArr.push(
          await uploadToCloudinary(req.files.image[0].buffer, "recipes/images", "image")
        );
      }

      // Video upload
      let videoUrl = "";
      if (req.files?.video?.[0]) {
        videoUrl = await uploadToCloudinary(
          req.files.video[0].buffer,
          "recipes/videos",
          "video"
        );
      }

      // Create recipe object
      const newRecipeData = {
        title,
        description,
        ingredients: ingredientsArr,
        steps: stepsArr,
        images: imagesArr,
        image: imagesArr[0] || "",
        video: videoUrl,
        isPublic: isPublic === "true" || isPublic === true,
      };

      // set the correct user field (user || author) if available
      const userField = getUserFieldName();
      if (userField) newRecipeData[userField] = req.userId;
      else newRecipeData.user = req.userId; // fallback: still set user (may be ignored by schema)

      const newRecipe = new Recipe(newRecipeData);

      const saved = await newRecipe.save();

      // Only populate if the detected field exists in schema
      if (userField) {
        await saved.populate(userField, "name avatar");
      }

      res.status(201).json(saved);
    } catch (error) {
      console.error("Create recipe error:", error && error.stack ? error.stack : error);
      res.status(500).json({ message: "Server error while creating recipe" });
    }
  }
);

/* 
   GET PUBLIC
    */
router.get("/public", async (req, res) => {
  try {
    const publicRecipes = await Recipe.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .lean();

    const userField = getUserFieldName();

    // If userField exists, populate via a separate query to avoid StrictPopulate issues with .lean()
    let populated = publicRecipes;
    if (userField) {
      // collect user ids
      const ids = publicRecipes
        .map((r) => r[userField])
        .filter(Boolean)
        .map(String);

      // lazy populate user data for efficiency
      const User = require("../models/User");
      const users = await User.find({ _id: { $in: ids } }).select("name avatar").lean();
      const userMap = {};
      users.forEach((u) => { userMap[String(u._id)] = u; });

      populated = publicRecipes.map((r) => ({
        ...r,
        user: userMap[String(r[userField])] || { name: "Unknown", avatar: "" },
        images: r.images || (r.image ? [r.image] : []),
        image: r.image || (r.images && r.images[0]) || "",
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        video: r.video || "",
      }));
    } else {
      populated = publicRecipes.map((r) => ({
        ...r,
        user: r.user || { name: "Unknown", avatar: "" },
        images: r.images || (r.image ? [r.image] : []),
        image: r.image || (r.images && r.images[0]) || "",
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        video: r.video || "",
      }));
    }

    res.json(populated);
  } catch (err) {
    console.error("/public error:", err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error loading public recipes" });
  }
});

/* 
   GET MINE
    */
router.get("/mine", jwtAuth, async (req, res) => {
  try {
    const userField = getUserFieldName();
    const query = userField ? { [userField]: req.userId } : { user: req.userId };
    const myRecipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.json(myRecipes);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error loading your recipes" });
  }
});

/* 
   GET BY ID
    */
router.get("/:id", async (req, res) => {
  try {
    const r = await Recipe.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ message: "Not found" });

    // attach user info
    const userField = getUserFieldName();
    let userObj = { name: "Unknown", avatar: "" };
    if (userField && r[userField]) {
      try {
        const User = require("../models/User");
        const u = await User.findById(r[userField]).select("name avatar").lean();
        if (u) userObj = u;
      } catch (e) { }
    } else if (r.user) {
      userObj = r.user;
    }

    res.json({
      ...r,
      user: userObj,
      images: r.images || (r.image ? [r.image] : []),
      image: r.image || (r.images && r.images[0]) || "",
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      steps: Array.isArray(r.steps) ? r.steps : [],
      video: r.video || "",
    });
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    res.status(500).json({ message: "Server error" });
  }
});

/* 
   UPDATE
    */
router.put(
  "/:id",
  jwtAuth,
  upload.fields([{ name: "images" }, { name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        ingredients,
        steps,
        isPublic,
        replaceImages,
        keepImages,
      } = req.body;

      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ message: "Not found" });

      const userField = getUserFieldName();
      const ownerId = userField ? recipe[userField] : recipe.user;
      if (String(ownerId) !== String(req.userId))
        return res.status(401).json({ message: "Not authorized" });

      if (title !== undefined) recipe.title = title;
      if (description !== undefined) recipe.description = description;

      // Structured parsing (if client sends empty string -> becomes [])
      if (typeof ingredients !== "undefined") recipe.ingredients = parseArrayField(ingredients, true);
      if (typeof steps !== "undefined") recipe.steps = parseArrayField(steps, false);

      if (isPublic !== undefined)
        recipe.isPublic = isPublic === "true" || isPublic === true;

      // IMAGE handling
      let imagesArr = [...(recipe.images || [])];

      const replace = replaceImages === "true" || replaceImages === true;
      const keep = parseArrayField(keepImages, false);

      if (replace) {
        imagesArr = Array.isArray(keep) ? keep : [];
      }

      if (req.files?.images?.length) {
        for (const f of req.files.images) {
          imagesArr.push(
            await uploadToCloudinary(f.buffer, "recipes/images", "image")
          );
        }
      }

      if (req.files?.image?.[0]) {
        imagesArr.push(
          await uploadToCloudinary(req.files.image[0].buffer, "recipes/images", "image")
        );
      }

      recipe.images = imagesArr;
      recipe.image = imagesArr[0] || "";

      if (req.files?.video?.[0]) {
        recipe.video = await uploadToCloudinary(
          req.files.video[0].buffer,
          "recipes/videos",
          "video"
        );
      }

      await recipe.save();
      res.json(recipe);
    } catch (err) {
      console.error("Update error:", err && err.stack ? err.stack : err);
      res.status(500).json({ message: "Error updating recipe" });
    }
  }
);

/* 
   DELETE
    */
router.delete("/:id", jwtAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });

    const userField = getUserFieldName();
    const ownerId = userField ? recipe[userField] : recipe.user;
    const isOwner = String(ownerId) === String(req.userId);
    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");

    if (!isOwner && !isAdmin)
      return res.status(401).json({ message: "Not authorized" });

    await recipe.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

//Likes
router.post("/:id/like", jwtAuth, async (req, res) => {
  console.log('DEBUG /like - auth header sample:', (req.headers.authorization || '').slice(0,60));
  console.log('DEBUG /like - req.userId:', req.userId);
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (!Array.isArray(recipe.likes)) {
      recipe.likes = [];
    }

    const userId = String(req.userId);
    const index = recipe.likes.findIndex(id => String(id) === userId);

    if (index === -1) {
      recipe.likes.push(req.userId);
    } else {
      recipe.likes.splice(index, 1);
    }

    await recipe.save();
    res.json({ likes: recipe.likes.length });

  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Error while liking" });
  }
});

//Comments
router.post("/:id/comment", jwtAuth, async (req, res) => {
  console.log('DEBUG /comment - auth header sample:', (req.headers.authorization || '').slice(0,60));
  console.log('DEBUG /comment - req.userId:', req.userId);
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (!Array.isArray(recipe.likes)) {
      recipe.likes = [];
    }

    recipe.comments.push({
      user: req.userId,
      text,
      createdAt: new Date(),
    });

    await recipe.save();
    await recipe.populate("comments.user", "name avatar");

    res.json(recipe.comments);

  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
});



module.exports = router;
