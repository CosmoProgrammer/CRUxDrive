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
  HeadObjectCommand,
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

interface File {
  key: string | undefined;
  size: number | undefined;
  lastModified: Date | undefined;
  redirectKey: string | undefined;
}

interface GroupFile {
  key: string | undefined;
  relativeKey: string | undefined;
  size: string | undefined;
  lastModified: string | undefined | Date;
}

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

  console.log(token);
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
        `insert "[['${payload.sub}','${payload.email}','${payload.name}', '${payload.picture}']]" into "users" columns "*";`
      );
      //console.log(`${payload.sub}/`);
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${payload.sub}/`,
      });
      const result = await s3Client.send(command);
      const command2 = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${payload.sub}/welcome/`,
      });
      const result2 = await s3Client.send(command2);
      voidb(
        `create new table "${payload.sub}_FilesFolders" with columns "[{'key':'string'}]" and values "[]"`
      );
      voidb(
        `create new table "${payload.sub}_Groups" with columns "[{'groupID':'string'}]" and values "[]"`
      );
      voidb(
        `create new table "${payload.sub}_Bookmarks" with columns "[{'key':'string'}]" and values "[]"`
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
        redirectKey: file.Key,
      }));
      console.log(fileStructure);
      return res.status(200).json({ fileStructure });
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
  return res.status(200).json(url);
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
  return res.status(200).json("deleted");
});

app.post("/createFolder", async (req: Request, res: Response) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${req.body.key}${req.body.name}/`,
  });
  const result = await s3Client.send(command);
  return res.status(200).json("Created");
});

app.post("/getDownloadURL", async (req: Request, res: Response) => {
  const { key } = req.body;
  const isLocked =
    voidb(`select table "lockedfiles" columns "*" where "key == '${key}'";`)[0][
      "data"
    ].length > 0;
  console.log(isLocked);
  if (isLocked) {
    return res.status(200).json(`/locked?key=${encodeURIComponent(key)}`);
  } else {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    console.log(url);
    return res.status(200).json(url);
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

app.post("/shareToEmail", async (req: Request, res: Response) => {
  const { items, email } = req.body;
  console.log("HI");
  console.log(items, email);
  const ids = voidb(
    `select table "users" columns "['email', 'userId']" where "email === '${email}'"`
  )[0]["data"];
  console.log(ids);
  if (ids.length === 0) {
    return res.status(404).json("Email Not Found");
  }
  const id = ids[0]["userId"];
  console.log(
    voidb(
      `insert "${JSON.stringify(items.map((element: any) => [element])).replace(
        /"/g,
        "'"
      )}" into "${id}_FilesFolders" columns "*";`
    )
  );
  return res.status(200).json("Shared");
});

app.get(
  "/getSharedFilesFolders",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { id, email } = req.body.user;
    //console.log(id);
    try {
      const sharedFiles = voidb(
        `select table "${id}_FilesFolders" columns "*";`
      )[0]
        ["data"].map((element: any) => [element.key])
        .flat();
      //console.log(sharedFiles);
      const fileStructure = await getSharedFilesInfo(sharedFiles);
      console.log(fileStructure);
      return res.status(200).json({ fileStructure });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "File fetching failed" });
    }
  }
);

app.post(
  "/createNewGroup",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { user, groupName, isPublic } = req.body;
    const id = Date.now().toString(16);
    voidb(
      `insert "[['${id}', '${groupName}', '${user.id}', ${isPublic}]]" into "groups" columns "*"`
    );
    voidb(
      `create new table "Group_${id}" columns "[{'key':'string'}, {'relativeKey':'string'}, {'lastModified': 'string'}, {'size': 'string'} ]" values "[]";`
    );
    voidb(
      `insert "[['', '/${groupName}/welcome/', '', '0']]" into "Group_${id}" columns "*"`
    );
    //console.log(user, groupName, isPublic, id);
    return res.status(200).json({ message: "Group created" });
  }
);

app.get(
  "/getAllMyGroups",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { id, email } = req.body.user;
    let data = voidb(
      `select table "groups" columns "*" where "owner === '${id}'";`
    )[0]["data"];
    return res.status(200).json(data);
  }
);

app.post(
  "/getGroupFileStructure",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { user, groupId, groupName } = req.body;
    //console.log(user, groupId, groupName);
    const data = voidb(`select table "Group_${groupId}" columns "*";`)[0][
      "data"
    ];
    const fileStructure = data.map((file: GroupFile) => ({
      key: file.relativeKey,
      size: file.size,
      lastModified: file.lastModified,
      redirectKey: file.key,
    }));
    console.log(fileStructure);
    return res.status(200).json({ fileStructure });
  }
);

app.post(
  "/createGroupFolder",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { user, key, name, groupId } = req.body;
    //console.log(key, name, groupId);
    console.log(
      voidb(
        `insert "[['', '/${key}${name}/', '', '0']]" into "Group_${groupId}" columns "*"`
      )
    );
    return res.status(200).json("created folder");
  }
);

