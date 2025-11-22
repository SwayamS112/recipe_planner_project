// backend/routes/recipes.js
const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const multer = require("multer");
const jwtAuth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary'); // use configured instance

// Multer memory storage (no local file saving)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload to Cloudinary
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

// CREATE Recipe (POST)
router.post(
  "/",
  jwtAuth,
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { title, description, ingredients, isPublic } = req.body;
      let imageUrl = "";
      let videoUrl = "";

      // upload image to cloudinary
      if (req.files && req.files.image) {
        imageUrl = await uploadToCloudinary(
          req.files.image[0].buffer,
          "recipes/images",
          "image"
        );
      }

      // upload video to cloudinary
      if (req.files && req.files.video) {
        videoUrl = await uploadToCloudinary(
          req.files.video[0].buffer,
          "recipes/videos",
          "video"
        );
      }

      const newRecipe = new Recipe({
        user: req.userId,
        title,
        description,
        ingredients: JSON.parse(ingredients || "[]"),
        image: imageUrl,
        video: videoUrl,
        isPublic: isPublic === "true" || isPublic === true,
      });

      await newRecipe.save();
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// GET all public recipes (social feed)
router.get("/public", async (req, res) => {
  try {
    const publicRecipes = await Recipe.find({ isPublic: true })
      .populate("user", "name avatar")
      .lean();

    const sanitized = publicRecipes.map((r) => ({
      ...r,
      image: r.image || "",
      video: r.video || "",
      user: r.user || { name: "Unknown", avatar: "" }
    }));

    res.json(sanitized);
  } catch (err) {
    console.error("Error in /public route:", err);
    res.status(500).json({ message: "Error loading public recipes" });
  }
});

// GET logged-in user recipes
router.get("/mine", jwtAuth, async (req, res) => {
  try {
    const myRecipes = await Recipe.find({ user: req.userId });
    res.json(myRecipes);
  } catch (err) {
    res.status(500).json({ message: "Error loading your recipes" });
  }
});

// ✅ KEEP THIS LAST
router.get('/:id', async (req, res) => {
  try {
    const r = await Recipe.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});


// UPDATE recipe (PUT)
router.put(
  "/:id",
  jwtAuth,
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { title, description, ingredients, isPublic } = req.body;
      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) return res.status(404).json({ message: "Not found" });
      if (String(recipe.user) !== String(req.userId))
  return res.status(401).json({ message: "Not authorized" });


      if (title) recipe.title = title;
      if (description) recipe.description = description;
      if (ingredients) recipe.ingredients = JSON.parse(ingredients);
      if (typeof isPublic !== "undefined")
        recipe.isPublic = isPublic === "true" || isPublic === true;

      if (req.files && req.files.image)
        recipe.image = await uploadToCloudinary(
          req.files.image[0].buffer,
          "recipes/images",
          "image"
        );

      if (req.files && req.files.video)
        recipe.video = await uploadToCloudinary(
          req.files.video[0].buffer,
          "recipes/videos",
          "video"
        );

      await recipe.save();
      res.json(recipe);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating recipe" });
    }
  }
);

// DELETE recipe
router.delete("/:id", jwtAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });
   if (String(recipe.user) !== String(req.userId))
  return res.status(401).json({ message: "Not authorized" });

    await recipe.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

module.exports = router;
