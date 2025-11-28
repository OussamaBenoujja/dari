const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api");
const canvas = require("canvas");

faceapi.env.monkeyPatch({
  Canvas: canvas.Canvas,
  Image: canvas.Image,
  ImageData: canvas.ImageData,
});
faceapi.tf.setBackend("tensorflow");
faceapi.tf.enableProdMode();

const VerificationRequest = require("../models/VerificationRequest");
const User = require("../models/User");
const validator = require("../utils/validator");

class VerificationService {
  constructor(options) {
    options = options || {};
    this.modelPath =
      options.modelPath || path.join(__dirname, "..", "..", "models", "face");
    this.modelsLoaded = false;
    this.autoEnabled = true;
    this.distanceThreshold = options.distanceThreshold || 0.45;
  }

  async submitVerification(userId, payload) {
    const errors = validator.validateVerificationInputs(payload);
    if (Object.keys(errors).length > 0) {
      const error = new Error("Validation failed");
      error.details = errors;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const request = new VerificationRequest({
      user: userId,
      verificationType: payload.verificationType,
      idNumber: payload.idNumber,
      idDocumentPath: payload.idDocumentPath,
      selfiePath: payload.selfiePath,
      status: "pending",
    });
    await request.save();

    const autoResult = await this.tryAutomaticVerification(request);
    if (autoResult.processed) {
      request.autoMatched = autoResult.matched;
      request.autoScore = autoResult.score;
      if (autoResult.matched) {
        request.status = "auto_approved";
        user.isVerified = true;
        user.verification_type = payload.verificationType;
        user.verification_id = payload.idNumber;
        user.verify_card_Image = payload.idDocumentPath;
        user.verificationSelfie = payload.selfiePath;
      } else {
        request.status = "manual_review";
        request.reason = autoResult.reason || "Automatic verification failed";
      }
    } else {
      request.status = "manual_review";
      request.reason =
        autoResult.reason || "Automatic verification not available";
    }

    await request.save();
    await user.save();
    return request;
  }

  async manualReview(requestId, reviewerId, decision, notes) {
    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    const user = await User.findById(request.user);
    if (!user) {
      throw new Error("User not found");
    }
    const choice = (decision || "").toLowerCase();
    if (choice === "approve") {
      request.status = "approved";
      request.reviewer = reviewerId;
      request.reviewNotes = notes;
      user.isVerified = true;
    } else if (choice === "reject") {
      request.status = "rejected";
      request.reviewer = reviewerId;
      request.reviewNotes = notes;
      request.reason = "Manual rejection";
    } else {
      throw new Error("Unknown decision");
    }
    await request.save();
    await user.save();
    return request;
  }

  async getLatestRequestForUser(userId) {
    return VerificationRequest.findOne({ user: userId }).sort({
      createdAt: -1,
    });
  }

  async listManualQueue() {
    return VerificationRequest.find({ status: "manual_review" }).populate(
      "user",
    );
  }

  async tryAutomaticVerification(request) {
    try {
      await this.ensureModels();
    } catch (err) {
      this.autoEnabled = false;
      return { processed: false, reason: err.message };
    }

    if (!this.autoEnabled) {
      return { processed: false, reason: "Automatic verification disabled" };
    }

    if (
      !this.isImageFile(request.idDocumentPath) ||
      !this.isImageFile(request.selfiePath)
    ) {
      return { processed: false, reason: "Unsupported file type" };
    }

    try {
      const idDescriptor = await this.getFaceDescriptor(request.idDocumentPath);
      const selfieDescriptor = await this.getFaceDescriptor(request.selfiePath);
      if (!idDescriptor || !selfieDescriptor) {
        return { processed: true, matched: false, reason: "Face not detected" };
      }
      const distance = faceapi.euclideanDistance(
        idDescriptor,
        selfieDescriptor,
      );
      const matched = distance <= this.distanceThreshold;
      return { processed: true, matched: matched, score: distance };
    } catch (err) {
      return { processed: false, reason: err.message };
    }
  }

  async ensureModels() {
    if (this.modelsLoaded) {
      return;
    }
    try {
      await faceapi.tf.ready();
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath);
      this.modelsLoaded = true;
    } catch (err) {
      throw new Error(
        "Face models could not be loaded. Place models in " + this.modelPath,
      );
    }
  }

  async getFaceDescriptor(filePath) {
    await this.assertFileExists(filePath);
    const image = await canvas.loadImage(filePath);
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) {
      return null;
    }
    return detection.descriptor;
  }

  async assertFileExists(filePath) {
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
          reject(new Error("File not accessible: " + filePath));
        } else {
          resolve(true);
        }
      });
    });
  }

  isImageFile(filePath) {
    if (!filePath) {
      return false;
    }
    const extensions = [".png", ".jpg", ".jpeg", ".bmp"];
    const ext = path.extname(filePath).toLowerCase();
    return extensions.includes(ext);
  }
}

module.exports = VerificationService;