app.post(
  "/uploadKeysToGroup",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    let results: GroupFile[] = [];
    const { user, toSendToGroup, groupId, groupName, groupRelativeKey } =
      req.body;

    await Promise.all(
      toSendToGroup.map(async (key: string) => {
        console.log(key);
        if (key.endsWith("/")) {
          //console.log("FOLDER");
          const sharedFolder = key.match(/[^/]+\/$/)![0];
          const folderInfo = {
            relativeKey: `/${groupRelativeKey}/` + sharedFolder,
            size: "0",
            lastModified: new Date().toISOString(),
            key: key,
          };
          results.push(folderInfo);

          const command = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: key,
          });
          const { Contents } = await s3Client.send(command);

          Contents?.forEach((item) => {
            if (!item.Key!.endsWith("/")) {
              const fileInfo = {
                relativeKey:
                  `/${groupRelativeKey}/` +
                  item.Key!.substring(item.Key!.lastIndexOf(sharedFolder)),
                size: JSON.stringify(item.Size),
                lastModified: item.LastModified,
                key: item.Key,
              };
              //console.log(fileInfo);
              results.push(fileInfo);
            }
          });
        } else {
          //console.log("FILE");
          const command = new HeadObjectCommand({
            Bucket: BUCKET,
            Key: key,
          });
          const metadata = await s3Client.send(command);
          const fileInfo = {
            relativeKey:
              `/${groupRelativeKey}/` +
              key.split("/").filter(Boolean).slice(-1)[0],
            size: JSON.stringify(metadata.ContentLength),
            lastModified: metadata.LastModified,
            key: key,
          };
          //console.log(fileInfo);
          results.push(fileInfo);
        }
      })
    );

    console.log("RESULTS");
    const flattenedResults = JSON.stringify(
      results.map(({ key, relativeKey, lastModified, size }) => [
        key,
        relativeKey,
        lastModified,
        size,
      ])
    ).replace(/"/g, "'");
    console.log(
      voidb(`insert "${flattenedResults}" into "Group_${groupId}" columns "*";`)
    );
    return res.status(200).json("uploaded");
  }
);

app.post(
  "/deleteObjectsInGroup",
  JWTMiddleware,
  async (req: Request, res: Response) => {
    const { user, objectsToDelete, groupId } = req.body;
    console.log(objectsToDelete, groupId);
    let data = voidb(`select table "Group_${groupId}" columns "*";`)[0]["data"];
    console.log(data);
    const filteredObjects = data.filter((obj: any) => {
      const isFileToDelete = objectsToDelete.includes(obj.relativeKey);
      const isInFolderToDelete = objectsToDelete.some(
        (folderKey: string) =>
          folderKey.endsWith("/") &&
          (obj.relativeKey.startsWith(folderKey) ||
            obj.relativeKey.startsWith("/" + folderKey))
      );
      return !isFileToDelete && !isInFolderToDelete;
    });
    //console.log(filteredObjects);
    const flattenedResults = JSON.stringify(
      filteredObjects.map(({ key, relativeKey, lastModified, size }) => [
        key,
        relativeKey,
        lastModified,
        size,
      ])
    ).replace(/"/g, "'");
    console.log(voidb(`truncate "Group_${groupId}";`));
    console.log(
      voidb(`insert "${flattenedResults}" into "Group_${groupId}" columns "*";`)
    );
    return res.status(200).json("deleted");
  }
);

/*app.get("/getAllGroupsYouArePartOf", JWTMiddleware, async (req: Request, res: Response) => {
  const { id, email } = req.body.user;
  //console.log(id);
  //const id = "105166271717311784705";
  console.log(`select table "${id}_Groups" columns "*";`);
  try {
    const groups = voidb(`select table "${id}_Groups" columns "*";`)[0]["data"];
    //console.log(groups);
    return res.status(200).json(groups);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "File fetching failed" });
  }
});

app.post("/addEmailToGroup", JWTMiddleware, async (req: Request, res: Response) => {
  const { user, group, email } = req.body;
  console.log(voidb(``))
})*/

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

async function getSharedFilesInfo(keys: string[]) {
  const results = [];
  for (const key of keys) {
    if (key.endsWith("/")) {
      let sharedFolder = key.match(/[^/]+\/$/)![0];
      const folderInfo = {
        key: "SharedObjects/" + sharedFolder,
        size: 0,
        lastModified: new Date().toISOString(),
        redirectKey: sharedFolder,
      };
      results.push(folderInfo);
      const folderContents = await listFolderContents(key, sharedFolder);
      results.push(...folderContents);
    } else {
      const fileInfo = await getFileInfo(key);
      if (fileInfo) results.push(fileInfo);
    }
  }
  return results;
}

async function listFolderContents(prefix: string, rootFolder: string) {
  //console.log("Getting folder contents");
  //console.log(prefix);
  const folderContents: File[] = [];
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  });
  const { Contents } = await s3Client.send(command);
  //console.log(Contents);
  Contents?.forEach((item) => {
    //console.log("beofre   ");
    //console.log(item.Key);
    if (!item.Key!.endsWith("/")) {
      //console.log("hi");
      folderContents.push({
        key:
          "SharedObjects/" +
          item.Key!.substring(item.Key!.lastIndexOf(rootFolder)),
        size: item.Size,
        lastModified: item.LastModified,
        redirectKey: item.Key,
      });
    }
  });

  return folderContents;
}

async function getFileInfo(key: string) {
  try {
    //console.log(key.split("/").filter(Boolean).slice(-1)[0]);
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const metadata = await s3Client.send(command);

    return {
      key: "SharedObjects/" + key.split("/").filter(Boolean).slice(-1)[0],
      size: metadata.ContentLength,
      lastModified: metadata.LastModified,
      redirectKey: key,
    };
  } catch (error) {
    console.error(`Error retrieving file info for ${key}:`, error);
    return null;
  }
}
