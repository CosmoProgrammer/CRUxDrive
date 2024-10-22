import voidb from "voidb";
import "jsr:@std/dotenv/load";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import _bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const app: Express = express();
const client = new OAuth2Client(Deno.env.get("GOOGLE_CLIENT_ID"));
const JWT_SECRET = Deno.env.get("JWT_SECRET");
const port = Deno.env.get("PORT") || 3000;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  //console.log(voidb(`select table "testing" columns "*";`));
  res.send("Welcome to the CRUxDrive API");
});

app.post("/login", async (req: Request, res: Response) => {
  interface GooglePayload {
    sub: string;
    email: string;
    name: string;
    picture: string;
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: Deno.env.get("GOOGLE_CLIENT_ID"),
    });

    const payload = ticket.getPayload() as GooglePayload;
    if (!payload.email.endsWith("@hyderabad.bits-pilani.ac.in")) {
      return res.status(403).send({ message: "Unauthorized login" });
    }

    const jwtToken = jwt.sign(
      {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token: jwtToken });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
