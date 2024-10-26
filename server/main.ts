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
import bcrypt from "bcrypt";

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
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${req.body.key}${req.body.name}/`,
  });
  const result = await s3Client.send(command);
  return res.json("Created");
});

app.post("/getDownloadURL", async (req: Request, res: Response) => {
  const { key } = req.body;
  const isLocked =
    voidb(`select table "lockedfiles" columns "*" where "key == '${key}'";`)[0][
      "data"
    ].length > 0;
  console.log(isLocked);
  if (isLocked) {
    return res.json(`/locked?key=${encodeURIComponent(key)}`);
  } else {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    console.log(url);
    return res.json(url);
  }
});

app.post("/lockFileFolder", async (req: Request, res: Response) => {
  const { key, password } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  if (key[key.length - 1] === "/") {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `${key}`,
    });
    const data = await s3Client.send(command);
    const subKeys = data.Contents?.map((file) => ({
      key: file.Key,
    }));
    const fileKeys = subKeys!
      .filter((item) => !item.key!.endsWith("/"))
      .map((item) => item.key);
    fileKeys.forEach((fileKey) => {
      if (
        voidb(
          `select table "lockedfiles" columns "*" where "key == '${key}'";`
        )[0]["data"].length > 0
      ) {
        return res.status(400).json(`File ${fileKey} already locked`);
      }
    });
    fileKeys.forEach((fileKey) => {
      voidb(
        `insert "[['${fileKey}','${hashedPassword}']]" into "lockedfiles" columns "*";`
      );
    });
    return res.status(200).json("File Locked");
  } else {
    let f = voidb(
      `select table "lockedfiles" columns "*" where "key == '${key}'";`
    )[0]["data"];
    if (f.length > 0) {
      return res.status(400).json("File already locked");
    }
    voidb(
      `insert "[['${key}','${hashedPassword}']]" into "lockedfiles" columns "*";`
    );
    return res.status(200).json("File Locked");
  }
});

app.post("/validatePassword", async (req: Request, res: Response) => {
  const { key, password } = req.body;
  console.log(key, password);
  const result = voidb(
    `select table "lockedfiles" columns "*" where "key == '${key}'";`
  )[0]["data"];
  if (!result || result.length === 0) {
    return res
      .status(404)
      .json({ error: "File not found or password incorrect" });
  }
  const storedHashedPassword = result[0]["password"];
  const isMatch = await bcrypt.compare(password, storedHashedPassword);
  if (!isMatch) {
    return res
      .status(401)
      .json({ error: "File not found or password incorrect" });
  }
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    return res.json({ url });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return res.status(500).json({ error: "Error generating download link" });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
