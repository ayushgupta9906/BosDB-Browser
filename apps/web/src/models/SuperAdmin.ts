
import mongoose, { Schema, Model } from 'mongoose';

export interface ISuperAdmin {
    id: string;
    email: string;
    name: string;
    password: string;
    role: 'super-admin'; // Always super-admin
    status: 'active' | 'suspended';
    createdAt: Date;
    lastLoginAt?: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super-admin'], default: 'super-admin' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
});

// Prevent Mongoose OverwriteModelError by deleting if exists (development fix)
if (mongoose.models.SuperAdmin) {
    delete mongoose.models.SuperAdmin;
}

const SuperAdmin: Model<ISuperAdmin> = mongoose.model('SuperAdmin', SuperAdminSchema);

export default SuperAdmin;
