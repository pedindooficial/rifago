import mongoose from "mongoose";

export interface ILogin2FAToken {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const Login2FATokenSchema = new mongoose.Schema<ILogin2FAToken>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

Login2FATokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Login2FAToken ?? mongoose.model<ILogin2FAToken>("Login2FAToken", Login2FATokenSchema);
