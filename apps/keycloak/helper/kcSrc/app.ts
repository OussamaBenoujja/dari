require("dotenv").config({ path: __dirname + "/../../.env" });

import express from "express";
import { Request, Response } from "express";

import { KeyCloackService } from "./AuthService";

const app = express();
const port = process.env.KC_AUTH_PORT!;

app.post("/auth/registr", async (req: Request, res: Response) => {
  try {
    const result = await KeyCloackService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Error Regeistering ERROR:\n" + err);
    res.status(500).json({ msg: "error during register", error: err });
  }
});

app.listen(port, () => {
  console.log("KeyCloak Auth APP SERVER STARTED on http://localhost:" + port);
});
