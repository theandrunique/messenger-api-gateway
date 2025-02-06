import { Socket } from "socket.io";
import { validateJWT } from "./auth";
import config from "./config";
import { Server } from "socket.io";

const io = new Server();

io.on("connection", async (socket: Socket) => {
  const accessToken = socket.handshake.query.accessToken as string;
  if (!accessToken) {
    console.log("No access token provided");
    socket.disconnect(true);
    return;
  }

  const payload = await validateJWT(accessToken);
  if (payload === null) {
    console.log("Invalid access token");
    socket.disconnect(true);
    return;
  }

  console.log(`Client connected: ${JSON.stringify(payload)}`);

  socket.write("hello");

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

io.listen(config.PORT, () => {
  console.log("Server listening on port", config.PORT);
});
