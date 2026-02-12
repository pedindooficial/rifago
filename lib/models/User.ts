import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  _id: string;
  email: string;
  name: string;
  password: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    twoFactorSecret: { type: String, default: null, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
