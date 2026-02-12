import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin {
  _id: string;
  email: string;
  password: string;
  createdAt: Date;
}

const AdminSchema = new mongoose.Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.models.Admin ?? mongoose.model<IAdmin>("Admin", AdminSchema);
