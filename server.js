require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const cors = require("cors");

const app = express();

const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;

db.once("open", () => {
  console.log("Connected to MongoDB");
});

// User Schema and Model

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

app.use(cors({ origin: "https://frontend-goldstone.onrender.com" }));

// API Routes

// Fetch users from external API and store in the database
app.get("/api/fetch-users", async (req, res) => {
  try {
    const response = await axios.get("https://gorest.co.in/public-api/users", {
      headers: {
        Authorization: process.env.API_TOKEN,
      },
    });
    const users = response.data.data;

    // Save users to the database
    await User.insertMany(users);

    res.json({ message: "Users fetched and stored successfully." });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Get all users from the database
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// ...
app.post("/api/users", async (req, res) => {
  const { name, email, gender, status } = req.body;

  try {
    const lastUser = await User.findOne().sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 : 1;

    const newUser = new User({
      id: newId,
      name,
      email,
      gender,
      status,
    });
    await newUser.save();

    res.json(newUser);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Failed to add user." });
  }
});

// Update a user in the database
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, gender, status } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { id },
      { name, email, gender, status },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user." });
  }
});

// ...
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await User.findOneAndDelete({ id });
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// Export users to a CSV file
app.get("/api/export-users", async (req, res) => {
  try {
    const users = await User.find();

    const csvWriter = createCsvWriter({
      path: "users.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "email", title: "Email" },
        { id: "gender", title: "Gender" },
        { id: "status", title: "Status" },
        { id: "created_at", title: "Created At" },
        { id: "updated_at", title: "Updated At" },
      ],
    });

    await csvWriter.writeRecords(users);

    res.json({ message: "Users exported to CSV file." });
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({ error: "Failed to export users." });
  }
});

///
// Add a new user to the database

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
