// ============================================================
// DO NOT MODIFY THIS FILE
// This file handles all page routes and static file serving.
// ============================================================

import express from "express";

export const pagesRouter = express.Router();

pagesRouter.get("/", (req, res) => {
  res.redirect("/home.html");
});

pagesRouter.get("/home.html", (req, res) => {
  res.sendFile("pages/home.html", { root: import.meta.dirname + "/.." });
});

pagesRouter.get("/post.html", (req, res) => {
  res.sendFile("pages/post.html", { root: import.meta.dirname + "/.." });
});

pagesRouter.use(express.static("pages"));

pagesRouter.use((req, res) => {
  res.status(404).sendFile("pages/404.html", {
    root: import.meta.dirname + "/..",
  });
});
