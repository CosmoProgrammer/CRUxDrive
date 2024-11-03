# CRUxDrive

This project is a comprehensive file-sharing and collaboration platform, similar to Google Drive. Built with Deno for the backend and React + TypeScript for the frontend, it provides secure, scalable, and user-friendly functionality for storing, sharing, and managing files.

## Features

* User Authentication: **Google OAuth** for logging in, **JWT-based authentication** for secure sessions.
* File Storage and Management: Upload and organize files/folders securely in **AWS S3**. Metadata and additional data are stored in a custom NoSQL library, **VoiDB**.
* Real-time file and folder operations with instant UI updates via **TanStack Query**.
* Customizable access control, allowing users to password-protect files/folders.
* File Sharing: Share files and folders with other users with automated email notifications using **Nodemailer**.
* Groups: Users can create public or private groups with independent, customizable file systems. Public groups are accessible to all users, while private groups can be selectively shared. Users can join/leave groups and manage files within group-based file systems.
* Search and Filter: Fuzzy search with **Fuse.js** across personal, shared, and group files. Filters by file type, last modified date, and size.
* Bookmarks: Bookmark frequently accessed files/folders for quick retrieval in a different view.

## Tech Stack

Storage: <img src="{https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white}" />, VoiDB

Frontend: <img src="{https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB}" /> <img src="{https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white}" /> <img src="{[BadgeURLHere](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=ReactQuery&logoColor=white)}" />   

Backend:  <img src="{https://img.shields.io/badge/Deno-white?style=for-the-badge&logo=deno&logoColor=464647}" /> <img src="{https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white}" /> <img src="{https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white}" /> 


## Setup

### Cloning the repository

```bash
git clone https://github.com/CosmoProgrammer/CRUxDrive.git
cd CruxDrive
```

### Setting up backend

Deno 2.0 sets up dependencies automatically, but since VoiDB requires the node modules folder, the extra flag is required. Alternatively, you can add ```
{
  "nodeModulesDir": "auto"
} ``` to the configuration file.
```bash
deno run --node-modules-dir=auto main.ts
```
Allow all required permissions. Run this in the server folder.

You require the following environment variables.

```env
PORT=8000
GOOGLE_CLIENT_ID=<id>
JWT_SECRET=<secret>
BUCKET=cruxdrive
accessKeyId=<aws access ky>
secretAccessKey=<aws secrect access key>
email=cruxdrive.notification@gmail.com
password=<app password of the email for nodemailer>
```

### Setting up frontend

Navigate to the client folder.
```bash
npm install
npm start
```

