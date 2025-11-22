// backend/routes/recipes.js
const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const multer = require("multer");
const jwtAuth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// helper: upload buffer to cloudinary
const uploadToCloudinary = async (buffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
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
};

// safe parser for arrays (stringified JSON or array)
function safeParseArray(input) {
  if (typeof input === "undefined" || input === null) return undefined;
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    if (input.trim() === "") return [];
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return { __parseError: true, raw: input };
    }
  }
  return undefined;
}

// CREATE Recipe (supports multiple images under `images`)
router.post(
  "/",
  jwtAuth,
  upload.fields([{ name: "images" }, { name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { title, description, ingredients, steps, isPublic } = req.body;

      const imagesArr = [];

      if (req.files && req.files.images && req.files.images.length) {
        for (const f of req.files.images) {
          const url = await uploadToCloudinary(f.buffer, "recipes/images", "image");
          imagesArr.push(url);
        }
      }

      if (req.files && req.files.image && req.files.image[0]) {
        const url = await uploadToCloudinary(req.files.image[0].buffer, "recipes/images", "image");
        imagesArr.push(url);
      }

      let videoUrl = "";
      if (req.files && req.files.video && req.files.video[0]) {
        videoUrl = await uploadToCloudinary(req.files.video[0].buffer, "recipes/videos", "video");
      }

      const newRecipe = new Recipe({
        user: req.userId,
        title,
        description,
        ingredients: safeParseArray(ingredients) || [],
        steps: safeParseArray(steps) || [],
        images: imagesArr,
        image: imagesArr[0] || "",
        video: videoUrl,
        isPublic: isPublic === "true" || isPublic === true,
      });

      const saved = await newRecipe.save();
      await saved.populate("user", "name avatar");
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error creating recipe:", error && error.stack ? error.stack : error);
      res.status(500).json({ message: "Server error while creating recipe" });
    }
  }
);

// GET public (newest first)
router.get("/public", async (req, res) => {
  try {
    const publicRecipes = await Recipe.find({ isPublic: true })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    const sanitized = publicRecipes.map((r) => ({
      ...r,
      images: r.images || (r.image ? [r.image] : []),
      image: r.image || (r.images && r.images[0]) || "",
      video: r.video || "",
      user: r.user || { name: "Unknown", avatar: "" }
    }));

    res.json(sanitized);
  } catch (err) {
    console.error("Error in /public route:", err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error loading public recipes" });
  }
});

// GET mine (newest first)
router.get("/mine", jwtAuth, async (req, res) => {
  try {
    const myRecipes = await Recipe.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(myRecipes);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error loading your recipes" });
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  try {
    const r = await Recipe.findById(req.params.id).populate("user", "name avatar");
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE recipe (supports images + keepImages)
router.put(
  "/:id",
  jwtAuth,
  upload.fields([{ name: "images" }, { name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { title, description, ingredients, steps, isPublic, replaceImages, keepImages } = req.body;
      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) return res.status(404).json({ message: "Not found" });
      if (String(recipe.user) !== String(req.userId))
        return res.status(401).json({ message: "Not authorized" });

      if (typeof title !== "undefined") recipe.title = title;
      if (typeof description !== "undefined") recipe.description = description;

      // parse arrays safely
      const parsedIngredients = safeParseArray(ingredients);
      if (parsedIngredients && parsedIngredients.__parseError) {
        return res.status(400).json({ message: "Invalid JSON for ingredients" });
      }
      if (typeof parsedIngredients !== "undefined") recipe.ingredients = parsedIngredients || [];

      const parsedSteps = safeParseArray(steps);
      if (parsedSteps && parsedSteps.__parseError) {
        return res.status(400).json({ message: "Invalid JSON for steps" });
      }
      if (typeof parsedSteps !== "undefined") recipe.steps = parsedSteps || [];

      if (typeof isPublic !== "undefined")
        recipe.isPublic = isPublic === "true" || isPublic === true;

      // Handle images:
      // If replaceImages=true then start with keepImages (client sends JSON array of URLs to keep)
      let imagesArr = Array.isArray(recipe.images) ? [...recipe.images] : [];

      const replace = replaceImages === "true" || replaceImages === true;
      let keep = safeParseArray(keepImages);
      if (keep && keep.__parseError) {
        return res.status(400).json({ message: "Invalid JSON for keepImages" });
      }
      if (replace) {
        imagesArr = Array.isArray(keep) ? keep : [];
      }

      // append newly uploaded images (if any)
      if (req.files && req.files.images && req.files.images.length) {
        for (const f of req.files.images) {
          const url = await uploadToCloudinary(f.buffer, "recipes/images", "image");
          imagesArr.push(url);
        }
      }

      // single-image fallback upload
      if (req.files && req.files.image && req.files.image[0]) {
        const url = await uploadToCloudinary(req.files.image[0].buffer, "recipes/images", "image");
        imagesArr.push(url);
      }

      if (imagesArr.length) {
        recipe.images = imagesArr;
        recipe.image = imagesArr[0] || "";
      }

      // video upload
      if (req.files && req.files.video && req.files.video[0]) {
        recipe.video = await uploadToCloudinary(req.files.video[0].buffer, "recipes/videos", "video");
      }

      await recipe.save();
      res.json(recipe);
    } catch (err) {
      console.error("Error updating recipe:", err && err.stack ? err.stack : err);
      res.status(500).json({ message: "Error updating recipe" });
    }
  }
);

// DELETE
router.delete("/:id", jwtAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });

    const isOwner = String(recipe.user) === String(req.userId);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    if (!isOwner && !isAdmin) return res.status(401).json({ message: "Not authorized" });

    await recipe.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

module.exports = router;
