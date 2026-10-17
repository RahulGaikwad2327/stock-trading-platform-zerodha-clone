const { Schema } = require("mongoose");

const UserSchema = new Schema({
  name: { type: String, trim: true, maxlength: 80, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, select: false },
  googleSub: { type: String, unique: true, sparse: true, select: false },
  appleSub: { type: String, unique: true, sparse: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

module.exports = { UserSchema };
