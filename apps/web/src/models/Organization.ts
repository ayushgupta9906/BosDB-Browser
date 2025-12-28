
import mongoose, { Schema, Model } from 'mongoose';

export interface IOrganization {
    id: string;
    name: string;
    adminUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    adminUserId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Prevent model overwrite in hot-reload
const Organization: Model<IOrganization> = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

export default Organization;
