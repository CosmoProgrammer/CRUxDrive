import voidb from "voidb";
import "jsr:@std/dotenv/load";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import _bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JWTMiddleware from "./middleware/JWT.ts";

const app: Express = express();
const port = Deno.env.get("PORT") || 3000;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new OAuth2Client(Deno.env.get("GOOGLE_CLIENT_ID"));
const JWT_SECRET = Deno.env.get("JWT_SECRET");
const BUCKET = Deno.env.get("BUCKET");
const accessKeyId = Deno.env.get("accessKeyId") || "";
const secretAccessKey = Deno.env.get("secretAccessKey") || "";

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

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
    console.log(payload.email, payload.sub, payload.name);
    console.log(payload.picture);
    let userIds = voidb(
      `select table "users" columns "['userId']";`
    )[0].data.map((pair: any) => pair.userId);
    if (userIds.indexOf(payload.sub) === -1) {
      voidb(
        `insert "[['${payload.sub}','${payload.email}','${payload.name}','','','','', '${payload.picture}']]" into "users" columns "*";`
      );
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

app.get(
  "/getFileStructure",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { id, email } = req.body.user;
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${id}/`,
      });
      const data = await s3Client.send(command);

      const fileStructure = data.Contents?.map((file) => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
      }));

      return res.json({ fileStructure });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "File fetching failed" });
    }
  }
);

app.post("/getUploadURL", async (req: Request, res: Response) => {
  console.log("Getting URL");
  const key = req.body.key;
  const contentType = req.body.contentType;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command);
  console.log(url);
  return res.json(url);
});

app.post("/delete", async (req: Request, res: Response) => {
  const keys = req.body;
  console.log(keys);
  const command = new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: keys.map((key: string) => ({ Key: key })) },
  });
  const result = await s3Client.send(command);
  console.log(result);
  return res.json("deleted");
});

app.post("/createFolder", async (req: Request, res: Response) => {
  //const [key, name] = req.body;
  //console.log(req.body);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${req.body.key}${req.body.name}/`,
  });
  const result = await s3Client.send(command);
  return res.json("Created");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
