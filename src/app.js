const express = require("express");
const { pool, initDB } = require("./config/db");
const {
  connectRabbitMQ,
  getChannel,
} = require("./config/rabbitmq");

const app = express();

// Middleware
app.use(express.json());

// Cek service & database
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Board Service Running",
      database: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// CREATE PROJECT
app.post("/projects", async (req, res) => {
  try {
    const { title, description, team_id, brief_id } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (title, description, team_id, brief_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, team_id, brief_id]
    );

    res.status(201).json({
      message: "Project created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// GET ALL PROJECTS
app.get("/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY id ASC"
    );

    res.json({
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// GET PROJECT BY ID
app.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// UPDATE STATUS PROJECT
app.patch("/projects/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Kirim notifikasi ke RabbitMQ jika status COMPLETED
    if (status === "COMPLETED") {
      const channel = getChannel();

      if (channel) {
        channel.sendToQueue(
          "video_completed",
          Buffer.from(
            JSON.stringify({
              projectId: result.rows[0].id,
              title: result.rows[0].title,
              status: result.rows[0].status,
              created_at: result.rows[0].created_at,
            })
          ),
          { persistent: true }
        );

        console.log(
          `Notification sent for project ${result.rows[0].id}`
        );
      }
    }

    res.json({
      message: "Status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// UPDATE PROJECT
app.put("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, team_id, brief_id } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           team_id = COALESCE($3, team_id),
           brief_id = COALESCE($4, brief_id)
       WHERE id = $5
       RETURNING *`,
      [title, description, team_id, brief_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project updated successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE PROJECT
app.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inisialisasi Database dan RabbitMQ
initDB().then(() => {
  connectRabbitMQ().catch((err) => {
    console.error("RabbitMQ Connection Error:", err);
  });
});

// START SERVER
app.listen(3003, () => {
  console.log("Board Service running on port 3003");
});