
import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    id: string;
    email: string;
    name: string;
    password?: string;
    googleId?: string;
    role: 'admin' | 'user';
    status: 'pending' | 'approved' | 'rejected';
    accountType: 'individual' | 'enterprise';
    organizationId: string;
    permissions?: any[];
    subscription?: any;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    id: { type: String, required: true }, // Not unique globally due to org scoping potential, but unique per email usually
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    accountType: { type: String, enum: ['individual', 'enterprise'], default: 'enterprise' },
    organizationId: { type: String, required: true },
    permissions: [{ type: Schema.Types.Mixed }],
    subscription: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
