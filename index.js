const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8dmqz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const run = async () => {
  try {
    await client.connect();
    const database = client.db("Adventure_Pathway");
    const userCollection = database.collection("users");
    const blogCollection = database.collection("blogs");
    const reviewCollection = database.collection("reviews");
    const ratingCollection = database.collection("ratings");
    //Get Paginated Reviews
    app.get("/ratings/:productId", async (req, res) => {
      const currentPage = parseInt(req.query.currentPage);
      const limit = parseInt(req.query.limit);
      const result = await ratingCollection
        .find({ productId: req.params.productId })
        .skip(currentPage * limit)
        .limit(limit)
        .toArray();
      res.json(result);
    });
    //Post Product Reivew
    app.post("/ratings", async (req, res) => {
      const result = await ratingCollection.insertOne(req.body);
      res.json(result);
    });
    //Delete Product Review
    app.delete("/ratings", async (req, res) => {
      const result = await ratingCollection.deleteOne({
        _id: ObjectId(req.body._id),
      });
      res.json(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.json(result);
    });
    //Post Users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });
    // Get a Specific User
    app.get("/specificUser/:email", async (req, res) => {
      const result = await userCollection.findOne({ email: req.params.email });
      res.json(result);
    });
    //Verify Admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //Make Admin
    app.put("/admin", async (req, res) => {
      const user = req.body.request;
      const requester = req.body.requester;
      if (requester) {
        const requesterAccount = await userCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user };
          const updateDoc = { $set: { role: req.body.role } };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res.status(403).json({ message: "You Can't Make Admin!" });
      }
    });
    // Post Blogs
    app.post("/blogs", async (req, res) => {
      const result = await blogCollection.insertOne(req.body);
      res.json(result);
    });
    // Get Paginatd Blogs
    app.get("/blogs", async (req, res) => {
      const cursor = blogCollection.find({ status: "Approved" });
      const currentPage = parseInt(req.query.currentPage);
      const size = 10;
      let blogs;
      if (currentPage) {
        blogs = await cursor
          .skip(currentPage * size)
          .limit(size)
          .toArray();
      } else {
        blogs = await cursor.toArray();
      }
      const count = await cursor.count();
      res.send({ count, blogs });
    });
    // Blogs
    app.get("/allBlogs", async (req, res) => {
      const result = await blogCollection.find({}).toArray();
      res.json(result);
    });
    app.get("/allBlogs/:category", async (req, res) => {
      const category = req.params.category;
      const result = await blogCollection.find({ status: category }).toArray();
      res.json(result);
    });
    app.get("/blogs/:id", async (req, res) => {
      const result = await blogCollection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });
    app.put("/blogs/:id", async (req, res) => {
      const blog = req.body;
      const filter = { _id: ObjectId(req.params.id) };
      const updateDoc = { $set: blog };
      const result = await blogCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    app.delete("/blogs/:id", async (req, res) => {
      const result = await blogCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });
    app.get("/topBlogs", async (req, res) => {
      const result = await blogCollection
        .find({ status: "Approved" })
        .sort({
          likes: -1,
        })
        .limit(5)
        .toArray();
      res.json(result);
    });
    // Get Overviews
    app.get("/overview", async (req, res) => {
      const totalUsers = await userCollection.count();
      const totalBlogs = await blogCollection.count();
      const totalReviews = await reviewCollection.count();
      res.json({ users: totalUsers, blogs: totalBlogs, reviews: totalReviews });
    });
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find({}).toArray();
      res.json(result);
    });
    app.post("/reviews", async (req, res) => {
      const result = await reviewCollection.insertOne(req.body);
      res.json(result);
    });
  } catch (error) {
    console.log(error);
  }
};
run();

app.get("/", (req, res) => {
  res.send("200. Everything is OK.");
});
app.listen(port, () => {
  console.log("200. Everything is OK.");
});
