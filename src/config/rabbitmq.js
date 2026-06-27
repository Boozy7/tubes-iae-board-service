const amqp = require("amqplib");
const { pool } = require("./db");

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://rabbitmq"
  );

  channel = await connection.createChannel();

  await channel.assertQueue("video_completed", { durable: true });
  await channel.assertQueue("team_created", { durable: true });
  await channel.assertQueue("brief_created", { durable: true });

  console.log("RabbitMQ Connected in Board Service");

  // Consume team_created
  channel.consume("team_created", async (msg) => {
    if (msg !== null) {
      try {
        const team = JSON.parse(msg.content.toString());
        await pool.query(
          "INSERT INTO teams (id, name, description, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
          [team.id, team.name, team.description, team.created_at]
        );
        console.log(`Team ${team.id} synced to Board Service.`);
        channel.ack(msg);
      } catch (err) {
        console.error("Error syncing team:", err);
        channel.nack(msg);
      }
    }
  });

  // Consume brief_created
  channel.consume("brief_created", async (msg) => {
    if (msg !== null) {
      try {
        const brief = JSON.parse(msg.content.toString());
        await pool.query(
          "INSERT INTO briefs (id, title, description, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
          [brief.id, brief.title, brief.description, brief.created_at]
        );
        console.log(`Brief ${brief.id} synced to Board Service.`);
        channel.ack(msg);
      } catch (err) {
        console.error("Error syncing brief:", err);
        channel.nack(msg);
      }
    }
  });
}

function getChannel() {
  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
};